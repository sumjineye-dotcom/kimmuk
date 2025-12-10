/**
 * 이미지 생성 서비스
 * Hugging Face Inference API를 사용하여 무료로 이미지 생성
 */

const getHuggingFaceApiKey = (): string => {
  const storedKey = typeof window !== 'undefined' 
    ? localStorage.getItem('huggingface_api_key') 
    : null;
  
  return storedKey || import.meta.env.VITE_HUGGINGFACE_API_KEY || '';
};

/**
 * Hugging Face API를 사용하여 이미지 생성
 */
export const generateImage = async (
  prompt: string,
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string> => {
  const apiKey = getHuggingFaceApiKey();
  
  if (!apiKey) {
    // API 키가 없으면 플레이스홀더 이미지 반환
    console.warn('Hugging Face API 키가 없습니다. 플레이스홀더 이미지를 사용합니다.');
    const [width, height] = aspectRatio === '16:9' ? [1024, 576] : [576, 1024];
    return `https://placehold.co/${width}x${height}/1a1a1a/white?text=${encodeURIComponent('Scene Image')}`;
  }

  try {
    // Stable Diffusion 모델 사용
    const response = await fetch(
      'https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            num_inference_steps: 30,
            guidance_scale: 7.5,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Hugging Face API error:', error);
      
      // 에러 시 플레이스홀더 반환
      const [width, height] = aspectRatio === '16:9' ? [1024, 576] : [576, 1024];
      return `https://placehold.co/${width}x${height}/1a1a1a/white?text=${encodeURIComponent('Error')}`;
    }

    // Blob으로 이미지 받기
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    
    return imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    
    // 에러 시 플레이스홀더 반환
    const [width, height] = aspectRatio === '16:9' ? [1024, 576] : [576, 1024];
    return `https://placehold.co/${width}x${height}/1a1a1a/white?text=${encodeURIComponent('Error')}`;
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
