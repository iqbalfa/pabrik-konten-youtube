
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
  thumbnail: {
     prompt: string; // Short scene description
     detailedPrompt?: string; // Full engineered prompt sent to AI
     suggestedText: string;
     emphasisText: string;
     normalText: string;
     fullTextOverlay?: string; 
     actionDescription?: string; 
     triggerType?: string; 
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
  finalDescription?: string;
  finalTags?: string;
  isLoading: boolean;
  error: string | null;
  apiKey: string;
  mandatoryKeywords?: string;
  thumbnailObject?: string;
  useHook: boolean;
  useOutro: boolean;
}
