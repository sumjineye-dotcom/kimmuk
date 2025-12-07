import { GoogleGenAI, Type } from "@google/genai";
import { SuggestedTopic } from "../types";

// API 키 가져오기: localStorage 우선, 없으면 환경 변수 사용
const getApiKey = (): string => {
  const storedKey = typeof window !== 'undefined' 
    ? localStorage.getItem('gemini_api_key') 
    : null;
  
  return storedKey || import.meta.env.VITE_GEMINI_API_KEY || '';
};

const createAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API 키가 설정되지 않았습니다. 우측 상단에서 API 키를 입력해주세요.');
  }
  return new GoogleGenAI({ apiKey });
};

const MODEL_NAME = "gemini-2.5-flash";

export const analyzeAndSuggestTopics = async (inputScript: string): Promise<SuggestedTopic[]> => {
  try {
    const ai = createAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `다음 텍스트(유튜브 대본 또는 아이디어)를 분석하세요. 
      텍스트의 구조(후킹, 전개 방식, 결론 등), 문체(Tone), 타겟 시청자를 파악하세요.
      
      분석 내용을 바탕으로, 해당 분야(Niche)에서 조회수가 잘 나올법한 매력적인 **새로운 동영상 주제 3가지**를 제안하세요.
      단, 단순히 주제만 던지는 것이 아니라 사용자가 흥미를 느낄만한 '클릭을 부르는 제목' 형태로 제안해주세요.

      입력된 대본/아이디어:
      "${inputScript}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "제안하는 유튜브 영상 제목" },
              rationale: { type: Type.STRING, description: "이 주제가 왜 좋은지, 기존 대본과 어떤 연결고리가 있는지 설명" },
            },
            required: ["title", "rationale"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as SuggestedTopic[];
    }
    throw new Error("No data returned from AI");
  } catch (error) {
    console.error("Error analyzing script:", error);
    throw new Error("대본 분석 및 주제 제안에 실패했습니다.");
  }
};

export const generateFullScript = async (topic: SuggestedTopic, referenceScript: string): Promise<string> => {
  try {
    const ai = createAI();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `당신은 전문 유튜브 대본 작가입니다. 
      사용자가 선택한 주제로 유튜브 대본을 작성해야 합니다.

      **핵심 요구사항:**
      아래 제공된 [참고 대본]은 **구조적 패턴과 문체의 톤만 참고**하세요.
      
      **절대 하지 말아야 할 것:**
      - 참고 대본의 구체적인 사례, 예시, 스토리를 그대로 사용하지 마세요
      - 참고 대본의 문장을 복사하거나 약간만 수정해서 사용하지 마세요
      - 참고 대본에 나온 고유명사, 인물, 브랜드를 그대로 언급하지 마세요
      
      **참고해야 할 것:**
      - 전체적인 구성 방식 (예: 문제제기 → 해결책 → 결론)
      - 문장의 길이와 리듬감
      - 시청자와 소통하는 톤 (친근함, 전문성 등)
      - 정보 전달 방식 (예: 넘버링, 비유, 질문 등)

      선택된 주제: "${topic.title}"
      주제 선정 이유: ${topic.rationale}

      [참고 대본 (구조와 톤만 참고)]:
      "${referenceScript}"

      작성 지침:
      1. 선택된 주제에 맞는 **완전히 새로운 내용, 사례, 예시**를 사용하세요
      2. 참고 대본과 같은 구성 단계를 따르되, 각 단계의 내용은 100% 새롭게 작성하세요
      3. 한국어로 자연스럽고 몰입감 있게 작성하세요
      4. 마크다운 헤더(##), 볼드체(**) 등을 적절히 사용하세요
      5. 오프닝(Hook)부터 아웃트로(Outro)까지 완전한 대본을 작성하세요`,
    });

    return response.text || "대본 생성에 실패했습니다.";
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("최종 대본 생성에 실패했습니다.");
  }
};

// 여러 대본을 분석하여 공통 흥행 요소 추출 및 재장착된 주제 제안 (5개 이상)
export const analyzeMultipleScripts = async (scripts: string[]): Promise<SuggestedTopic[]> => {
  try {
    const ai = createAI();
    
    const scriptsText = scripts.map((script, index) => 
      `[대본 ${index + 1}]
${script}
`).join('\n---\n\n');

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `당신은 유튜브 콘텐츠 전문 분석가입니다.
      
      아래 여러 개의 대본을 분석하여:
      1. **공통적인 흥행 요소**를 찾아내세요 (구조, 문체, 후킹 전략, 타겟층, 전개 방식 등)
      2. 이 흥행 요소를 활용하되 **저작권 위험이 없도록 완전히 재장착된 새로운 주제 5개 이상**을 제안하세요.
      
      중요: 
      - 원본 대본의 구체적인 내용이나 고유한 스토리를 그대로 사용하지 마세요
      - 흥행 요소(패턴, 구조, 톤)만 추출하여 완전히 다른 주제에 적용하세요
      - 각 주제는 클릭을 부르는 제목 형태로 작성하세요
      - 최소 5개 이상의 다양한 주제를 제안하세요

      분석할 대본들:
      ${scriptsText}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: '재장착된 새로운 주제의 제목' },
              rationale: { type: Type.STRING, description: '이 주제가 왜 흥행할 것인지, 어떤 공통 요소를 활용했는지 설명' },
            },
            required: ['title', 'rationale'],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as SuggestedTopic[];
    }
    throw new Error('No data returned from AI');
  } catch (error) {
    console.error('Error analyzing multiple scripts:', error);
    throw new Error('다중 대본 분석에 실패했습니다.');
  }
};
