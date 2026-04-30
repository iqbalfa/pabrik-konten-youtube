/**
 * Knowledge Base Service — Direct JSON import (no fetch, no CORS issues)
 * Data stored in /data/ directory, bundled at build time.
 *
 * v2 turns raw KB files into a lightweight Content Intelligence Brief:
 * freshness guard → relevance scoring → YouTube-ready insight cards.
 */

import newsData from '../data/news_latest.json';
import trendingData from '../data/news_trending.json';
import youtubeData from '../data/youtube_comments.json';

interface NewsArticle {
  id: string;
  title: string;
  url: string;
  source: string;
  summary: string;
  topics: string[];
  published: string;
}

interface TrendingTopic {
  topic: string;
  article_count: number;
  recent_headlines: string[];
}

interface YouTubeComment {
  text: string;
  author: string;
  likes: number;
  published: string;
  reply_count: number;
  topics: string[];
}

interface YouTubeVideo {
  video_id: string;
  title: string;
  channel: string;
  url: string;
  published: string;
  stats: { views: number; likes: number; comments: number };
  comment_count: number;
  comments: YouTubeComment[];
}

type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'unknown';

interface FreshnessInfo {
  updated: string;
  ageDays: number | null;
  status: FreshnessStatus;
  label: string;
}

interface ScoredNews extends NewsArticle {
  score: number;
  reason: string;
}

interface ScoredComment extends YouTubeComment {
  score: number;
  reason: string;
  videoTitle: string;
}

interface IntelligenceBrief {
  enabled: boolean;
  freshness: {
    overall: FreshnessStatus;
    news: FreshnessInfo;
    trending: FreshnessInfo;
    youtube: FreshnessInfo;
  };
  isSafeToInject: boolean;
  selectedNews: ScoredNews[];
  selectedComments: ScoredComment[];
  selectedTrends: TrendingTopic[];
  localContext: string[];
  audiencePain: string[];
  youtubeAngles: { angle: string; thesis: string }[];
  riskNotes: string[];
  promptContext: string;
}

const MAX_AUTO_INJECT_AGE_DAYS = 7;
const STOPWORDS = new Set([
  'yang', 'dan', 'atau', 'dengan', 'untuk', 'dari', 'dalam', 'karena', 'jadi', 'pada', 'agar', 'bisa',
  'saat', 'ini', 'itu', 'adalah', 'sebagai', 'tentang', 'bahas', 'kenapa', 'orang', 'banyak', 'anak',
  'muda', 'indonesia', 'terlihat', 'sebenarnya', 'contoh', 'seperti', 'hidup', 'topik', 'video', 'channel'
]);

const LOCAL_ENTITY_GROUPS: Record<string, string[]> = {
  finance: ['paylater', 'pinjol', 'utang', 'cicilan', 'kpr', 'qris', 'slik', 'ojk', 'bpjs', 'dplk', 'thr', 'gaji', 'dompet', 'tagihan', 'kredit'],
  lifestyle: ['flexing', 'gengsi', 'nongkrong', 'circle', 'kos', 'kontrakan', 'apartemen', 'mall', 'coffee shop', 'skincare', 'iphone'],
  shopping: ['shopee', 'tokopedia', 'tiktok shop', 'indomaret', 'alfamart', 'cod', 'promo', 'checkout', 'keranjang'],
  transport: ['gojek', 'grab', 'krl', 'mrt', 'angkot', 'supra', 'ojol', 'motor'],
  education: ['ukt', 'snpm b', 'snbt', 'kuliah', 'fresh graduate', 'ijazah', 'kampus'],
  culture: ['arisan', 'buka puasa', 'tahlilan', 'nikahan', 'ronda', 'warung', 'gorengan', 'tetangga']
};

