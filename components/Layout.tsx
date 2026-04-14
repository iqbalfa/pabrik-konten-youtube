import React, { useRef, useState } from 'react';
import { AppStep } from '../types';
import { translations } from '../translations';
import { CHANNELS, ChannelName } from '../presets';

// SVG Icons — no emoji icons (UI/UX Pro Max rule)
const Icons = {
  save: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
    </svg>
  ),
  load: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  eye: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  eyeOff: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
  check: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
    </svg>
  ),
  lock: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  image: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
};

interface LayoutProps {
  currentStep: AppStep;
  children: React.ReactNode;
  isLoading: boolean;
  language: 'id' | 'en';
  onLanguageChange: (lang: 'id' | 'en') => void;
  imageModel: string;
  onImageModelChange: (model: string) => void;
  onSaveState?: () => void;
  onLoadState?: (file: File) => void;
  onStartNew?: () => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  selectedChannel: ChannelName | '';
  onChannelChange: (channel: ChannelName) => void;
  onStepClick: (step: AppStep) => void;
  toastMessage?: { message: string; type: 'success' | 'error' } | null;
  onToastShown?: () => void;
}

// Toast notification component
const Toast: React.FC<{ message: string; type?: 'success' | 'error'; onClose: () => void }> = ({ message, type = 'success', onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-enter fixed top-4 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
      type === 'success' ? 'bg-primary text-on-primary' : 'bg-destructive text-white'
    }`}>
      {type === 'success' ? <Icons.check /> : null}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100 transition-flat">×</button>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({
  currentStep, children, isLoading, language, onLanguageChange,
  imageModel, onImageModelChange, onSaveState, onLoadState, onStartNew,
  apiKey, onApiKeyChange, selectedChannel, onChannelChange, onStepClick,
  toastMessage, onToastShown
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // External toast drives the display; dismiss calls onToastShown
  const toast = toastMessage || null;
  const dismissToast = () => { if (onToastShown) onToastShown(); };

  const t = translations[language];

  const steps = [
    { id: AppStep.INPUT_REFERENCE, label: t.steps.input },
    { id: AppStep.SELECT_IDEA, label: t.steps.ideas },
    { id: AppStep.SCRIPT_GENERATION, label: t.steps.script },
    { id: AppStep.TITLE_AND_THUMBNAIL, label: t.steps.titleThumb },
    { id: AppStep.DESCRIPTION_TAGS, label: t.steps.metadata },
  ];

  const progressPercent = ((currentStep) / (steps.length - 1)) * 100;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onLoadState) {
      onLoadState(e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground font-sans">
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={dismissToast} />}

      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-sidebar text-sidebar-text flex-shrink-0 md:h-screen md:sticky md:top-0 overflow-y-auto shadow-xl z-20 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-lg font-bold tracking-tight text-primary">
              PABRIK KONTEN
            </h1>
            <span className="text-[10px] font-mono bg-gray-800 text-gray-500 px-2 py-0.5 rounded border border-gray-700">v1.0</span>
          </div>
          <p className="text-xs text-gray-400">YouTube Para-Ilmu</p>

          {/* Progress bar — UX: multi-step progress indicator */}
          <div className="mt-4">
            <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
              <span>Langkah {currentStep + 1} dari {steps.length}</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="step-progress">
              <div className="step-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Master Preset — Channel Selector */}
          <div className="mt-5">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Master Preset
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => onChannelChange(e.target.value as ChannelName)}
              className="w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-flat cursor-pointer"
            >
              <option value="" disabled>Pilih Channel...</option>
              {CHANNELS.map(ch => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          </div>

          {/* Language selector */}
          <div className="mt-5">
            <label className="block text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
              {t.layout.systemLanguage}
            </label>
            <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
              <button
                onClick={() => onLanguageChange('id')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-flat ${
                  language === 'id'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-flat ${
                  language === 'en'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* API Key */}
          <div className="mt-5">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              <Icons.lock />
              Gemini API Key
            </label>
            <div className="relative mt-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder="AIza..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring pr-9 transition-flat"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-flat"
                aria-label={showApiKey ? 'Sembunyikan API Key' : 'Tampilkan API Key'}
              >
                {showApiKey ? <Icons.eyeOff /> : <Icons.eye />}
              </button>
            </div>
            {apiKey ? (
              <p className="text-[10px] text-primary mt-1.5 flex items-center gap-1">
                <Icons.check /> API Key tersimpan
              </p>
            ) : (
              <p className="text-[10px] text-gray-600 mt-1.5">
                Dapatkan gratis di aistudio.google.com/apikey
              </p>
            )}
          </div>

          {/* Image Model */}
          <div className="mt-5">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              <Icons.image />
              Image Model
            </label>
            <div className="flex flex-col mt-2 space-y-1">
              {['gemini-2.5-flash-image', 'gemini-3.1-flash-image-preview'].map((model) => (
                <button
                  key={model}
                  onClick={() => onImageModelChange(model)}
                  className={`w-full py-2 px-3 text-xs font-medium rounded-lg transition-flat text-left ${
                    imageModel === model
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  {model.includes('2.5') ? 'Flash 2.5' : 'Flash 3.1'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Steps navigation */}
        <nav className="p-4 space-y-1 flex-1">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-3 mb-2">Workflow</p>
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isClickable = isCompleted || isCurrent;
            return (
            <button
              key={step.id}
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-flat ${
                isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'
              } ${
                isCurrent
                  ? 'bg-primary text-on-primary shadow-md'
                  : isCompleted
                  ? 'text-primary'
                  : 'text-gray-500'
              }`}
            >
              <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center text-[10px] font-bold transition-flat ${
                isCurrent
                  ? 'bg-white/20 text-white'
                  : isCompleted
                  ? 'bg-primary/20 text-primary'
                  : 'bg-gray-800 text-gray-600'
              }`}>
                {isCompleted ? <Icons.check /> : idx + 1}
              </div>
              <span className="truncate">{step.label}</span>
            </button>
            );
          })}
        </nav>

        {/* Session Control */}
        <div className="p-4 border-t border-gray-800 space-y-2">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">{t.session.control}</p>
          <button
            onClick={onSaveState}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-300 transition-flat border border-gray-700"
            title={t.session.saveTitle}
          >
            <Icons.save />
            {t.session.save}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium text-gray-300 transition-flat border border-gray-700"
            title={t.session.loadTitle}
          >
            <Icons.load />
            {t.session.load}
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
          {onStartNew && (
            <button
              onClick={onStartNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 rounded-lg text-xs font-medium text-red-400 transition-flat border border-red-900/50"
              title="Hapus semua progress dan mulai dari awal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Mulai Baru
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative bg-background">
        <div className="max-w-[1400px] mx-auto">
          {/* Loading overlay — UX: skeleton/shimmer for >300ms operations */}
          {isLoading && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm">
              <div className="bg-surface p-8 rounded-2xl shadow-2xl flex flex-col items-center border border-border">
                <div className="spinner mb-5" />
                <h3 className="text-base font-semibold text-foreground mb-1">{t.loading}</h3>
                <p className="text-xs text-gray-500">{t.layout.aiWorking}</p>
              </div>
            </div>
          )}

          {/* Content card */}
          <div className="animate-fade-up bg-surface rounded-2xl shadow-sm border border-border min-h-[80vh] p-8 relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
