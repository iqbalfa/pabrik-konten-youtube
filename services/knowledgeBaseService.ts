/**
 * Knowledge Base Service
 * Fetches real-time Indonesian news & YouTube comments from GitHub Pages.
 */

const KB_BASE_URL = 'https://iqbalfa.github.io/knowledge-base';

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

interface NewsData {
  updated: string;
  source: string;
  count: number;
  items: NewsArticle[];
}

interface TrendingData {
  updated: string;
  topics: TrendingTopic[];
}

interface YouTubeData {
  updated: string;
  source: string;
  video_count: number;
  total_comments: number;
  videos: YouTubeVideo[];
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function fetchKB<T>(endpoint: string): Promise<T | null> {
  const cached = cache.get(endpoint);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  try {
    const resp = await fetch(`${KB_BASE_URL}/${endpoint}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    cache.set(endpoint, { data, timestamp: Date.now() });
    return data as T;
  } catch (e) {
    console.warn(`[KB] Failed to fetch ${endpoint}:`, e);
    return null;
  }
}

/**
 * Build context string for LLM prompts from knowledge base data.
 * Filters by topic relevance if referenceText is provided.
 */
export const buildKnowledgeBaseContext = async (
  referenceText: string = ''
): Promise<string> => {
  const parts: string[] = [];

  // Fetch all data in parallel
  const [news, trending, youtube] = await Promise.all([
    fetchKB<NewsData>('data/news/latest.json'),
    fetchKB<TrendingData>('data/news/trending.json'),
    fetchKB<YouTubeData>('data/youtube/comments.json'),
  ]);

  // --- Trending Topics ---
  if (trending?.topics?.length) {
    const topTopics = trending.topics.slice(0, 8);
    const topicLines = topTopics.map(t =>
      `- ${t.topic} (${t.article_count} artikel): ${t.recent_headlines.slice(0, 2).join('; ')}`
    );
    parts.push(`[TOPIK TRENDING INDONESIA SAAT INI]\n${topicLines.join('\n')}`);
  }

  // --- Relevant News (keyword match with reference) ---
  if (news?.items?.length && referenceText) {
    const refWords = referenceText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const relevant = news.items
      .filter(item => {
        const text = (item.title + ' ' + item.summary).toLowerCase();
        return refWords.some(w => text.includes(w));
      })
      .slice(0, 5);

    if (relevant.length) {
      const newsLines = relevant.map(a =>
        `- [${a.source}] ${a.title}\n  ${a.summary.slice(0, 150)}...`
      );
      parts.push(`[BERITA TERKAIT REFERENSI]\n${newsLines.join('\n\n')}`);
    }
  }

  // --- Netizen Voice (top comments from relevant videos) ---
  if (youtube?.videos?.length) {
    // Get all comments, sort by engagement
    const allComments: (YouTubeComment & { videoTitle: string })[] = [];
    for (const video of youtube.videos) {
      for (const comment of video.comments) {
        allComments.push({ ...comment, videoTitle: video.title });
      }
    }
    allComments.sort((a, b) => b.likes - a.likes);

    // Filter by relevance if reference provided
    let selected: typeof allComments;
    if (referenceText) {
      const refWords = referenceText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      selected = allComments
        .filter(c => {
          const text = c.text.toLowerCase();
          return refWords.some(w => text.includes(w));
        })
        .slice(0, 8);

      // If not enough relevant, fill with top engagement
      if (selected.length < 3) {
        selected = allComments.slice(0, 8);
      }
    } else {
      selected = allComments.slice(0, 8);
    }

    if (selected.length) {
      const commentLines = selected.map(c =>
        `- "${c.text.slice(0, 200)}" (${c.likes} likes)`
      );
      parts.push(`[SUARA NETIZEN — Komentar dengan engagement tinggi]\n${commentLines.join('\n')}`);
    }
  }

  if (!parts.length) return '';

  return `\n\n${parts.join('\n\n---\n\n')}\n\n[GUNAKAN KONTEKS DI ATAS]: Referensi data real-time ini untuk membuat konten yang RELEVAN dengan situasi Indonesia saat ini. Gunakan frasa, sentimen, dan framing yang sedang trending. Jangan ulang fakta yang sudah umum — ambil angle yang belum banyak dibahas.`;
};

/**
 * Check if knowledge base is available
 */
export const checkKBAvailability = async (): Promise<boolean> => {
  try {
    const resp = await fetch(`${KB_BASE_URL}/data/news/latest.json`, { method: 'HEAD' });
    return resp.ok;
  } catch {
    return false;
  }
};