const PAIN_PATTERNS: Array<{ match: RegExp; pain: string; context: string }> = [
  { match: /paylater|pinjol|utang|cicilan|kredit/i, pain: 'Takut terlihat mampu padahal cashflow rapuh karena cicilan dan utang konsumtif.', context: 'Paylater, cicilan HP, pinjol, QRIS, dan tagihan bulanan.' },
  { match: /flexing|gengsi|circle|nongkrong|sosial media|media sosial/i, pain: 'Tekanan sosial untuk terlihat sukses di depan circle dan media sosial.', context: 'Nongkrong mahal, story Instagram, outfit/HP baru, dan validasi circle.' },
  { match: /kerja|gaji|fresh graduate|karier|kantor/i, pain: 'Rasa tertinggal karena gaji dan karier tidak secepat tampilan hidup orang lain.', context: 'Gaji UMR, fresh graduate, budaya kantor, dan biaya hidup kota.' },
  { match: /rumah|kpr|kontrakan|kos/i, pain: 'Kecemasan soal tempat tinggal dan masa depan finansial yang terasa makin jauh.', context: 'KPR, kos-kosan, kontrakan, DP rumah, dan biaya hidup urban.' },
  { match: /mental|cemas|takut|malu|sendiri/i, pain: 'Rasa malu dan cemas yang sering disembunyikan di balik persona online.', context: 'Overthinking, validasi sosial, dan tekanan membandingkan hidup.' }
];

const now = () => Date.now();

const daysBetween = (dateString: string): number | null => {
  const time = Date.parse(dateString);
  if (Number.isNaN(time)) return null;
  return Math.max(0, Math.floor((now() - time) / 86_400_000));
};

const getFreshnessInfo = (updated: string = ''): FreshnessInfo => {
  const ageDays = daysBetween(updated);
  if (ageDays === null) return { updated: updated || 'N/A', ageDays: null, status: 'unknown', label: 'Tidak diketahui' };
  const status: FreshnessStatus = ageDays <= 3 ? 'fresh' : ageDays <= 7 ? 'aging' : 'stale';
  const label = ageDays === 0 ? 'Hari ini' : `${ageDays} hari lalu`;
  return { updated, ageDays, status, label };
};

const combineFreshness = (...items: FreshnessInfo[]): FreshnessStatus => {
  if (items.some(i => i.status === 'stale')) return 'stale';
  if (items.some(i => i.status === 'aging')) return 'aging';
  if (items.every(i => i.status === 'fresh')) return 'fresh';
  return 'unknown';
};

const normalize = (text: string = '') => text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();

const getTokens = (text: string = ''): string[] => {
  const seen = new Set<string>();
  return normalize(text)
    .split(' ')
    .filter(w => w.length > 3 && !STOPWORDS.has(w))
    .filter(w => {
      if (seen.has(w)) return false;
      seen.add(w);
      return true;
    })
    .slice(0, 80);
};

const getLocalEntities = (text: string = ''): string[] => {
  const lower = normalize(text);
  const found: string[] = [];
  for (const entities of Object.values(LOCAL_ENTITY_GROUPS)) {
    for (const entity of entities) {
      if (lower.includes(normalize(entity))) found.push(entity);
    }
  }
  return Array.from(new Set(found)).slice(0, 12);
};

const recencyScore = (dateString: string): number => {
  const age = daysBetween(dateString);
  if (age === null) return 0;
  if (age <= 1) return 3;
  if (age <= 3) return 2;
  if (age <= 7) return 1;
  return 0;
};

const scoreText = (haystack: string, tokens: string[], entities: string[]): { score: number; matched: string[] } => {
  const text = normalize(haystack);
  const matchedTokens = tokens.filter(token => text.includes(token));
  const matchedEntities = entities.filter(entity => text.includes(normalize(entity)));
  return {
    score: matchedTokens.length * 4 + matchedEntities.length * 5,
    matched: Array.from(new Set([...matchedEntities, ...matchedTokens])).slice(0, 5)
  };
};

