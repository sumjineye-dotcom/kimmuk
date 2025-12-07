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

export interface ScriptState {
  originalInput: string;
  topics: SuggestedTopic[];
  selectedTopic: SuggestedTopic | null;
  selectedStructure: ScriptStructure | null;
  generatedScript: string;
  isLoading: boolean;
  error: string | null;
  step: 'INPUT' | 'TOPIC_SELECTION' | 'STRUCTURE_SELECTION' | 'SCRIPT_VIEW';
  structureSummary: string;
}
