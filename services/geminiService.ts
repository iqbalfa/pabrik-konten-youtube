import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PROMPT_IDEAS, PROMPT_IDEAS_STYLE_ONLY, PROMPT_TITLES, PROMPT_DESCRIPTION, PROMPT_TAGS, PROMPT_FULL_SCRIPT, PROMPT_HOOK_GUIDELINES, PROMPT_RETENTION_GUIDELINES, CONTENT_FILTERS } from "../constants";
import { VideoIdea, TitleThumbnailPair } from "../types";
import { buildKnowledgeBaseContext } from "./knowledgeBaseService";

export const API_KEY_STORAGE = 'gemini_api_key';

export const setApiKey = (key: string) => {
  localStorage.setItem(API_KEY_STORAGE, key);
};

export const getApiKey = (): string | null => {
  const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem(API_KEY_STORAGE) : null;
  return storedKey || (import.meta as any).env?.VITE_GEMINI_API_KEY || null;
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

const formatIdeasJsonToLegacyText = (json: any): string => {
  const summary = String(json?.summary || json?.ringkasan_referensi || '').trim();
  const ideas = Array.isArray(json?.ideas) ? json.ideas : [];
  const blocks = ideas.slice(0, 3).map((idea: any, idx: number) => {
    const points = Array.isArray(idea.points) ? idea.points : [];
    const modification = String(idea.modification_level || idea.modificationLevel || `Ide ${idx + 1}`).trim();
    const angle = String(idea.angle || '').trim();
    const uniqueValue = String(idea.unique_value || idea.uniqueValue || '').trim();
    const literalTopic = String(idea.literal_topic || idea.literalTopic || '').trim();
    const hiddenAnxiety = String(idea.hidden_anxiety || idea.hiddenAnxiety || '').trim();
    const creativeTechnique = String(idea.creative_technique || idea.creativeTechnique || '').trim();
    const transformedConcept = String(idea.transformed_concept || idea.transformedConcept || '').trim();
    const whyNotParaphrase = String(idea.why_not_paraphrase || idea.whyNotParaphrase || '').trim();

    return `[TINGKAT MODIFIKASI ${idx + 1}: ${modification}]\n` +
      `[ANGLE: ${angle}]\n` +
      `[UNIK: ${uniqueValue}]\n` +
      `[TOPIK LITERAL: ${literalTopic}]\n` +
      `[HIDDEN ANXIETY: ${hiddenAnxiety}]\n` +
      `[TEKNIK TRANSFORMASI: ${creativeTechnique}]\n` +
      `[KONSEP TRANSFORMASI: ${transformedConcept}]\n` +
      `[BUKAN PARAFRASE KARENA: ${whyNotParaphrase}]\n\n` +
      `Judul Video: ${String(idea.title || '').trim()}\n\n` +
      `Narasi Hook: ${String(idea.hook || '').trim()}\n\n` +
      `Poin-Poin Pembongkaran:\n${points.map((point: any, pointIdx: number) => `${pointIdx + 1}. ${String(point).trim()}`).join('\n')}\n\n` +
      `Garis Besar Penutup: ${String(idea.closing || '').trim()}`;
  });

  return `[RANGKUMAN REFERENSI]\n${summary || 'Ringkasan tidak tersedia.'}\n\n${blocks.join('\n\n')}`;
};

export const generateIdeas = async (referenceText: string, fileContents: string[], keywords: string, language: 'id' | 'en' = 'id', channelName: string = '', writingStyle: string = '', useKnowledgeBase: boolean = true, ideationMode: 'creative' | 'style_only' = 'creative') => {
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
    kbContext = buildKnowledgeBaseContext(referenceText, keywords, channelName, useKnowledgeBase);
    console.log('[KB] Context injected:', kbContext.length, 'chars');
  }
  
  // Inject content filters based on preset name
  const presetName = detectPresetName(writingStyle);
  const contentFilters = CONTENT_FILTERS[presetName] || CONTENT_FILTERS['Ilmu Lidi'];
  const activePrompt = ideationMode === 'creative' ? PROMPT_IDEAS : PROMPT_IDEAS_STYLE_ONLY;
  const outputContract = ideationMode === 'creative'
    ? '[OUTPUT CONTRACT — STRICT JSON]\nReturn only JSON that matches the response schema. Do not output markdown, code fences, or legacy text markers. Keep exactly 3 ideas: 1 Faithful Upgrade, 1 Radical Reframe, 1 Audience Identity/System Reframe. Each idea must contain 5-10 concrete points and the creative transformation metadata fields. Reject your own draft if any title is only a paraphrase of the user input.'
    : '[OUTPUT CONTRACT — STRICT JSON]\nReturn only JSON that matches the response schema. Do not output markdown, code fences, or legacy text markers. Keep exactly 3 ideas with different perspectives: Fakta Inti, Curiosity Kicker, Practical Benefit.';
  const systemPrompt = `${activePrompt.replace('${contentFilters}', contentFilters)}\n\n${outputContract}`;
  const ideasSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING, description: 'Ringkasan singkat referensi utama dan konteks user.' },
      ideas: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            modification_level: { type: Type.STRING, description: 'For creative mode: FAITHFUL UPGRADE, RADICAL REFRAME, AUDIENCE IDENTITY / SYSTEM REFRAME. For style_only mode: ADAPTASI CHANNEL STYLE.' },
            angle: { type: Type.STRING, description: 'Nama angle content filter/channel yang dipakai.' },
            unique_value: { type: Type.STRING, description: 'Satu kalimat: value unik ide ini dibanding ide lain.' },
            literal_topic: { type: Type.STRING, description: 'Topik literal mentah dari input user.' },
            hidden_anxiety: { type: Type.STRING, description: 'Ketakutan/konflik/tekanan sosial. Kosongkan untuk mode style_only.' },
            creative_technique: { type: Type.STRING, description: 'Teknik transformasi (creative mode) atau kosong (style_only mode).' },
            transformed_concept: { type: Type.STRING, description: 'Konsep video baru hasil reframe, bukan parafrase.' },
            why_not_paraphrase: { type: Type.STRING, description: 'Alasan singkat kenapa ide ini bukan sekadar parafrase input.' },
            title: { type: Type.STRING },
            hook: { type: Type.STRING },
            points: { type: Type.ARRAY, items: { type: Type.STRING } },
            closing: { type: Type.STRING }
          },
          required: ['modification_level', 'angle', 'unique_value', 'literal_topic', 'hidden_anxiety', 'creative_technique', 'transformed_concept', 'why_not_paraphrase', 'title', 'hook', 'points', 'closing']
        }
      }
    },
    required: ['summary', 'ideas']
  };
  
  const prompt = `Referensi Utama:\n${referenceText}${filesContext}${keywordsContext}${channelContext}${styleContext}${timeContext}${kbContext}\n\nLakukan instruksi di system instruction.${langInstruction}`;
  
  const responseText = await generateContent(systemPrompt, prompt, "gemini-3.1-pro-preview", undefined, "application/json", ideasSchema);
  let responseJson: any;
  try {
    responseJson = JSON.parse(responseText || '{}');
  } catch {
    throw new Error('Response JSON ideasi rusak. Coba generate ulang.');
  }
  let formattedText = formatIdeasJsonToLegacyText(responseJson);
  
  // Auto-replace outdated years in generated titles
  formattedText = formattedText.replace(/Judul Video:\s*(.*)/gi, (match, title) => {
      return `Judul Video: ${title.replace(/\b(2023|2024|2025)\b/g, currentYear.toString())}`;
  });
  
  return formattedText;
};

