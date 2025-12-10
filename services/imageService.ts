/**
 * 이미지 생성 서비스
 * Google Imagen 3 API를 사용하여 이미지 생성
 */

import { GoogleGenAI } from "@google/genai";

const getApiKey = (): string => {
  const storedKey = typeof window !== 'undefined' 
    ? localStorage.getItem('gemini_api_key') 
    : null;
  
  return storedKey || import.meta.env.VITE_GEMINI_API_KEY || '';
};

/**
 * Google Imagen 3 API를 사용하여 이미지 생성
 */
export const generateImage = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.warn('Gemini API 키가 없습니다. 플레이스홀더 이미지를 사용합니다.');
    const [width, height] = aspectRatio === '16:9' ? [1024, 576] : [576, 1024];
    return `https://placehold.co/${width}x${height}/1a1a1a/white?text=${encodeURIComponent('API Key Required')}`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Imagen 3 모델 사용
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16',
      },
    });

    if (response.images && response.images.length > 0) {
      // 첫 번째 이미지의 base64 데이터 반환
      const imageData = response.images[0];
      return `data:image/png;base64,${imageData}`;
    }
    
    throw new Error('이미지 생성 결과를 받지 못했습니다.');
  } catch (error: any) {
    console.error('Error generating image:', error);
    
    if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
      console.error('API 사용 할당량을 초과했습니다.');
    }
    
    // 에러 시 플레이스홀더 반환
    const [width, height] = aspectRatio === '16:9' ? [1024, 576] : [576, 1024];
    return `https://placehold.co/${width}x${height}/1a1a1a/white?text=${encodeURIComponent('Generation Failed')}`;
  }
};

/**
 * 여러 이미지를 순차적으로 생성 (레이트 리밋 회피)
 */
export const generateImages = async (
  prompts: string[],
  aspectRatio: '16:9' | '9:16' = '16:9',
  onProgress?: (current: number, total: number) => void
): Promise<string[]> => {
  const images: string[] = [];
  
  for (let i = 0; i < prompts.length; i++) {
    if (onProgress) {
      onProgress(i + 1, prompts.length);
    }
    
    const imageUrl = await generateImage(prompts[i], aspectRatio);
    images.push(imageUrl);
    
    // API 레이트 리밋을 위해 잠시 대기 (무료 API는 느림)
    if (i < prompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return images;
};
