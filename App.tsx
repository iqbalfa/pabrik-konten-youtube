import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Step1Input } from './components/Step1Input';
import { Step2Ideas } from './components/Step2Ideas';
import { Step3Script } from './components/Step3Script';
import { Step4TitleThumbnail } from './components/Step4TitleThumbnail';
import { Step5Metadata } from './components/Step5Metadata';
import { AppState, AppStep, VideoIdea, ScriptSection, TitleThumbnailPair } from './types';
import * as GeminiService from './services/geminiService';
import { translations } from './translations';
import { WRITING_STYLE_PRESETS, VISUAL_STYLE_PRESETS, HOOK_DEFAULTS, OUTRO_DEFAULTS, ChannelName } from './presets';
import { useAutoSave, getAutoSavedState, clearAutoSavedState } from './hooks/useAutoSave';

const WPM = 130; // Words per minute
const minutesToWords = (minutes: number) => minutes * WPM;

const initialState: AppState = {
  step: AppStep.INPUT_REFERENCE,
  language: 'id',
  imageModel: 'gemini-2.5-flash-image',
  selectedChannel: '',
  channelName: '',
  writingStyle: WRITING_STYLE_PRESETS['Ilmu Lidi'],
  visualStyle: '',
  referenceText: '',
  fileContents: [],
  keywords: '',
  targetWordCount: 18, // midpoint minutes of default 16-20 range
  selectedIdea: null,
  analysis: '',
  finalTitle: '',
  script: [],
  selectedTitleThumbnailPair: null,
  finalDescription: '',
  finalTags: '',
  finalHashtags: '',
  finalPinnedComment: '',
  finalChapters: '',
  isLoading: false,
  error: null,
  apiKey: GeminiService.getApiKey() || '',
  mandatoryKeywords: '',
  thumbnailObject: '',
  useKnowledgeBase: false,
  useHook: true,
  useOutro: true,
};

const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

const sanitizeStateForExport = (state: AppState) => {
  const { apiKey, ...safeState } = state;
  return { ...safeState, exportedAt: new Date().toISOString(), exportVersion: 2 };
};

