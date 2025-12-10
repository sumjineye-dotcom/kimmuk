import React from 'react';
import { StoryboardScene } from '../types';
import { Loader2, Image as ImageIcon } from 'lucide-react';

interface StoryboardViewerProps {
  scenes: StoryboardScene[];
  aspectRatio: '16:9' | '9:16';
}

export const StoryboardViewer: React.FC<StoryboardViewerProps> = ({ scenes, aspectRatio }) => {
  const aspectRatioClass = aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">생성된 스토리보드</h2>
        <p className="text-gray-400">{scenes.length}개의 씬이 생성되었습니다</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenes.map((scene) => (
          <div key={scene.sceneNumber} className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
            {/* 이미지 영역 */}
            <div className={`${aspectRatioClass} bg-gray-900 flex items-center justify-center relative`}>
              {scene.isGenerating ? (
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm">생성 중...</span>
                </div>
              ) : scene.imageUrl ? (
                <img
                  src={scene.imageUrl}
                  alt={`Scene ${scene.sceneNumber}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-600">
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">대기 중</span>
                </div>
              )}
              
              {/* 씬 번호 배지 */}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                #{scene.sceneNumber}
              </div>
            </div>

            {/* 설명 영역 */}
            <div className="p-4 space-y-2">
              <p className="text-gray-300 text-sm leading-relaxed">{scene.description}</p>
              {scene.visualPrompt && (
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-400">프롬프트 보기</summary>
                  <p className="mt-2 text-gray-600">{scene.visualPrompt}</p>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
