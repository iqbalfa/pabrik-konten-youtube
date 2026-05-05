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
  const isIlmuLidiPreset = /ilmu\s*lidi/i.test(`${channelName || ''} ${writingStyle || ''}`);

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

  const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z0-9à-ÿ\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  const isBoundaryEmphasis = (overlay: string, emphasis: string) => {
      const normalizedOverlay = normalizeText(overlay);
      const normalizedEmphasis = normalizeText(emphasis);
      if (!normalizedOverlay || !normalizedEmphasis) return false;
      return normalizedOverlay === normalizedEmphasis ||
          normalizedOverlay.startsWith(`${normalizedEmphasis} `) ||
          normalizedOverlay.endsWith(` ${normalizedEmphasis}`);
  };

  const getValidationBadges = (pair: TitleThumbnailPair) => {
      const title = pair.title || '';
      const overlay = pair.thumbnail.fullTextOverlay || '';
      const normalizedTitle = normalizeText(title);
      const normalizedOverlay = normalizeText(overlay);
      const mandatory = mandatoryKeywords.trim();
      const keywordOk = !mandatory || normalizedTitle.includes(normalizeText(mandatory));
      const titleOk = title.length > 0 && title.length <= 60;
      const overlayWords = overlay.trim().split(/\s+/).filter(Boolean).length;
      const overlayOk = overlayWords >= 2 && overlayWords <= 4;
      const notDuplicate = normalizedOverlay.length > 0 && !normalizedTitle.includes(normalizedOverlay);
      const emphasisOk = isBoundaryEmphasis(overlay, pair.thumbnail.emphasisText || '');
      const feasibility = pair.thumbnail.feasibilityScore || 0;
      const visualCtr = pair.thumbnail.visualCtrScore || 0;
      const hasConflict = Boolean(pair.thumbnail.visualMetaphor && pair.thumbnail.conflictObject);
      const hasCuriosity = Boolean(pair.thumbnail.curiosityObject || pair.thumbnail.stopScrollReason);
      const risk = (pair.clickbaitRisk || 'MEDIUM').toUpperCase();
      return [
          { label: mandatory ? 'Keyword judul' : 'Keyword opsional', ok: keywordOk, value: mandatory || 'Tidak diisi' },
          { label: 'Mobile title', ok: titleOk, value: `${title.length}/60 char` },
          { label: 'Text 2-4 kata', ok: overlayOk, value: `${overlayWords || 0} kata` },
          { label: 'Emphasis tepi', ok: emphasisOk, value: emphasisOk ? 'Awal/akhir' : 'Jangan tengah' },
          { label: 'Tidak copy judul', ok: notDuplicate, value: notDuplicate ? 'Complementary' : 'Terlalu mirip' },
          { label: 'Visual CTR', ok: visualCtr >= 78, value: visualCtr ? `${visualCtr}/100` : 'Belum ada' },
          { label: 'Konflik visual', ok: hasConflict, value: hasConflict ? 'Metafora + objek' : 'Terlalu literal' },
          { label: 'Curiosity object', ok: hasCuriosity, value: hasCuriosity ? 'Ada' : 'Kurang misteri' },
          { label: 'Feasibility', ok: feasibility >= 70, value: `${feasibility || '-'}%` },
          { label: 'Clickbait risk', ok: risk !== 'HIGH', value: risk },
      ];
  };

  const quickRemixActions = [
      { label: 'Stop-scroll+', instruction: 'Buat versi yang lebih stop-scroll: satu konflik visual besar, objek utama lebih ekstrem, dan terbaca dalam 1 detik.' },
      { label: 'Konflik+', instruction: 'Perkuat konflik visual. Tambahkan ancaman/ketegangan yang konkret, bukan cuma ekspresi wajah.' },
      { label: 'Curiosity', instruction: 'Tambahkan curiosity object yang aneh/kontras sehingga penonton bertanya apa yang sedang terjadi.' },
      { label: 'Metafora total', instruction: 'Ganti visual literal menjadi metafora visual total. Jangan sekadar orang + objek biasa.' },
      { label: 'Lebih gelap', instruction: 'Buat versi lebih gelap, dramatis, dan punya emotional punch lebih kuat, tapi tetap tidak menyesatkan.' },
      { label: 'Lebih absurd', instruction: 'Buat versi lebih lucu/absurd ala thumbnail viral, tapi pesan utama tetap jelas dalam sekali lihat.' },
      { label: 'Lebih lokal', instruction: 'Ganti objek visual menjadi lebih Indonesia dan sehari-hari: QRIS, struk minimarket, paket COD, kos-kosan, motor, warung, atau objek lokal relevan.' },
      { label: 'Topik jelas', instruction: 'Buat topik lebih cepat terbaca secara visual tanpa menambah teks panjang. Fokuskan objek utama dan kurangi detail kecil.' },
  ];

  const handleQuickRemix = (pairId: string, instruction: string) => {
      setModifyingPromptId(pairId);
      setModificationInput(instruction);
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

  const handleUpdatePairData = (pairId: string, field: 'emphasisText' | 'normalText' | 'prompt' | 'fullTextOverlay' | 'visualConcept', value: string) => {
      setPairs(prev => prev.map(p => {
          if (p.id !== pairId) return p;
          
          let updatedThumbnail = { ...p.thumbnail };

          if (field === 'prompt') {
              updatedThumbnail.prompt = value;
          } else if (field === 'visualConcept') {
              updatedThumbnail.visualConcept = value;
          } else {
              updatedThumbnail[field] = value;
          }
          
          // Automatically regenerate detailed prompt when dependencies change
          const visualBrief = [
              updatedThumbnail.visualMetaphor ? `${updatedThumbnail.visualMetaphor}` : '',
              updatedThumbnail.conflictObject ? `Konflik utama scene: ${updatedThumbnail.conflictObject}` : '',
              updatedThumbnail.curiosityObject ? `Elemen penasaran: ${updatedThumbnail.curiosityObject}` : '',
              updatedThumbnail.emotionTarget ? `Emosi yang dituju: ${updatedThumbnail.emotionTarget}` : '',
              updatedThumbnail.stopScrollReason ? `${updatedThumbnail.stopScrollReason}` : '',
              updatedThumbnail.prompt ? `Scene: ${updatedThumbnail.prompt}` : '',
          ].filter(Boolean).join('\n');
          updatedThumbnail.detailedPrompt = constructThumbnailPrompt(
              visualBrief || updatedThumbnail.prompt,
              updatedThumbnail.actionDescription || '',
              updatedThumbnail.emphasisText,
              updatedThumbnail.normalText,
              updatedThumbnail.fullTextOverlay, // Use the potentially updated field here
              visualStyle,
              channelName || ''
          );
          
          // Clear finalEngineeredPrompt so UI shows the newly drafted detailedPrompt
          updatedThumbnail.finalEngineeredPrompt = undefined;

          return { ...p, thumbnail: updatedThumbnail };
      }));
  };

  const handleResetDetailedPrompt = (pairId: string) => {
      const pair = pairs.find(p => p.id === pairId);
      if (!pair) return;
      const visualBrief = [
          pair.thumbnail.visualMetaphor ? `VISUAL METAPHOR: ${pair.thumbnail.visualMetaphor}` : '',
          pair.thumbnail.conflictObject ? `CONFLICT OBJECT: ${pair.thumbnail.conflictObject}` : '',
          pair.thumbnail.curiosityObject ? `CURIOSITY OBJECT: ${pair.thumbnail.curiosityObject}` : '',
          pair.thumbnail.emotionTarget ? `EMOTION TARGET: ${pair.thumbnail.emotionTarget}` : '',
          pair.thumbnail.stopScrollReason ? `STOP-SCROLL REASON: ${pair.thumbnail.stopScrollReason}` : '',
          pair.thumbnail.prompt ? `SCENE: ${pair.thumbnail.prompt}` : '',
      ].filter(Boolean).join('\n');
      const resetPrompt = constructThumbnailPrompt(
          visualBrief || pair.thumbnail.prompt,
          pair.thumbnail.actionDescription || '',
          pair.thumbnail.emphasisText,
          pair.thumbnail.normalText,
          pair.thumbnail.fullTextOverlay,
          visualStyle,
          channelName || ''
      );
      setPairs(prev => prev.map(p =>
          p.id === pairId
              ? { ...p, thumbnail: { ...p.thumbnail, finalEngineeredPrompt: undefined, detailedPrompt: resetPrompt } }
              : p
      ));
  };

  const handleDetailedPromptChange = (pairId: string, value: string) => {
      setPairs(prev => prev.map(p => {
          if (p.id !== pairId) return p;
          return { ...p, thumbnail: { ...p.thumbnail, finalEngineeredPrompt: value } };
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
          // Inject mascot observer instruction if refImages are uploaded
          const mascotObserverNote = refImages.length > 0
            ? "\n\n[OBSERVER IDENTITY]: Karakter observer dari referensi yang diunggah WAJIB muncul di scene ini -- posisikan di sudut frame sebagai identitas channel. HANYA SATU kemunculan. JANGAN duplikasi."
            : "";
          const fullPromptWithObserver = fullPrompt + mascotObserverNote;
          
          const { imageUrl, engineeredPrompt } = await onGenerateImage(
              fullPromptWithObserver,
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
    <div className="space-y-8 pb-44 relative">
      <div className="border-b pb-6 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.title} <span className="text-primary">v1.1 Visual Director</span></h2>
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
               <div className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-[10px] font-black uppercase tracking-wider">
                   3 CTR Packages
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">1. {t.refBackground} <span className="text-red-500">Required</span></label>
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
                  <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">
                    {isIlmuLidiPreset
                      ? 'Khusus Ilmu Lidi: pakai Font___Background_Style.png untuk background biru muda, headline hitam, dan banner merah.'
                      : 'Dipakai sebagai background + typography style untuk preset/channel ini. Jangan pakai aset Ilmu Lidi untuk channel lain kecuali memang sengaja.'}
                  </p>
              </div>

              {/* Character Input */}
              <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">2. {t.refCharacter} <span className="text-gray-400">Optional</span></label>
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
                  <p className="mt-2 text-[10px] text-gray-400 leading-relaxed">
                    {isIlmuLidiPreset
                      ? 'Khusus Ilmu Lidi: upload Ilmu_Lidi.jpeg agar karakter tetap anak 7-10 tahun, semi-chibi, bukan versi dewasa.'
                      : 'Upload maskot/karakter agar image model menjaga identitas visual channel ini.'}
                  </p>
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
          <div className="flex justify-center py-10 bg-white border border-gray-200 rounded-2xl shadow-sm">
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
                              
                              <div className="mb-5 grid grid-cols-2 gap-2">
                                  {getValidationBadges(pair).map((badge) => (
                                      <div key={badge.label} className={`rounded-lg border px-2.5 py-2 ${badge.ok ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                                          <div className="text-[9px] font-black uppercase tracking-wide">{badge.label}</div>
                                          <div className="text-[10px] font-bold truncate">{badge.ok ? 'OK' : 'Cek'} · {badge.value}</div>
                                      </div>
                                  ))}
                              </div>

                              <div className="mb-6 group">
                                  <label className="block text-[10px] font-black uppercase text-gray-400 mb-1">{t.titleLabel}</label>
                                  <h3 className="text-2xl font-black text-gray-900 leading-tight group-hover:text-yellow-600 transition-colors">
                                      {pair.title}
                                  </h3>
                                  {pair.ctrAnalysis && (
                                      <div className="mt-3 bg-blue-50 border border-blue-100 p-3 rounded-lg">
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                              <span className="block text-[9px] font-black uppercase text-blue-500">CTR Analysis</span>
                                              {pair.clickbaitRisk && <span className="text-[9px] font-black uppercase text-blue-700 bg-white/70 px-2 py-0.5 rounded">Risk: {pair.clickbaitRisk}</span>}
                                          </div>
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

                              {(pair.thumbnail.visualMetaphor || pair.thumbnail.conflictObject || pair.thumbnail.stopScrollReason) && (
                                  <div className="mb-6 bg-gradient-to-br from-gray-950 to-slate-900 border border-slate-700 p-4 rounded-xl text-white shadow-sm">
                                      <div className="flex flex-wrap items-center gap-2 mb-3">
                                          <span className="px-2.5 py-1 rounded-full bg-primary text-black text-[9px] font-black uppercase tracking-widest">Visual Director</span>
                                          {pair.thumbnail.visualCtrScore && (
                                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${pair.thumbnail.visualCtrScore >= 78 ? 'bg-emerald-400 text-slate-950' : 'bg-amber-300 text-slate-950'}`}>
                                                  Stop-scroll {pair.thumbnail.visualCtrScore}/100
                                              </span>
                                          )}
                                          {pair.thumbnail.emotionTarget && (
                                              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[9px] font-black uppercase tracking-widest border border-white/10">
                                                  Emosi: {pair.thumbnail.emotionTarget}
                                              </span>
                                          )}
                                      </div>
                                      <div className="grid gap-3 text-xs">
                                          {pair.thumbnail.visualMetaphor && (
                                              <div>
                                                  <span className="block text-slate-400 font-black uppercase tracking-widest text-[9px] mb-1">Visual Metaphor</span>
                                                  <p className="text-slate-100 leading-relaxed">{pair.thumbnail.visualMetaphor}</p>
                                              </div>
                                          )}
                                          <div className="grid md:grid-cols-2 gap-3">
                                              {pair.thumbnail.conflictObject && (
                                                  <div>
                                                      <span className="block text-slate-400 font-black uppercase tracking-widest text-[9px] mb-1">Conflict Object</span>
                                                      <p className="text-slate-100 leading-relaxed">{pair.thumbnail.conflictObject}</p>
                                                  </div>
                                              )}
                                              {pair.thumbnail.curiosityObject && (
                                                  <div>
                                                      <span className="block text-slate-400 font-black uppercase tracking-widest text-[9px] mb-1">Curiosity Object</span>
                                                      <p className="text-slate-100 leading-relaxed">{pair.thumbnail.curiosityObject}</p>
                                                  </div>
                                              )}
                                          </div>
                                          {pair.thumbnail.stopScrollReason && (
                                              <div className="border-t border-white/10 pt-3">
                                                  <span className="block text-slate-400 font-black uppercase tracking-widest text-[9px] mb-1">Stop-scroll Reason</span>
                                                  <p className="text-slate-100 leading-relaxed">{pair.thumbnail.stopScrollReason}</p>
                                              </div>
                                          )}
                                          {pair.thumbnail.thumbnailWeakness && (
                                              <div className="border-t border-white/10 pt-3">
                                                  <span className="block text-amber-300 font-black uppercase tracking-widest text-[9px] mb-1">Risiko Lemah</span>
                                                  <p className="text-amber-50 leading-relaxed">{pair.thumbnail.thumbnailWeakness}</p>
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              )}

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
                                      <p className="text-[9px] text-red-400/80 mb-1">Emphasis harus di awal/akhir frasa, jangan di tengah.</p>
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
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                        {t.thumbnailConcept}
                                    </p>
                                    {(pair.thumbnail.finalEngineeredPrompt) && (
                                        <button
                                            onClick={() => handleResetDetailedPrompt(pair.id)}
                                            className="text-[9px] text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
                                        >
                                            Reset ke Auto
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    className="w-full text-[10px] font-mono text-gray-700 bg-white p-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none"
                                    style={{ height: '160px' }}
                                    value={pair.thumbnail.finalEngineeredPrompt || pair.thumbnail.detailedPrompt || ''}
                                    onChange={(e) => handleDetailedPromptChange(pair.id, e.target.value)}
                                    placeholder={t.engineeredPlaceholder}
                                />
                               
                               <div className="flex flex-wrap gap-1.5 mb-3">
                                   {quickRemixActions.map((action) => (
                                       <button
                                         key={action.label}
                                         onClick={(e) => { e.stopPropagation(); handleQuickRemix(pair.id, action.instruction); }}
                                         className="px-2.5 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-[9px] font-black text-gray-600 uppercase transition-colors"
                                       >
                                           {action.label}
                                       </button>
                                   ))}
                               </div>

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
                                  <div className="text-center p-6 w-full">
                                      <div className="mb-6 w-full aspect-video rounded-xl border border-gray-700 bg-gray-950 relative overflow-hidden">
                                          <div className="absolute inset-y-0 left-0 w-1/2 bg-gray-800/80 border-r border-dashed border-gray-600 flex flex-col items-center justify-center p-4">
                                              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-2">Text Zone</span>
                                              <div className="bg-red-600 text-white px-3 py-1 rounded font-black text-sm max-w-full truncate">{(pair.thumbnail.fullTextOverlay || 'TEKS THUMB').toUpperCase()}</div>
                                          </div>
                                          <div className="absolute inset-y-0 right-0 w-1/2 flex items-center justify-center p-4">
                                              <div className="w-24 h-24 rounded-full border-2 border-gray-500 flex items-center justify-center text-gray-500 text-[10px] font-bold uppercase">Objek</div>
                                          </div>
                                          <div className="absolute bottom-2 right-2 border border-dashed border-red-400 text-red-300 text-[9px] px-1.5 py-0.5 rounded bg-red-950/30">SAFE AREA</div>
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
                                  YouTube Search Preview
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
      <div className="fixed bottom-0 right-0 left-0 md:left-72 bg-white/90 backdrop-blur-md border-t border-gray-200 p-6 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-50 flex justify-end items-center gap-4">
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