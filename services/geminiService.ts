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
      아래 제공된 [참고 대본]의 **구조와 형식, 문체, 호흡(Pacing)**을 철저히 분석하고, **그 구조를 그대로 차용하여** 새로운 대본을 작성하세요.
      예를 들어, 참고 대본이 "질문"으로 시작하면 새 대본도 질문으로 시작하고, 참고 대본이 "3가지 팁"을 나열하는 구조라면 새 대본도 동일한 구성을 따르세요.
      내용만 주제에 맞게 변경되어야 합니다.

      선택된 주제: "${topic.title}"
      주제 선정 이유: ${topic.rationale}

      [참고 대본 (구조를 따라야 할 대상)]:
      "${referenceScript}"

      작성 지침:
      1. 한국어로 자연스럽고 몰입감 있게 작성하세요.
      2. 가독성을 위해 마크다운 헤더(##), 볼드체(**) 등을 적절히 사용하세요.
      3. 오프닝(Hook)부터 아웃트로(Outro)까지 완전한 대본을 작성하세요.`,
    });

    return response.text || "대본 생성에 실패했습니다.";
  } catch (error) {
    console.error("Error generating script:", error);
    throw new Error("최종 대본 생성에 실패했습니다.");
  }
};