const buildPainAndContext = (source: string, entities: string[]) => {
  const pain = new Set<string>();
  const context = new Set<string>();
  for (const pattern of PAIN_PATTERNS) {
    if (pattern.match.test(source)) {
      pain.add(pattern.pain);
      context.add(pattern.context);
    }
  }
  for (const entity of entities) context.add(entity);
  return {
    pains: Array.from(pain).slice(0, 5),
    contexts: Array.from(context).slice(0, 8)
  };
};

const getChannelAngles = (channelName: string = '', referenceText: string = '') => {
  const lowerChannel = channelName.toLowerCase();
  const topic = referenceText.split(/[.!?\n]/)[0]?.replace(/^topik:\s*/i, '').slice(0, 90) || 'topik ini';

  if (lowerChannel.includes('survival')) {
    return [
      { angle: 'Survival Modern', thesis: `${topic} sebagai ancaman kecil yang diam-diam melemahkan daya tahan hidup.` },
      { angle: 'Battle Plan', thesis: 'Beri penonton rencana praktis agar tidak kalah oleh sistem atau kebiasaan yang menguras energi/uang.' }
    ];
  }
  if (lowerChannel.includes('nyantuy')) {
    return [
      { angle: 'Absurd Reality', thesis: `Tunjukkan betapa absurdnya ${topic} dengan gaya santai, deadpan, tapi tetap kena.` },
      { angle: 'Plot Twist Lokal', thesis: 'Cari twist yang terasa dekat dengan keseharian Indonesia, bukan teori luar negeri.' }
    ];
  }
  if (lowerChannel.includes('psikologi')) {
    return [
      { angle: 'Self-Awareness', thesis: `${topic} dibaca sebagai pola pikiran dan tekanan sosial yang sering tidak disadari.` },
      { angle: 'Emotional Mirror', thesis: 'Buat penonton merasa “ini gue banget” tanpa menggurui atau sok klinis.' }
    ];
  }
  if (lowerChannel.includes('finance') || /uang|gaji|paylater|utang|investasi|kpr/i.test(referenceText)) {
    return [
      { angle: 'Financial Reality Check', thesis: `${topic} sebagai benturan antara gaya hidup, cashflow, dan keputusan uang harian.` },
      { angle: 'Contrarian Money Take', thesis: 'Masalah utamanya bukan selalu kurang uang, tapi salah membaca tekanan sosial dan prioritas.' }
    ];
  }
  return [
    { angle: 'Contrarian', thesis: `${topic} dibaca dari sisi yang berlawanan dengan asumsi umum penonton.` },
    { angle: 'Local Proof', thesis: 'Gunakan contoh Indonesia yang konkret agar topik terasa dekat dan tidak seperti terjemahan.' }
  ];
};

