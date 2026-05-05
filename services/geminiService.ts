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

### ANTI-PATTERN JUDUL (DILARANG)
- "Update [Tahun]:" terlalu newsy dan template.
- "Sedang Trending:" generic.
- "[Number] Fakta Tentang [X]" paling overused.
- "Ternyata Ini Faktanya:" klise.
- "Panduan Lengkap:" terdengar textbook.
- "Breaking:" bukan channel berita.
- Jangan membuat judul yang cuma mengganti sinonim dari judul lama.


### PRINSIP THUMBNAIL
- Thumbnail harus menonjolkan pesan utama, bukan sekadar dekorasi.
- Harus punya objek utama yang konkret, cepat dikenali, dan simbolik.
- Teks thumbnail harus pendek, padat, 2-4 kata, terbaca dalam <0.5 detik, dan JANGAN mengulang judul.
- Teks dan objek harus saling melengkapi, bukan duplikasi.
- Harus ada satu pusat perhatian yang jelas.
- Variasi thumbnail harus beda logika, bukan beda kosmetik.
- Hindari thumbnail generik yang hanya mengandalkan ekspresi wajah kaget atau panik.
- Gunakan objek atau simbol yang relevan dengan topik dan mudah dikenali audiens.

### VISUAL TRANSFORMATION ENGINE — WAJIB
Tugas thumbnail BUKAN menjelaskan topik secara literal. Tugas thumbnail adalah MENUNJUKKAN HASIL TERBURUK/TERANEH/TERKEJUT dari topik secara EXTREM dan HYPERBOLIC.

Untuk setiap variasi, lakukan proses ini:
1. LITERAL TOPIC — pahami topik/judul secara sederhana.
2. HIDDEN ANXIETY — temukan rasa takut, marah, atau rasa tertipu yang terkecil dari topik ini.
3. HYPERBOLIC LITERALISM — JANGAN buat metafora. TUNJUKKAN HASILNYA SECARA EXTREM SEKALI SECARA LITERALLY. Makin ekstrem dan literally, makin kuat.
4. CONFLICT OBJECT — pilih satu objek utama yang menciptakan konflik, ancaman, atau ketegangan.
5. CURIOSITY OBJECT — tambahkan satu elemen aneh/kontras yang bikin penonton bertanya "itu apa?".
6. EMOTIONAL PROOF — karakter/subjek harus bereaksi secara spesifik dengan ekspresi dan pose yang PROVES the emotion.
7. STOP-SCROLL TEST — kenapa gambar ini menghentikan scroll dalam 1 detik?

PRINSIP HYPERBOLIC LITERALISM:
- Makin literally ekstrem = makin kuat thumbnail
- Contoh: topik "pria hamil" → TUNJUKKAN literally pria dewasa dengan perut besar hijau membusuk, bukan metafora "perut sebagai masalah"
- Contoh: topik "makan sampah" → TUNJUKKAN literally wajah seseorang dengan sampah di mulut, bukan metafora
- Contoh: topik "dibuang sistem" → TUNJUKKAN literally orang dilempar keluar dari pintu mesin raksasa bertulis SISTEM, bukan metafora abstrak

CONTOH TRANSFORMASI (@SingkatCeritaJuga style):
- Topik tabungan → HYPERBOLIC: 50 tahun dilempari keluar pintu mesin raksasa bertulis SISTEM, ekspresi ketakutan, struk menumpuk beterbangan.
- Topik paylater → HYPERBOLIC: HP berubah jadi borgol besar yang mengikat kalender, rantai dari layar menuju ke masa depan yang suram.
- Topik makan di restoran busuk → HYPERBOLIC: makanan berbentuk toilet di atas meja, ekspresi jijik ekstrem, semua orang menutup mulut.
- Topik tempat terlarang → HYPERBOLIC: candi runtuh dengan karakter panik berlari, teks "MASUK SINI = M4TI".
- Topik anak di pemakaman → HYPERBOLIC: anak SD ceria tertawa di depan nisan, ekspresi normal vs latar kuburan.

ANTI-GENERIK: Draft gagal jika hanya berisi orang panik biasa, uang melayang generik, laptop/HP tanpa keanehan ekstrem, tanda tanya tanpa konteks, atau ekspresi kaget tanpa situasi ekstrem konkret.

