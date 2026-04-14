import React, { useState } from 'react';
import { translations } from '../translations';

interface Props {
  description: string;
  tags: string;
  onGenerate: () => void;
  onBack: () => void;
  isLoading: boolean;
  language: 'id' | 'en';
  onToast?: (message: string, type?: 'success' | 'error') => void;
}

export const Step5Metadata: React.FC<Props> = ({ description, tags, onGenerate, onBack, isLoading, language, onToast }) => {
  const t = translations[language].metadata;
  const tCommon = translations[language];
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    if (onToast) onToast(`${label} berhasil disalin!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-32">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">{t.title}</h2>
        <p className="text-gray-600 mt-1">{t.subtitle}</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex flex-col items-center text-center">
          <p className="text-blue-900 mb-4 font-medium">{t.descLabel}</p>
          <button 
            onClick={onGenerate}
            disabled={isLoading || (!!description && !!tags)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-md transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? tCommon.loading : (description ? t.btnGenerate : t.btnGenerate)}
          </button>
      </div>

      {/* Two Column Layout for Results */}
      <div className="grid md:grid-cols-2 gap-8">
          
          {/* Description Column */}
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-lg">{t.descLabel}</h3>
                  <button 
                    onClick={() => copyToClipboard(description, setCopiedDesc, 'Deskripsi')}
                    disabled={!description}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors ${copiedDesc ? 'bg-green-100 text-green-800 border-green-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                  >
                      {copiedDesc ? t.copied : t.copy}
                  </button>
              </div>
              <textarea 
                readOnly
                value={description}
                className="w-full h-[500px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm leading-relaxed text-gray-800 bg-gray-50 font-sans"
                placeholder="..."
              />
          </div>

          {/* Tags Column */}
          <div className="space-y-4">
              <div className="flex justify-between items-center">
                  <h3 className="font-bold text-gray-900 text-lg">{t.tagsLabel}</h3>
                  <button 
                    onClick={() => copyToClipboard(tags, setCopiedTags, 'Tags')}
                    disabled={!tags}
                    className={`text-xs px-3 py-1.5 rounded border transition-colors ${copiedTags ? 'bg-green-100 text-green-800 border-green-300' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                  >
                      {copiedTags ? t.copied : t.copy}
                  </button>
              </div>
              <div className="relative">
                 <textarea 
                    readOnly
                    value={tags}
                    className="w-full h-[150px] p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm leading-relaxed text-gray-800 bg-gray-50 font-mono"
                    placeholder="..."
                />
                <div className="mt-2 text-xs text-gray-500">
                    {t.tagsOptimizationHint}
                </div>
              </div>
              
              {/* Preview Tags as pills */}
              {tags && (
                  <div className="mt-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">{t.previewTagsLabel}</h4>
                      <div className="flex flex-wrap gap-2">
                          {tags.split(',').map((tag, i) => (
                              <span key={i} className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                                  {tag.trim()}
                              </span>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>

       {/* Floating Footer */}
       <div className="fixed bottom-0 right-0 left-0 md:left-64 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 flex justify-center items-center gap-4">
          <button 
            onClick={onBack} 
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-lg font-medium transition-all shadow-sm"
          >
            {tCommon.back}
          </button>
      </div>
    </div>
  );
};