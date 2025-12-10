export interface SuggestedTopic {
  title: string;
  rationale: string;
}

export interface AnalysisResult {
  structureSummary: string;
  topics: SuggestedTopic[];
}

export type ScriptStructure = 
  | 'original'
  | 'in-medias-res'
  | 'fiction-curved'
  | 'save-the-cat'
  | 'story-circle';

export interface ScriptStructureOption {
  id: ScriptStructure;
  name: string;
  description: string;
  details: string;
}

export type VisualStyle = 
  | 'cinematic'
  | 'k-drama'
  | 'webtoon'
  | 'pixar'
  | 'folk-painting'
  | 'fairy-tale'
  | 'diorama'
  | 'wool-felt';

export interface VisualStyleOption {
  id: VisualStyle;
  name: string;
  nameKo: string;
  description: string;
}

export interface StoryboardScene {
  sceneNumber: number;
  description: string;
  visualPrompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface StoryboardSettings {
  visualStyle: VisualStyle;
  engine: 'nano' | 'banana' | 'pro';
  aspectRatio: '16:9' | '9:16';
  sceneCount: number;
}

export interface ScriptState {
  originalInput: string;
  topics: SuggestedTopic[];
  selectedTopic: SuggestedTopic | null;
  selectedStructure: ScriptStructure | null;
  generatedScript: string;
  isLoading: boolean;
  error: string | null;
  step: 'INPUT' | 'TOPIC_SELECTION' | 'STRUCTURE_SELECTION' | 'SCRIPT_VIEW' | 'STORYBOARD_SETTINGS' | 'STORYBOARD_VIEW';
  structureSummary: string;
  storyboardSettings?: StoryboardSettings;
  storyboardScenes?: StoryboardScene[];
}