const normalizeTags = (rawTags: string): string => {
  const seen = new Set<string>();
  return rawTags
    .split(/,|\n/)
    .map(tag => tag.replace(/^#/, '').trim())
    .filter(tag => tag.length >= 2 && tag.length <= 45)
    .filter(tag => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 15)
    .join(', ');
};

const buildHashtags = (tags: string, title: string): string => {
  const candidates = [
    ...tags.split(',').map(t => t.trim()),
    ...title.split(/\s+/).filter(w => w.length >= 5).slice(0, 3),
  ];
  const seen = new Set<string>();
  return candidates
    .map(tag => tag.replace(/^#/, '').replace(/[^\p{L}\p{N}\s]/gu, '').trim())
    .filter(tag => tag.length >= 3 && tag.length <= 22)
    .map(tag => `#${tag.replace(/\s+/g, '')}`)
    .filter(tag => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5)
    .join(' ');
};

const buildPinnedComment = (title: string): string => {
  const cleanTitle = title.trim() || 'topik ini';
  return `Bagian mana dari video ini yang paling bikin lo mikir ulang soal ${cleanTitle}? Tulis di komentar, Hermes bakal pakai insight penonton buat ide video berikutnya.`;
};

const buildChapters = (sections: ScriptSection[], selectedIdea: VideoIdea | null): string => {
  const pointTitles = selectedIdea?.points?.length ? selectedIdea.points : sections.map(s => s.title);
  const items = ['00:00 Opening', ...pointTitles.slice(0, 8).map((point, idx) => {
    const minute = String((idx + 1) * 2).padStart(2, '0');
    const clean = point.replace(/\s+/g, ' ').slice(0, 70);
    return `${minute}:00 ${clean}`;
  })];
  return items.join('\n');
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(initialState);
  const prevLoadingRef = useRef(state.isLoading);
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-save every 30s
  useAutoSave(state, !state.isLoading);

  // Check for auto-saved state on mount
  useEffect(() => {
    const saved = getAutoSavedState();
    if (saved) {
      const savedAt = saved._autoSavedAt;
      if (savedAt && (saved.referenceText || saved.selectedIdea || (saved.script && saved.script.length > 0))) {
        const date = new Date(savedAt);
        const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        if (window.confirm(`Ditemukan auto-save dari jam ${timeStr}. Mau restore?`)) {
          const { _autoSavedAt, ...cleanState } = saved;
          setState({ ...initialState, ...cleanState });
          setToastMessage({ message: 'Auto-save berhasil direstore!', type: 'success' });
        }
      }
    }
  }, []);

  useEffect(() => {
    if (prevLoadingRef.current && !state.isLoading && !state.error) {
      playNotificationSound();
    }
    prevLoadingRef.current = state.isLoading;
  }, [state.isLoading, state.error]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
  }, []);

  const handleError = (error: any) => {
    const msg = error?.message || '';
    let userMessage = 'Terjadi kesalahan. Coba lagi.';

    if (msg.includes('API_KEY') || msg.includes('API Key') || msg.includes('401') || msg.includes('403')) {
      userMessage = 'API Key tidak valid atau expired. Cek di sidebar dan pastikan key benar.';
    } else if (msg.includes('429') || msg.includes('rate') || msg.includes('Too Many')) {
      userMessage = 'Rate limit tercapai. Tunggu 1-2 menit lalu coba lagi.';
    } else if (msg.includes('503') || msg.includes('overloaded') || msg.includes('high demand')) {
      userMessage = 'Server Gemini sedang sibuk. Coba lagi dalam beberapa saat.';
    } else if (msg.includes('network') || msg.includes('fetch') || msg.includes('NetworkError')) {
      userMessage = 'Koneksi gagal. Cek internet kamu dan coba lagi.';
    } else if (msg.includes('quota') || msg.includes('billing')) {
      userMessage = 'Quota API habis atau ada masalah billing. Cek Google AI Studio.';
    } else if (msg.includes('SAFETY') || msg.includes('blocked')) {
      userMessage = 'Konten diblokir filter safety. Coba ubah judul atau topik.';
    }

    setState(prev => ({ ...prev, isLoading: false, error: userMessage }));
    showToast(userMessage, 'error');
  };

  const handleSaveState = () => {
    try {
      const json = JSON.stringify(sanitizeStateForExport(state), null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `PabrikKonten_${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Session berhasil disimpan!');
    } catch (e) {
      showToast('Gagal menyimpan session.', 'error');
      console.error(e);
    }
  };

  const handleLoadState = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) return;
        const loadedState = JSON.parse(text) as AppState;
        if (loadedState.step === undefined || loadedState.referenceText === undefined) {
          throw new Error('Format file tidak valid');
        }
        setState({ ...initialState, ...loadedState, apiKey: GeminiService.getApiKey() || '' });
        showToast('Session berhasil dimuat! Langkah ' + ((loadedState.step || 0) + 1));
      } catch (err) {
        showToast('Format file tidak valid. Gunakan file .json dari Pabrik Konten.', 'error');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleChannelChange = (channel: ChannelName) => {
    setState(prev => ({
      ...prev,
      selectedChannel: channel,
      channelName: channel,
      writingStyle: WRITING_STYLE_PRESETS[channel] || prev.writingStyle,
      visualStyle: VISUAL_STYLE_PRESETS[channel] || '',
      useHook: HOOK_DEFAULTS[channel] ?? prev.useHook,
      useOutro: OUTRO_DEFAULTS[channel] ?? prev.useOutro,
    }));
  };

  const handleStepClick = (step: AppStep) => {
    // Only allow navigating to completed steps or current step
    if (step <= state.step) {
      setState(prev => ({ ...prev, step }));
    }
  };

  const handleBack = () => {
    setState(prev => {
      if (prev.step === AppStep.SELECT_IDEA) return { ...prev, step: AppStep.INPUT_REFERENCE };
      if (prev.step === AppStep.SCRIPT_GENERATION) return { ...prev, step: AppStep.SELECT_IDEA };
      if (prev.step === AppStep.TITLE_AND_THUMBNAIL) {
        if (prev.script.length === 0) return { ...prev, step: AppStep.INPUT_REFERENCE };
        return { ...prev, step: AppStep.SCRIPT_GENERATION };
      }
      if (prev.step === AppStep.DESCRIPTION_TAGS) return { ...prev, step: AppStep.TITLE_AND_THUMBNAIL };
      return prev;
    });
  };

  const handleReferenceSubmit = async (channel: string, style: string, text: string, files: string[], keywords: string, wordCount: number, language: 'id' | 'en', useKnowledgeBase: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      channelName: channel,
      writingStyle: style,
      referenceText: text,
      fileContents: files,
      keywords: keywords,
      mandatoryKeywords: keywords,
      targetWordCount: wordCount,
      language: language,
      useKnowledgeBase,
      error: null
    }));
    try {
      const ideasText = await GeminiService.generateIdeas(text, files, keywords, language, channel, style, useKnowledgeBase);
      setState(prev => ({ ...prev, analysis: ideasText, isLoading: false, step: AppStep.SELECT_IDEA }));
    } catch (e) {
      handleError(e);
    }
  };

  const handleVariantsOnly = (channel: string, style: string, text: string, files: string[], keywords: string, language: 'id' | 'en', useKnowledgeBase: boolean) => {
    setState(prev => ({
      ...prev,
      channelName: channel,
      writingStyle: style,
      referenceText: text,
      fileContents: files,
      keywords: keywords,
      mandatoryKeywords: keywords,
      language: language,
      useKnowledgeBase,
      script: [],
      step: AppStep.TITLE_AND_THUMBNAIL
    }));
  };

  const handleRegenerateIdeas = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const ideasText = await GeminiService.generateIdeas(state.referenceText, state.fileContents, state.keywords || '', state.language, state.channelName, state.writingStyle, state.useKnowledgeBase);
      setState(prev => ({ ...prev, analysis: ideasText, isLoading: false }));
    } catch (e) {
      handleError(e);
    }
  };

  const handleIdeaSelect = async (idea: VideoIdea) => {
    setState(prev => ({
      ...prev,
      selectedIdea: idea,
      finalTitle: idea.title,
      step: AppStep.SCRIPT_GENERATION
    }));
  };

  const generateFullScript = async () => {
    if (!state.selectedIdea) return '';
    return GeminiService.generateFullScript(
      state.selectedIdea,
      minutesToWords(state.targetWordCount || 18),
      state.language,
      state.channelName,
      state.writingStyle,
      state.useHook,
      state.useOutro,
      state.referenceText,
      state.fileContents,
      state.useKnowledgeBase
    );
  };

  const handleScriptCompleted = (sections: ScriptSection[]) => {
    setState(prev => ({ ...prev, script: sections, step: AppStep.TITLE_AND_THUMBNAIL }));
  };

  const handleTitleThumbCompleted = (pair: TitleThumbnailPair) => {
    setState(prev => ({
      ...prev,
      finalTitle: pair.title,
      selectedTitleThumbnailPair: pair,
      step: AppStep.DESCRIPTION_TAGS
    }));
  };

  const handleGenerateMetadata = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const contentContext = state.script.length > 0
        ? state.script.map(s => `=== ${s.title} ===\n${s.content}`).join('\n\n')
        : state.referenceText + "\n\n" + state.fileContents.join('\n');

      const [desc, tags] = await Promise.all([
        GeminiService.generateDescription(contentContext, state.finalTitle, state.language, state.channelName, state.writingStyle),
        GeminiService.generateTags(contentContext, state.finalTitle, state.language, state.channelName, state.writingStyle)
      ]);

      const normalizedTags = normalizeTags(tags);
      const hashtags = buildHashtags(normalizedTags, state.finalTitle);
      const descWithTags = `${desc.trim()}\n\n${hashtags}`.trim();
      const pinnedComment = buildPinnedComment(state.finalTitle);
      const chapters = buildChapters(state.script, state.selectedIdea);

      setState(prev => ({
        ...prev,
        finalDescription: descWithTags,
        finalTags: normalizedTags,
        finalHashtags: hashtags,
        finalPinnedComment: pinnedComment,
        finalChapters: chapters,
        isLoading: false
      }));
      showToast('Metadata berhasil dibuat!');
    } catch (e) {
      handleError(e);
    }
  };

  const handleStartNew = () => {
    if (window.confirm('Yakin mau mulai baru? Semua progress yang belum disimpan akan hilang.')) {
      clearAutoSavedState();
      setState(initialState);
      showToast('Session baru dimulai!');
    }
  };

  const t = translations[state.language];

  return (
    <Layout
      currentStep={state.step}
      isLoading={state.isLoading}
      language={state.language}
      onLanguageChange={(lang) => setState(prev => ({ ...prev, language: lang }))}
      imageModel={state.imageModel || 'gemini-2.5-flash-image'}
      onImageModelChange={(model) => setState(prev => ({ ...prev, imageModel: model }))}
      onSaveState={handleSaveState}
      onLoadState={handleLoadState}
      onStartNew={handleStartNew}
      apiKey={state.apiKey}
      onApiKeyChange={(key) => {
        GeminiService.setApiKey(key);
        setState(prev => ({ ...prev, apiKey: key }));
      }}
      onApiKeyClear={() => {
        GeminiService.clearApiKey();
        setState(prev => ({ ...prev, apiKey: '' }));
        showToast('API Key lokal dihapus.');
      }}
      selectedChannel={state.selectedChannel}
      onChannelChange={handleChannelChange}
      onStepClick={handleStepClick}
      toastMessage={toastMessage}
      onToastShown={() => setToastMessage(null)}
    >
      {state.step === AppStep.INPUT_REFERENCE && (
        <Step1Input
          onNext={handleReferenceSubmit}
          onGenerateVariantsOnly={handleVariantsOnly}
          language={state.language}
            hasApiKey={!!state.apiKey}
            selectedChannel={state.selectedChannel}
            useHook={state.useHook}
            useOutro={state.useOutro}
            onUseHookChange={(val) => setState(prev => ({ ...prev, useHook: val }))}
            onUseOutroChange={(val) => setState(prev => ({ ...prev, useOutro: val }))}
            onToast={showToast}
            onLoadStrategyReport={(data) => {
              setState(prev => ({
                ...prev,
                referenceText: data.referenceText,
                keywords: data.keywords,
                mandatoryKeywords: data.mandatoryKeywords,
                thumbnailObject: data.thumbnailObject,
              }));
            }}
        />
      )}

      {state.step === AppStep.SELECT_IDEA && (
        <Step2Ideas
          ideasText={state.analysis}
          onNext={handleIdeaSelect}
          onBack={handleBack}
          onRegenerate={handleRegenerateIdeas}
          language={state.language}
          useHook={state.useHook}
        />
      )}

      {state.step === AppStep.SCRIPT_GENERATION && state.selectedIdea && (
        <Step3Script
          videoTitle={state.finalTitle}
          onGenerateFullScript={generateFullScript}
          onBack={handleBack}
          onNext={handleScriptCompleted}
          language={state.language}
        />
      )}

      {state.step === AppStep.TITLE_AND_THUMBNAIL && (
        <Step4TitleThumbnail
          scriptSections={state.script}
          keywords={state.keywords || ''}
          contextOverride={state.script.length === 0 ? (state.referenceText + "\n" + state.fileContents.join(' ')) : undefined}
          onNext={handleTitleThumbCompleted}
          onBack={handleBack}
          onGeneratePairs={(context, keywords, mandatoryKeywords, count, specificObject, visualStyle) => GeminiService.generateTitleAndThumbnailPairs(context, keywords, mandatoryKeywords, state.language, count, specificObject, state.channelName, state.writingStyle, visualStyle)}
          onGenerateImage={(fullPrompt, refs, bg, txtRef) => GeminiService.generateRealThumbnailImage(fullPrompt, refs, bg, txtRef, state.imageModel || 'gemini-2.5-flash-image')}
          language={state.language}
          channelName={state.channelName}
          writingStyle={state.writingStyle}
          onToast={showToast}
          defaultMandatoryKeywords={state.mandatoryKeywords}
          defaultThumbnailObject={state.thumbnailObject}
          defaultVisualStyle={state.visualStyle}
        />
      )}

      {state.step === AppStep.DESCRIPTION_TAGS && (
        <Step5Metadata
          description={state.finalDescription || ''}
          tags={state.finalTags || ''}
          onGenerate={handleGenerateMetadata}
          onBack={handleBack}
          isLoading={state.isLoading}
          language={state.language}
          onToast={showToast}
          finalTitle={state.finalTitle}
          scriptSections={state.script}
          selectedPair={state.selectedTitleThumbnailPair || null}
          hashtags={state.finalHashtags || ''}
          pinnedComment={state.finalPinnedComment || ''}
          chapters={state.finalChapters || ''}
          onDescriptionChange={(value) => setState(prev => ({ ...prev, finalDescription: value }))}
          onTagsChange={(value) => setState(prev => ({ ...prev, finalTags: normalizeTags(value), finalHashtags: buildHashtags(value, prev.finalTitle) }))}
          onPinnedCommentChange={(value) => setState(prev => ({ ...prev, finalPinnedComment: value }))}
          onChaptersChange={(value) => setState(prev => ({ ...prev, finalChapters: value }))}
        />
      )}
    </Layout>
  );
};

export default App;
