import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PROMPT_IDEAS, PROMPT_TITLES, PROMPT_DESCRIPTION, PROMPT_TAGS, PROMPT_FULL_SCRIPT, PROMPT_HOOK_GUIDELINES, PROMPT_RETENTION_GUIDELINES, CONTENT_FILTERS } from "../constants";
import { VideoIdea, TitleThumbnailPair } from "../types";
import { buildKnowledgeBaseContext } from "./knowledgeBaseService";

const API_KEY_STORAGE = 'gemini_api_key';

export const setApiKey = (key: string) => {
  localStorage.setItem(API_KEY_STORAGE, key);
};

export const getApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE) || process.env.API_KEY || null;
};

export const clearApiKey = () => {
  localStorage.removeItem(API_KEY_STORAGE);
};

const getAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key belum diisi. Masukkan Gemini API Key di pengaturan.");
  }
  return new GoogleGenAI({ apiKey });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateContent = async (
  systemInstruction: string, 
  prompt: string, 
  model: string = "gemini-3.1-flash-lite-preview", // Default text model
  tools?: any[],
  responseMimeType?: string,
  responseSchema?: any,
  maxRetries: number = 3
) => {
  const ai = getAIClient();
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const config: any = { systemInstruction: systemInstruction };
      if (tools) config.tools = tools;
      if (responseMimeType) config.responseMimeType = responseMimeType;
      if (responseSchema) config.responseSchema = responseSchema;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: config
      });
      return response.text || "No response generated.";
    } catch (error: any) {
      lastError = error;
      // Check if it's a 503 or 429 error which are retryable
      const isRetryable = error?.message?.includes("503") || 
                          error?.message?.includes("high demand") ||
                          error?.message?.includes("429") ||
                          error?.message?.includes("Too Many Requests");
      
      if (isRetryable && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        console.warn(`Gemini API busy (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(delay)}ms...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

const cleanMetadataResponse = (text: string) => {
  return text
    .replace(/^Berikut adalah deskripsi video YouTube yang disusun khusus[\s\S]*?:\n?/i, '')
    .replace(/^(Berikut|Ini|Tentu|Baik).*?(deskripsi|tags).*?:\n?/i, '')
    .trim();
};

const cleanScriptResponse = (text: string) => {
  let clean = text.replace(/\*\*/g, '').replace(/\*/g, '');
  clean = clean
    .replace(/^Berikut adalah naskah[\s\S]*?:\n?/i, '')
    .replace(/^Tentu, ini naskah[\s\S]*?:\n?/i, '')
    .replace(/^Sesuai aturan V\d+\.\d+[\s\S]*?:\n?/i, '')
    .replace(/^Halo.*?:\n?/i, '')
    .replace(/^BABAK \d+[:\s].*?$/gim, '')
    .replace(/^SEGMEN [A-Z]+[:\s].*?$/gim, '')
    .replace(/^\(Total Word Count:.*?\)$/gim, '')
    .replace(/^Nomor \d+[:\.]\s*/gim, '')
    .replace(/^Poin \d+[:\.]\s*/gim, '')
    // Only remove numbered list items at line start (not inline numbers like "5 juta")
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\(Visual:.*?\)/gi, '')
    .replace(/\[Visual:.*?\]/gi, '')
    .trim();
  return clean;
};

// Word count that handles Indonesian text better
const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
};

// --- EXISTING FILE TO BASE64 HELPER ---
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Detect which preset name the writingStyle belongs to
const detectPresetName = (writingStyle: string): string => {
  const upper = writingStyle.toUpperCase();
  if (upper.includes('NYANTUY')) return 'Ilmu Nyantuy';
  if (upper.includes('PSIKOLOGI')) return 'Ilmu Psikologi Diri';
  if (upper.includes('SURVIVAL')) return 'Ilmu Survival';
  if (upper.includes('LIDI')) return 'Ilmu Lidi';
  // Fallback: check exact preset name match
  for (const name of Object.keys(CONTENT_FILTERS)) {
    if (writingStyle.startsWith(`STYLE PENULISAN: ${name.toUpperCase()}`)) return name;
  }
  return 'Ilmu Lidi';
};

export const generateIdeas = async (referenceText: string, fileContents: string[], keywords: string, language: 'id' | 'en' = 'id', channelName: string = '', writingStyle: string = '', useKnowledgeBase: boolean = true) => {
  const currentYear = new Date().getFullYear();
  const timeContext = `\n\n[KONTEKS WAKTU]: Saat ini adalah tahun ${currentYear}. Jika Anda menggunakan angka tahun di judul atau naskah, WAJIB gunakan tahun ${currentYear} atau setelahnya. JANGAN gunakan tahun 2023, 2024, atau 2025.`;
  
  const filesContext = fileContents.length > 0 ? `\n\n[ISI FILE TAMBAHAN]:\n${fileContents.join('\n\n---\n\n')}` : '';
  const keywordsContext = keywords ? `\n\n[KATA KUNCI WAJIB ADA DI JUDUL/KONTEKS]: ${keywords}` : '';
  const channelContext = channelName ? `\n\n[NAMA CHANNEL]: ${channelName}` : '';
  const styleContext = writingStyle ? `\n\n[STYLE PENULISAN]: ${writingStyle}` : '';
  const langInstruction = `\n\n[IMPORTANT]: Generate the output in ${language === 'en' ? 'English' : 'Bahasa Indonesia'}.`;
  
  // Inject knowledge base context (bundled JSON, no fetch needed)
  let kbContext = '';
  if (useKnowledgeBase && language === 'id') {
    kbContext = buildKnowledgeBaseContext(referenceText);
    console.log('[KB] Context injected:', kbContext.length, 'chars');
  }
  
  // Inject content filters based on preset name
  const presetName = detectPresetName(writingStyle);
  const contentFilters = CONTENT_FILTERS[presetName] || CONTENT_FILTERS['Ilmu Lidi'];
  const systemPrompt = PROMPT_IDEAS.replace('${contentFilters}', contentFilters);
  
  const prompt = `Referensi Utama:\n${referenceText}${filesContext}${keywordsContext}${channelContext}${styleContext}${timeContext}${kbContext}\n\nLakukan instruksi di system instruction.${langInstruction}`;
  
  let responseText = await generateContent(systemPrompt, prompt, "gemini-3.1-pro-preview");
  
  // Auto-replace outdated years in generated titles
  responseText = responseText.replace(/Judul Video:\s*(.*)/gi, (match, title) => {
      return `Judul Video: ${title.replace(/\b(2023|2024|2025)\b/g, currentYear.toString())}`;
  });
  
  return responseText;
};

export const generateFullScript = async (idea: VideoIdea, targetWordCount: number, language: 'id' | 'en' = 'id', channelName: string = '', writingStyle: string = '', useHook: boolean = true, useOutro: boolean = true, useKnowledgeBase: boolean = true) => {
  const pointsList = idea.points.map((p, i) => `Poin ${i + 1}: ${p}`).join('\n');
  const channelContext = channelName ? `\n\n[NAMA CHANNEL]: ${channelName}` : '';
  const styleContext = writingStyle ? `\n\n[STYLE PENULISAN]: ${writingStyle}` : '';
  const langInstruction = `\n\n[IMPORTANT]: Generate the output in ${language === 'en' ? 'English' : 'Bahasa Indonesia'}.`;
  
  // Inject knowledge base context for script generation
  let kbContext = '';
  if (useKnowledgeBase && language === 'id') {
    const refForKB = `${idea.title} ${idea.hook} ${idea.points.join(' ')}`;
    kbContext = buildKnowledgeBaseContext(refForKB);
  }
  
  // Hook & Closing allocation based on toggles
  const hookWords = useHook ? 150 : 0;
  const closingWords = useOutro ? 75 : 0;
  const bodyTotalWords = Math.max(100, targetWordCount - hookWords - closingWords);
  const pointsCount = idea.points.length || 1;
  const wordsPerPoint = Math.round(bodyTotalWords / pointsCount);

  // Build distribution instruction based on toggles
  const parts: string[] = [];
  parts.push(`Total Target: ${targetWordCount} Kata.`);
  parts.push(`DISTRIBUSI WAJIB:`);
  if (useHook) {
    parts.push(`- BABAK 1 (HOOK): Tepat ${hookWords} kata. Padat, punchy, langsung tarik penonton dalam 30 detik.`);
  }
  parts.push(`- BABAK 2 (ISI): Total ${bodyTotalWords} kata. Karena ada ${pointsCount} poin, maka SETIAP POIN wajib dibahas sepanjang kurang lebih ${wordsPerPoint} kata.`);
  if (useOutro) {
    parts.push(`- BABAK 3 (PENUTUP): Tepat ${closingWords} kata. Singkat, kuat, berkesan.`);
  }

  // Instruction for skipping hook/outro
  const structureInstruction = !useHook && !useOutro
    ? '\n[STRUKTUR]: Langsung masuk ke daftar poin. DILARANG KERAS bikin hook/pembuka, intro, opening, dan penutup. Naskah WAJIB dimulai langsung dari poin pertama tanpa kalimat pembuka apapun.'
    : !useHook
    ? '\n[STRUKTUR]: DILARANG KERAS bikin hook/pembuka, intro, atau opening. Tidak ada kalimat pembuka. Naskah WAJIB dimulai langsung dari poin pertama. Contoh: Kalimat pertama langsung masuk ke topik tanpa basa-basi.'
    : !useOutro
    ? '\n[STRUKTUR]: Setelah poin terakhir langsung selesai. DILARANG bikin penutup/outro.'
    : '';

  const wordCountInstruction = `
|[TARGET PANJANG NASKAH (SANGAT PENTING)]
${parts.join('\n')}
`;

  const hookContext = useHook ? `Hook: ${idea.hook}` : '';

  const prompt = `
[KONTEKS IDE]
Judul: ${idea.title}
${hookContext}
[DAFTAR POIN PEMBAHASAN]
${pointsList}

${wordCountInstruction}${structureInstruction}

[ATURAN PENULISAN POIN & TANDA BACA]
1. TRANSISI POIN: Agar penonton bisa mengikuti alur, sebutkan perpindahan poin secara eksplisit tapi natural di dalam kalimat (contoh: "masuk ke poin pertama...", "alasan kedua adalah...", "yang ketiga..."). JANGAN gunakan format header kaku seperti "Poin 1: [Judul]". Variasikan kalimat transisinya agar tidak repetitif atau terdengar seperti template robot.
2. DILARANG KERAS menggunakan tanda kurung () dalam naskah. Jika ada penjelasan tambahan, gunakan kata sambung yang natural (seperti 'yaitu', 'artinya', atau koma) alih-alih menggunakan tanda kurung.
${kbContext}
${channelContext}
${styleContext}
${langInstruction}

${useHook ? PROMPT_HOOK_GUIDELINES + '\n' : ''}
${PROMPT_RETENTION_GUIDELINES}

Lakukan penulisan naskah penuh sesuai instruksi sistem.
`;

  let response = await generateContent(PROMPT_FULL_SCRIPT, prompt, "gemini-3.1-pro-preview");
  let cleanedResponse = cleanScriptResponse(response);
  // Count from raw response (before cleaning) for accurate tracking
  let rawWordCount = countWords(response);
  let wordCount = countWords(cleanedResponse);

  let retries = 0;
  const maxRetries = 5;
  const minTarget = Math.floor(targetWordCount * 0.90); // 10% tolerance below
  const maxTarget = Math.ceil(targetWordCount * 1.15);  // 15% tolerance above

  console.log(`[Script] Initial: ${wordCount} words (raw: ${rawWordCount}). Target: ${targetWordCount} [${minTarget}-${maxTarget}]`);

  // --- EXPAND LOOP: if under minTarget ---
  while (wordCount < minTarget && retries < maxRetries) {
      console.log(`[Auto-Expand] Script is ${wordCount} words. Target: ${targetWordCount}. Expanding (try ${retries + 1}/${maxRetries})...`);

      const wordsToAdd = targetWordCount - wordCount;
      const expandPrompt = `
Kamu sebelumnya menulis naskah penuh sebanyak ${wordCount} kata.
Target AKHIR adalah ${targetWordCount} kata (boleh antara ${minTarget} sampai ${maxTarget} kata).
Kamu perlu menambah sekitar ${wordsToAdd} kata lagi.

TUGAS:
Tulis ulang SELURUH naskah di bawah ini menjadi versi yang lebih panjang, dengan target AKHIR ${targetWordCount} kata. JANGAN melebihi ${maxTarget} kata.

CARA MEMPERPANJANG (tanpa terlihat seperti filler):
1. Tambahkan 1-2 studi kasus nyata atau contoh konkret di setiap poin.
2. Tambahkan analogi yang relevan dan mudah dipahami.
3. Jelaskan "Kenapa hal ini bisa terjadi?" lebih mendalam (Root Cause).
4. Berikan counter-argument: apa yang orang awam pikirkan vs kenyataannya.
5. Perdalam penjelasan setiap poin dengan detail tambahan yang informatif.

[ATURAN MUTLAK]:
1. TETAP TTS-FRIENDLY: DILARANG tanda kurung (), strip panjang —, titik dua :.
2. PERTAHANKAN GAYA BAHASA DAN TONE yang sama persis dengan naskah asli. Jangan berubah gaya.
3. INTEGRASI POIN NATURAL: Jangan format list kaku. Sebutkan poin secara verbal.
4. PISAHKAN PARAGRAF: Pisahkan setiap poin dengan baris kosong.
5. DILARANG MENGULANG KALIMAT YANG SAMA. Tambahkan substansi baru.
6. TARGET JUMLAH KATA: ${targetWordCount} kata. Hitung dengan cermat. Jangan terlalu pendek, jangan terlalu panjang.
${styleContext}
${langInstruction}

Naskah sebelumnya:
"""
${cleanedResponse}
"""

Tulis ulang versi panjangnya sekarang (target ${targetWordCount} kata):
`;
      response = await generateContent(PROMPT_FULL_SCRIPT, expandPrompt, "gemini-3.1-pro-preview");
      cleanedResponse = cleanScriptResponse(response);
      rawWordCount = countWords(response);
      wordCount = countWords(cleanedResponse);
      retries++;
      console.log(`[Auto-Expand] Result: ${wordCount} words (raw: ${rawWordCount})`);
  }

  // --- CONDENSE LOOP: if over maxTarget ---
  retries = 0;
  while (wordCount > maxTarget && retries < maxRetries) {
      console.log(`[Auto-Condense] Script is ${wordCount} words. Max: ${maxTarget}. Condensing (try ${retries + 1}/${maxRetries})...`);

      const condensePrompt = `
Kamu sebelumnya menulis naskah penuh sebanyak ${wordCount} kata.
Target AKHIR adalah ${targetWordCount} kata (boleh antara ${minTarget} sampai ${maxTarget} kata).
Naskahmu terlalu panjang — perlu diringkas sekitar ${wordCount - targetWordCount} kata.

TUGAS:
Tulis ulang SELURUH naskah di bawah ini menjadi versi yang lebih ringkas, dengan target AKHIR ${targetWordCount} kata. JANGAN kurang dari ${minTarget} kata.

CARA MERINGKAS (tanpa kehilangan substansi):
1. Potong kalimat yang redundant atau bertele-tele.
2. Gabungkan paragraf yang membahas hal serupa.
3. Singkatkan contoh — tetap informatif tapi lebih padat.
4. Buang filler words yang tidak menambah makna.
5. Pertahankan semua poin pembahasan — JANGAN hapus poin apapun.

[ATURAN MUTLAK]:
1. TETAP TTS-FRIENDLY: DILARANG tanda kurung (), strip panjang —, titik dua :.
2. PERTAHANKAN GAYA BAHASA DAN TONE yang sama persis dengan naskah asli.
3. INTEGRASI POIN NATURAL: Jangan format list kaku. Sebutkan poin secara verbal.
4. PISAHKAN PARAGRAF: Pisahkan setiap poin dengan baris kosong.
5. TARGET JUMLAH KATA: ${targetWordCount} kata. Hitung dengan cermat.
${styleContext}
${langInstruction}

Naskah sebelumnya:
"""
${cleanedResponse}
"""

Tulis ulang versi ringkasnya sekarang (target ${targetWordCount} kata):
`;
      response = await generateContent(PROMPT_FULL_SCRIPT, condensePrompt, "gemini-3.1-pro-preview");
      cleanedResponse = cleanScriptResponse(response);
      rawWordCount = countWords(response);
      wordCount = countWords(cleanedResponse);
      retries++;
      console.log(`[Auto-Condense] Result: ${wordCount} words (raw: ${rawWordCount})`);
  }

  console.log(`[Script] Final: ${wordCount} words. Target was: ${targetWordCount} [${minTarget}-${maxTarget}]`);
  return cleanedResponse;
};

export const generateDescription = async (fullScript: string, videoTitle: string, language: 'id' | 'en' = 'id', channelName: string = '', writingStyle: string = '') => {
  const channelContext = channelName ? `\n\n[NAMA CHANNEL]: ${channelName}` : '';
  const styleContext = writingStyle ? `\n\n[STYLE PENULISAN]: ${writingStyle}` : '';
  const langInstruction = `\n\n[IMPORTANT]: Generate the output in ${language === 'en' ? 'English' : 'Bahasa Indonesia'}.`;
  const prompt = `JUDUL VIDEO: ${videoTitle}${channelContext}${styleContext}\n\nNASKAH LENGKAP:\n${fullScript}\n\nBuatkan deskripsi YouTube.${langInstruction}`;
  const response = await generateContent(PROMPT_DESCRIPTION, prompt, "gemini-3.1-flash-lite-preview");
  return cleanMetadataResponse(response);
};

export const generateTags = async (fullScript: string, videoTitle: string, language: 'id' | 'en' = 'id', channelName: string = '', writingStyle: string = '') => {
  const channelContext = channelName ? `\n\n[NAMA CHANNEL]: ${channelName}` : '';
  const styleContext = writingStyle ? `\n\n[STYLE PENULISAN]: ${writingStyle}` : '';
  const langInstruction = `\n\n[IMPORTANT]: Generate the output in ${language === 'en' ? 'English' : 'Bahasa Indonesia'}.`;
  const prompt = `JUDUL VIDEO: ${videoTitle}${channelContext}${styleContext}\n\nNASKAH LENGKAP:\n${fullScript}\n\nBuatkan Tags YouTube.${langInstruction}`;
  const response = await generateContent(PROMPT_TAGS, prompt, "gemini-3.1-flash-lite-preview");
  return cleanMetadataResponse(response);
};


// --- NEW TITLE & THUMBNAIL GENERATOR ---

const THUMBNAIL_SYSTEM_INSTRUCTION = `
### PERAN
Anda adalah strategist packaging YouTube Profesional.
TUGAS UTAMA: Mengubah konteks video menjadi 3 pasangan Judul + Arah Thumbnail yang kuat, tidak generik, dan menarik.

### PRINSIP JUDUL
- Judul harus relate ke hidup nyata penonton.
- Harus punya trigger emosi atau rasa penasaran, tapi jangan murahan.
- Kreativitas framing lebih penting daripada formula tetap.
- Variasi framing wajib. Jangan hasilkan 3 judul rasa sama.
- Keyword boleh dipakai jika natural, jangan dipaksa.
- Judul harus terdengar seperti dibuat manusia yang cerdas dan tajam.
- Boleh memakai objek konkret atau simbol budaya jika memperkuat klik dan relevansi.
- DILARANG KERAS menggunakan kata kasar/makian seperti "Goblok", "Tolol", "Bego", "Anjing", "Bangsat", dan sejenisnya. Gunakan bahasa yang tegas namun tetap profesional atau sesuai dengan gaya channel.

### PRINSIP THUMBNAIL
- Thumbnail harus menonjolkan pesan utama, bukan sekadar dekorasi.
- Harus punya objek utama yang konkret, cepat dikenali, dan simbolik.
- Teks thumbnail harus pendek, padat, 2-5 kata, dan JANGAN mengulang judul.
- Teks dan objek harus saling melengkapi, bukan duplikasi.
- Harus ada satu pusat perhatian yang jelas.
- Variasi thumbnail harus beda logika, bukan beda kosmetik.
- Hindari thumbnail generik yang hanya mengandalkan ekspresi wajah kaget atau panik.
- Gunakan objek atau simbol yang relevan dengan topik dan mudah dikenali audiens.

### GAYA BERPIKIR YANG DIINGINKAN
- Jangan terpaku pada satu emosi tunggal (seperti rasa takut atau serakah) sebagai template.
- Jangan pakai pola clickbait pasaran yang terlalu mudah ditebak.
- Cari angle yang terasa cerdas, kreatif, dan menarik, tapi tetap natural.
- Contoh sukses lama hanya benchmark kreativitas, bukan template tetap.

### SCORING CTR
Untuk setiap variasi yang dihasilkan, berikan juga field "ctr_analysis" berisi analisis singkat (2-3 kalimat) kenapa judul ini berpotensi CTR tinggi atau sedang. Analisis harus menyebutkan:
- Apakah ada curiosity gap yang kuat?
- Apakah ada emosi spesifik yang terpicu?
- Apakah judul cukup jelas dalam 1 detik?
- Apakah judul terasa clickbait murahan atau cerdas?

Contoh format ctr_analysis: "Judul ini kuat karena ada kontras antara ekspektasi dan kenyataan yang memicu rasa penasaran. Kata 'bukan yang kamu kira' menciptakan curiosity gap. Cukup jelas dalam 1 detik bahwa ini bahas topik [X]. Terasa cerdas, bukan clickbait murahan."

### DIVERSITY ENFORCEMENT (SANGAT PENTING)
Ketiga variasi yang dihasilkan WAJIB benar-benar berbeda secara STRATEGI, bukan cuma beda kata.

ATURAN DIVERSITY:
1. Setiap variasi WAJIB pakai template dari KATEGORI YANG BERBEDA (tidak boleh 3 variasi dari Curiosity Gap semua).
2. Setiap variasi WAJIB pakai TRIGGER TYPE yang BERBEDA.
3. Setiap variasi WAJIB punya FRAMING yang beda. Contoh framing berbeda untuk topik "cara hemat uang":
   - Framing A: "Kenapa Tabungan Kamu Selalu Habis?" (Curiosity — fokus ke masalah)
   - Framing B: "7 Cara Nabung Rp 5 Juta Per Bulan" (Numbers — fokus ke hasil)  
   - Framing C: "Stop Boros! Gini Cara yang Benar" (Problem-Solution — fokus ke solusi)
4. DILARANG variasi yang hanya mengganti sinonim. Contoh variasi BURUK:
   - V1: "5 Cara Hemat Uang"
   - V2: "5 Tips Berhemat"  
   - V3: "5 Metode Mengatur Uang" ← Ini BUKAN variasi, ini sinonim.
5. Panjang judul harus bervariasi: satu pendek (30-40 char), satu sedang (40-55 char), satu bisa lebih panjang (55-65 char).

CEKLIST DIVERSITY (self-check sebelum output):
- Apakah 3 judul ini dari 3 kategori template berbeda? YA/TIDAK
- Apakah 3 trigger_type berbeda? YA/TIDAK
- Apakah 3 framing berbeda (bukan sinonim)? YA/TIDAK
- Apakah panjang judul bervariasi? YA/TIDAK

Jika ada yang TIDAK, ulangi variasi yang terlalu mirip sebelum output final.

### ATURAN KOMPOSISI
- Semua elemen visual utama (karakter, objek, aksi) berada di sisi kanan frame.
- Sisi kiri disisakan untuk text overlay.
- Jangan deskripsikan background, warna background, atau elemen lingkungan. Fokus pada karakter, aksi, dan objek foreground.

### INSTRUKSI OUTPUT JSON
- Title: harus channel-fit, natural, click-enticing, dan berbeda framing antar variasi.
- Thumbnail_prompt: deskripsi adegan visual secara keseluruhan, fokus pada pesan utama dan objek sentral.
- Full_text_overlay: 2-5 kata, punchy, bukan copy judul.
- Action_description: aksi karakter harus spesifik dan relevan dengan pesan/topik utama.
- emphasis_word dan normal_word harus tetap mendukung full_text_overlay dengan logika yang enak dibaca.

### TRIGGER TYPES (WAJIB PILIH SALAH SATU)
Setiap variasi WAJIB menggunakan trigger_type yang berbeda dari variasi lain. Pilih dari kategori berikut:

1. FEAR — Visual yang memicu rasa takut atau waswas. Contoh: ancaman mendekat, bahaya mengintai, wajah ketakutan, objek menyeramkan.
2. CURIOSITY — Visual yang memicu rasa penasaran. Contoh: objek tertutup/blur, tanda tanya besar, sesuatu yang "tersembunyi" atau belum terbuka.
3. SHOCK — Visual yang memicu keterkejutan. Contoh: perbandingan drastis before/after, ekspresi kaget ekstrem, fakta mengejutkan dalam angka besar.
4. AUTHORITY — Visual yang memancarkan kredibilitas dan kekuasaan. Contoh: angka/data besar, simbol pencapaian, gesture "expert", podium/trophy.
5. CONTROVERSY — Visual yang memicu perdebatan. Contoh: dua pihak berhadapan, VS layout, opini yang bertentangan, simbol kontroversi.
6. COMPARISON — Visual yang menunjukkan perbedaan. Contoh: split before/after, kiri vs kanan, murah vs mahal, lama vs baru.
7. TRANSFORMATION — Visual yang menunjukkan perubahan drastis. Contoh: metamorfosis, glow-up, dari nol ke sukses, timeline perubahan.
8. NUMBERS — Visual yang memakai angka sebagai daya tarik utama. Contoh: angka besar di tengah frame, uang/pendapatan, countdown, statistik.
9. EMOTION — Visual yang memicu emosi kuat (haru, bangga, marah). Contoh: wajah emosional, momen dramatis, gesture penuh perasaan.
10. HUMOR — Visual yang memicu tawa atau senyum. Contoh: situasi absurd, ekspresi lucu, meme-style, ironi visual.

ATURAN TRIGGER TYPE:
- Ketiga variasi WAJIB pakai trigger_type yang BERBEDA.
- Pilih trigger_type yang paling sesuai dengan konteks materi, bukan acak.
- Jangan pakai "PSIKOLOGI VISUAL" atau label generik lain.
`;

// Thumbnail visual styles per channel/niche
const THUMBNAIL_STYLES: Record<string, string> = {
  'Ilmu Lidi': 'Modern 2D webcomic style, bold clean line art, stylized character design, flat colors with cel-shading, cinematic dramatic lighting, volumetric atmosphere, rim lighting, deep shadows, ambient occlusion, depth of field, sharp focus on subject, 8k resolution, high quality digital illustration.',
  'Ilmu Survival': 'Dark cinematic 2D illustration style, dramatic lighting with deep shadows, muted earth tones with danger accents (red/orange), atmospheric fog or haze, gritty textured surfaces, intense character expressions, survival/preparedness aesthetic, high contrast, moody color grading.',
  'Ilmu Nyantuy': 'Ultra-minimalist 2D cartoon style, crude MS Paint aesthetic, basic flat colors, unpolished rough outlines, intentionally simple drawing, humorous deadpan tone, solid white or basic flat color background, low-effort high-comedy internet meme vibe, lo-fi digital art.',
  'Ilmu Psikologi Diri': '2D fast digital scribble, whiteboard doodle style, dry-erase marker texture, thick messy lines, casual character illustration, pure white background, minimal flat colors, spontaneous energetic drawing, humorous explanation style.',
};

const THUMBNAIL_STYLE_DEFAULT = 'Modern 2D webcomic style, bold clean line art, stylized character design, flat colors with cel-shading, cinematic dramatic lighting, 8k resolution, high quality digital illustration.';

// Get thumbnail style based on writing style text
export const getThumbnailStyle = (writingStyle: string): string => {
  const upper = writingStyle.toUpperCase();
  if (upper.includes('NYANTUY')) return THUMBNAIL_STYLES['Ilmu Nyantuy'];
  if (upper.includes('PSIKOLOGI')) return THUMBNAIL_STYLES['Ilmu Psikologi Diri'];
  if (upper.includes('SURVIVAL')) return THUMBNAIL_STYLES['Ilmu Survival'];
  if (upper.includes('LIDI')) return THUMBNAIL_STYLES['Ilmu Lidi'];
  return THUMBNAIL_STYLE_DEFAULT;
};

// --- EXPORTED HELPER FOR PROMPT CONSTRUCTION ---
export const constructThumbnailPrompt = (
  sceneDescription: string,
  actionDescription: string,
  emphasisText: string,
  normalText: string,
  fullTextOverlay: string = "", // Added support for fullTextOverlay
  visualStyle: string = THUMBNAIL_STYLE_DEFAULT,
  channelName: string = "" // Added support for channelName
): string => {
  const phraseToRender = fullTextOverlay || `${emphasisText} ${normalText}`;
  
  return `ROLE: Seniman Thumbnail YouTube Profesional.

[VISUAL STYLE]:
${visualStyle}

[REFERENCE USAGE - ATURAN KETAT]:
Gunakan gambar referensi yang diberikan HANYA untuk:
- style background
- nuansa layout
- treatment tipografi
- hirarki visual text
- gaya kotak / block / shadow / emphasis typography

JANGAN menyalin, merender ulang, atau mempertahankan teks yang ada di gambar referensi.
JANGAN memasukkan kata, huruf, angka, atau frasa apa pun dari gambar referensi ke hasil akhir, kecuali kata tersebut memang identik dengan overlay text yang tertulis di prompt ini.
Jika gambar referensi mengandung tulisan lain, anggap tulisan itu hanya contoh style, BUKAN konten final.

[BACKGROUND REFERENCE RULES - ATURAN KETAT]:
- Background hasil akhir WAJIB mengikuti gambar referensi background yang diunggah.
- Jangan ganti background jadi putih polos, kosong, atau generik kecuali referensinya memang seperti itu.
- Pertahankan tone, pola, tekstur, rasa, dan struktur background dari referensi.
- Area kiri boleh aman untuk text overlay, tetapi tetap harus memakai background dari referensi.
- Jangan menciptakan background baru yang tidak perlu.
- Jika background referensi putih atau polos, barulah hasil boleh putih atau polos.
- Jika background referensi punya pola, ikon, tekstur, gradasi, atau nuansa tertentu, hasil akhir harus mengikuti itu.

[TEXT STYLE REFERENCE RULES - ATURAN KETAT]:
- Style teks harus TERINSPIRASI dari referensi, BUKAN menyalin isi teks referensi.
- Ambil hanya gaya visualnya: ukuran relatif, block merah, warna teks, bayangan, penekanan, hirarki, dan komposisi.
- Isi teks final HARUS hanya memakai kata-kata yang ditentukan dalam prompt ini.
- Abaikan seluruh kata pada reference image.
- Reference text adalah STYLE REFERENCE ONLY, NOT CONTENT REFERENCE.

[SCENE DESCRIPTION]:
${sceneDescription}
- Tulis dalam Bahasa Indonesia
- Ringkas tapi jelas
- Fokus pada:
  - objek utama
  - aksi atau situasi utama
  - konflik visual
  - rasa visual
- Jangan deskripsikan background secara detail
- Jangan tulis parameter kamera
- Jangan menulis prompt yang terlalu puitis atau abstrak
- Adegan harus cepat kebaca dalam sekali lihat

[CHARACTER ACTION - WAJIB]:
Karakter utama WAJIB melakukan aksi ini:
"${actionDescription}"
- Pose dan emosi harus benar-benar sesuai dengan konflik utama
- Aksi harus konkret, bukan abstrak
- Aksi harus membantu thumbnail terasa hidup dan langsung kebaca

[COMPOSITION - ATURAN KETAT]:
1. ABSOLUTE SPLIT LAYOUT:
   - SISI KIRI (0% sampai 50% lebar): disediakan untuk text overlay final
   - Tidak boleh ada karakter, objek utama, atau aksi penting di area ini
   - Background di sisi kiri tetap mengikuti reference image
   - SISI KANAN (50% sampai 100% lebar): semua elemen visual utama wajib ditempatkan di sini
2. TIMESTAMP SAFETY:
   - SUDUT KANAN BAWAH harus aman
   - Jangan taruh wajah, objek utama, atau detail paling penting di sana

[SUBJECT / CHARACTER]:
- Karakter utama merepresentasikan entitas/channel: "${channelName || 'Karakter Utama'}"
- Gunakan karakter atau subjek sesuai brief
- JANGAN mengarang desain karakter kalau sudah ada referensi visual
- Kalau ada reference image karakter, WAJIB ikuti ciri visual dari reference image tersebut
- Kalau tidak ada reference karakter, buat subjek visual yang jelas, kuat, dan cocok dengan sudut video

[TEXT OVERLAY INSTRUCTIONS - FINAL DAN MENGIKAT]:
Satu-satunya teks yang boleh muncul di thumbnail final adalah teks berikut:

FULL OVERLAY TEXT:
"${phraseToRender.toUpperCase()}"

DETAIL SUSUNAN TEXT:
1. NORMAL WORD:
   "${normalText.toUpperCase()}"
   - berfungsi sebagai teks pendamping
   - mengikuti style sekunder dari reference typography
   - ditempatkan agar menyambung secara visual dengan emphasis word
   - harus mengikuti urutan baca alami

2. EMPHASIS WORD:
   "${emphasisText.toUpperCase()}"
   - teks paling dominan
   - mengikuti style emphasis dari reference typography
   - paling menonjol secara visual
   - ditempatkan di kiri atas atau kiri tengah

[TEXT SAFETY LOCK - SANGAT PENTING]:
- Semua overlay text wajib HURUF KAPITAL
- Jangan ubah isi katanya
- Jangan tambah kata baru
- Jangan kurangi kata
- Jangan render tulisan apa pun dari reference image kecuali memang sama persis dengan overlay text final
- Jika reference image berisi teks, abaikan isinya dan ambil hanya style visualnya
- Thumbnail final HARUS hanya menampilkan teks yang ditentukan di prompt ini
- Tidak boleh ada teks lain selain yang disebut di prompt ini
- Overlay text adalah elemen layout atau desain, bukan objek fisik di dalam adegan
- Komposisi visual harus mendukung keterbacaan overlay text secara maksimal

[CRITICAL BACKGROUND LOCK]:
- Jika ada reference image background, maka background hasil akhir HARUS mengikuti reference image tersebut.
- Jangan fallback ke putih.
- Jangan fallback ke background kosong.
- Jangan invent background baru.
- Sisi kiri hanya dikosongkan dari objek utama untuk kebutuhan overlay text, BUKAN dikosongkan dari background.`;
};

export const generateTitleAndThumbnailPairs = async (
    context: string, 
    keywords: string, 
    mandatoryKeywords: string = '', 
    language: 'id' | 'en' = 'id',
    count: number = 3,
    specificObject: string = '',
    channelName: string = '',
    writingStyle: string = '',
    visualStyle: string = THUMBNAIL_STYLE_DEFAULT
): Promise<TitleThumbnailPair[]> => {
  const ai = getAIClient();
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      pairs: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
             title: { type: Type.STRING },
             thumbnail_prompt: { type: Type.STRING },
             full_text_overlay: { type: Type.STRING, description: "STEP 1: Short 2-5 words text overlay." },
             action_description: { type: Type.STRING, description: "Specific description of character pose/action." },
             emphasis_word: { type: Type.STRING, description: "STEP 2: Part of the text for Emphasis Highlight." },
             normal_word: { type: Type.STRING, description: "STEP 2: Part of the text for Normal Text." },
             trigger_type: { type: Type.STRING, description: "Visual strategy: FEAR, CURIOSITY, SHOCK, etc." },
             feasibility_score: { type: Type.NUMBER },
             ctr_analysis: { type: Type.STRING, description: "Analisis singkat kenapa judul ini potensi CTR tinggi/sedang. 2-3 kalimat." }
          },
          required: ["title", "thumbnail_prompt", "full_text_overlay", "action_description", "emphasis_word", "normal_word", "trigger_type", "ctr_analysis"]
        }
      }
    },
    required: ["pairs"]
  };

  let extraContext = "";
  if (mandatoryKeywords && mandatoryKeywords.trim() !== '') {
      extraContext += `\n\n[SYARAT MUTLAK JUDUL]: WAJIB mengandung kata: "${mandatoryKeywords}".`;
  }
  if (specificObject && specificObject.trim() !== '') {
      extraContext += `\n\n[SYARAT MUTLAK VISUAL]: Thumbnail WAJIB menampilkan objek spesifik: "${specificObject}". Integrasikan objek ini dengan strategi psikologi.`;
  }
  if (writingStyle && writingStyle.trim() !== '') {
      extraContext += `\n\n[STYLE PENULISAN]: ${writingStyle}`;
  }

  // Replace "Omni Channel" with channelName in system instruction if provided
  let systemInstruction = THUMBNAIL_SYSTEM_INSTRUCTION;
  if (channelName) {
      systemInstruction = systemInstruction.replace(/"Omni Channel"/g, `"${channelName}"`);
      systemInstruction = systemInstruction.replace(/Omni Channel/g, channelName);
  }

  // ADDED YEAR 2026 CONTEXT
  const currentYear = new Date().getFullYear();
  const timeContext = `\n\n[KONTEKS WAKTU]: Saat ini adalah tahun ${currentYear}. Jika menggunakan angka tahun di judul atau teks, WAJIB gunakan tahun ${currentYear}. JANGAN gunakan tahun 2023, 2024, atau 2025.`;
  const targetLanguage = language === 'en' ? 'ENGLISH' : 'BAHASA INDONESIA';
  const langInstruction = `\n\n[CRITICAL LANGUAGE REQUIREMENT]: The user has explicitly set the system language to "${targetLanguage}". You MUST generate ALL text fields in the JSON output (title, thumbnail_prompt, full_text_overlay, action_description, emphasis_word, normal_word) ENTIRELY in ${targetLanguage}. DO NOT output Indonesian if the language is set to 'en'. Translate all slang and concepts appropriately.`;
  systemInstruction += langInstruction + timeContext + `\n\n[PANDUAN JUDUL TAMBAHAN]\n${PROMPT_TITLES}`;

  const userPrompt = language === 'en' 
    ? `Create ${count} variations of Video Title + Thumbnail Concept using the psychological strategy of "${channelName || 'Omni Channel'}".\n\nContext:\n${context}\n\nGeneral Keywords: ${keywords}${extraContext}${langInstruction}${timeContext}`
    : `Buatlah ${count} variasi Judul Video + Konsep Thumbnail dengan strategi psikologi "${channelName || 'Omni Channel'}".\n\nKonteks:\n${context}\n\nKeywords Umum: ${keywords}${extraContext}${langInstruction}${timeContext}`;

  try {
    const responseText = await generateContent(
      systemInstruction,
      userPrompt,
      "gemini-3.1-flash-lite-preview",
      undefined,
      "application/json",
      schema
    );
    const json = JSON.parse(responseText || "{}");
    return json.pairs.map((p: any, idx: number) => {
        let safeTitle = p.title || "";
        let safeOverlay = p.full_text_overlay || "";
        let safeEmphasis = p.emphasis_word || "";
        let safeNormal = p.normal_word || "";
        
        // Auto-replace outdated years
        const yearRegex = /\b(2023|2024|2025)\b/g;
        safeTitle = safeTitle.replace(yearRegex, currentYear.toString());
        safeOverlay = safeOverlay.replace(yearRegex, currentYear.toString());
        safeEmphasis = safeEmphasis.replace(yearRegex, currentYear.toString());
        safeNormal = safeNormal.replace(yearRegex, currentYear.toString());

        return {
            id: `pair-${Date.now()}-${idx}`,
            title: safeTitle,
            ctrAnalysis: p.ctr_analysis || "Tidak ada analisis.",
            thumbnail: {
                prompt: p.thumbnail_prompt,
                fullTextOverlay: safeOverlay,
                actionDescription: p.action_description,
                suggestedText: safeOverlay, // Fallback
                emphasisText: safeEmphasis,
                normalText: safeNormal,
                triggerType: p.trigger_type || "CURIOSITY",
                status: 'idle',
                feasibilityScore: p.feasibility_score || 85,
                // Automatically construct detailed prompt on creation
                detailedPrompt: constructThumbnailPrompt(
                    p.thumbnail_prompt, 
                    p.action_description, 
                    safeEmphasis, 
                    safeNormal,
                    safeOverlay, // Pass this
                    visualStyle,
                    channelName // Pass channelName
                )
            }
        };
    });
  } catch (e) {
      console.error(e);
      throw new Error("Gagal generate Title/Thumbnail pairs");
  }
};

// --- HELPER: REFINE IMAGE PROMPT ---
export const refineImagePrompt = async (originalPrompt: string, userInstruction: string) => {
    const prompt = `
    Anda adalah Prompt Engineer untuk Image Generation (Style: Webcomic/Digital Art).
    
    PROMPT ASLI:
    "${originalPrompt}"
    
    PERMINTAAN MODIFIKASI USER:
    "${userInstruction}"
    
    TUGAS:
    Tulis ulang Prompt Asli agar sesuai dengan permintaan user. Pertahankan detail artistik (lighting, style) dari prompt asli, tapi ubah subjek/komposisi sesuai permintaan user.
    Hanya outputkan Prompt Final (Plain Text). Jangan ada teks tambahan.
    `;
    
    return generateContent("You are an expert prompt engineer.", prompt, "gemini-3.1-flash-lite-preview");
};

// --- IMAGE GENERATION SERVICE PATCHED (STRICT OMNI CHANNEL - NO STICKMAN WORD) ---

export interface ImageGenerationResult {
    imageUrl: string;
    engineeredPrompt: string;
}

export const generateRealThumbnailImage = async (
  fullPrompt: string, // Changed: Accepts full engineered prompt
  referenceImages: File[],
  referenceBackground: File | null,
  referenceTextStyle: File | null,
  imageModel: string = "gemini-2.5-flash-image",
  maxRetries: number = 2
): Promise<ImageGenerationResult> => { 
  const ai = getAIClient();
  const parts: any[] = [];
  
  // 1. System Prompt (The full prompt is passed here)
  parts.push({ text: fullPrompt });

  // 2. Background
  if (referenceBackground) {
    const bgBase64 = await fileToBase64(referenceBackground);
    parts.push({ text: "USE THIS BACKGROUND COMPOSITION:" });
    parts.push({ inlineData: { data: bgBase64, mimeType: referenceBackground.type } });
  }

  // 3. Characters
  if (referenceImages && referenceImages.length > 0) {
      parts.push({ text: "REFERENCE CHARACTER (USE EXACTLY):" });
      for (const file of referenceImages) {
        const base64 = await fileToBase64(file);
        parts.push({ inlineData: { data: base64, mimeType: file.type } });
      }
  }

  // 4. Text Style Reference
  if (referenceTextStyle) {
      const textBase64 = await fileToBase64(referenceTextStyle);
      parts.push({ text: "REFERENCE BACKGROUND + TEXT:" });
      parts.push({ inlineData: { data: textBase64, mimeType: referenceTextStyle.type } });
  }

  let lastError: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: imageModel, 
        contents: { parts },
        config: {
            imageConfig: {
                aspectRatio: "16:9"
            }
        }
      });

      if (response.candidates && response.candidates[0].content.parts) {
           for (const part of response.candidates[0].content.parts) {
               if (part.inlineData && part.inlineData.data) {
                   return {
                       imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`,
                       engineeredPrompt: fullPrompt
                   };
               }
           }
      }
      
      return {
          imageUrl: "https://via.placeholder.com/1280x720/000000/FFFFFF?text=No+Image+Data+Returned",
          engineeredPrompt: fullPrompt + "\n\n[WARN: API returned OK but no image data found]"
      };
      
    } catch (error: any) {
      lastError = error;
      const isRetryable = error?.message?.includes("503") || 
                          error?.message?.includes("high demand") ||
                          error?.message?.includes("429");
      
      if (isRetryable && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
        console.warn(`Gemini Image API busy (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${Math.round(delay)}ms...`);
        await sleep(delay);
        continue;
      }
      
       return {
           imageUrl: "https://via.placeholder.com/1280x720/000000/FFFFFF?text=Generation+Failed",
           engineeredPrompt: fullPrompt + `\n\n[ERROR: Generation failed: ${error}]`
       };
    }
  }
  
  return {
      imageUrl: "https://via.placeholder.com/1280x720/000000/FFFFFF?text=Retry+Limit+Exceeded",
      engineeredPrompt: fullPrompt + `\n\n[ERROR: Retry limit exceeded. Last error: ${lastError}]`
  };
};