### CHARACTER STRATEGY — WAJIB PILIH SALAH SATU
Untuk setiap variasi, tentukan character_strategy:
- 'famous_character': Pilih ini JIKA narasi/storyline secara eksplisit menyebutkan tokoh nyata yang bisa divisualkan. Contoh tokoh: "Charles Darwin", "Newton", "Tesla", "Michelangelo", "presiden", "selebriti", "tokoh sejarah", "tokoh dunia", "tokoh terkenal", figur dengan nama/julukan yang dikenali.
- 'mascot_as_main': Pilih ini JIKA topik adalah konsep abstrak tanpa tokoh (misal: "tips hemat", "cara kerja X", "fenomena Y", "prilaku A").
- Jika memilih 'famous_character', WAJIB isi famous_character_name dengan nama tokoh yang конкрет.
- Mascot/channel identity yang diunggah user tetap bisa muncul sebagai karakter sekunder/observer di sudut frame, TAPI tokoh utama harus sesuai character_strategy.

### RELASI JUDUL + THUMBNAIL (WAJIB)
Judul dan thumbnail HARUS saling melengkapi, bukan saling mengulang.
- Judul membuka curiosity gap.
- Thumbnail memberi visual conflict atau emotional proof.
- Thumbnail text tidak boleh copy-paste judul.
- Thumbnail text harus punchy, 2-4 kata, dan lebih terasa seperti reaksi/konflik visual.
Contoh bagus:
Judul: "Barang Murah Ini Bikin Dompet Lo Bocor Pelan-Pelan"
Thumbnail text: "KOK HABIS?"
Visual: dompet kosong + struk panjang + karakter panik.
Contoh buruk:
Thumbnail text: "BARANG MURAH BIKIN DOMPET BOCOR" karena cuma mengulang judul.

### ATURAN VISUAL RELATABLE INDONESIA
Jika konteks audience Indonesia, pilih objek visual yang langsung familiar bagi penonton Indonesia.
- Finance/money: dompet kosong, struk Indomaret/Alfamart, QRIS, paylater, pinjol, tagihan listrik/token, paket COD, kos-kosan.
- Everyday objects: motor Supra, warung, minimarket, gorengan, galon, pulsa, paket Shopee/TikTok Shop.
- Hindari simbol/brand/contoh luar negeri yang tidak relatable jika ada padanan lokal yang lebih kuat.

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

Tambahkan juga scoring visual:
- visual_ctr_score: angka 1-100 untuk kekuatan visual thumbnail, bukan kualitas judul.
- stop_scroll_reason: alasan konkret kenapa penonton berhenti scroll.
- thumbnail_weakness: risiko utama yang bisa membuat thumbnail gagal diklik.
Skor visual minimal 78. Kalau di bawah itu, revisi konsep sebelum output.

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
- Jangan deskripsikan background, warna background, elemen lingkungan, atau TEMPAT/LOKASI. Fokus pada karakter, aksi, dan objek foreground.
- TIDAK BOLEH ada deskripsi tempat: "di rumah", "di kantor", "di sekolah", "di supermarket", "berlatar", "dengan latar", dll.

