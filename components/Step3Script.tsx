
import React, { useState, useEffect, useRef } from 'react';
import { ScriptSection } from '../types';
import { translations } from '../translations';

interface Props {
  videoTitle: string;
  onGenerateFullScript: () => Promise<string>;
  onBack: () => void;
  onNext: (sections: ScriptSection[]) => void;
  language: 'id' | 'en';
}

export const Step3Script: React.FC<Props> = ({ videoTitle, onGenerateFullScript, onBack, onNext, language }) => {
  const t = translations[language].script;
  const tCommon = translations[language];
  const [sections, setSections] = useState<ScriptSection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const hasStartedRef = useRef(false);

  // Helper to remove markdown bold/italic syntax client-side
  const cleanContent = (text: string) => {
    if (!text) return '';
    // Remove ** and * used for markdown bold/italic
    return text.replace(/\*\*/g, '').replace(/\*/g, '').trim();
  };

  // Automated Generation
  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    processScript();
  }, []);

  const processScript = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
        const rawContent = await onGenerateFullScript();
        const content = cleanContent(rawContent); // Apply cleaning
        setSections([{ title: "Full Script", content }]);
    } catch (e) {
        console.error(`Failed to generate full script`, e);
        setError(`Gagal membuat naskah.`);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleRetry = () => {
      processScript();
  };

  const handleDownloadSection = (title: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    // Sanitize title for filename
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    element.download = `${safeTitle}.txt`;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
  };

  const getFullScriptText = () => {
      const header = `JUDUL VIDEO: ${videoTitle}\n\n`;
      const body = sections.map(s => `=== ${s.title} ===\n\n${s.content}`).join('\n\n');
      return header + body;
  };

  const copyAll = () => {
    const fullText = getFullScriptText();
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAll = () => {
    const fullText = getFullScriptText();
    const element = document.createElement("a");
    const file = new Blob([fullText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    
    // Sanitize video title for filename
    const safeFilename = videoTitle.replace(/[^a-z0-9 ]/gi, '').trim().replace(/\s+/g, '_') || 'Naskah_Video';
    element.download = `${safeFilename}.txt`;
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const progressPercentage = sections.length > 0 ? 100 : 0;

  // Word count + reading time stats
  const totalWords = sections.reduce((sum, s) => sum + s.content.trim().split(/\s+/).filter(w => w.length > 0).length, 0);
  const readingMinutes = Math.ceil(totalWords / 130); // ~130 wpm for Indonesian TTS
  const readingSeconds = Math.round((totalWords / 130) * 60);

  return (
    <div className="flex flex-col h-full space-y-6 pb-24">
       <div className="border-b-2 border-gray-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
             <button 
                onClick={onBack}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all border border-transparent hover:border-gray-200"
                title="Kembali"
            >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.generatorTitle} <span className="text-primary">v1.0</span></h2>
                <p className="text-gray-500 mt-1 font-bold text-sm">{t.generatorSubtitle}</p>
            </div>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={handleDownloadAll}
                disabled={sections.length === 0}
                className="text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-2xl shadow-sm bg-gray-100 hover:bg-gray-200 text-gray-800 disabled:opacity-50 transition-all flex items-center border border-gray-200"
            >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {t.download}
            </button>
            <button 
                onClick={copyAll}
                disabled={sections.length === 0}
                className={`text-[10px] font-black uppercase tracking-widest px-8 py-3 rounded-2xl shadow-xl disabled:opacity-50 transition-all transform active:scale-95 ${
                    copied ? 'bg-emerald-500 text-white' : 'bg-primary hover:bg-primary text-black'
                }`}
            >
                {copied ? t.copied : t.copy}
            </button>
        </div>
      </div>

      {/* Progress Bar & Status Section */}
      <div className="space-y-4">
          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner border border-gray-300 relative">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-in-out flex items-center justify-end pr-4 text-[10px] font-black text-black shadow-lg ${error ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${progressPercentage}%` }}
              >
                  {progressPercentage > 5 && <span className="bg-white/40 px-2 py-0.5 rounded-full">{progressPercentage}%</span>}
              </div>
          </div>
          
          <div className="flex justify-center h-8">
              {isProcessing && (
                  <div className="flex items-center space-x-3 text-gray-900 font-black text-xs uppercase tracking-widest animate-pulse bg-white border border-gray-200 px-6 py-2 rounded-full shadow-sm">
                      <div className="w-2 h-2 bg-primary rounded-full animate-ping"></div>
                      <span>Sedang Menulis Naskah...</span>
                  </div>
              )}
              {!isProcessing && error && (
                  <div className="text-red-600 font-black text-xs uppercase tracking-widest bg-red-50 px-6 py-2 rounded-full border border-red-200 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      {error}
                  </div>
              )}
              {!isProcessing && !error && sections.length > 0 && (
                  <div className="text-emerald-700 font-black text-xs uppercase tracking-widest bg-emerald-50 px-8 py-2 rounded-full border-2 border-emerald-500 animate-bounce shadow-md">
                      ✨ {t.title}
                  </div>
              )}
          </div>
      </div>

      {/* Script Content Area */}
      <div className="flex-1 bg-white border-0 rounded-[2.5rem] shadow-2xl bg-gray-50 overflow-y-auto p-12 font-serif leading-loose text-xl text-gray-800 relative min-h-[600px] border border-gray-100">
          
          <div className="mb-16 text-center">
              <span className="text-[10px] font-black text-gray-400 tracking-[0.4em] uppercase mb-4 block">{t.officialLabel}</span>
              <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none mb-4">{videoTitle}</h1>
              <div className="h-1.5 w-32 bg-primary mx-auto rounded-full"></div>
          </div>

          {sections.length === 0 && isProcessing && (
               <div className="flex flex-col items-center justify-center h-64 text-gray-300">
                   <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-gray-900 mb-4 opacity-20"></div>
                   <p className="font-black text-xs uppercase tracking-widest">{t.initializingLabel}</p>
               </div>
          )}

          {sections.map((section, idx) => (
              <div key={idx} className="mb-16 last:mb-0 animate-fade-in-up">
                  <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                      <div className="flex items-center gap-3">
                          <span className="bg-gray-900 text-primary text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-[0.2em] shadow-lg">
                            {section.title.split(':')[0].trim()}
                          </span>
                          <span className="text-gray-400 text-xs font-black uppercase tracking-widest italic">
                             {section.title.includes('BABAK 2') ? section.title.replace('BABAK 2: ', '') : section.title.split(':')[1]?.trim() || ''}
                          </span>
                      </div>
                      
                      <button 
                        onClick={() => handleDownloadSection(section.title, section.content)}
                        className="text-gray-300 hover:text-gray-900 transition-all p-3 rounded-2xl hover:bg-white hover:shadow-md active:scale-90"
                        title={t.downloadPart}
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                  </div>
                  <div className="whitespace-pre-wrap px-4 border-l-2 border-transparent hover:border-primary transition-all duration-500 leading-relaxed font-medium">
                    {section.content}
                  </div>
              </div>
          ))}

          {error && !isProcessing && (
              <div className="flex flex-col items-center justify-center py-12 bg-red-50 rounded-[2rem] border-4 border-dashed border-red-200 mt-8 group">
                  <div className="bg-white p-4 rounded-full shadow-lg mb-6 group-hover:rotate-12 transition-transform">
                    <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-red-900 font-black text-lg mb-2 uppercase tracking-tight">{t.errorTitle}</p>
                  <p className="text-red-600 text-sm mb-6 max-w-sm text-center">{t.errorSubtitle}</p>
                  <button 
                    onClick={handleRetry}
                    className="flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    {t.btnRetry}
                  </button>
              </div>
          )}

      </div>

      {!isProcessing && !error && sections.length > 0 && (
          <div className="fixed bottom-0 right-0 left-0 md:left-64 bg-white/95 backdrop-blur-2xl border-t border-gray-100 p-6 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.2)] z-50 flex justify-center items-center gap-6 animate-fade-in-up">
              {/* Word count + reading time */}
              <div className="hidden md:flex items-center gap-4 mr-4">
                  <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Kata</p>
                      <p className="text-gray-900 font-black text-lg leading-none tabular-nums">{totalWords.toLocaleString()}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200" />
                  <div className="text-center">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Durasi TTS</p>
                      <p className="text-primary font-black text-lg leading-none tabular-nums">~{readingMinutes}m {readingSeconds % 60}s</p>
                  </div>
              </div>
              <div className="hidden lg:block">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{t.statusFinal}</p>
                  <p className="text-emerald-600 font-bold text-sm leading-none">{t.statusComplete}</p>
              </div>
              <button
                  onClick={() => onNext(sections)}
                  className="bg-gray-900 hover:bg-black text-white px-12 py-5 rounded-3xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_15px_30px_-5px_rgba(0,0,0,0.3)] hover:shadow-black/40 active:scale-95 flex items-center gap-4"
              >
                  {t.btnNext}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
          </div>
      )}
    </div>
  );
};
