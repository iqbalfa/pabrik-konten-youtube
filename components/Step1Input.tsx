import React, { useState, useRef } from 'react';
import { translations } from '../translations';
import { WRITING_STYLE_PRESETS } from '../presets';
import { getKBIntelligencePreview } from '../services/knowledgeBaseService';

interface Props {
  onNext: (channelName: string, writingStyle: string, text: string, files: string[], keywords: string, wordCount: number, language: 'id' | 'en', useKnowledgeBase: boolean) => void;
  onGenerateVariantsOnly: (channelName: string, writingStyle: string, text: string, files: string[], keywords: string, language: 'id' | 'en', useKnowledgeBase: boolean) => void;
  language: 'id' | 'en';
  hasApiKey: boolean;
  selectedChannel: string;
  useHook: boolean;
  useOutro: boolean;
  onUseHookChange: (val: boolean) => void;
  onUseOutroChange: (val: boolean) => void;
  onToast?: (message: string, type?: 'success' | 'error') => void;
  onLoadStrategyReport?: (data: { referenceText: string; keywords: string; mandatoryKeywords: string; thumbnailObject: string }) => void;
}

// Toggle switch component
const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
  <label className="flex items-center gap-2 cursor-pointer select-none group">
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0 ${
        checked ? 'bg-primary' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
    <span className={`text-xs font-medium transition-colors ${checked ? 'text-foreground' : 'text-gray-400 group-hover:text-gray-500'}`}>
      {label}
    </span>
  </label>
);

