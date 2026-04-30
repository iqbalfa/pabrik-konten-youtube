import React, { useMemo, useState } from 'react';
import { translations } from '../translations';
import { ScriptSection, TitleThumbnailPair } from '../types';

interface Props {
  description: string;
  tags: string;
  onGenerate: () => void;
  onBack: () => void;
  isLoading: boolean;
  language: 'id' | 'en';
  onToast?: (message: string, type?: 'success' | 'error') => void;
  finalTitle?: string;
  scriptSections?: ScriptSection[];
  selectedPair?: TitleThumbnailPair | null;
  hashtags?: string;
  pinnedComment?: string;
  chapters?: string;
  onDescriptionChange?: (value: string) => void;
  onTagsChange?: (value: string) => void;
  onPinnedCommentChange?: (value: string) => void;
  onChaptersChange?: (value: string) => void;
}

export const Step5Metadata: React.FC<Props> = ({
  description, tags, onGenerate, onBack, isLoading, language, onToast,
  finalTitle = '', scriptSections = [], selectedPair = null,
  hashtags = '', pinnedComment = '', chapters = '',
  onDescriptionChange, onTagsChange, onPinnedCommentChange, onChaptersChange
}) => {
  const t = translations[language].metadata;
  const tCommon = translations[language];
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const scriptText = useMemo(() => scriptSections.map(s => `=== ${s.title} ===\n${s.content}`).join('\n\n'), [scriptSections]);
  const finalPackage = useMemo(() => [
    `# FINAL UPLOAD PACKAGE`,
    ``,
    `## TITLE`,
    finalTitle || selectedPair?.title || '',
    ``,
    selectedPair ? `## THUMBNAIL PACKAGE\nOverlay: ${selectedPair.thumbnail.fullTextOverlay || selectedPair.thumbnail.suggestedText}\nTrigger: ${selectedPair.thumbnail.triggerType || '-'}\nClickbait Risk: ${selectedPair.clickbaitRisk || '-'}\nCTR Analysis: ${selectedPair.ctrAnalysis || '-'}\nVisual Concept: ${selectedPair.thumbnail.visualConcept || '-'}\nPrompt Image:\n${selectedPair.thumbnail.detailedPrompt || selectedPair.thumbnail.prompt || '-'}` : `## THUMBNAIL PACKAGE\nBelum ada paket thumbnail dipilih.`,
    ``,
    `## DESCRIPTION`,
    description || '',
    ``,
    `## TAGS`,
    tags || '',
    ``,
    `## HASHTAGS`,
    hashtags || '',
    ``,
    `## PINNED COMMENT`,
    pinnedComment || '',
    ``,
    `## CHAPTERS`,
    chapters || '',
    ``,
    `## SCRIPT`,
    scriptText || 'Tidak ada naskah di sesi ini.'
  ].join('\n'), [finalTitle, selectedPair, description, tags, hashtags, pinnedComment, chapters, scriptText]);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    if (onToast) onToast(`${label} berhasil disalin!`);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  const downloadFinalPackage = () => {
    const blob = new Blob([finalPackage], { type: 'text/plain' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    const safeTitle = (finalTitle || 'final_package').replace(/[^a-z0-9 ]/gi, '').trim().replace(/\s+/g, '_') || 'final_package';
    link.download = `${safeTitle}_youtube_package.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const tagCount = tags.split(',').map(t => t.trim()).filter(Boolean).length;
  const tagChars = tags.length;
  const descChars = description.length;

  return (
    <div className="space-y-8 pb-36">
      <div className="border-b pb-4 flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Final Upload Package</h2>
          <p className="text-gray-600 mt-1">Metadata, thumbnail package, naskah, dan asset copy siap upload.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={onGenerate} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-bold shadow-md transition-all disabled:opacity-50">
            {isLoading ? tCommon.loading : (description ? 'Regenerate Metadata' : t.btnGenerate)}
          </button>
          <button onClick={() => copyToClipboard(finalPackage, 'Final package')} className="bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-lg font-bold shadow-md">
            {copiedLabel === 'Final package' ? 'Tersalin' : 'Copy All'}
          </button>
          <button onClick={downloadFinalPackage} className="bg-white border border-gray-300 text-gray-800 px-5 py-3 rounded-lg font-bold shadow-sm hover:bg-gray-50">
            Download .txt
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4"><p className="text-[10px] uppercase font-black text-emerald-700">Title</p><p className="text-sm font-bold text-gray-900 mt-1">{finalTitle || selectedPair?.title || 'Belum dipilih'}</p></div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4"><p className="text-[10px] uppercase font-black text-blue-700">Tags</p><p className="text-sm font-bold text-gray-900 mt-1">{tagCount} tags · {tagChars}/500 chars</p></div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4"><p className="text-[10px] uppercase font-black text-purple-700">Description</p><p className="text-sm font-bold text-gray-900 mt-1">{descChars.toLocaleString()} chars</p></div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><p className="text-[10px] uppercase font-black text-amber-700">Thumbnail</p><p className="text-sm font-bold text-gray-900 mt-1">{selectedPair ? selectedPair.thumbnail.status : 'Belum ada image'}</p></div>
      </div>

      {selectedPair && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-black text-gray-900 text-lg">Paket Judul + Thumbnail Terpilih</h3>
              <p className="text-xs text-gray-500">Data dari Step 4 sekarang ikut masuk final package.</p>
            </div>
            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-gray-900 text-white">{selectedPair.thumbnail.triggerType || 'CTR'}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-4"><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Overlay</p><p className="font-bold">{selectedPair.thumbnail.fullTextOverlay || selectedPair.thumbnail.suggestedText}</p></div>
            <div className="bg-gray-50 rounded-xl p-4"><p className="text-[10px] uppercase font-black text-gray-400 mb-1">CTR Analysis</p><p>{selectedPair.ctrAnalysis || '-'}</p></div>
            <div className="bg-gray-50 rounded-xl p-4 md:col-span-2"><p className="text-[10px] uppercase font-black text-gray-400 mb-1">Visual Concept</p><p>{selectedPair.thumbnail.visualConcept || '-'}</p></div>
          </div>
          {selectedPair.thumbnail.imageUrl && <img src={selectedPair.thumbnail.imageUrl} alt="Selected thumbnail" className="w-full max-w-xl rounded-xl border shadow-sm" />}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-center"><h3 className="font-bold text-gray-900 text-lg">Description</h3><button onClick={() => copyToClipboard(description, 'Deskripsi')} disabled={!description} className="text-xs px-3 py-1.5 rounded border bg-white text-gray-600 border-gray-300 hover:bg-gray-50 disabled:opacity-50">{copiedLabel === 'Deskripsi' ? t.copied : t.copy}</button></div>
          <textarea value={description} onChange={(e) => onDescriptionChange?.(e.target.value)} className="w-full h-[420px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm leading-relaxed text-gray-800 bg-white font-sans" placeholder="Generate atau edit deskripsi di sini..." />
        </div>
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-gray-900 text-lg">Tags</h3><button onClick={() => copyToClipboard(tags, 'Tags')} disabled={!tags} className="text-xs px-3 py-1.5 rounded border bg-white text-gray-600 border-gray-300 hover:bg-gray-50 disabled:opacity-50">{copiedLabel === 'Tags' ? t.copied : t.copy}</button></div>
            <textarea value={tags} onChange={(e) => onTagsChange?.(e.target.value)} className="w-full h-[130px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm leading-relaxed text-gray-800 bg-white font-mono" placeholder="tag 1, tag 2, tag 3" />
            <p className={`mt-2 text-xs ${tagChars > 500 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>YouTube tags idealnya ≤500 karakter total. Sekarang {tagChars}/500.</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Hashtags</h3>
            <input value={hashtags} readOnly className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Pinned Comment</h3>
            <textarea value={pinnedComment} onChange={(e) => onPinnedCommentChange?.(e.target.value)} className="w-full h-[110px] p-4 border border-gray-300 rounded-lg bg-white text-sm" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg mb-3">Chapters / Timestamp Draft</h3>
            <textarea value={chapters} onChange={(e) => onChaptersChange?.(e.target.value)} className="w-full h-[160px] p-4 border border-gray-300 rounded-lg bg-white text-sm font-mono" />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 right-0 left-0 md:left-72 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 flex justify-center items-center gap-4">
        <button onClick={onBack} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-all shadow-sm">{tCommon.back}</button>
        <button onClick={() => copyToClipboard(finalPackage, 'Final package')} className="bg-gray-900 text-white hover:bg-black px-6 py-3 rounded-lg font-bold transition-all shadow-sm">Copy Final Package</button>
      </div>
    </div>
  );
};
