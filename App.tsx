import React, { useState } from 'react';
import { ScriptState, SuggestedTopic } from './types';
import { analyzeAndSuggestTopics, generateFullScript, analyzeMultipleScripts } from './services/geminiService';
import { Button } from './components/Button';
import { StepIndicator } from './components/StepIndicator';
import { ApiKeyManager } from './components/ApiKeyManager';
import { FileUpload } from './components/FileUpload';
import { Copy, RefreshCw, PenTool, Sparkles, Youtube, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<ScriptState>({
    originalInput: '',
    topics: [],
    selectedTopic: null,
    generatedScript: '',
    isLoading: false,
    error: null,
    step: 'INPUT',
  });

  const [uploadedScripts, setUploadedScripts] = useState<string[]>([]);

  const handleAnalyze = async () => {
    if (!state.originalInput.trim()) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const topics = await analyzeAndSuggestTopics(state.originalInput);
      setState(prev => ({
        ...prev,
        topics,
        isLoading: false,
        step: 'TOPIC_SELECTION',
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "대본 분석에 실패했습니다. 다시 시도해주세요.",
      }));
    }
  };

  const handleAnalyzeMultiple = async (scripts: string[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const topics = await analyzeMultipleScripts(scripts);
      setUploadedScripts(scripts);
      setState(prev => ({
        ...prev,
        topics,
        isLoading: false,
        step: 'TOPIC_SELECTION',
        originalInput: `[${scripts.length}개 파일 분석]`, // 참고용
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "다중 대본 분석에 실패했습니다. 다시 시도해주세요.",
      }));
    }
  };

  const handleGenerate = async (topic: SuggestedTopic) => {
    setState(prev => ({ ...prev, selectedTopic: topic, isLoading: true, error: null }));
    try {
      // 여러 파일을 분석한 경우, 첫 번째 파일을 참고 대본으로 사용
      const referenceScript = uploadedScripts.length > 0 
        ? uploadedScripts[0] 
        : state.originalInput;
      
      const script = await generateFullScript(topic, referenceScript);
      setState(prev => ({
        ...prev,
        generatedScript: script,
        isLoading: false,
        step: 'SCRIPT_VIEW',
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "대본 생성에 실패했습니다. 다시 시도해주세요.",
      }));
    }
  };

  const reset = () => {
    setState({
      originalInput: '',
      topics: [],
      selectedTopic: null,
      generatedScript: '',
      isLoading: false,
      error: null,
      step: 'INPUT',
    });
    setUploadedScripts([]);
  };

  const goBackToTopics = () => {
    setState(prev => ({
        ...prev,
        step: 'TOPIC_SELECTION',
        generatedScript: '',
        selectedTopic: null
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(state.generatedScript);
    alert("대본이 클립보드에 복사되었습니다!");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 md:p-12 font-sans">
      {/* API Key Manager */}
      <ApiKeyManager />
      
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center gap-3 mb-12">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Youtube size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
              TubeScript AI
            </h1>
            <p className="text-gray-400 text-sm mt-1">AI 기반 바이럴 대본 생성기</p>
          </div>
        </header>

        <StepIndicator currentStep={state.step} />

        {state.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
            {state.error}
          </div>
        )}

        {/* View 1: Input */}
        {state.step === 'INPUT' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
              <label className="block text-lg font-bold text-gray-200 mb-4">
                어떤 영상 대본인가요? (또는 아이디어)
              </label>
              <textarea
                className="w-full h-64 bg-gray-950 border border-gray-700 rounded-xl p-4 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all text-lg leading-relaxed"
                placeholder="예: 2024년 개발자 로드맵에 대해 이야기하고 싶어. 초보자를 위해 쉽고 재미있게 설명하는 스타일로 작성된 대본이야..."
                value={state.originalInput}
                onChange={(e) => setState(prev => ({ ...prev, originalInput: e.target.value }))}
              />
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleAnalyze} 
                  isLoading={state.isLoading}
                  disabled={!state.originalInput.trim()}
                  className="w-full md:w-auto"
                >
                  <Sparkles size={20} />
                  분석 및 주제 제안받기
                </Button>
              </div>
            </div>
            
            {/* 다중 파일 업로드 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-gray-950 text-gray-500">또는</span>
              </div>
            </div>
            
            <FileUpload onAnalyze={handleAnalyzeMultiple} isLoading={state.isLoading} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 text-gray-400">
              <div className="flex flex-col items-center text-center p-4">
                <PenTool className="mb-2 text-indigo-400" />
                <h3 className="text-base font-bold text-gray-200">구조 분석</h3>
                <p className="text-sm mt-1 text-gray-400">입력한 대본의 톤과 구조를 완벽하게 파악합니다.</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <RefreshCw className="mb-2 text-indigo-400" />
                <h3 className="text-base font-bold text-gray-200">새로운 주제 추천</h3>
                <p className="text-sm mt-1 text-gray-400">분석된 스타일을 적용할 수 있는 참신한 주제를 제안합니다.</p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <Sparkles className="mb-2 text-indigo-400" />
                <h3 className="text-base font-bold text-gray-200">맞춤형 대본 생성</h3>
                <p className="text-sm mt-1 text-gray-400">원래 대본의 형식을 그대로 유지한 새 대본을 완성합니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* View 2: Selection */}
        {state.step === 'TOPIC_SELECTION' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">다음 주제를 선택하세요</h2>
              <Button variant="ghost" onClick={reset} className="text-sm">
                처음으로
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {state.topics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => handleGenerate(topic)}
                  disabled={state.isLoading}
                  className="group relative flex flex-col items-start text-left p-6 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-indigo-900/20"
                >
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                     <span className="text-indigo-400 text-sm font-semibold flex items-center gap-1">
                       대본 생성하기 <ArrowLeft className="rotate-180" size={16}/>
                     </span>
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 mb-2 pr-0 md:pr-8">
                    {topic.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {topic.rationale}
                  </p>
                </button>
              ))}
            </div>
            
            {state.isLoading && (
               <div className="flex justify-center py-12">
                   <div className="flex flex-col items-center gap-4">
                       <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                       <p className="text-indigo-300 animate-pulse font-medium">분석된 구조로 대본을 작성 중입니다...</p>
                   </div>
               </div>
            )}
          </div>
        )}

        {/* View 3: Result */}
        {state.step === 'SCRIPT_VIEW' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg text-indigo-400 font-semibold mb-1">완성된 대본</h2>
                <h3 className="text-2xl font-bold text-white">{state.selectedTopic?.title}</h3>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="secondary" onClick={goBackToTopics} className="flex-1 md:flex-none">
                  뒤로가기
                </Button>
                <Button variant="primary" onClick={copyToClipboard} className="flex-1 md:flex-none">
                  <Copy size={18} />
                  복사하기
                </Button>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 shadow-2xl overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              <article className="prose prose-invert prose-lg max-w-none text-gray-300 custom-scrollbar max-h-[70vh] overflow-y-auto pr-4">
                <div className="whitespace-pre-wrap font-sans leading-relaxed">
                  {state.generatedScript}
                </div>
              </article>
            </div>
            
            <div className="flex justify-center pt-8">
                <Button variant="ghost" onClick={reset}>
                    새로운 대본 만들기
                </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;