const buildPromptContext = (brief: Omit<IntelligenceBrief, 'promptContext'>): string => {
  if (!brief.enabled) return '';

  const freshnessLine = `Freshness: ${brief.freshness.overall.toUpperCase()} — News ${brief.freshness.news.label}, Trending ${brief.freshness.trending.label}, YouTube comments ${brief.freshness.youtube.label}.`;

  if (!brief.isSafeToInject) {
    return `\n\n[CONTENT INTELLIGENCE BRIEF — KB STALE, JANGAN DIJADIKAN FAKTA AKTUAL]\n${freshnessLine}\nData knowledge base sudah melewati ${MAX_AUTO_INJECT_AGE_DAYS} hari, jadi JANGAN mengklaimnya sebagai tren saat ini. Gunakan hanya sebagai pengingat konteks umum Indonesia jika relevan, dan prioritaskan referensi utama user.`;
  }

  const lines: string[] = [];
  lines.push('[CONTENT INTELLIGENCE BRIEF — KONTEKS INDONESIA TERKURASI]');
  lines.push(freshnessLine);
  lines.push('Aturan pakai: brief ini adalah konteks pendukung, BUKAN sumber fakta utama. Jangan mengarang angka/statistik/kasus baru. Jika detail tidak ada di referensi, tulis sebagai analogi atau skenario sehari-hari.');

  if (brief.audiencePain.length) {
    lines.push(`\nAudience Pain:\n${brief.audiencePain.map(p => `- ${p}`).join('\n')}`);
  }
  if (brief.localContext.length) {
    lines.push(`\nKonteks Lokal / Objek Relatable:\n${brief.localContext.map(c => `- ${c}`).join('\n')}`);
  }
  if (brief.selectedNews.length) {
    lines.push(`\nSinyal Berita Relevan:\n${brief.selectedNews.map(n => `- [${n.source}] ${n.title}\n  Alasan: ${n.reason}\n  Ringkas: ${n.summary.slice(0, 170)}...`).join('\n')}`);
  }
  if (brief.selectedComments.length) {
    lines.push(`\nSuara Netizen Relevan:\n${brief.selectedComments.map(c => `- "${c.text.slice(0, 180)}" (${c.likes} likes)\n  Alasan: ${c.reason}`).join('\n')}`);
  }
  if (brief.selectedTrends.length) {
    lines.push(`\nTrend Terdekat:\n${brief.selectedTrends.map(t => `- ${t.topic}: ${t.recent_headlines.slice(0, 2).join('; ')}`).join('\n')}`);
  }
  if (brief.youtubeAngles.length) {
    lines.push(`\nAngle YouTube yang Bisa Dipakai:\n${brief.youtubeAngles.map(a => `- ${a.angle}: ${a.thesis}`).join('\n')}`);
  }
  if (brief.riskNotes.length) {
    lines.push(`\nRisk Notes:\n${brief.riskNotes.map(r => `- ${r}`).join('\n')}`);
  }

  return `\n\n${lines.join('\n')}`;
};

