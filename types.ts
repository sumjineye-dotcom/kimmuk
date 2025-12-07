export interface SuggestedTopic {
  title: string;
  rationale: string;
}

export interface AnalysisResult {
  structureSummary: string;
  topics: SuggestedTopic[];
}

export interface ScriptState {
  originalInput: string;
  topics: SuggestedTopic[];
  selectedTopic: SuggestedTopic | null;
  generatedScript: string;
  isLoading: boolean;
  error: string | null;
  step: 'INPUT' | 'TOPIC_SELECTION' | 'SCRIPT_VIEW';
  structureSummary: string;
}
