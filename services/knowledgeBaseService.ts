/**
 * Knowledge Base Service — Direct JSON import (no fetch, no CORS issues)
 * Data stored in /data/ directory, bundled at build time.
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

/**
 * Build context string for LLM prompts from knowledge base data.
 * Filters by topic relevance if referenceText is provided.
 */
export const buildKnowledgeBaseContext = (
  referenceText: string = ''
): string => {
  const parts: string[] = [];

  // --- Trending Topics ---
  const trending = trendingData as { updated: string; topics: TrendingTopic[] };
  if (trending?.topics?.length) {
    const topTopics = trending.topics.slice(0, 8);
    const topicLines = topTopics.map(t =>
      `- ${t.topic} (${t.article_count} artikel): ${t.recent_headlines.slice(0, 2).join('; ')}`
    );
    parts.push(`[TOPIK TRENDING INDONESIA SAAT INI]\n${topicLines.join('\n')}`);
  }

  // --- Relevant News (keyword match with reference) ---
  const news = newsData as { updated: string; count: number; items: NewsArticle[] };
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
  const youtube = youtubeData as { updated: string; videos: YouTubeVideo[] };
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

  return `\n\n[SUASANA KONTEKS INDONESIA KETIKA ini DITULIS]\n\n${parts.join('\n\n')}\n\nCatatan: Angle, diksi, dan framing naskah sebaiknya mencerminkan apa yang sedang hangat dibicarakan masyarakat Indonesia saat ini — bukan mengulang hal yang sudah basi. Kalau ada fakta atau perspektif dari konteks di atas yang bikin narasi lebih nampol, gunakan dengan cara yang natural.`;
};

/**
 * Get KB data summary for UI display
 */
export const getKBSummary = () => {
  const news = newsData as { updated: string; count: number };
  const trending = trendingData as { updated: string; topics: TrendingTopic[] };
  const youtube = youtubeData as { updated: string; video_count: number; total_comments: number };

  return {
    newsCount: news?.count || 0,
    newsUpdated: news?.updated || 'N/A',
    trendingTopics: trending?.topics?.length || 0,
    trendingUpdated: trending?.updated || 'N/A',
    youtubeVideos: youtube?.video_count || 0,
    youtubeComments: youtube?.total_comments || 0,
    youtubeUpdated: youtube?.updated || 'N/A',
  };
};
