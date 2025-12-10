import React, { useState } from 'react';
import { ScriptState, SuggestedTopic, ScriptStructure, ScriptStructureOption, StoryboardSettings, StoryboardScene } from './types';
import { analyzeAndSuggestTopics, generateFullScript, analyzeMultipleScripts, regenerateTopicsWithKeywords, analyzeScriptForStoryboard } from './services/geminiService';
import { generateImage } from './services/imageService';
import { Button } from './components/Button';
import { StepIndicator } from './components/StepIndicator';
import { ApiKeyManager } from './components/ApiKeyManager';
import { FileUpload } from './components/FileUpload';
import { StoryboardSettings as StoryboardSettingsComponent } from './components/StoryboardSettings';
import { StoryboardViewer } from './components/StoryboardViewer';
import { Copy, RefreshCw, PenTool, Sparkles, Youtube, ArrowLeft, Clapperboard } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<ScriptState>({
    originalInput: '',
    topics: [],
    selectedTopic: null,
    selectedStructure: null,
    generatedScript: '',
    isLoading: false,
    error: null,
    step: 'INPUT',
    structureSummary: '',
  });

  const [uploadedScripts, setUploadedScripts] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [requiredKeywords, setRequiredKeywords] = useState<string>('');
  const [regenerateKeywords, setRegenerateKeywords] = useState<string>('');

  const scriptStructureOptions: ScriptStructureOption[] = [
    {
      id: 'original',
      name: '원본 대본의 구조 그대로 사용',
      description: '분석된 원본 구조 유지',
      details: '원본 대본의 이야기 전개 방식, 스토리텔링 기법, 감정 흐름을 그대로 유지하면서 주제만 변경',
    },
    {
      id: 'in-medias-res',
      name: '인 미디어스 레스',
      description: '인트로 후킹형',
      details: '가장 흥미로운 장면부터 시작 → 과거 설명 → 여정 → 결과',
    },
    {
      id: 'fiction-curved',
      name: '픽션 커브드',
      description: '고구마 후 사이다형',
      details: '문제 제기 → 문제 심화 → 전환점 → 해결책 → 성공 사례',
    },
    {
      id: 'save-the-cat',
      name: '세이브 더 캣',
      description: '인생역전 드라마형',
      details: '평범한 시작 → 촉매제 → 고민 → 시련 → 위기 → 극복 → 변화',
    },
    {
      id: 'story-circle',
      name: '댄 하몬의 스토리 서클',
      description: '영웅 여정 8단계',
      details: '편안함 → 필요 → 난관 진입 → 탐색 → 획든 → 대가 → 귀환 → 변화',
    },
  ];

  const handleAnalyze = async () => {
    if (!state.originalInput.trim()) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await analyzeAndSuggestTopics(state.originalInput, requiredKeywords);
      setState(prev => ({
        ...prev,
        topics: result.topics,
        structureSummary: result.structureSummary,
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

  const handleAnalyzeMultiple = async (scripts: string[], files: File[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await analyzeMultipleScripts(scripts, requiredKeywords);
      setUploadedScripts(scripts);
      setUploadedFiles(files);
      setState(prev => ({
        ...prev,
        topics: result.topics,
        structureSummary: result.structureSummary,
        isLoading: false,
        step: 'TOPIC_SELECTION',
        originalInput: `[${scripts.length}개 파일 분석]`,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "다중 대본 분석에 실패했습니다. 다시 시도해주세요.",
      }));
    }
  };

  const handleSelectTopic = (topic: SuggestedTopic) => {
    setState(prev => ({ 
      ...prev, 
      selectedTopic: topic, 
      step: 'STRUCTURE_SELECTION' 
    }));
  };

  const handleSelectStructure = async (structure: ScriptStructure) => {
    if (!state.selectedTopic) return;
    
    setState(prev => ({ ...prev, selectedStructure: structure, isLoading: true, error: null }));
    try {
      // 여러 파일을 분석한 경우, 첫 번째 파일을 참고 대본으로 사용
      const referenceScript = uploadedScripts.length > 0 
        ? uploadedScripts[0] 
        : state.originalInput;
      
      const script = await generateFullScript(state.selectedTopic, referenceScript, structure);
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

  const handleRegenerate = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // 기존 구조 분석은 유지하고, 새로운 키워드로 주제만 재생성
      const originalScript = uploadedScripts.length > 0 
        ? uploadedScripts[0] 
        : state.originalInput;
      
      const newTopics = await regenerateTopicsWithKeywords(
        state.structureSummary,
        originalScript,
        regenerateKeywords
      );
      
      setState(prev => ({
        ...prev,
        topics: newTopics,
        // structureSummary는 그대로 유지
        isLoading: false,
      }));
      setRegenerateKeywords('');
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: "주제 재생성에 실패했습니다. 다시 시도해주세요.",
      }));
    }
  };

  const reset = () => {
    setState({
      originalInput: '',
      topics: [],
      selectedTopic: null,
      selectedStructure: null,
      generatedScript: '',
      isLoading: false,
      error: null,
      step: 'INPUT',
      structureSummary: '',
    });
    setUploadedScripts([]);
    setUploadedFiles([]);
    setRequiredKeywords('');
    setRegenerateKeywords('');
  };

  const goBackToInput = () => {
    setState(prev => ({
      ...prev,
      step: 'INPUT',
      topics: [],
      structureSummary: '',
      error: null,
    }));
    setRegenerateKeywords('');
  };

  const goBackToTopics = () => {
    setState(prev => ({
        ...prev,
        step: 'TOPIC_SELECTION',
        generatedScript: '',
        selectedTopic: null,
        selectedStructure: null,
    }));
  };

  const goBackToStructureSelection = () => {
    setState(prev => ({
      ...prev,
      step: 'STRUCTURE_SELECTION',
      selectedStructure: null,
      generatedScript: '',
      error: null,
    }));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(state.generatedScript);
    alert("대본이 클립보드에 복사되었습니다!");
  };

  // 스토리보드 관련 핸들러
  const handleCreateStoryboard = () => {
    setState(prev => ({
      ...prev,
      step: 'STORYBOARD_SETTINGS',
      storyboardSettings: {
        visualStyle: 'cinematic',
        engine: 'nano',
        aspectRatio: '16:9',
        sceneCount: 30,
      },
    }));
  };

  const handleStoryboardSettingsChange = (settings: StoryboardSettings) => {
    setState(prev => ({
      ...prev,
      storyboardSettings: settings,
    }));
  };

  const handleGenerateStoryboard = async () => {
    if (!state.generatedScript || !state.storyboardSettings) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1단계: 대본을 씬으로 분석
      const scenes = await analyzeScriptForStoryboard(
        state.generatedScript,
        state.storyboardSettings.sceneCount,
        state.storyboardSettings.visualStyle
      );

      setState(prev => ({
        ...prev,
        storyboardScenes: scenes,
        step: 'STORYBOARD_VIEW',
        isLoading: false,
      }));

      // 2단계: 이미지를 하나씩 생성 (백그라운드)
      generateStoryboardImages(scenes, state.storyboardSettings.aspectRatio);
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || "스토리보드 생성에 실패했습니다.",
      }));
    }
  };

  const generateStoryboardImages = async (scenes: StoryboardScene[], aspectRatio: '16:9' | '9:16') => {
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      // 해당 씬을 생성 중으로 표시
      setState(prev => ({
        ...prev,
        storyboardScenes: prev.storyboardScenes?.map(s =>
          s.sceneNumber === scene.sceneNumber
            ? { ...s, isGenerating: true }
            : s
        ),
      }));

      try {
        // 이미지 생성
        const imageUrl = await generateImage(scene.visualPrompt, aspectRatio);
        
        // 생성된 이미지로 업데이트
        setState(prev => ({
          ...prev,
          storyboardScenes: prev.storyboardScenes?.map(s =>
            s.sceneNumber === scene.sceneNumber
              ? { ...s, imageUrl, isGenerating: false }
              : s
          ),
        }));
      } catch (error) {
        console.error(`Error generating image for scene ${scene.sceneNumber}:`, error);
        
        // 에러 표시
        setState(prev => ({
          ...prev,
          storyboardScenes: prev.storyboardScenes?.map(s =>
            s.sceneNumber === scene.sceneNumber
              ? { ...s, isGenerating: false }
              : s
          ),
        }));
      }
    }
  };

  const goBackToScript = () => {
    setState(prev => ({
      ...prev,
      step: 'SCRIPT_VIEW',
      storyboardSettings: undefined,
      storyboardScenes: undefined,
    }));
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
              
              {/* 필수 키워드 입력 */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  주제에 꼭 포함할 키워드 (선택사항)
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-950 border border-gray-700 rounded-xl p-3 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="예: AI, 개발자, 2024 (쉼표로 구분)"
                  value={requiredKeywords}
                  onChange={(e) => setRequiredKeywords(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  입력한 키워드가 제안되는 주제 제목에 포함됩니다
                </p>
              </div>
              
              <div className="mt-6 flex justify-end">
                <Button 
                  onClick={handleAnalyze} 
                  isLoading={state.isLoading}
                  disabled={state.isLoading || !state.originalInput.trim()}
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
            
            <FileUpload 
              onAnalyze={handleAnalyzeMultiple} 
              isLoading={state.isLoading}
              initialFiles={uploadedFiles}
              initialContents={uploadedScripts}
            />
            
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
              <Button variant="ghost" onClick={goBackToInput} className="text-sm">
                <ArrowLeft size={16} />
                뒤로 가기
              </Button>
            </div>
            
            {/* 구조 요약 */}
            {state.structureSummary && (
              <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/10 border border-indigo-500/30 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <PenTool className="text-indigo-400 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="text-lg font-bold text-indigo-300 mb-2">대본 분석 (구조 및 스토리텔링 기법)</h3>
                    <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                      {state.structureSummary}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-4">
              {state.topics.map((topic, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectTopic(topic)}
                  disabled={state.isLoading}
                  className="group relative flex flex-col items-start text-left p-6 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-indigo-900/20"
                >
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                     <span className="text-indigo-400 text-sm font-semibold flex items-center gap-1">
                       구조 선택하기 <ArrowLeft className="rotate-180" size={16}/>
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
            
            {/* 주제 재생성 섹션 */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mt-8">
              <div className="flex items-start gap-3 mb-4">
                <RefreshCw className="text-indigo-400 mt-1 flex-shrink-0" size={20} />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-200 mb-2">마음에 드는 주제가 없나요?</h3>
                  <p className="text-sm text-gray-400 mb-4">새로운 키워드를 입력하고 다른 주제 5개를 다시 제안받아보세요.</p>
                  
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      className="flex-1 bg-gray-950 border border-gray-700 rounded-lg p-3 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="새로운 키워드 입력 (예: 트렌드, 최신기술, 실전팁)"
                      value={regenerateKeywords}
                      onChange={(e) => setRegenerateKeywords(e.target.value)}
                    />
                    <Button 
                      onClick={handleRegenerate}
                      isLoading={state.isLoading}
                      disabled={state.isLoading || !regenerateKeywords.trim()}
                      className="whitespace-nowrap"
                    >
                      <RefreshCw size={18} />
                      새로운 주제 5개 다시 제안받기
                    </Button>
                  </div>
                </div>
              </div>
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

        {/* View 3: Structure Selection */}
        {state.step === 'STRUCTURE_SELECTION' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">대본 구조를 선택하세요</h2>
                <p className="text-gray-400">선택한 주제: <span className="text-indigo-400 font-semibold">{state.selectedTopic?.title}</span></p>
              </div>
              <Button variant="ghost" onClick={goBackToTopics} className="text-sm">
                <ArrowLeft size={16} />
                주제 다시 선택
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scriptStructureOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectStructure(option.id)}
                  disabled={state.isLoading}
                  className="group relative flex flex-col items-start text-left p-6 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500 rounded-xl transition-all duration-300 shadow-lg hover:shadow-indigo-900/20"
                >
                  <div className="mb-3">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 mb-1">
                      {option.name}
                    </h3>
                    <p className="text-indigo-400 text-sm font-semibold">
                      {option.description}
                    </p>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {option.details}
                  </p>
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-indigo-400 text-sm font-semibold flex items-center gap-1">
                      선택 <ArrowLeft className="rotate-180" size={16}/>
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {state.isLoading && (
               <div className="flex justify-center py-12">
                   <div className="flex flex-col items-center gap-4">
                       <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                       <p className="text-indigo-300 animate-pulse font-medium">선택한 구조로 대본을 작성 중입니다...</p>
                   </div>
               </div>
            )}
          </div>
        )}

        {/* View 4: Result */}
        {state.step === 'SCRIPT_VIEW' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg text-indigo-400 font-semibold mb-1">완성된 대본</h2>
                <h3 className="text-2xl font-bold text-white">{state.selectedTopic?.title}</h3>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Button variant="secondary" onClick={goBackToStructureSelection} className="flex-1 md:flex-none">
                  구조 다시 선택
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
            
            <div className="flex justify-center gap-4 pt-8">
                <Button variant="primary" onClick={handleCreateStoryboard} icon={Clapperboard}>
                    스토리보드 만들기
                </Button>
                <Button variant="ghost" onClick={reset}>
                    새로운 대본 만들기
                </Button>
            </div>
          </div>
        )}

        {/* View 5: Storyboard Settings */}
        {state.step === 'STORYBOARD_SETTINGS' && state.storyboardSettings && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-6">
              <Button variant="ghost" onClick={goBackToScript} className="text-sm">
                <ArrowLeft size={18} />
                대본으로 돌아가기
              </Button>
            </div>

            <StoryboardSettingsComponent
              settings={state.storyboardSettings}
              onSettingsChange={handleStoryboardSettingsChange}
              onGenerate={handleGenerateStoryboard}
              isLoading={state.isLoading}
            />
          </div>
        )}

        {/* View 6: Storyboard View */}
        {state.step === 'STORYBOARD_VIEW' && state.storyboardScenes && state.storyboardSettings && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={goBackToScript} className="text-sm">
                  <ArrowLeft size={18} />
                  대본으로 돌아가기
                </Button>
              </div>
            </div>

            <StoryboardViewer 
              scenes={state.storyboardScenes} 
              aspectRatio={state.storyboardSettings.aspectRatio}
            />

            <div className="flex justify-center gap-4 pt-8">
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