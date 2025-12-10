import React from 'react';
import { VisualStyle, VisualStyleOption, StoryboardSettings as StoryboardSettingsType } from '../types';
import { Button } from './Button';
import { Clapperboard } from 'lucide-react';

interface StoryboardSettingsProps {
  settings: StoryboardSettingsType;
  onSettingsChange: (settings: StoryboardSettingsType) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const visualStyleOptions: VisualStyleOption[] = [
  { id: 'cinematic', name: 'Cinematic', nameKo: '시네마틱 실사', description: 'Cinematic' },
  { id: 'k-drama', name: 'K-Drama', nameKo: 'K-드라마 실사', description: 'Drama' },
  { id: 'webtoon', name: 'Webtoon', nameKo: '웹툰', description: 'Webtoon' },
  { id: 'pixar', name: '3D Animation', nameKo: '3D 애니메이션', description: 'Pixar style' },
  { id: 'folk-painting', name: 'Folk Painting', nameKo: '한국 민화', description: 'Folk Painting' },
  { id: 'fairy-tale', name: 'Fairy Tale', nameKo: '동화 일러스트', description: 'Fairy Tale' },
  { id: 'diorama', name: 'Diorama', nameKo: '디오라마', description: 'Diorama' },
  { id: 'wool-felt', name: 'Wool Felt', nameKo: '동화 양모인형', description: 'Wool Felt' },
];

export const StoryboardSettings: React.FC<StoryboardSettingsProps> = ({
  settings,
  onSettingsChange,
  onGenerate,
  isLoading,
}) => {
  const handleStyleChange = (style: VisualStyle) => {
    onSettingsChange({ ...settings, visualStyle: style });
  };

  const handleEngineChange = (engine: 'nano' | 'banana' | 'pro') => {
    onSettingsChange({ ...settings, engine });
  };

  const handleAspectRatioChange = (aspectRatio: '16:9' | '9:16') => {
    onSettingsChange({ ...settings, aspectRatio });
  };

  const handleSceneCountChange = (count: number) => {
    onSettingsChange({ ...settings, sceneCount: count });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">스토리보드 설정</h2>
        <p className="text-gray-400">대본을 시각화할 스타일과 옵션을 선택하세요</p>
      </div>

      {/* 비주얼 스타일 선택 */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">비주얼 스타일</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {visualStyleOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleStyleChange(option.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                settings.visualStyle === option.id
                  ? 'border-purple-500 bg-purple-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
              }`}
            >
              <div className="font-semibold">{option.nameKo}</div>
              <div className="text-xs text-gray-400 mt-1">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 엔진 선택 */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">엔진</h3>
        <div className="flex gap-3">
          {(['nano', 'banana', 'pro'] as const).map((engine) => (
            <button
              key={engine}
              onClick={() => handleEngineChange(engine)}
              className={`px-6 py-2 rounded-lg border-2 transition-all capitalize ${
                settings.engine === engine
                  ? 'border-purple-500 bg-purple-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
              }`}
            >
              {engine.charAt(0).toUpperCase() + engine.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* 비율 선택 */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">비율</h3>
        <div className="flex gap-3">
          {(['16:9', '9:16'] as const).map((ratio) => (
            <button
              key={ratio}
              onClick={() => handleAspectRatioChange(ratio)}
              className={`px-6 py-2 rounded-lg border-2 transition-all ${
                settings.aspectRatio === ratio
                  ? 'border-purple-500 bg-purple-500/10 text-white'
                  : 'border-gray-700 bg-gray-800/50 text-gray-300 hover:border-gray-600'
              }`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>

      {/* 씬 개수 선택 */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">씬 개수 ({settings.sceneCount})</h3>
        <input
          type="range"
          min="5"
          max="100"
          value={settings.sceneCount}
          onChange={(e) => handleSceneCountChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />
        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>5</span>
          <span>100</span>
        </div>
      </div>

      {/* 생성 버튼 */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onGenerate}
          disabled={isLoading}
          icon={Clapperboard}
        >
          {isLoading ? '스토리보드 생성 중...' : '스토리보드 생성하기'}
        </Button>
      </div>
    </div>
  );
};