export const generateFullScript = async (idea: VideoIdea, targetWordCount: number, language: 'id' | 'en' = 'id', channelName: string = '', writingStyle: string = '', useHook: boolean = true, useOutro: boolean = true, originalReferenceText: string = '', originalFileContents: string[] = [], useKnowledgeBase: boolean = true) => {
  const pointsList = idea.points.map((p, i) => `Poin ${i + 1}: ${p}`).join('\n');
  const channelContext = channelName ? `\n\n[NAMA CHANNEL]: ${channelName}` : '';
  const styleContext = writingStyle ? `\n\n[STYLE PENULISAN]: ${writingStyle}` : '';
  const langInstruction = `\n\n[IMPORTANT]: Generate the output in ${language === 'en' ? 'English' : 'Bahasa Indonesia'}.`;
  const sourceContext = (originalReferenceText.trim() || originalFileContents.length > 0)
    ? `\n\n[SUMBER REFERENSI ASLI - GROUNDING WAJIB]\n${originalReferenceText.trim()}${originalFileContents.length > 0 ? `\n\n[ISI FILE REFERENSI]\n${originalFileContents.join('\n\n---\n\n')}` : ''}\n\n[ATURAN FAKTUALITAS]\n- Naskah WAJIB menjaga fakta inti dari sumber referensi di atas.\n- DILARANG membuat nama riset, angka statistik, tahun, kasus nyata, brand, lokasi, atau klaim faktual baru jika tidak ada di sumber.\n- Jika butuh contoh tambahan, tulis sebagai analogi atau skenario sehari-hari, bukan sebagai fakta/riset nyata.\n- Jika detail sumber kurang, pilih penjelasan konseptual yang aman daripada mengarang data.`
    : '';
  
  // Inject knowledge base context for script generation
  let kbContext = '';
  if (useKnowledgeBase && language === 'id') {
    const refForKB = `${originalReferenceText} ${idea.title} ${idea.hook} ${idea.points.join(' ')}`;
    kbContext = buildKnowledgeBaseContext(refForKB, '', channelName, useKnowledgeBase);
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
${sourceContext}

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
1. Tambahkan contoh konkret atau analogi lokal di setiap poin. Jangan mengklaimnya sebagai studi/kasus nyata kecuali memang ada di sumber referensi.
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
6. GROUNDING: Jangan membuat angka, riset, tahun, kasus, lokasi, atau brand baru di luar sumber referensi. Contoh tambahan harus terasa sebagai analogi/skenario, bukan klaim fakta.
7. TARGET JUMLAH KATA: ${targetWordCount} kata. Hitung dengan cermat. Jangan terlalu pendek, jangan terlalu panjang.
${sourceContext}
${styleContext}
${langInstruction}
${structureInstruction}

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
${sourceContext}
${styleContext}
${langInstruction}
${structureInstruction}

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
Anda adalah strategist packaging YouTube Profesional. Tugas: ubah konteks video menjadi 3 pasangan Judul + Arah Thumbnail yang kuat dan tidak generik.

### PRINSIP JUDUL
- Harus relate ke hidup nyata, punya trigger emosi/penasaran, jangan murahan. Variasi framing wajib antar judul. Keyword natural, jangan dipaksa. DILARANG kata kasar (goblok, tolol, anjing, dll).

### ANTI-PATTERN JUDUL
"Update [Tahun]:", "Sedang Trending:", "[Number] Fakta Tentang [X]", "Ternyata Ini Faktanya:", "Panduan Lengkap:", "Breaking:". Jangan cuma ganti sinonim.

### PRINSIP THUMBNAIL
- Objek utama konkret, cepat dikenali, simbolik. Teks 2-4 kata, terbaca <0.5 detik, JANGAN mengulang judul. Satu pusat perhatian jelas. Hindari wajah kaget generik.

### VISUAL TRANSFORMATION ENGINE
Tugas thumbnail: MENUNJUKKAN HASIL TERBURUK/TERANEH/TERKEJUT secara HYPERBOLIC LITERAL. Bukan metafora — tunjukkan hasilnya secara ekstrem dan literally.
Proses: LITERAL TOPIC → HIDDEN ANXIETY → HYPERBOLIC LITERALISM → CONFLICT OBJECT → CURIOSITY OBJECT → EMOTIONAL PROOF → STOP-SCROLL TEST.
Contoh: topik "pria hamil" → pria dewasa perut hijau membusuk. Topik "makan sampah" → wajah dengan sampah di mulut. Topik "dibuang sistem" → orang dilempar pintu mesin raksasa bertulis SISTEM.
ANTI-GENERIK: Gagal jika hanya orang panik biasa, uang melayang generik, laptop/HP tanpa keanehan, tanda tanya tanpa konteks.

### CHARACTER STRATEGY — WAJIB
DUA entitas karakter WAJIB dibedakan:
1. KARAKTER UTAMA — tokoh dari narasi yang WAJIB di-invent AI.
   - 'famous_character': jika narasi menyebut tokoh nyata terkenal. WAJIB isi famous_character_name.
   - 'narrative_character': karakter fiktif dari cerita (karyawan, pemilik restoran, ibu muda, dll).
   - Deskripsi WAJIB lengkap: usia, gender, pakaian, ekspresi spesifik, pose/action.
   - Contoh BAIK: "Pria 40-an berjas coklat, wajah khawatir, memegang struk tagihan besar merah".
   - Contoh BURUK: "Karakter pria".
2. MASKOT CHANNEL — karakter tetap channel (Ilmu Lidi dll), observer yang berbaur dengan karakter utama dalam satu scene. BUKAN tokoh utama. TIDAK ADA PENGECUALIAN.
   - Jika maskot duduk di meja yang sama dengan karakter utama → maskot di kursi sebelah.
   - Jika karakter utama sedang berlari → maskot ikut berlari di sampingnya.
   - Jika karakter utama memegang sesuatu → maskot melihat/menunjuk ke arah itu.
   - DILARANG: maskot di sudut frame yang terisolasi.

### RELASI JUDUL + THUMBNAIL
Judul buka curiosity gap. Thumbnail beri visual conflict/emotional proof. Thumbnail text TIDAK boleh copy judul — harus punchy 2-4 kata, seperti reaksi/konflik visual. Contoh bagus: Judul "Barang Murah Ini Bikin Dompet Lo Bocor" → Text "KOK HABIS?".

### ATURAN VISUAL INDONESIA
Objek familiar: dompet kosong, struk Indomaret, QRIS, paylater, pinjol, tagihan listrik, paket COD, motor Supra, warung, gorengan. Hindari simbol luar negeri jika ada padanan lokal.

### DIVERSITY ENFORCEMENT
3 variasi WAJIB beda trigger type, beda framing, beda panjang judul (30-40, 40-55, 55-65 char). DILARANG sinonim. Self-check sebelum output.

### ATURAN KOMPOSISI
- Teks besar di KIRI frame. Karakter utama + maskot berbaur di KANAN frame.
- JANGAN deskripsikan background/tempat/lokasi. Fokus pada karakter, aksi, dan objek foreground.
- DILARANG: komposisi simetris, elemen di tengah, split-screen, before-after, VS layout.

### CLICKABILITY ENGINE — WAJIB
Tujuan: scene di kanan frame membuat orang BERHENTI SCROLL <0.5 detik.
Setiap thumbnail_prompt WAJIB memiliki 6 elemen ini:
1. **CONFLICT OBJECT** — benda visual sumber konflik yang dominan. BOTOL RACUN, STRUK MERAH, PISAU, HP RETAK. Bukan kata abstrak seperti "masalah" atau "tekanan".
2. **FOCAL POINT** — satu elemen paling menarik mata, di kanan frame (eye-path natural setelah teks kiri).
3. **MOMEN KRITIS** — aksi SEDANG terjadi, bukan sebelum atau sesudah. "Sedang menuang" (bukan "sudah tumpah"). "Tangan meraih" (bukan "telah mengambil").
4. **EKSPRESI SPESIFIK** — bukan "wajah kaget". Tapi "melotot ngeri, mulut setengah terbuka, alis naik asimetris, keringat dingin di pelipis".
5. **IMPLIED STORY** — setelah lihat, penonton bertanya "kok bisa?"/"terus?"/"serius?"
6. **CONTRAST** — dramatic scale/status contrast dalam 1 frame: kaya vs miskin, besar vs kecil, bersih vs kotor, sehat vs sakit.

### TRIGGER TYPES (pilih untuk tiap variasi, WAJIB berbeda)
1. FEAR — ancaman, bahaya, wajah takut
2. CURIOSITY — objek tertutup/blur, misteri
3. SHOCK — ekspresi kaget ekstrem, angka mengejutkan
4. CONTROVERSY — simbol/opini kontroversial dominan
5. TRANSFORMATION — metamorfosis tunggal tanpa split
6. ABSURDISM — paradoks 1 frame, kontras ekstrem
7. HYPERBOLIC_LITERAL — hasil terburuk secara literally

DILARANG: COMPARISON, split-screen, before-after, VS layout. Satu scene bersih.

### INSTRUKSI OUTPUT JSON
- thumbnail_prompt: prompt teknis image-model. WAJIB berisi: karakter utama (usia, pakaian, ekspresi) + aksi/pose + objek + maskot berbaur sebagai observer (jika channel punya maskot). TIDAK BOLEH deskripsi tempat. Contoh BAIK: "Pria 40-an berjas coklat, wajah khawatir, mendorong meja, kalkulator besar dan struk menumpuk. Ilmu Lidi di sebelahnya menunjuk struk dengan ekspresi kaget".
- full_text_overlay: 2-4 kata, punchy, bukan copy judul.
- emphasis_word: di AWAL atau AKHIR full_text_overlay.
- Format: "{emphasis_word} {normal_word}" ATAU "{normal_word} {emphasis_word}".
`;

// Thumbnail visual styles per channel/niche
const THUMBNAIL_STYLES: Record<string, string> = {
  'Ilmu Lidi': 'Modern 2D webcomic, bold clean line art, flat cel-shading, cinematic dramatic lighting, sharp focus, 8k.',
  'Ilmu Survival': 'Dark cinematic 2D, dramatic chiaroscuro, muted earth tones, gritty textured, intense expressions, high contrast, moody.',
  'Ilmu Nyantuy': 'Ultra-minimalist 2D cartoon style, crude MS Paint aesthetic, basic flat colors, unpolished rough outlines, intentionally simple drawing, humorous deadpan tone, solid white or basic flat color background, low-effort high-comedy internet meme vibe, lo-fi digital art.',
  'Ilmu Psikologi Diri': '2D fast digital scribble, whiteboard doodle, dry-erase marker texture, thick messy lines, pure white bg, minimal flat colors.',
};

const THUMBNAIL_STYLE_DEFAULT = 'Modern 2D webcomic, bold clean line art, flat cel-shading, cinematic dramatic lighting, sharp focus, 8k.';

// Get thumbnail style based on writing style text
export const getThumbnailStyle = (writingStyle: string): string => {
  const upper = writingStyle.toUpperCase();
  if (upper.includes('NYANTUY')) return THUMBNAIL_STYLES['Ilmu Nyantuy'];
  if (upper.includes('PSIKOLOGI')) return THUMBNAIL_STYLES['Ilmu Psikologi Diri'];
  if (upper.includes('SURVIVAL')) return THUMBNAIL_STYLES['Ilmu Survival'];
  if (upper.includes('LIDI')) return THUMBNAIL_STYLES['Ilmu Lidi'];
  return THUMBNAIL_STYLE_DEFAULT;
};

const isIlmuLidiChannel = (channelName: string = ""): boolean => /ilmu\s*lidi/i.test(channelName);

const getIlmuLidiPromptLocks = (): string => `
[ILMU LIDI PRESET LOCK]:
- Karakter utama: INVENT dari narasi channel ini (usia 20-40 tahun, gaya visual webcomic 2D).
- Maskot Ilmu Lidi (usia visual 7-10 tahun, 2D semi-chibi): observer yang berbaur dengan karakter utama dalam scene. BUKAN tokoh utama.
- Lock maskot: no adult face, no teenage look, no mature jawline, no realistic anatomy (khusus maskot). Karakter utama tetap usia dewasa.
- Background & typography: SEPENUHNYA dari reference image yang diunggah — JANGAN deskripsikan dalam prompt ini.`;

const getGenericPromptLocks = (channelName: string = ""): string => `
[CHANNEL STYLE LOCK]:
Gunakan referensi gambar sesuai preset/channel "${channelName || 'channel ini'}" yang sudah dipilih.
- Pertahankan identitas visual dan style yang sudah di-set oleh preset channel tersebut.
- Jangan memaksakan elemen style dari channel lain.
- Typography/font/color WAJIB sepenuhnya dari reference image yang diunggah — JANGAN deskripsikan jenis font, warna font, atau gaya typography dalam prompt ini.`;

const getGlobalThumbnailSafetyLocks = (): string => `
[SAFETY LOCKS]:
- NO fake YouTube UI (play button, progress bar, subscribe, watermark, frame player).
- Hanya teks overlay yang ditentukan — semua teks Bahasa Indonesia. DILARANG incidental text pada objek, kertas, HP, struk, poster, background, stiker, watermark, atau properti. Struk/kertas/HP: visual saja tanpa tulisan terbaca.`;

const normalizeTextSpaces = (value: string = ""): string => value.replace(/\s+/g, " ").trim();
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeThumbnailTextParts = (
  fullTextOverlay: string = "",
  emphasisText: string = "",
  normalText: string = ""
): { fullTextOverlay: string; emphasisText: string; normalText: string; emphasisPosition: 'START' | 'END' } => {
  let overlay = normalizeTextSpaces(fullTextOverlay || `${emphasisText} ${normalText}`);
  let emphasis = normalizeTextSpaces(emphasisText);
  let normal = normalizeTextSpaces(normalText);

  if (!overlay) {
    return { fullTextOverlay: "", emphasisText: "", normalText: "", emphasisPosition: 'END' };
  }

  const words = overlay.split(/\s+/).filter(Boolean);
  const rebuildWithBoundaryEmphasis = (preferEnd: boolean = true) => {
    if (words.length <= 1) {
      emphasis = words[0] || overlay;
      normal = "";
      return;
    }
    if (preferEnd) {
      emphasis = words[words.length - 1];
      normal = words.slice(0, -1).join(" ");
    } else {
      emphasis = words[0];
      normal = words.slice(1).join(" ");
    }
  };

  if (!emphasis || !overlay.toLowerCase().includes(emphasis.toLowerCase())) {
    rebuildWithBoundaryEmphasis(true);
  }

  const emphasisPattern = escapeRegExp(emphasis);
  const startsWithEmphasis = new RegExp(`^${emphasisPattern}(\\s|$)`, 'i').test(overlay);
  const endsWithEmphasis = new RegExp(`(^|\\s)${emphasisPattern}$`, 'i').test(overlay);

  if (startsWithEmphasis) {
    normal = normalizeTextSpaces(overlay.replace(new RegExp(`^${emphasisPattern}\\s*`, 'i'), ""));
    return { fullTextOverlay: overlay, emphasisText: emphasis, normalText: normal, emphasisPosition: 'START' };
  }

  if (endsWithEmphasis) {
    normal = normalizeTextSpaces(overlay.replace(new RegExp(`\\s*${emphasisPattern}$`, 'i'), ""));
    return { fullTextOverlay: overlay, emphasisText: emphasis, normalText: normal, emphasisPosition: 'END' };
  }

  // If the model puts emphasis in the middle, keep the overlay phrase intact,
  // then choose an edge word as the emphasis so normalText stays contiguous.
  // Example: "RUMAH GAK HARUS KPR" + emphasis "GAK HARUS" -> emphasis "KPR", normal "RUMAH GAK HARUS".
  rebuildWithBoundaryEmphasis(true);
  return { fullTextOverlay: overlay, emphasisText: emphasis, normalText: normal, emphasisPosition: 'END' };
};

// --- EXPORTED HELPER FOR PROMPT CONSTRUCTION ---
export const constructThumbnailPrompt = (
  sceneDescription: string,
  actionDescription: string,
  emphasisText: string,
  normalText: string,
  fullTextOverlay: string = "",
  visualStyle: string = THUMBNAIL_STYLE_DEFAULT,
  channelName: string = ""
): string => {
  const textParts = normalizeThumbnailTextParts(fullTextOverlay, emphasisText, normalText);
  const phraseToRender = textParts.fullTextOverlay;
  const safeEmphasisText = textParts.emphasisText;
  const safeNormalText = textParts.normalText;
  const emphasisPosition = textParts.emphasisPosition;
  const channelPresetLocks = isIlmuLidiChannel(channelName)
    ? getIlmuLidiPromptLocks()
    : getGenericPromptLocks(channelName);
  const globalSafetyLocks = getGlobalThumbnailSafetyLocks();
  
  return `ROLE: Thumbnail Artist for YouTube.

[VISUAL STYLE]:
${visualStyle}

[SCENE]:
${sceneDescription || ''}
${actionDescription ? `Action: ${actionDescription}` : ''}

[TEXT OVERLAY]:
"${phraseToRender.toUpperCase()}"
→ Emphasis "${safeEmphasisText.toUpperCase()}" ${emphasisPosition === 'START' ? '(AWAL)': '(AKHIR)'}: style typography SEPENUHNYA dari reference image font yang diunggah.
→ Normal word: warna hitam solid, ukuran sama dengan emphasis word.

[RULES]:
Komposisi: Teks besar di kiri. Subjek utama di kanan.
Clickability: Conflict object dominan + momen kritis + ekspresi spesifik kuat + contrast dalam 1 frame.
${channelPresetLocks}
${globalSafetyLocks}`;};

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
             thumbnail_prompt: { type: Type.STRING, description: "Prompt teknis image-model. WAJIB: conflict object dominan + focal point jelas di kanan frame + momen KRITIS sedang terjadi + ekspresi spesifik kuat + contrast dalam 1 frame. WAJIB siapa karakter utama (usia, pakaian, ekspresi) + aksi/pose + objek. TIDAK BOLEH deskripsi tempat. Contoh: 'Pria 40-an berjas coklat, wajah khawatir, melotot ke struk tagihan raksasa MERAH yang disobek, kalkulator hancur di sampingnya'." },
             full_text_overlay: { type: Type.STRING, description: "Teks overlay thumbnail, 2-4 kata, punchy, bukan copy judul." },
             action_description: { type: Type.STRING, description: "Aksi/pose spesifik karakter utama yang sedang dilakukan di scene." },
             emphasis_word: { type: Type.STRING, description: "Kata yang di-highlight. Harus di AWAL atau AKHIR full_text_overlay." },
             normal_word: { type: Type.STRING, description: "Sisa kata selain emphasis_word, harus kontigu/berurutan." },
             trigger_type: { type: Type.STRING, description: "Visual strategy: FEAR, CURIOSITY, SHOCK, ABSURDISM, HYPERBOLIC_LITERAL, dll." },
             character_strategy: { type: Type.STRING, description: "'famous_character' jika narasi menyebutkan tokoh nyata yang bisa divisualkan. 'narrative_character' jika narasi menyebutkan karakter/anonymous dari cerita." },
             famous_character_name: { type: Type.STRING, description: "Nama tokoh terkenal yang harus jadi subjek utama. WAJIB jika character_strategy='famous_character'." }
          },
          required: ["title", "thumbnail_prompt", "full_text_overlay", "action_description", "emphasis_word", "normal_word", "trigger_type", "character_strategy"]
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
  extraContext += `\n\n[ATURAN WAJIB TEXT OVERLAY]: full_text_overlay harus 2-4 kata. emphasis_word HARUS berupa kata/frasa di AWAL atau AKHIR full_text_overlay, tidak boleh mengambil kata tengah. normal_word adalah sisa frasa yang kontigu. Format valid hanya: "emphasis_word + normal_word" atau "normal_word + emphasis_word". Contoh buruk: full_text_overlay="RUMAH GAK HARUS KPR", emphasis_word="GAK HARUS", normal_word="RUMAH KPR".`;
  if (isIlmuLidiChannel(channelName)) {
      extraContext += `\n\n[ATURAN KHUSUS ILMU LIDI UNTUK THUMBNAIL]: Maskot Ilmu Lidi adalah observer yang berbaur dengan karakter utama dalam scene — BUKAN tokoh utama. AI WAJIB invent karakter utama dari narasi. DILARANG COMPARISON, split-screen, VS layout, before-after; teks Inggris; incidental text pada objek.`;
  } else {
      extraContext += `\n\n[ATURAN STYLE CHANNEL]: Jangan memakai style typography/background Ilmu Lidi kecuali user eksplisit memilih/mengunggahnya untuk channel ini. Thumbnail_prompt harus mengikuti identitas channel "${channelName || 'channel ini'}".`;
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
  const langInstruction = `\\n\\n[CRITICAL LANGUAGE REQUIREMENT]: The user has explicitly set the system language to "${targetLanguage}". You MUST generate ALL text fields in the JSON output (title, thumbnail_prompt, full_text_overlay, action_description, emphasis_word, normal_word) ENTIRELY in ${targetLanguage}. DO NOT output Indonesian if the language is set to 'en'. Translate all slang and concepts appropriately.`;
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

        const normalizedTextParts = normalizeThumbnailTextParts(safeOverlay, safeEmphasis, safeNormal);
        safeOverlay = normalizedTextParts.fullTextOverlay;
        safeEmphasis = normalizedTextParts.emphasisText;
        safeNormal = normalizedTextParts.normalText;

        const rawTrigger = String(p.trigger_type || "CURIOSITY").toUpperCase();
        const safeTrigger = rawTrigger.includes("COMPARISON") || rawTrigger.includes("VS") || rawTrigger.includes("BEFORE") || rawTrigger.includes("AFTER")
            ? "CONTRAST_WITHOUT_SPLIT"
            : rawTrigger;

        return {
            id: `pair-${Date.now()}-${idx}`,
            title: safeTitle,
            thumbnail: {
                prompt: p.thumbnail_prompt,
                fullTextOverlay: safeOverlay,
                actionDescription: p.action_description,
                emphasisText: safeEmphasis,
                normalText: safeNormal,
                triggerType: safeTrigger,
                status: 'idle',
                characterStrategy: p.character_strategy || "narrative_character",
                famousCharacterName: p.famous_character_name || "",
                // Automatically construct detailed prompt on creation
                detailedPrompt: constructThumbnailPrompt(
                    p.thumbnail_prompt,
                    p.action_description,
                    safeEmphasis,
                    safeNormal,
                    safeOverlay,
                    visualStyle,
                    channelName
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
    // IMPORTANT: Force simplification of the background
    parts.push({ text: "PRESERVE reference background colors/layout, simplify by removing distracting details (people, clutter, depth layers). DO NOT replace with new background. Max 1-2 environmental elements. INVALID: dark bg, new textures/colors, or \"background\" described in prompt output." });
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
      parts.push({ text: "REFERENCE TYPOGRAPHY & STYLE (USE EXACTLY):" });
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
      
      throw new Error('Gemini image API returned OK but no image data was found.');
      
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
      
      throw error;
    }
  }
  
  throw lastError || new Error('Retry limit exceeded while generating thumbnail image.');
};