export const buildContentIntelligenceBrief = ({
  referenceText = '',
  keywords = '',
  channelName = '',
  enabled = true,
  maxAgeDays = MAX_AUTO_INJECT_AGE_DAYS,
}: {
  referenceText?: string;
  keywords?: string;
  channelName?: string;
  enabled?: boolean;
  maxAgeDays?: number;
} = {}): IntelligenceBrief => {
  const news = newsData as { updated: string; count: number; items: NewsArticle[] };
  const trending = trendingData as { updated: string; topics: TrendingTopic[] };
  const youtube = youtubeData as { updated: string; videos: YouTubeVideo[]; video_count: number; total_comments: number };

  const newsFreshness = getFreshnessInfo(news?.updated);
  const trendingFreshness = getFreshnessInfo(trending?.updated);
  const youtubeFreshness = getFreshnessInfo(youtube?.updated);
  const overall = combineFreshness(newsFreshness, trendingFreshness, youtubeFreshness);
  const oldestAge = Math.max(newsFreshness.ageDays ?? 999, trendingFreshness.ageDays ?? 999, youtubeFreshness.ageDays ?? 999);
  const isSafeToInject = enabled && overall !== 'unknown' && oldestAge <= maxAgeDays;

  const source = `${referenceText}\n${keywords}\n${channelName}`;
  const tokens = getTokens(source);
  const entities = getLocalEntities(source);
  const { pains, contexts } = buildPainAndContext(source, entities);

  const selectedNews = (news?.items || [])
    .map(item => {
      const scored = scoreText(`${item.title} ${item.summary} ${(item.topics || []).join(' ')}`, tokens, entities);
      const score = scored.score + recencyScore(item.published) * 2;
      return {
        ...item,
        score,
        reason: scored.matched.length ? `match: ${scored.matched.join(', ')}` : 'engagement/konteks umum'
      };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const allComments: ScoredComment[] = [];
  for (const video of youtube?.videos || []) {
    for (const comment of video.comments || []) {
      const scored = scoreText(`${comment.text} ${video.title} ${(comment.topics || []).join(' ')}`, tokens, entities);
      const engagement = Math.min(5, Math.log10((comment.likes || 0) + 1));
      const score = scored.score + engagement + recencyScore(comment.published);
      if (score > 0) {
        allComments.push({
          ...comment,
          videoTitle: video.title,
          score,
          reason: scored.matched.length ? `match: ${scored.matched.join(', ')}` : 'komentar berengagement'
        });
      }
    }
  }
  const selectedComments = allComments.sort((a, b) => b.score - a.score).slice(0, 8);

  const selectedTrends = (trending?.topics || [])
    .map(topic => ({ topic, scored: scoreText(`${topic.topic} ${topic.recent_headlines.join(' ')}`, tokens, entities) }))
    .filter(item => item.scored.score > 0)
    .sort((a, b) => b.scored.score - a.scored.score)
    .map(item => item.topic)
    .slice(0, 3);

  const riskNotes = [
    'Jangan mengklaim data KB sebagai statistik jika angka tidak muncul di referensi utama.',
    'Bedakan contoh analogi sehari-hari dengan fakta/kasus nyata.',
    'Jika topik sensitif finansial/mental, jangan menyalahkan penonton secara kasar.'
  ];

  const partialBrief = {
    enabled,
    freshness: { overall, news: newsFreshness, trending: trendingFreshness, youtube: youtubeFreshness },
    isSafeToInject,
    selectedNews,
    selectedComments,
    selectedTrends,
    localContext: contexts.length ? contexts : entities.slice(0, 8),
    audiencePain: pains,
    youtubeAngles: getChannelAngles(channelName, referenceText),
    riskNotes,
  };

  return {
    ...partialBrief,
    promptContext: buildPromptContext(partialBrief)
  };
};

/**
 * Backward-compatible helper used by existing Gemini service.
 */
export const buildKnowledgeBaseContext = (
  referenceText: string = '',
  keywords: string = '',
  channelName: string = '',
  enabled: boolean = true
): string => {
  return buildContentIntelligenceBrief({ referenceText, keywords, channelName, enabled }).promptContext;
};

export const getKBIntelligencePreview = (referenceText: string = '', keywords: string = '', channelName: string = '') => {
  const brief = buildContentIntelligenceBrief({ referenceText, keywords, channelName, enabled: true });
  return {
    status: brief.freshness.overall,
    isSafeToInject: brief.isSafeToInject,
    freshness: brief.freshness,
    counts: {
      relevantNews: brief.selectedNews.length,
      relevantComments: brief.selectedComments.length,
      relevantTrends: brief.selectedTrends.length,
      localContext: brief.localContext.length,
      audiencePain: brief.audiencePain.length,
    },
    sample: {
      pain: brief.audiencePain.slice(0, 2),
      context: brief.localContext.slice(0, 4),
      angles: brief.youtubeAngles.slice(0, 2),
      news: brief.selectedNews.slice(0, 2).map(n => ({ title: n.title, reason: n.reason })),
      comments: brief.selectedComments.slice(0, 2).map(c => ({ text: c.text.slice(0, 120), reason: c.reason, likes: c.likes })),
    }
  };
};

/**
 * Get KB data summary for UI display
 */
export const getKBSummary = () => {
  const news = newsData as { updated: string; count: number };
  const trending = trendingData as { updated: string; topics: TrendingTopic[] };
  const youtube = youtubeData as { updated: string; video_count: number; total_comments: number };
  const newsFreshness = getFreshnessInfo(news?.updated);
  const trendingFreshness = getFreshnessInfo(trending?.updated);
  const youtubeFreshness = getFreshnessInfo(youtube?.updated);

  return {
    newsCount: news?.count || 0,
    newsUpdated: news?.updated || 'N/A',
    newsFreshness,
    trendingTopics: trending?.topics?.length || 0,
    trendingUpdated: trending?.updated || 'N/A',
    trendingFreshness,
    youtubeVideos: youtube?.video_count || 0,
    youtubeComments: youtube?.total_comments || 0,
    youtubeUpdated: youtube?.updated || 'N/A',
    youtubeFreshness,
    overallStatus: combineFreshness(newsFreshness, trendingFreshness, youtubeFreshness),
  };
};
