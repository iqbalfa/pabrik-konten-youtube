import React, { useState, useRef, useEffect } from 'react';
import { TitleThumbnailPair, ScriptSection } from '../types';
import { refineImagePrompt, constructThumbnailPrompt, getThumbnailStyle } from '../services/geminiService';
import { translations } from '../translations';
import { VISUAL_STYLE_PRESETS } from '../presets';

interface Props {
  scriptSections: ScriptSection[];
  keywords: string;
  contextOverride?: string;
  onNext: (selectedPair: TitleThumbnailPair) => void;
  onBack: () => void;
  onGeneratePairs: (context: string, keywords: string, mandatoryKeywords: string, count: number, specificObject: string, visualStyle: string) => Promise<TitleThumbnailPair[]>;
  onGenerateImage: (fullPrompt: string, refs: File[], bg: File | null, txtRef: File | null) => Promise<{ imageUrl: string, engineeredPrompt: string }>;
  language: 'id' | 'en';
  channelName?: string;
  writingStyle?: string;
  onToast?: (message: string, type?: 'success' | 'error') => void;
  defaultMandatoryKeywords?: string;
  defaultThumbnailObject?: string;
  defaultVisualStyle?: string;
}

export const Step4TitleThumbnail: React.FC<Props> = ({ 
    scriptSections, 
    keywords: initialKeywords, 
    contextOverride,
    onNext, 
    onBack,
    onGeneratePairs,
    onGenerateImage,
    language,
    channelName,
    writingStyle,
    onToast,
    defaultMandatoryKeywords,
    defaultThumbnailObject,
    defaultVisualStyle,
}) => {
  const t = translations[language].titleThumb;
  const tCommon = translations[language];
  const [pairs, setPairs] = useState<TitleThumbnailPair[]>([]);
  const [isGeneratingPairs, setIsGeneratingPairs] = useState(false);
  const [isRegeneratingSingle, setIsRegeneratingSingle] = useState<Record<string, boolean>>({});
  
  // Inputs
  const [mandatoryKeywords, setMandatoryKeywords] = useState(defaultMandatoryKeywords || '');
  const [specificObject, setSpecificObject] = useState(defaultThumbnailObject || '');
  // Init visualStyle ONCE on mount — don't recompute on every render
  const isFirstRenderRef = useRef(true);
  const [visualStyle, setVisualStyle] = useState(
    defaultVisualStyle || getThumbnailStyle(writingStyle || '')
  );

  // Sync visual style when channel changes (only update if user hasn't manually edited)
  const prevChannelRef = useRef(channelName);
  useEffect(() => {
    if (!isFirstRenderRef.current) {
      // Subsequent renders: sync from preset if channel changed
      if (channelName && channelName !== prevChannelRef.current) {
        const preset = VISUAL_STYLE_PRESETS[channelName as keyof typeof VISUAL_STYLE_PRESETS];
        if (preset) setVisualStyle(preset);
      }
    } else {
      // First render: use prop value, then mark initialized
      isFirstRenderRef.current = false;
    }
    prevChannelRef.current = channelName || '';
  }, [channelName]);
  
  // Ref Inputs
  const [refImages, setRefImages] = useState<File[]>([]);
  const [bgImage, setBgImage] = useState<File | null>(null);
  
  const bgInputRef = useRef<HTMLInputElement>(null);
  const charInputRef = useRef<HTMLInputElement>(null);

  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Prompt Modification State
  const [modifyingPromptId, setModifyingPromptId] = useState<string | null>(null);
  const [modificationInput, setModificationInput] = useState('');

  const getContext = () => {
      if (contextOverride) return contextOverride;
      return scriptSections.map(s => s.content).join('\n\n');
  };

  const validateTitle = (title: string, context: string): { valid: boolean; warnings: string[] } => {
      const warnings: string[] = [];
      
      // 1. Cek panjang karakter (YouTube mobile crop ~60 char)
      if (title.length > 60) {
          warnings.push(`Judul terlalu panjang (${title.length} karakter). YouTube mobile hanya tampilkan ~60 karakter.`);
      }
      
      // 2. Cek koma dan kurung
      if (title.includes(',') || title.includes('(') || title.includes(')')) {
          warnings.push('Judul mengandung koma atau kurung — tidak direkomendasikan untuk YouTube.');
      }
      
      return { valid: warnings.length === 0, warnings };
  };

  const handleGeneratePairs = async () => {
      setIsGeneratingPairs(true);
      try {
          const context = getContext();
          let results = await onGeneratePairs(context, initialKeywords, mandatoryKeywords, 3, specificObject, visualStyle);
          
          // Apply validation
          results = results.map(pair => {
              const validation = validateTitle(pair.title, context);
              return { ...pair, titleWarnings: validation.warnings };
          });

          setPairs(results);
          if (results.length > 0) setSelectedPairId(results[0].id);
      } catch (e) {
          if (onToast) onToast(t.errorPairs, 'error'); else alert(t.errorPairs);
      } finally {
          setIsGeneratingPairs(false);
      }
  };

  const handleRegenerateSinglePair = async (pairId: string) => {
      setIsRegeneratingSingle(prev => ({ ...prev, [pairId]: true }));
      try {
          const context = getContext();
          // Generate just 1 new idea
          let newPairs = await onGeneratePairs(context, initialKeywords, mandatoryKeywords, 1, specificObject, visualStyle);
          
          if (newPairs.length > 0) {
              let newPair = newPairs[0];
              const validation = validateTitle(newPair.title, context);
              newPair = { ...newPair, titleWarnings: validation.warnings };

              // Update state replacing only the matching ID with the new pair
              setPairs(prev => prev.map(p => p.id === pairId ? newPair : p));
              
              if (selectedPairId === pairId) {
                  setSelectedPairId(newPair.id);
              }
          }
      } catch (e) {
          if (onToast) onToast(t.errorRegen, 'error'); else alert(t.errorRegen);
      } finally {
          setIsRegeneratingSingle(prev => ({ ...prev, [pairId]: false }));
      }
  };

  const handleUpdatePairData = (pairId: string, field: 'emphasisText' | 'normalText' | 'prompt' | 'fullTextOverlay', value: string) => {
      setPairs(prev => prev.map(p => {
          if (p.id !== pairId) return p;
          
          let updatedThumbnail = { ...p.thumbnail };

          if (field === 'prompt') {
              updatedThumbnail.prompt = value;
          } else {
              updatedThumbnail[field] = value;
          }
          
          // Automatically regenerate detailed prompt when dependencies change
          updatedThumbnail.detailedPrompt = constructThumbnailPrompt(
              updatedThumbnail.prompt,
              updatedThumbnail.actionDescription || '',
              updatedThumbnail.emphasisText,
              updatedThumbnail.normalText,
              updatedThumbnail.fullTextOverlay, // Use the potentially updated field here
              visualStyle
          );
          
          // Clear finalEngineeredPrompt so UI shows the newly drafted detailedPrompt
          updatedThumbnail.finalEngineeredPrompt = undefined;

          return { ...p, thumbnail: updatedThumbnail };
      }));
  };

  const handleDetailedPromptChange = (pairId: string, value: string) => {
      setPairs(prev => prev.map(p => {
          if (p.id !== pairId) return p;
          return { ...p, thumbnail: { ...p.thumbnail, detailedPrompt: value, finalEngineeredPrompt: undefined } };
      }));
  };

  const handleRefinePrompt = async (pairId: string) => {
      if (!modificationInput.trim()) return;
      setModifyingPromptId(pairId);
      const pair = pairs.find(p => p.id === pairId);
      if (!pair) return;

      try {
          const newPrompt = await refineImagePrompt(pair.thumbnail.prompt, modificationInput);
          handleUpdatePairData(pairId, 'prompt', newPrompt);
          setModificationInput('');
      } catch (e) {
          if (onToast) onToast(t.errorRefine, 'error'); else alert(t.errorRefine);
      } finally {
          setModifyingPromptId(null);
      }
  };

  const handleGenerateThumbnailImage = async (pairId: string) => {
      const pair = pairs.find(p => p.id === pairId);
      if (!pair) return;

      if (!bgImage) {
          if (onToast) onToast(t.errorBg, 'error'); else alert(t.errorBg);
          return;
      }

      setPairs(prev => prev.map(p => p.id === pairId ? { ...p, thumbnail: { ...p.thumbnail, status: 'generating' } } : p));

      try {
          // Use the detailedPrompt from state
          const fullPrompt = pair.thumbnail.detailedPrompt || "";
          
          const { imageUrl, engineeredPrompt } = await onGenerateImage(
              fullPrompt,
              refImages,
              bgImage,
              bgImage // Pass bgImage as textStyleImage
          );

          setPairs(prev => prev.map(p => p.id === pairId ? { 
              ...p, 
              thumbnail: { 
                  ...p.thumbnail, 
                  status: 'success', 
                  imageUrl,
                  finalEngineeredPrompt: engineeredPrompt
              } 
          } : p));

      } catch (e) {
          console.error(e);
          setPairs(prev => prev.map(p => p.id === pairId ? { 
              ...p, 
              thumbnail: { ...p.thumbnail, status: 'error' } 
          } : p));
          if (onToast) onToast(t.errorImage, 'error'); else alert(t.errorImage);
      }
  };

  const handleRefImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) setRefImages(Array.from(e.target.files));
  };

  return (
    <div className="space-y-8 pb-32 relative">
      <div className="border-b pb-6 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.title} <span className="text-primary">v1.0</span></h2>
            <p className="text-gray-500 mt-2 font-medium">
                {t.subtitle}
            </p>
        </div>
        {pairs.length > 0 && (
            <button 
                onClick={handleGeneratePairs} 
                disabled={isGeneratingPairs}
                className="text-xs font-bold text-gray-500 underline hover:text-black"
            >
                {isGeneratingPairs ? t.generatingPairs : t.btnRegenerate}
            </button>
        )}
      </div>

      {/* 1. INPUT ASSETS SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center border-b pb-4 mb-4">
               <div>
                   <h3 className="font-bold text-gray-800 uppercase tracking-wide text-sm">{t.configTitle}</h3>
                   <span className="text-xs text-gray-400">{t.configSubtitle}</span>
               </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Keyword Wajib Input */}
              <div className="bg-blue-50 border border-yellow-200 p-4 rounded-xl">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                      {t.mandatoryKeyword}
                  </label>
                  <input 
                      type="text" 
                      value={mandatoryKeywords}
                      onChange={(e) => setMandatoryKeywords(e.target.value)}
                      placeholder={t.keywordPlaceholder}
                      className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm font-bold text-gray-900 placeholder-gray-400"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">{t.keywordHint}</p>
              </div>

              {/* Specific Object Input */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                      {t.specificObject}
                  </label>
                  <input 
                      type="text" 
                      value={specificObject}
                      onChange={(e) => setSpecificObject(e.target.value)}
                      placeholder={t.objectPlaceholder}
                      className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-900 placeholder-gray-400"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">{t.objectHint}</p>
              </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
              {/* Background Input */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. {t.refBackground}</label>
                  <div 
                    onClick={() => bgInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${bgImage ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-blue-50'}`}
                  >
                      <input ref={bgInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setBgImage(e.target.files[0])} />
                      {bgImage ? (
                          <div className="text-green-700 font-bold text-xs truncate">{bgImage.name}</div>
                      ) : (
                          <span className="text-gray-400 text-xs">{t.uploadRef}</span>
                      )}
                  </div>
              </div>

              {/* Character Input */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. {t.refCharacter}</label>
                  <div 
                    onClick={() => charInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-blue-50 transition-all"
                  >
                      <input ref={charInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleRefImageChange} />
                      {refImages.length > 0 ? (
                          <div className="text-gray-800 font-bold text-xs">{refImages.length} File</div>
                      ) : (
                          <span className="text-gray-400 text-xs">{t.uploadRef}</span>
                      )}
                  </div>
              </div>

              {/* Visual Style Input */}
              <div>
                  <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase">3. {t.visualStyle || 'VISUAL STYLE'}</label>
                      <select
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val && val in VISUAL_STYLE_PRESETS) {
                              setVisualStyle(VISUAL_STYLE_PRESETS[val as keyof typeof VISUAL_STYLE_PRESETS]);
                            }
                          }}
                          value={channelName && channelName in VISUAL_STYLE_PRESETS ? channelName : ''}
                          className="text-[10px] bg-muted hover:bg-purple-50 px-2 py-1 rounded-md text-gray-600 transition-flat outline-none border-none cursor-pointer font-normal"
                      >
                          {Object.keys(VISUAL_STYLE_PRESETS).map(ch => (
                              <option key={ch} value={ch}>{ch}</option>
                          ))}
                      </select>
                  </div>
                  <textarea
                      className="w-full h-32 px-4 py-3 border border-purple-200 rounded-xl text-[10px] font-mono text-foreground placeholder-gray-400 resize-y focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-flat bg-white"
                      placeholder="Visual style prompt will appear here based on selected channel..."
                      value={visualStyle}
                      onChange={(e) => setVisualStyle(e.target.value)}
                  />
              </div>
          </div>
      </div>

      {/* 2. GENERATE BUTTON */}
      {pairs.length === 0 && (
          <div className="flex justify-center py-10">
              <button 
                  onClick={handleGeneratePairs}
                  disabled={isGeneratingPairs}
                  className="bg-gray-900 hover:bg-black text-white px-10 py-5 rounded-full font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:transform-none flex items-center gap-3"
              >
                  {isGeneratingPairs ? (
                      <>{t.generatingPairs}</>
                  ) : (
                      <>
                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        {t.btnGenerate}
                      </>
                  )}
              </button>
          </div>
      )}

      {/* 3. RESULTS GRID */}
      <div className="grid gap-12">
          {pairs.map((pair, idx) => (
              <div 
                key={pair.id}
                onClick={() => setSelectedPairId(pair.id)}
                className={`bg-white rounded-3xl border-2 overflow-hidden transition-all duration-300 shadow-lg hover:shadow-2xl ${
                    selectedPairId === pair.id ? 'border-primary ring-4 ring-primary/20' : 'border-gray-200'
                }`}
              >
                  <div className="grid lg:grid-cols-12 gap-0">
                      
                      {/* Left: Title & Text Logic */}
                      <div className="lg:col-span-5 p-8 flex flex-col justify-between bg-white relative z-10 overflow-y-auto max-h-[800px]">
                          <div>
                              <div className="flex justify-between items-start mb-6">
                                  <div className="flex items-center gap-3">
                                    <span className="bg-gray-900 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-sm">{idx + 1}</span>
                                    <span className="text-xs font-black uppercase tracking-widest text-gray-400">{t.variationLabel}</span>
                                    {pair.thumbnail.triggerType && (
                                        <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase border border-indigo-100">
                                            {pair.thumbnail.triggerType}
                                        </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleRegenerateSinglePair(pair.id); }}
                                    disabled={isRegeneratingSingle[pair.id]}
                                    className="text-[10px] font-bold uppercase tracking-wide bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center text-gray-600 transition-colors"
                                  >
                                      {isRegeneratingSingle[pair.id] ? (
                                          <span className="animate-pulse">{tCommon.loading}</span>
                                      ) : (
                                          <>
                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                            {t.btnRegenerateSingle}
                                          </>
                                      )}
                                  </button>
                              </div>
                              
                              <div className="mb-6 group">
                                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">{t.titleLabel}</label>
                                  <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-yellow-600 transition-colors">
                                      {pair.title}
                                  </h3>
                                  {pair.ctrAnalysis && (
                                      <div className="mt-3 bg-blue-50 border border-blue-100 p-3 rounded-lg">
                                          <span className="block text-[9px] font-black uppercase text-blue-500 mb-1">CTR Analysis</span>
                                          <p className="text-xs text-blue-900 leading-relaxed">{pair.ctrAnalysis}</p>
                                      </div>
                                  )}
                                  {pair.titleWarnings && pair.titleWarnings.length > 0 && (
                                      <div className="mt-3 bg-red-50 border border-red-100 p-3 rounded-lg">
                                          <span className="block text-[9px] font-black uppercase text-red-500 mb-1">⚠️ Peringatan Judul</span>
                                          <ul className="list-disc list-inside text-xs text-red-900 leading-relaxed">
                                              {pair.titleWarnings.map((warning, i) => (
                                                  <li key={i}>{warning}</li>
                                              ))}
                                          </ul>
                                      </div>
                                  )}
                              </div>

                              <div className="space-y-4 mb-6">
                                  {/* 1. FULL PHRASE INPUT - NEW */}
                                  <div className="bg-gray-800 border border-gray-700 p-3 rounded-xl shadow-sm">
                                      <span className="block text-[9px] font-black uppercase text-primary mb-1">1. {t.fullTextOverlay}</span>
                                      <input 
                                        type="text"
                                        className="w-full bg-transparent border-b border-gray-600 text-lg font-bold text-white focus:outline-none focus:border-primary placeholder-gray-500"
                                        value={pair.thumbnail.fullTextOverlay || ''}
                                        onChange={(e) => handleUpdatePairData(pair.id, 'fullTextOverlay', e.target.value)}
                                        placeholder={t.fullTextPlaceholder}
                                      />
                                  </div>

                                  <div className="bg-red-50 border border-red-100 p-3 rounded-xl shadow-sm">
                                      <span className="block text-[9px] font-black uppercase text-red-400 mb-1">2. {t.emphasisText}</span>
                                      <input 
                                        type="text"
                                        className="w-full bg-transparent border-b border-red-200 text-xl font-bold text-red-600 focus:outline-none focus:border-red-500"
                                        value={pair.thumbnail.emphasisText}
                                        onChange={(e) => handleUpdatePairData(pair.id, 'emphasisText', e.target.value)}
                                      />
                                  </div>
                                  <div className="bg-gray-50 border border-gray-100 p-3 rounded-xl shadow-sm">
                                      <span className="block text-[9px] font-black uppercase text-gray-400 mb-1">3. {t.normalText}</span>
                                      <input 
                                        type="text"
                                        className="w-full bg-transparent border-b border-gray-300 text-xl font-bold text-gray-800 focus:outline-none focus:border-gray-500"
                                        value={pair.thumbnail.normalText}
                                        onChange={(e) => handleUpdatePairData(pair.id, 'normalText', e.target.value)}
                                      />
                                  </div>
                              </div>
                              
                              {/* CHARACTER ACTION DISPLAY */}
                              <div className="mb-4 bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                  <span className="block text-[9px] font-black uppercase text-indigo-400 mb-1">{t.actionDesc}</span>
                                  <p className="font-medium text-sm text-indigo-900 italic">
                                      "{pair.thumbnail.actionDescription}"
                                  </p>
                              </div>
                          </div>

                          {/* AREA PROMPT VISUAL EDITABLE */}
                          <div className="pt-6 border-t border-gray-100 mt-auto">
                               <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                                   {t.visualPrompt}
                               </p>
                               <textarea
                                   className="w-full text-[10px] font-mono text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none h-24 mb-3"
                                   value={pair.thumbnail.prompt}
                                   onChange={(e) => handleUpdatePairData(pair.id, 'prompt', e.target.value)}
                               />

                               <p className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2 mt-4">
                                   {t.engineeredPrompt}
                               </p>
                               <textarea
                                   className="w-full text-[10px] font-mono text-blue-800 bg-blue-50 p-3 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none h-32 mb-3"
                                   value={pair.thumbnail.finalEngineeredPrompt || pair.thumbnail.detailedPrompt || ''}
                                   onChange={(e) => handleDetailedPromptChange(pair.id, e.target.value)}
                                   placeholder={t.engineeredPlaceholder}
                               />
                               
                               {/* MAGIC MODIFY PROMPT */}
                               <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex gap-2">
                                   <input 
                                     type="text" 
                                     className="flex-1 bg-white border border-blue-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-400"
                                     placeholder={t.magicEditPlaceholder}
                                     value={modifyingPromptId === pair.id ? modificationInput : ''}
                                     onChange={(e) => {
                                         setModifyingPromptId(pair.id);
                                         setModificationInput(e.target.value);
                                     }}
                                   />
                                   <button 
                                     onClick={() => handleRefinePrompt(pair.id)}
                                     disabled={modifyingPromptId === pair.id && !modificationInput}
                                     className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 rounded uppercase tracking-wide transition-colors disabled:opacity-50"
                                   >
                                       {modifyingPromptId === pair.id && modificationInput ? t.applyAi : t.magicEdit}
                                   </button>
                               </div>
                          </div>
                      </div>

                      {/* Right: Thumbnail Preview/Generation (ASPECT RATIO FIXED) */}
                      <div className="lg:col-span-7 bg-gray-900 p-6 flex flex-col items-center justify-center relative group">
                          
                          {/* 16:9 CONTAINER (aspect-video) */}
                          <div className="w-full aspect-video bg-gray-800 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center relative border border-gray-700">
                              
                              {pair.thumbnail.imageUrl ? (
                                  <div className="relative w-full h-full group/image">
                                      <img 
                                        src={pair.thumbnail.imageUrl} 
                                        className="w-full h-full object-cover cursor-zoom-in" 
                                        alt="Generated Thumbnail" 
                                        onClick={(e) => { e.stopPropagation(); setZoomedImage(pair.thumbnail.imageUrl || null); }}
                                      />
                                      
                                      {/* Hover Actions with Loading State */}
                                      <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm ${pair.thumbnail.status === 'generating' ? 'opacity-100' : 'opacity-0 group-hover/image:opacity-100'}`}>
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); handleGenerateThumbnailImage(pair.id); }}
                                            disabled={pair.thumbnail.status === 'generating'}
                                            className="bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-full font-bold text-xs transition-all transform hover:scale-105 disabled:opacity-80 disabled:transform-none disabled:cursor-wait"
                                          >
                                              {pair.thumbnail.status === 'generating' ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin h-3 w-3 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    {tCommon.loading}
                                                </span>
                                              ) : t.btnRegenerateSingle}
                                          </button>
                                          
                                          {pair.thumbnail.status !== 'generating' && (
                                              <>
                                                   <a 
                                                    href={pair.thumbnail.imageUrl} 
                                                    download={`thumb-${pair.id}.png`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="bg-primary hover:bg-primary text-black px-5 py-2.5 rounded-full font-bold text-xs transition-all transform hover:scale-105"
                                                  >
                                                      {t.downloadHd}
                                                  </a>
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); setZoomedImage(pair.thumbnail.imageUrl || null); }}
                                                    className="bg-transparent border-2 border-white text-white px-3 py-2 rounded-full hover:bg-white/20 transition-all"
                                                    title={t.zoomImage}
                                                  >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                                                  </button>
                                              </>
                                          )}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-center p-8 w-full">
                                      <div className="mb-6 text-gray-600 flex justify-center">
                                          <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                      </div>
                                      <button
                                          onClick={(e) => { e.stopPropagation(); handleGenerateThumbnailImage(pair.id); }}
                                          disabled={pair.thumbnail.status === 'generating'}
                                          className="bg-primary hover:bg-primary text-black px-8 py-3 rounded-full font-bold text-sm shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none"
                                      >
                                          {pair.thumbnail.status === 'generating' ? (
                                              <span className="flex items-center gap-2">
                                                  <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                  </svg>
                                                  {t.rendering}
                                              </span>
                                          ) : t.btnGenerateVisual}
                                      </button>
                                      {pair.thumbnail.status === 'error' && <p className="text-red-400 text-xs mt-3 font-bold">{t.errorGenerate}</p>}
                                      {!bgImage && <p className="text-red-400 text-xs mt-3 font-bold">{t.errorBg}</p>}
                                  </div>
                              )}
                          </div>

                          {/* YouTube Search Preview Mockup */}
                          <div className="mt-6 border-t border-gray-700 pt-6 w-full">
                              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                                  📱 YouTube Search Preview
                              </h4>
                              <div className="bg-white border rounded-xl p-4 max-w-md shadow-sm mx-auto">
                                  {/* Thumbnail + Info Row */}
                                  <div className="flex gap-3">
                                      {/* Small Thumbnail */}
                                      <div className="w-40 h-[90px] bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                                          {pair.thumbnail.imageUrl ? (
                                              <img 
                                                  src={pair.thumbnail.imageUrl} 
                                                  className="w-full h-full object-cover" 
                                                  alt="Thumbnail preview"
                                              />
                                          ) : (
                                              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                                                  No Image
                                              </div>
                                          )}
                                          {/* Duration badge placeholder */}
                                          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1 rounded">
                                              12:34
                                          </span>
                                      </div>
                                      {/* Title + Meta */}
                                      <div className="flex-1 min-w-0 text-left">
                                          <h5 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
                                              {pair.title}
                                          </h5>
                                          <p className="text-xs text-gray-500 mt-1">
                                              {channelName || 'Channel Name'} • 2.5rb x ditonton • 3 hari lalu
                                          </p>
                                      </div>
                                  </div>
                                  
                                  {/* Warning jika judul terpotong */}
                                  {pair.title.length > 60 && (
                                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2 text-left">
                                          <p className="text-[10px] text-amber-700">
                                              ⚠️ Judul terpotong di mobile! Yang terlihat hanya: 
                                              <span className="font-bold"> "{pair.title.slice(0, 60)}..."</span>
                                          </p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          ))}
      </div>

      {/* FOOTER ACTION */}
      <div className="fixed bottom-0 right-0 left-0 md:left-64 bg-white/90 backdrop-blur-md border-t border-gray-200 p-6 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-50 flex justify-end items-center gap-4">
            <button 
                onClick={onBack} 
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 rounded-xl font-bold transition-all shadow-sm active:scale-95"
            >
                {tCommon.back}
            </button>
            <button
                onClick={() => {
                    if (pairs.length > 0) {
                         const target = selectedPairId ? pairs.find(p => p.id === selectedPairId)! : pairs[0];
                         onNext(target);
                    }
                }}
                disabled={pairs.length === 0}
                className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95 flex items-center justify-center gap-2"
            >
                {t.btnNext}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
      </div>

      {/* LIGHTBOX ZOOM MODAL */}
      {zoomedImage && (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
            onClick={() => setZoomedImage(null)}
          >
              <div className="relative max-w-7xl w-full max-h-screen flex flex-col items-center">
                  <img 
                    src={zoomedImage} 
                    className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                    onClick={(e) => e.stopPropagation()} 
                    alt="Zoomed Preview"
                  />
                  <button 
                    onClick={() => setZoomedImage(null)}
                    className="mt-6 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full font-bold backdrop-blur-md transition-all"
                  >
                      {t.closePreview}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};