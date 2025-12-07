import { GoogleGenAI, Type } from "@google/genai";
import { SuggestedTopic, AnalysisResult } from "../types";

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

export const analyzeAndSuggestTopics = async (inputScript: string, requiredKeywords?: string): Promise<AnalysisResult> => {
  try {
    const ai = createAI();
    
    const keywordInstruction = requiredKeywords?.trim() 
      ? `\n\n**필수 키워드:** 다음 키워드를 제목에 반드시 포함하세요: ${requiredKeywords}`
      : '';
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `당신은 유튜브 바이럴 콘텐츠 전문가입니다.
      
      아래 대본을 분석하여:
      1. **원작의 핵심 구조와 패턴**을 요약하세요 (오프닝 방식, 전개 구조, 톤, 타겟 등)
      2. 그 제목 구조를 활용한 **변형 제목 5개**를 제안하세요
      
      **중요 규칙:**
      - 제목은 원작과 유사한 구조/패턴 사용 (클릭률 보장)
      - 하지만 스토리는 완전히 다른 방향 (차별화)
      - 다른 분야, 다른 타겟, 다른 접근법으로 재해석
      - 각 제목은 클릭을 부르는 형태로 작성${keywordInstruction}
      
      입력된 대본:
      "${inputScript}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            structureSummary: { type: Type.STRING, description: "대본의 핵심 구조와 패턴 요약" },
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "원작 제목을 변형한 새로운 제목" },
                  rationale: { type: Type.STRING, description: "원작과 어떤 구조를 공유하고, 스토리는 어떻게 다른지 설명" },
                },
                required: ["title", "rationale"],
              },
            },
          },
          required: ["structureSummary", "topics"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
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
      - 제목의 구조와 패턴 (숫자, 키워드 배치, 후킹 방식)
      - 전체적인 스토리 구성 방식 (문제제기 → 해결책 → 결론)
      - 문장의 길이와 리듬감
      - 시청자와 소통하는 톤 (친근함, 전문성 등)
      
      **핵심:**
      선택된 주제는 원작 제목과 유사한 구조를 가지지만, 
      대본 내용은 완전히 다른 방향/각도/사례로 전개하세요.

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
export const analyzeMultipleScripts = async (scripts: string[], requiredKeywords?: string): Promise<AnalysisResult> => {
  try {
    const ai = createAI();
    
    const scriptsText = scripts.map((script, index) => 
      `[대본 ${index + 1}]
${script}
`).join('\n---\n\n');

    const keywordInstruction = requiredKeywords?.trim() 
      ? `\n- **필수 키워드:** 다음 키워드를 제목에 반드시 포함하세요: ${requiredKeywords}`
      : '';

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `당신은 유튜브 콘텐츠 전문 분석가입니다.
      
      아래 여러 개의 대본을 분석하여:
      1. **공통적인 제목 패턴과 흥행 요소**를 요약하세요 (구조, 숫자 사용, 키워드, 후킹 방식, 타겟 등)
      2. 그 패턴을 활용한 **변형 제목 5개 이상**을 제안하세요
      
      **핵심 전략:**
      - 제목 구조는 검증된 원작 패턴 활용 (클릭률 보장)
      - 스토리는 완전히 다른 각도/분야/타겟으로 재해석
      - 원본의 구체적 내용 복사 금지, 패턴만 차용
      - 저작권 안전하게 "재장착"${keywordInstruction}

      분석할 대본들:
      ${scriptsText}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            structureSummary: { type: Type.STRING, description: '여러 대본의 공통 패턴과 흥행 요소 요약' },
            topics: {
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
          required: ['structureSummary', 'topics'],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error('No data returned from AI');
  } catch (error) {
    console.error('Error analyzing multiple scripts:', error);
    throw new Error('다중 대본 분석에 실패했습니다.');
  }
};
