
export enum AppStep {
  INPUT_REFERENCE = 0,
  SELECT_IDEA = 1,
  SCRIPT_GENERATION = 2,
  TITLE_AND_THUMBNAIL = 3,
  DESCRIPTION_TAGS = 4
}

export interface TitleThumbnailPair {
  id: string;
  title: string;
  ctrAnalysis?: string;
  titleWarnings?: string[];
  clickbaitRisk?: 'LOW' | 'MEDIUM' | 'HIGH' | string;
  thumbnail: {
     prompt: string; // Short scene description / technical image prompt
     visualConcept?: string; // Human-readable thumbnail concept
     detailedPrompt?: string; // Full engineered prompt sent to AI
     suggestedText: string;
     emphasisText: string;
     normalText: string;
     fullTextOverlay?: string; 
     actionDescription?: string; 
     triggerType?: string; 
     visualMetaphor?: string;
     conflictObject?: string;
     curiosityObject?: string;
     emotionTarget?: string;
     stopScrollReason?: string;
     thumbnailWeakness?: string;
     visualCtrScore?: number;
     imageUrl?: string;
     status: 'idle' | 'generating' | 'success' | 'error';
     feasibilityScore?: number;
     finalEngineeredPrompt?: string; 
  };
}

export interface VideoIdea {
  id: number;
  modificationLevel: string;
  title: string;
  hook: string;
  points: string[];
  closing: string;
  angle?: string;
  uniqueValue?: string;
  literalTopic?: string;
  hiddenAnxiety?: string;
  creativeTechnique?: string;
  transformedConcept?: string;
  whyNotParaphrase?: string;
}

export interface ScriptSection {
  title: string;
  content: string;
}

export interface AppState {
  step: AppStep;
  language: 'id' | 'en';
  imageModel: string;
  selectedChannel: string;
  channelName: string;
  writingStyle: string;
  visualStyle: string;
  referenceText: string;
  fileContents: string[];
  keywords?: string;
  targetWordCount: number;
  selectedIdea: VideoIdea | null;
  analysis: string;
  finalTitle: string;
  script: ScriptSection[];
  selectedTitleThumbnailPair?: TitleThumbnailPair | null;
  finalDescription?: string;
  finalTags?: string;
  finalHashtags?: string;
  finalPinnedComment?: string;
  finalChapters?: string;
  isLoading: boolean;
  error: string | null;
  apiKey: string;
  mandatoryKeywords?: string;
  thumbnailObject?: string;
  useKnowledgeBase: boolean;
  useHook: boolean;
  useOutro: boolean;
  ideationMode: 'creative' | 'style_only';
}