### INSTRUKSI OUTPUT JSON
Output adalah CTR package, bukan sekadar pasangan generik.
- Title: harus channel-fit, natural, click-enticing, dan berbeda framing antar variasi.
- Visual_concept: konsep thumbnail human-readable, 1-2 kalimat. Jelaskan konflik visual dan kenapa mudah diklik.
- Visual_metaphor: metafora visual utama yang mengubah topik literal menjadi konflik yang clickable.
- Conflict_object: satu objek utama yang menciptakan ancaman/ketegangan/konflik.
- Curiosity_object: satu elemen aneh/kontras yang membuat penonton bertanya.
- Emotion_target: emosi utama yang ditargetkan, misalnya takut, malu, marah, kaget, lega, iri, atau absurd.
- Stop_scroll_reason: alasan 1 kalimat kenapa visual ini membuat orang berhenti scroll.
- Thumbnail_weakness: risiko utama kenapa thumbnail ini bisa terasa lemah/generik.
- Visual_ctr_score: skor visual 1-100; minimal 78, revisi jika lebih rendah.
- Thumbnail_prompt: prompt teknis image-model yang konkret, fokus pada pesan utama, objek sentral, dan aksi. Wajib memasukkan visual_metaphor, conflict_object, dan curiosity_object secara natural. TIDAK BOLEH mengandung deskripsi tempat/lokasi/settings seperti "di kantor", "di rumah", "di supermarket", "berlatar", "dengan latar", "background:", dll. Cukup: SUBJEK + AKSI + OBJEK YANG ADA + KONFLIK VISUAL. Contoh BURUK: "seorang pria berdiri di kantor dengan latar meja kerja". Contoh BAIK: "Karakter kita mendorong meja jatuh ke arahnya, ekspresi panik, calculator besar dan struk menumpuk".
- Full_text_overlay: 2-4 kata, punchy, bukan copy judul.
- Action_description: aksi karakter harus spesifik dan relevan dengan pesan/topik utama.
- emphasis_word dan normal_word harus membentuk full_text_overlay dengan urutan baca yang jelas.
- ATURAN WAJIB EMPHASIS: emphasis_word HANYA boleh berada di AWAL atau AKHIR full_text_overlay, tidak boleh di tengah kalimat.
- normal_word adalah sisa frasa yang menyambung dengan emphasis_word, bukan gabungan kata yang terpisah.
- Format valid hanya: "{emphasis_word} {normal_word}" ATAU "{normal_word} {emphasis_word}".
- Contoh BURUK: full_text_overlay="RUMAH GAK HARUS KPR", emphasis_word="GAK HARUS", normal_word="RUMAH KPR" karena emphasis di tengah dan normal terpecah.
- Contoh BAIK: full_text_overlay="RUMAH GAK HARUS KPR", emphasis_word="KPR", normal_word="RUMAH GAK HARUS" ATAU emphasis_word="RUMAH", normal_word="GAK HARUS KPR".
- clickbait_risk: LOW, MEDIUM, atau HIGH. HIGH jika terlalu menyesatkan atau terlalu bombastis.

### TRIGGER TYPES (WAJIB PILIH SALAH SATU)
Setiap variasi WAJIB menggunakan trigger_type yang berbeda dari variasi lain. Pilih dari kategori berikut:

1. FEAR — Visual yang memicu rasa takut atau waswas. Contoh: ancaman mendekat, bahaya mengintai, wajah ketakutan, objek menyeramkan.
2. CURIOSITY — Visual yang memicu rasa penasaran. Contoh: objek tertutup/blur, tanda tanya besar, sesuatu yang "tersembunyi" atau belum terbuka.
3. SHOCK — Visual yang memicu keterkejutan. Contoh: ekspresi kaget ekstrem, angka besar yang mengejutkan, objek utama yang tampak tidak wajar.
4. AUTHORITY — Visual yang memancarkan kredibilitas dan kekuasaan. Contoh: angka/data besar, simbol pencapaian, gesture "expert", podium/trophy.
5. CONTROVERSY — Visual yang memicu perdebatan tanpa layout VS/split-screen. Contoh: satu simbol/opini kontroversial yang dominan, ekspresi tidak percaya, objek pemicu debat.
6. TRANSFORMATION — Visual yang menunjukkan perubahan drastis tanpa split before/after. Contoh: metamorfosis tunggal, glow-up, objek berubah bentuk, timeline abstrak yang tetap satu komposisi.
7. NUMBERS — Visual yang memakai angka sebagai daya tarik utama. Contoh: angka besar di tengah frame, uang/pendapatan, countdown, statistik.
8. EMOTION — Visual yang memicu emosi kuat (haru, bangga, marah). Contoh: wajah emosional, momen dramatis, gesture penuh perasaan.
9. HUMOR — Visual yang memicu tawa atau senyum. Contoh: situasi absurd, ekspresi lucu, meme-style, ironi visual.
10. ABSURDISM — Visual yang menampilkan sesuatu yang sangat tidak masuk akal atau paradoks dalam 1 frame. Kontras ekstrem antara subjek dan setting. Contoh: anak ceria di pemakaman, orang makan dari toilet, situasi normal dengan elemen sangat janggal.
11. HYPERBOLIC_LITERAL — Visual yang MENUNJUKKAN HASIL TERBURUK/TEREKSTREM dari topik SECARA LITERALLY. Bukan metafora. Makin ekstrem dan literally, makin kuat. Contoh: pria dengan perut hijau membusuk untuk "pria hamil", restoran mewah dengan makanan berbentuk poop.