export const Step1Input: React.FC<Props> = ({
  onNext, onGenerateVariantsOnly, language, hasApiKey, selectedChannel,
  useHook, useOutro, onUseHookChange, onUseOutroChange,
  onToast, onLoadStrategyReport
}) => {
  const t = translations[language].step1;
  const [writingStyle, setWritingStyle] = useState(WRITING_STYLE_PRESETS['Ilmu Lidi']);

  // Sync writing style when channel changes via Master Preset
  const prevChannelRef = React.useRef(selectedChannel);
  React.useEffect(() => {
    if (selectedChannel && selectedChannel !== prevChannelRef.current) {
      const preset = WRITING_STYLE_PRESETS[selectedChannel as keyof typeof WRITING_STYLE_PRESETS];
      if (preset) setWritingStyle(preset);
    }
    prevChannelRef.current = selectedChannel;
  }, [selectedChannel]);

  const [text, setText] = useState('');
  const [fileContents, setFileContents] = useState<string[]>([]);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [keywords, setKeywords] = useState('');
  const initialKBPreview = React.useMemo(() => getKBIntelligencePreview('', '', selectedChannel), []);
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(initialKBPreview.isSafeToInject);
  const [targetWordCount, setTargetWordCount] = useState<number>(18);
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const strategyInputRef = useRef<HTMLInputElement>(null);
  const [strategyIdeas, setStrategyIdeas] = useState<any[]>([]);
  const [showStrategyPicker, setShowStrategyPicker] = useState(false);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = Array.from(e.target.files);
      if (files.length + fileNames.length > 10) {
        if (onToast) onToast(t.maxFiles, 'error'); else alert(t.maxFiles);
        return;
      }
      setIsReading(true);
      try {
        const names: string[] = [];
        const contents: string[] = [];
        for (const file of files) {
          names.push(file.name);
          contents.push(await readFileAsText(file));
        }
        setFileNames(prev => [...prev, ...names]);
        setFileContents(prev => [...prev, ...contents]);
      } catch {
        if (onToast) onToast(t.readFail, 'error'); else alert(t.readFail);
      } finally {
        setIsReading(false);
      }
    }
  };

  const handleStrategyFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const content = await readFileAsText(file);
        const data = JSON.parse(content);
        if (data.ideas && Array.isArray(data.ideas)) {
          setStrategyIdeas(data.ideas);
          setShowStrategyPicker(true);
        } else {
          if (onToast) onToast('Format JSON tidak valid. Harus punya array "ideas".', 'error');
        }
      } catch {
        if (onToast) onToast('Gagal membaca file JSON.', 'error');
      }
      e.target.value = '';
    }
  };

  const handleSelectStrategyIdea = (idea: any) => {
    setText(idea.reference_text || '');
    setKeywords(idea.keywords || '');
    if (onLoadStrategyReport) {
      onLoadStrategyReport({
        referenceText: idea.reference_text || '',
        keywords: idea.keywords || '',
        mandatoryKeywords: idea.mandatory_keywords || '',
        thumbnailObject: idea.thumbnail_object || '',
      });
    }
    setShowStrategyPicker(false);
    setStrategyIdeas([]);
    if (onToast) onToast('Strategy report berhasil dimuat!', 'success');
  };

  const hasContent = text.trim().length > 0 || fileContents.length > 0;
  const canSubmit = hasContent && hasApiKey;
  const kbPreview = React.useMemo(
    () => getKBIntelligencePreview(`${text}\n${fileContents.join('\n')}`, keywords, selectedChannel),
    [text, fileContents, keywords, selectedChannel]
  );
  const kbStatusStyle = kbPreview.status === 'fresh'
    ? 'bg-green-50 border-green-200 text-green-700'
    : kbPreview.status === 'aging'
    ? 'bg-amber-50 border-amber-200 text-amber-700'
    : 'bg-red-50 border-red-200 text-red-700';
  const kbStatusLabel = kbPreview.status === 'fresh'
    ? 'Fresh'
    : kbPreview.status === 'aging'
    ? 'Aging'
    : kbPreview.status === 'stale'
    ? 'Stale'
    : 'Unknown';

  const handleKnowledgeBaseToggle = (enabled: boolean) => {
    setUseKnowledgeBase(enabled);
    if (enabled && !kbPreview.isSafeToInject && onToast) {
      onToast('KB lokal sudah stale. Hermes akan pakai hanya sebagai konteks umum, bukan klaim tren saat ini.', 'error');
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">{t.title}</h2>
            <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">v1.0</span>
          </div>
          <p className="text-sm text-gray-500">{t.subtitle}</p>
        </div>
        {onLoadStrategyReport && (
          <div>
            <input
              type="file"
              accept=".json"
              ref={strategyInputRef}
              onChange={handleStrategyFileChange}
              className="hidden"
            />
            <button
              onClick={() => strategyInputRef.current?.click()}
              className="text-xs font-semibold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-3 py-2 rounded-lg transition-flat flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Load Strategy Report
            </button>
          </div>
        )}
      </div>

      {/* Form card */}
      <div className="bg-surface rounded-2xl border border-border p-6 md:p-8 space-y-6">
        {/* 1. Style Penulisan */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="writingStyle" className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              1. {t.styleLabel}
            </label>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val && val in WRITING_STYLE_PRESETS) {
                  setWritingStyle(WRITING_STYLE_PRESETS[val as keyof typeof WRITING_STYLE_PRESETS]);
                }
              }}
              value={selectedChannel in WRITING_STYLE_PRESETS ? selectedChannel : ''}
              className="text-[10px] bg-muted hover:bg-primary/10 px-2 py-1 rounded-md text-gray-600 transition-flat outline-none border-none cursor-pointer font-normal"
            >
              {Object.keys(WRITING_STYLE_PRESETS).map(preset => (
                <option key={preset} value={preset}>{preset}</option>
              ))}
            </select>
          </div>
          <textarea
            id="writingStyle"
            className="w-full h-32 px-4 py-3 border border-border rounded-xl text-xs font-mono text-foreground placeholder-gray-400 resize-y focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-flat"
            placeholder={t.stylePlaceholder}
            value={writingStyle}
            onChange={(e) => setWritingStyle(e.target.value)}
          />
        </div>

        {/* 2. Text / Link Referensi */}
        <div>
          <label htmlFor="refText" className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
            2. {t.refLabel}
          </label>
          <textarea
            id="refText"
            className="w-full h-44 px-4 py-3 border border-border rounded-xl text-sm font-mono text-foreground placeholder-gray-400 resize-y focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-flat"
            placeholder={t.refPlaceholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* 3. Settings bar + 5. File Upload */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2 border-t border-border">
          {/* Word count */}
          <div className="flex items-center gap-2">
            <label htmlFor="wordCount" className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              3. {t.wordCountLabel}
            </label>
            <select
              id="wordCount"
              value={targetWordCount}
              onChange={(e) => setTargetWordCount(Number(e.target.value))}
              className="px-3 py-2 border border-border rounded-lg text-sm font-semibold text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-flat bg-surface cursor-pointer"
            >
              <option value={10}>{t.wordCount1}</option>
              <option value={14}>{t.wordCount2}</option>
              <option value={18}>{t.wordCount3}</option>
              <option value={22}>{t.wordCount4}</option>
              <option value={26}>{t.wordCount5}</option>
            </select>
          </div>

          {/* Keywords */}
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <label htmlFor="keywords" className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
              4. {t.keywordLabel}
            </label>
            <input
              id="keywords"
              type="text"
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm font-mono text-foreground placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-flat"
              placeholder={t.keywordPlaceholder}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border hidden md:block" />

          {/* Hook toggle */}
          <Toggle checked={useHook} onChange={onUseHookChange} label="Hook" />

          {/* Outro toggle */}
          <Toggle checked={useOutro} onChange={onUseOutroChange} label="Outro" />

          {/* Knowledge Base toggle */}
          {language === 'id' && (
            <Toggle checked={useKnowledgeBase} onChange={handleKnowledgeBaseToggle} label="KB Lokal" />
          )}

          {/* Separator */}
          <div className="w-px h-6 bg-border hidden md:block" />

          {/* 5. File Upload — button only */}
          <div className="flex items-center gap-2">
            <input
              type="file"
              multiple
              accept=".txt,.md,.json,.csv"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isReading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-foreground hover:text-primary bg-gray-100 hover:bg-primary/10 rounded-lg transition-flat border border-border hover:border-primary/20 disabled:opacity-50"
            >
              {isReading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  {t.fileReading}
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  5. {t.fileLabel}
                </>
              )}
            </button>
            {fileNames.length > 0 && (
              <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {fileNames.length} file
              </span>
            )}
          </div>
        </div>

        {/* Uploaded files list (shown only when files exist) */}
        {fileNames.length > 0 && (
          <div className="flex flex-wrap gap-2 -mt-2">
            {fileNames.map((n, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] font-mono text-gray-500 bg-muted px-2 py-1 rounded-md">
                <svg className="w-3 h-3 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Knowledge Base intelligence preview */}
      {language === 'id' && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${kbStatusStyle}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <div className="font-bold text-xs uppercase tracking-wider">Knowledge Base Intelligence: {kbStatusLabel}</div>
              <div className="text-xs opacity-90">
                News {kbPreview.freshness.news.label} · Trending {kbPreview.freshness.trending.label} · Komentar {kbPreview.freshness.youtube.label}
              </div>
            </div>
            <div className="text-xs font-mono bg-white/60 px-2 py-1 rounded-lg border border-current/10">
              {kbPreview.counts.relevantNews} berita · {kbPreview.counts.relevantComments} komentar · {kbPreview.counts.relevantTrends} tren
            </div>
          </div>
          {!kbPreview.isSafeToInject && (
            <p className="mt-2 text-xs leading-relaxed">
              Data melewati batas fresh 7 hari, jadi default KB dimatikan. Jika dinyalakan manual, prompt diberi guardrail agar tidak mengklaimnya sebagai “tren saat ini”.
            </p>
          )}
          {(kbPreview.sample.pain.length > 0 || kbPreview.sample.context.length > 0) && (
            <div className="mt-3 grid gap-2 md:grid-cols-2 text-xs">
              {kbPreview.sample.pain.length > 0 && (
                <div className="bg-white/50 rounded-lg p-2 border border-current/10">
                  <div className="font-semibold mb-1">Audience pain</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {kbPreview.sample.pain.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              )}
              {kbPreview.sample.context.length > 0 && (
                <div className="bg-white/50 rounded-lg p-2 border border-current/10">
                  <div className="font-semibold mb-1">Konteks lokal</div>
                  <div>{kbPreview.sample.context.join(' · ')}</div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* API key warning */}
      {!hasApiKey && (
        <div className="flex items-center gap-2 px-4 py-3 bg-accent/10 border border-accent/20 rounded-xl text-sm text-accent">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Masukkan <strong className="mx-1">Gemini API Key</strong> di sidebar kiri untuk mulai generate.
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
        <button
          onClick={() => onGenerateVariantsOnly(selectedChannel, writingStyle, text, fileContents, keywords, language, useKnowledgeBase)}
          disabled={!canSubmit}
          className="bg-primary hover:bg-primary-hover text-on-primary px-6 py-3.5 rounded-xl text-sm font-semibold transition-flat shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {t.btnShortcut}
        </button>

        <button
          onClick={() => onNext(selectedChannel, writingStyle, text, fileContents, keywords, targetWordCount, language, useKnowledgeBase)}
          disabled={!canSubmit}
          className="bg-foreground hover:bg-foreground/90 text-white px-8 py-3.5 rounded-xl text-sm font-bold transition-flat shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {t.btnFull}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>

      {/* Strategy Report Picker Modal */}
      {showStrategyPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl border border-border max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">Pilih Ide dari Strategy Report</h3>
              <button
                onClick={() => { setShowStrategyPicker(false); setStrategyIdeas([]); }}
                className="text-gray-400 hover:text-foreground transition-flat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {strategyIdeas.map((idea, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectStrategyIdea(idea)}
                  className="w-full text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-flat"
                >
                  <div className="font-semibold text-sm text-foreground mb-1">{idea.title}</div>
                  <div className="text-xs text-gray-500 line-clamp-2">{idea.hook}</div>
                  {idea.mandatory_keywords && (
                    <div className="mt-2 text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded inline-block">
                      wajib: {idea.mandatory_keywords}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
