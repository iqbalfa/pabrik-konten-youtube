
import React, { useState } from 'react';
import { VideoIdea } from '../types';
import { translations } from '../translations';

interface Props {
  ideasText: string;
  onNext: (idea: VideoIdea) => void;
  onBack: () => void;
  onRegenerate: () => void;
  language: 'id' | 'en';
}

export const Step2Ideas: React.FC<Props> = ({ ideasText, onNext, onBack, onRegenerate, language }) => {
  const t = translations[language].step2;
  const tCommon = translations[language];
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const cleanText = (text: string) => {
    if (!text) return '';
    return text.replace(/\*\*/g, '').trim();
  };

  const parseContent = (text: string) => {
    const summaryMatch = text.match(/\[RANGKUMAN REFERENSI\]([\s\S]*?)(\[TINGKAT MODIFIKASI|$)/);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    const ideaParts = text.split(/\[TINGKAT MODIFIKASI/g).slice(1); 
    
    const parsedIdeas: VideoIdea[] = ideaParts.map((part, idx) => {
       const rawPointsBlock = part.match(/Poin-Poin[Dd]?[:\s]*(?:[Dd]ata[^\n]*\n)?\s*([\s\S]*?)(?=\nGaris Besar Penutup)/)?.[1] || '';
       
       const rawLines = rawPointsBlock.split('\n').map(p => p.trim()).filter(p => p.length > 0);
       const points: string[] = [];
       let currentPoint = '';

       for (const line of rawLines) {
           // Check if line starts with a number followed by dot/dash/etc
           if (/^[\*\-\•\d]+\.?\s+/.test(line)) {
               if (currentPoint) {
                   points.push(cleanText(currentPoint));
               }
               currentPoint = line.replace(/^[\*\-\•\d]+\.?\s*/g, '').trim();
           } else {
               if (currentPoint) {
                   currentPoint += '\n' + line.trim();
               } else {
                   currentPoint = line.trim();
               }
           }
       }
       if (currentPoint) {
           const cleaned = cleanText(currentPoint);
           // Skip if it looks like a stub header without real content
           // e.g. "Pembongkaran" (1 short word, no colon, no description)
           // but NOT "Kipas Angin Leher Patah" (4 meaningful words)
           const isStub = /^[A-Za-z]+[:\s]*$/.test(cleaned) && cleaned.length < 15;
           if (!isStub && cleaned.length > 0) {
               points.push(cleaned);
           } else if (isStub) {
               console.warn(`[PabrikKonten] Skipping stub header: "${cleaned}"`);
           }
       }

       // Validate: if title says "8 Barang" but we got 9 points (or empty #1), something is wrong
       const titleMatch = part.match(/Judul Video:\s*(.*)/)?.[1] || '';
       const titleNum = parseInt(titleMatch.match(/(\d+)\s+Barang/)?.[1] || '0');
       if (titleNum > 0 && Math.abs(points.length - titleNum) > 1) {
           console.warn(`[PabrikKonten] Mismatch: judul "${titleNum} Barang" tapi ada ${points.length} poin parsed. Cek output LLM.`);
       }

       const modLevel = part.split(']')[0]?.replace(':', '').trim() || 'Unknown';

       return {
        id: idx,
        modificationLevel: modLevel,
        title: cleanText(part.match(/Judul Video:\s*(.*)/)?.[1] || 'Untitled'),
        hook: cleanText(part.match(/Narasi Hook:\s*([\s\S]*?)Poin-Poin/)?.[1] || ''),
        points: points,
        closing: `[TINGKAT MODIFIKASI${part}`
      };
    });

    return { summary, ideas: parsedIdeas };
  };

  const { summary, ideas } = parseContent(ideasText);
  const isParseFailed = ideas.length === 0;

  const handleSelect = () => {
    if (selectedIdx !== null) {
      onNext(ideas[selectedIdx]);
    }
  };

  return (
    <div className="space-y-6 pb-32">
      <div className="border-b pb-6 flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              {t.title} <span className="ml-3 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-mono border border-yellow-200">v6.3</span>
            </h2>
            <p className="text-gray-600 mt-1">{t.subtitle}</p>
        </div>
        <button 
            onClick={onRegenerate}
            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-all border border-red-200 shadow-sm active:scale-95"
            title={t.btnRegenerateTitle}
        >
             <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
             {t.btnRegenerate}
        </button>
      </div>

      <div className="grid md:grid-cols-1 gap-6">
        {summary && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {t.summaryLabel}
                </h3>
                <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap italic border-l-2 border-gray-100 pl-3">
                    {cleanText(summary)}
                </div>
            </div>
        )}
      </div>

      {isParseFailed ? (
        <div className="whitespace-pre-wrap bg-gray-50 p-6 rounded-xl text-sm border font-mono">{ideasText}</div>
      ) : (
        <div className="grid gap-8 mt-4">
          {ideas.map((idea, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedIdx(idx)}
              className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-300 ${
                selectedIdx === idx
                  ? 'border-primary bg-blue-50/30 shadow-xl scale-[1.02] z-10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-white bg-white shadow-sm'
              }`}
            >
              <div className="absolute -top-3 left-6">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                  idea.modificationLevel.toUpperCase().includes('EKSTREM') 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : idea.modificationLevel.toUpperCase().includes('TINGGI') 
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                }`}>
                  {t.modLevelLabel} {idea.modificationLevel}
                </span>
              </div>

              <div className="p-8 pt-10">
                <h3 className="text-xl font-black text-gray-900 mb-6 leading-tight group-hover:text-yellow-600 transition-colors">
                  {idea.title}
                </h3>
                
                <div className="space-y-5">

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                      <span className="font-bold block text-[10px] text-gray-400 uppercase tracking-widest mb-2">{t.hookPreviewLabel}</span>
                      <p className="text-sm text-gray-700 leading-relaxed italic">
                        "{idea.hook}"
                      </p>
                    </div>

                    {idea.points.length > 0 && (
                      <div className="bg-gray-50/50 p-5 rounded-xl border border-dashed border-gray-300">
                        <span className="font-bold block text-[10px] text-gray-400 uppercase tracking-widest mb-3">{t.pointsLabel}</span>
                        <ul className="space-y-2">
                          {idea.points.map((pt, pIdx) => (
                            <li key={pIdx} className="text-xs text-gray-600 flex items-start">
                              <span className="text-primary font-bold mr-2">#{pIdx+1}</span>
                              <span className="whitespace-pre-wrap">{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                <div className={`mt-6 flex justify-end transition-opacity ${selectedIdx === idx ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="bg-primary text-black px-4 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center">
                        {t.selectedLabel} 
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-0 right-0 left-0 md:left-64 bg-white/90 backdrop-blur-md border-t border-gray-200 p-6 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-50 flex justify-center items-center flex-col md:flex-row gap-4">
         <div className="text-sm text-gray-400 font-medium hidden md:block">
            {t.hint}
         </div>
         <div className="flex gap-4 w-full md:w-auto">
            <button 
                onClick={onBack} 
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-xl font-bold transition-all shadow-sm active:scale-95"
            >
                {tCommon.back}
            </button>
            <button
                onClick={handleSelect}
                disabled={selectedIdx === null && !isParseFailed}
                className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95 flex-1 md:flex-none"
            >
                {t.btnSelect}
            </button>
         </div>
      </div>
    </div>
  );
};