ATURAN TRIGGER TYPE:
- Ketiga variasi WAJIB pakai trigger_type yang BERBEDA.
- Pilih trigger_type yang paling sesuai dengan konteks materi, bukan acak.
- DILARANG memakai trigger_type "COMPARISON".
- DILARANG split-screen, before-after, kiri-vs-kanan, VS layout, atau komposisi perbandingan dua panel. Area kiri sudah dipakai untuk teks besar; visual utama harus tetap satu scene yang bersih.
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

const isIlmuLidiChannel = (channelName: string = ""): boolean => /ilmu\s*lidi/i.test(channelName);

const getIlmuLidiPromptLocks = (): string => `
[ILMU LIDI PRESET LOCK]:
- Karakter utama: maskot anak laki-laki bernama Ilmu Lidi (usia visual 7-10 tahun, 2D semi-chibi).
- NEGATIVE LOCK: no adult face, no teenage look, no mature jawline, no realistic anatomy.
- Background & typography: SEPENUHNYA dari reference image yang diunggah — JANGAN deskripsikan dalam prompt ini.
- Bottom-right harus bersih untuk durasi YouTube.`;

const getGenericPromptLocks = (channelName: string = ""): string => `
[CHANNEL STYLE LOCK]:
Gunakan referensi gambar sesuai preset/channel "${channelName || 'channel ini'}" yang sudah dipilih.
- Pertahankan identitas visual dan style yang sudah di-set oleh preset channel tersebut.
- Jangan memaksakan elemen style dari channel lain.
- Typography/font/color WAJIB sepenuhnya dari reference image yang diunggah — JANGAN deskripsikan jenis font, warna font, atau gaya typography dalam prompt ini.`;

const getGlobalThumbnailSafetyLocks = (): string => `
[NO FAKE YOUTUBE UI - FINAL LOCK]:
DILARANG KERAS membuat elemen UI YouTube palsu: overlay durasi/timestamp seperti 10:23 atau 12:34, play button, progress bar, watermark YouTube, badge channel, tombol subscribe, like/share UI, atau frame player. Sudut kanan bawah HARUS bersih dari objek penting dan teks.

[INDONESIAN VISIBLE TEXT LOCK]:
Semua teks yang terlihat di gambar final HARUS Bahasa Indonesia dan hanya teks overlay yang ditentukan. DILARANG menambahkan teks Inggris seperti Bill, Debt, Money, Loan, Save, Rich, Poor, Sale, Promo asing, kecuali brand/nama resmi yang memang diminta. Gunakan padanan Indonesia: TAGIHAN, UTANG, UANG, PINJAMAN, HEMAT, KAYA, MISKIN, PROMO.

[NO INCIDENTAL TEXT LOCK]:
DILARANG menambahkan tulisan lain pada objek, kertas, layar HP, struk, poster, papan, background, stiker, watermark, atau properti. Jika ada struk/kertas/HP, tampilkan sebagai bentuk visual tanpa tulisan terbaca, kecuali kata itu adalah overlay final.`;

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
  fullTextOverlay: string = "", // Added support for fullTextOverlay
  visualStyle: string = THUMBNAIL_STYLE_DEFAULT,
  channelName: string = "" // Added support for channelName
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

[CHANNEL STYLE LOCK]:
${channelPresetLocks}

[GLOBAL SAFETY LOCK]:
${globalSafetyLocks}

[REFERENCE IMAGES]:
Background & typography → gunakan untuk style dan referensi visual, bukan untuk menyalin teks/konten yang ada.
Karakter reference → gunakan untuk identitas, proporsi, dan pose style karakter.

[BACKGROUND]:
Ikuti reference image yang diunggah. Area kiri kosong untuk teks overlay. Area kanan untuk subjek utama — simplify, tidak crowded.

[SCENE]:
${sceneDescription}
${actionDescription ? `Aksi: ${actionDescription}` : ''}

[SUBJEK UTAMA]:
Karakter utama adalah figur visual yang paling menonjol di scene ini.

[TEXT OVERLAY - FINAL]:
• FULL: "${phraseToRender.toUpperCase()}"
• Emphasis: "${safeEmphasisText.toUpperCase()}" → posisi: ${emphasisPosition === 'START' ? 'AWAL' : 'AKHIR'} kalimat
• Hanya teks ini yang boleh muncul. Huruf KAPITAL. Style dari reference typography.
• JANGAN render teks lain (timestamp, label, nama objek, kata Inggris BILL/DEBT/MONEY dll).

[COMPOSITION]:
Teks di kiri. Subjek utama di kanan. Sudut kanan bawah bersih.
DILARANG split-screen, VS layout, atau dua panel.
`;};

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
             visual_concept: { type: Type.STRING, description: "Human-readable thumbnail concept separate from technical prompt." },
             visual_metaphor: { type: Type.STRING, description: "The main visual metaphor that turns the topic into a clickable conflict." },
             conflict_object: { type: Type.STRING, description: "The single object creating visual threat, tension, or contradiction." },
             curiosity_object: { type: Type.STRING, description: "The unusual or contrast element that makes viewers ask what is happening." },
             emotion_target: { type: Type.STRING, description: "Primary emotion targeted by the thumbnail." },
             stop_scroll_reason: { type: Type.STRING, description: "Why this visual stops viewers in under one second." },
             thumbnail_weakness: { type: Type.STRING, description: "Main risk that could make this thumbnail weak or generic." },
             visual_ctr_score: { type: Type.NUMBER, description: "Visual clickability score from 1 to 100. Minimum target is 78." },
             full_text_overlay: { type: Type.STRING, description: "STEP 1: Short 2-4 words text overlay." },
             action_description: { type: Type.STRING, description: "Specific description of character pose/action." },
             emphasis_word: { type: Type.STRING, description: "STEP 2: Emphasis highlight. Must be the prefix OR suffix of full_text_overlay, never the middle words." },
             normal_word: { type: Type.STRING, description: "STEP 2: Remaining contiguous text next to emphasis_word. Must not combine separated words from before and after emphasis." },
             trigger_type: { type: Type.STRING, description: "Visual strategy: FEAR, CURIOSITY, SHOCK, ABSURDISM, HYPERBOLIC_LITERAL, etc." },
             character_strategy: { type: Type.STRING, description: "'famous_character' jika narasi menyebutkan tokoh nyata yang bisa divisualkan (nama, julukan, figur terkenal). 'mascot_as_main' jika narasi tidak punya tokoh populer yang jelas." },
             famous_character_name: { type: Type.STRING, description: "Nama tokoh terkenal yang harus jadi subjek utama thumbnail. WAJIB diisi jika character_strategy='famous_character'. Contoh: 'Charles Darwin', 'Isaac Newton', 'Nikola Tesla', 'Michelangelo', 'Albert Einstein'." },
             feasibility_score: { type: Type.NUMBER },
             ctr_analysis: { type: Type.STRING, description: "Analisis singkat kenapa judul ini potensi CTR tinggi/sedang. 2-3 kalimat." },
             clickbait_risk: { type: Type.STRING, description: "LOW, MEDIUM, or HIGH" }
          },
          required: ["title", "thumbnail_prompt", "visual_concept", "visual_metaphor", "conflict_object", "curiosity_object", "emotion_target", "stop_scroll_reason", "thumbnail_weakness", "visual_ctr_score", "full_text_overlay", "action_description", "emphasis_word", "normal_word", "trigger_type", "ctr_analysis", "clickbait_risk", "character_strategy", "famous_character_name"]
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
  extraContext += `\n\n[ATURAN WAJIB VISUAL CTR]: thumbnail_prompt harus berupa konflik visual, bukan gambar literal topik. Sertakan visual_metaphor, conflict_object, curiosity_object, emotion_target, stop_scroll_reason, thumbnail_weakness, dan visual_ctr_score. Hindari visual generik seperti orang panik + uang/HP tanpa metafora. Minimal visual_ctr_score 78.`;
  if (isIlmuLidiChannel(channelName)) {
      extraContext += `\n\n[ATURAN KHUSUS ILMU LIDI UNTUK THUMBNAIL]: Typography/background reference biru muda + headline hitam + banner merah adalah KHUSUS preset Ilmu Lidi. Thumbnail_prompt harus menjaga karakter Ilmu Lidi sebagai anak laki-laki 7-10 tahun semi-chibi, bukan remaja/dewasa. DILARANG COMPARISON, split-screen, VS layout, before-after, overlay durasi palsu, teks Inggris, dan incidental text pada objek.`;
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
  const langInstruction = `\n\n[CRITICAL LANGUAGE REQUIREMENT]: The user has explicitly set the system language to "${targetLanguage}". You MUST generate ALL text fields in the JSON output (title, thumbnail_prompt, visual_concept, visual_metaphor, conflict_object, curiosity_object, emotion_target, stop_scroll_reason, thumbnail_weakness, full_text_overlay, action_description, emphasis_word, normal_word) ENTIRELY in ${targetLanguage}. DO NOT output Indonesian if the language is set to 'en'. Translate all slang and concepts appropriately.`;
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

        const visualBrief = [
            `ACTOR STRATEGY: ${p.character_strategy === 'famous_character' && p.famous_character_name ? `Tokoh utama: "${p.famous_character_name}" — figur ini adalah subjek visual utama di scene, BUKAN elemen sekunder. Maskot/channel identity (jika diunggah) BOLEH muncul sebagai karakter sekunder di sudut frame.` : p.character_strategy === 'famous_character' ? `Tokoh utama: figur yang disebutkan dalam narasi. Maskot boleh sekunder.` : `Tokoh utama: maskot/channel identity.`}`,
            p.visual_metaphor ? `HYPERBOLIC CONCEPT: ${p.visual_metaphor}` : '',
            p.conflict_object ? `CONFLICT OBJECT: ${p.conflict_object}` : '',
            p.curiosity_object ? `CURIOSITY OBJECT: ${p.curiosity_object}` : '',
            p.emotion_target ? `EMOTION TARGET: ${p.emotion_target}` : '',
            p.stop_scroll_reason ? `STOP-SCROLL REASON: ${p.stop_scroll_reason}` : '',
            p.thumbnail_prompt ? `SCENE: ${p.thumbnail_prompt}` : '',
        ].filter(Boolean).join("\n");

        return {
            id: `pair-${Date.now()}-${idx}`,
            title: safeTitle,
            ctrAnalysis: p.ctr_analysis || "Tidak ada analisis.",
            clickbaitRisk: p.clickbait_risk || "MEDIUM",
            thumbnail: {
                prompt: p.thumbnail_prompt,
                visualConcept: p.visual_concept || p.thumbnail_prompt,
                visualMetaphor: p.visual_metaphor,
                conflictObject: p.conflict_object,
                curiosityObject: p.curiosity_object,
                emotionTarget: p.emotion_target,
                stopScrollReason: p.stop_scroll_reason,
                thumbnailWeakness: p.thumbnail_weakness,
                visualCtrScore: Number(p.visual_ctr_score) || 75,
                fullTextOverlay: safeOverlay,
                actionDescription: p.action_description,
                suggestedText: safeOverlay, // Fallback
                emphasisText: safeEmphasis,
                normalText: safeNormal,
                triggerType: safeTrigger,
                status: 'idle',
                feasibilityScore: p.feasibility_score || 85,
                characterStrategy: p.character_strategy || "mascot_as_main",
                famousCharacterName: p.famous_character_name || "",
                // Automatically construct detailed prompt on creation
                detailedPrompt: constructThumbnailPrompt(
                    visualBrief || p.thumbnail_prompt, 
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
    // IMPORTANT: Force simplification of the background
    parts.push({ text: "IMPORTANT: PRESERVE AND MINIMALIZE — Keep the original background as-is in terms of colors and general layout. Do NOT replace it with a new background. Simplification means: reduce clutter by removing distracting details (people in background, complex textures, layered depth), NOT by substituting with a new background. Max 1-2 dominant environmental elements. INVALID outputs: dark background, formula sketches, new textures, colors not in reference, or explicit descriptions of \"background\" or \"latar\" in the prompt itself. The only source of truth is the reference image." });
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