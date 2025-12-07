import { GoogleGenAI, Type } from "@google/genai";
import { SuggestedTopic, AnalysisResult, ScriptStructure } from "../types";

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
      contents: [{
        role: 'user',
        parts: [{ text: `당신은 유튜브 콘텐츠 분석 전문가입니다.
      
      **분석 목표:**
      아래 제공된 대본을 면밀히 분석하여 다음을 수행하세요:
      
      1. **대본의 이야기 흐름과 구조 분석** (구조 요약에 포함할 내용):
         - 주제와 핵심 메시지
         - 이야기 전개 방식 (오프닝 → 분론 → 결론 등 각 섹션의 역할)
         - 사용된 스토리텔링 기법 (문제제기, 해결, 공감, 반전 등)
         - 후킹 포인트와 클릭유도 요소
         - 타겟 청중과 톤 (친근함, 전문성, 유머 등)
         - 문장 길이, 리듬, 표현 스타일
      
      2. **분석한 구조와 기법을 적용한 새로운 주제 5개 제안**:
         - **핵심 원칙**: 원본의 구조, 기법, 톤은 그대로 사용하되, 등장인물과 사건은 완전히 다르게
         - 원본의 이야기를 카피하면 절대 안됨 (예: 원본이 "50년 전 타임캡슐"이면 "오래된 물건 발견" 구조는 유지하되 "망해진 가게", "폐허" 등 다른 소재)
         - 원본의 전개 방식을 모방하되, 새로운 인물/장소/상황으로 채우기
         - 제목 패턴 유지 (예: 원본이 "숫자 + 키워드"면 동일 패턴 사용)${keywordInstruction}
      
      **예시:**
      - 원본: "50년 전 본 타임캡슐, 그 안에서 발견된 할아버지의 유언이 불러온 기적"
      - 분석된 구조: 오래된 물건 발견 → 안에 숨겨진 메시지 → 기적/감동 결말
      - 적용 예: "25년 후 수십억 발견으로 돌아오다" (구조 동일, 소재는 돈/투자)
      
      **분석대상 대본:**
      "${inputScript}"
      
      **출력 형식:**
      - structureSummary: 위 대본의 이야기 흐름, 구조, 특징을 상세히 분석한 요약 (3-5문단)
      - topics: 5개의 변형 주제` }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            structureSummary: { 
              type: Type.STRING, 
              description: "업로드한 대본의 이야기 흐름, 구조, 스토리텔링 기법, 톤, 타겟 청중 등을 상세히 분석한 요약 (3-5문단)" 
            },
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { 
                    type: Type.STRING, 
                    description: "원본의 제목 패턴을 적용한 새로운 주제 제목 (등장인물/사건은 완전히 다르게)" 
                  },
                  rationale: { 
                    type: Type.STRING, 
                    description: "원본의 어떤 구조와 기법을 적용했는지, 등장인물과 사건은 어떻게 달라졌는지 설명" 
                  },
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
    throw new Error("대본 분석 결과를 받지 못했습니다.");
  } catch (error: any) {
    console.error("Error analyzing script:", error);
    
    // API 키 및 쿼터 오류 처리
    if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
      throw new Error('설정한 API 키의 사용 할당량을 초과했습니다. Google AI Studio에서 새 API 키를 발급받거나 유료 플랜으로 업그레이드하세요.');
    }
    if (error.message?.includes('API key')) {
      throw new Error('API 키가 유효하지 않습니다. 우측 상단에서 API 키를 확인해주세요.');
    }
    
    throw new Error("대본 분석에 실패했습니다. 다시 시도해주세요.");
  }
};

const getStructureGuide = (structure: ScriptStructure): string => {
  switch (structure) {
    case 'in-medias-res':
      return `**인 미디어스 레스 (In Medias Res - 인트로 후킹형)**
      
      구조:
      1. **강렬한 오프닝 (Hook)**: 가장 흥미로운 장면/결과부터 시작
         - "이 방법으로 3개월 만에 ○○○를 달성했습니다" 같은 임팩트
         - 시청자를 즉시 몰입시키는 강렬한 문장
      
      2. **배경 설명 (Setup)**: 어떻게 그 결과에 도달했는지 과거로 돌아가 설명
         - "하지만 6개월 전 제 상황은 완전히 달랐습니다"
         - 문제 상황, 시작점 설명
      
      3. **여정과 과정 (Journey)**: 단계별로 시도한 방법들
         - 시행착오, 배운 점, 적용한 전략
         - 구체적인 액션 아이템
      
      4. **결과와 교훈 (Resolution)**: 다시 현재로 돌아와 결과 강조
         - 오프닝에서 언급한 성과를 자세히 설명
         - 시청자가 얻을 수 있는 인사이트
      
      5. **행동 촉구 (Call-to-Action)**: 시청자에게 다음 단계 제시`;
    
    case 'fiction-curved':
      return `**픽션 커브드 (Fiction Curved - 고구마 후 사이다형)**
      
      구조:
      1. **문제 제기 (Problem)**: 시청자가 공감할 수 있는 불편함/문제 강조
         - "이런 상황 겪어보신 적 있나요?"
         - 고구마 먹듯 답답한 상황 설정
      
      2. **문제 심화 (Amplification)**: 문제가 얼마나 심각한지 확대
         - 통계, 사례, 실제 피해 사례
         - 시청자의 불안감을 더 자극
      
      3. **전환점 (Turning Point)**: "하지만..."으로 시작하는 반전
         - 해결책의 존재를 암시
         - 희망의 신호
      
      4. **해결책 제시 (Solution)**: 사이다처럼 시원한 명쾌한 해법
         - 구체적이고 실행 가능한 방법
         - 단계별 가이드
      
      5. **성공 사례와 마무리 (Success & Wrap-up)**: 해결책의 효과 증명
         - 실제 적용 사례
         - 긍정적인 결과로 마무리`;
    
    case 'save-the-cat':
      return `**세이브 더 캣 (Save the Cat - 인생역전 드라마형)**
      
      구조:
      1. **오프닝 이미지 (Opening Image)**: 주인공(화자)의 현재 상태
         - 평범하거나 힘든 시작점
         - 시청자와 유사한 상황 설정
      
      2. **테마 제시 (Theme Stated)**: 이 영상의 핵심 메시지 암시
         - "인생을 바꾸는 것은 작은 선택입니다"
      
      3. **촉매제 (Catalyst)**: 변화를 촉발하는 사건/깨달음
         - 전환점이 되는 순간
         - "그때 이것을 알게 되었습니다"
      
      4. **고민과 준비 (Debate)**: 변화에 대한 두려움과 결심
         - 내적 갈등
         - 용기를 내는 과정
      
      5. **액션과 시련 (Fun & Games)**: 실제로 시도하고 부딪히는 과정
         - 작은 성공들
         - 여전히 있는 장애물들
      
      6. **정점과 교훈 (All is Lost & Dark Night)**: 최대 위기 또는 깨달음
         - 가장 힘든 순간
         - 진짜 중요한 것을 깨닫는 순간
      
      7. **해결과 변화 (Break into Three)**: 극복과 성장
         - 문제 해결
         - 완전히 달라진 모습
      
      8. **마무리 이미지 (Final Image)**: 변화된 현재 모습
         - 오프닝과 대비되는 성장한 모습`;
    
    case 'story-circle':
      return `**댄 하몬의 스토리 서클 (Dan Harmon's Story Circle)**
      
      구조:
      1. **편안한 영역 (You/Comfort Zone)**: 주인공의 일상
         - "저는 평범한 ○○였습니다"
         - 익숙하지만 뭔가 부족한 현재
      
      2. **필요/욕구 (Need)**: 무언가 원하거나 부족함을 느낌
         - "하지만 ○○○가 필요했습니다"
         - 내적 동기 발생
      
      3. **낯선 세계 진입 (Go)**: 새로운 시도/환경
         - "그래서 ○○○를 시작했습니다"
         - 모험의 시작
      
      4. **탐색과 적응 (Search)**: 새로운 환경에 적응하며 배움
         - 시행착오
         - 새로운 규칙 학습
      
      5. **위기와 획득 (Find)**: 원하던 것을 얻지만 대가가 따름
         - 목표 달성의 순간
         - 예상치 못한 결과
      
      6. **대가 치르기 (Take)**: 변화의 고통/어려움 경험
         - "쉽지 않았습니다"
         - 희생과 노력
      
      7. **귀환 (Return)**: 원래 세계로 돌아옴
         - 배운 것을 가지고 일상으로
      
      8. **변화 (Change)**: 성장한 모습으로 새로운 균형
         - "이제 저는 ○○○입니다"
         - 완전히 달라진 관점과 능력`;
  }
};

export const generateFullScript = async (
  topic: SuggestedTopic, 
  referenceScript: string, 
  structure: ScriptStructure
): Promise<string> => {
  try {
    const ai = createAI();
    const structureGuide = getStructureGuide(structure);
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        role: 'user',
        parts: [{ text: `당신은 전문 유튜브 대본 작가입니다. 
      사용자가 선택한 주제와 스토리 구조로 유튜브 대본을 작성해야 합니다.

      **선택된 스토리 구조:**
      ${structureGuide}

      **작성 프로세스:**
      
      **1단계: 참고 대본의 톤과 스타일 분석**
      [참고 대본]을 분석하여 다음을 파악하세요:
      - 문장 길이와 리듬
      - 청중과의 상호작용 방식 (질문, 공감, 행동 유도)
      - 톤과 스타일 (친근함, 전문성, 유머 등)
      - 사용하는 어휘 수준과 표현 방식
      
      **2단계: 선택된 구조에 맞춰 대본 작성**
      - 위에 제시된 **스토리 구조를 정확히 따르세요**
      - 각 구조 단계를 명확하게 구분하여 작성하세요
      - 참고 대본의 **톤과 스타일**을 유지하되, 내용은 선택된 주제에 맞게 완전히 새롭게 작성하세요
      - 각 섹션이 자연스럽게 다음 섹션으로 이어지도록 하세요
      
      **절대 금지사항:**
      - 참고 대본의 구체적인 사례, 예시를 복사하지 마세요
      - 참고 대본의 문장을 조금만 바꿔 쓰지 마세요
      - 참고 대본의 고유명사를 그대로 사용하지 마세요
      
      **논리적 일관성 필수:**
      - 모든 문장과 문단은 앞뒤 맥락이 자연스럽게 연결되어야 합니다
      - 주장과 근거가 논리적으로 일치해야 합니다
      - 섹션 간 전환이 매끄러워야 합니다
      - 결론은 본론 내용을 정확히 요약해야 합니다

      선택된 주제: "${topic.title}"
      주제 선정 이유: ${topic.rationale}

      [참고 대본 - 톤과 스타일 참고용]:
      "${referenceScript}"

      작성 요구사항:
      1. 선택된 **스토리 구조의 모든 단계**를 포함하세요
      2. 각 단계를 마크다운 헤더(##)로 명확히 구분하세요
      3. 선택된 주제에 맞는 **완전히 새로운 내용, 사례, 예시**를 사용하세요
      4. 앞뒤 맥락이 논리적으로 **완벽하게 연결**되도록 작성하세요
      5. 참고 대본의 톤과 스타일을 유지하며 한국어로 자연스럽게 작성하세요` }]
      }],
    });

    return response.text || "대본 생성에 실패했습니다.";
  } catch (error: any) {
    console.error("Error generating script:", error);
    
    if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
      throw new Error('설정한 API 키의 사용 할당량을 초과했습니다. Google AI Studio에서 새 API 키를 발급받거나 유료 플랜으로 업그레이드하세요.');
    }
    
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
      contents: [{
        role: 'user',
        parts: [{ text: `당신은 유튜브 콘텐츠 분석 전문가입니다.
      
      **분석 목표:**
      아래 여러 대본을 면밀히 분석하여 다음을 수행하세요:
      
      1. **대본들의 공통 이야기 흐름과 구조 분서** (구조 요약에 포함할 내용):
         - 공통 주제와 핵심 메시지 패턴
         - 공통된 이야기 전개 방식 (오프닝, 분론, 결론 각 섹션의 역할)
         - 공통 스토리텔링 기법 (문제제기, 해결, 공감, 반전 등)
         - 후킹 포인트와 클릭유도 요소 (숫자, 키워드, 제목 패턴)
         - 타겟 청중과 톤 (친근함, 전문성, 유머 등)
         - 문장 길이, 리듬, 표현 스타일
      
      2. **분석한 공통 구조와 기법을 적용한 새로운 주제 5개 제안**:
         - **핵심 원칙**: 원본들의 공통 구조, 기법, 톤은 그대로 사용하되, 등장인물과 사건은 완전히 다르게
         - 원본의 이야기를 카피하면 절대 안됨
         - 원본의 전개 방식을 모방하되, 새로운 인물/장소/상황으로 채우기
         - 제목 패턴 유지 (예: 원본이 "숫자 + 키워드"면 동일 패턴 사용)${keywordInstruction}
      
      **분석대상 대본들:**
      ${scriptsText}
      
      **출력 형식:**
      - structureSummary: 위 대본들의 공통 이야기 흐름, 구조, 특징을 상세히 분석한 요약 (3-5문단)
      - topics: 5개의 변형 주제` }]
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            structureSummary: { 
              type: Type.STRING, 
              description: '업로드한 대본들의 공통 이야기 흐름, 구조, 스토리텔링 기법, 톤, 타겟 청중 등을 상세히 분석한 요약 (3-5문단)' 
            },
            topics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { 
                    type: Type.STRING, 
                    description: '원본들의 공통 제목 패턴을 적용한 새로운 주제 제목 (등장인물/사건은 완전히 다르게)' 
                  },
                  rationale: { 
                    type: Type.STRING, 
                    description: '원본들의 어떤 공통 구조와 기법을 적용했는지, 등장인물과 사건은 어떻게 달라졌는지 설명' 
                  },
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
    throw new Error('대본 분석 결과를 받지 못했습니다.');
  } catch (error: any) {
    console.error('Error analyzing multiple scripts:', error);
    
    if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
      throw new Error('설정한 API 키의 사용 할당량을 초과했습니다. Google AI Studio에서 새 API 키를 발급받거나 유료 플랜으로 업그레이드하세요.');
    }
    
    throw new Error('다중 대본 분석에 실패했습니다.');
  }
};

// 기존 구조 분석을 유지하고 새로운 키워드로 주제만 재생성
export const regenerateTopicsWithKeywords = async (
  structureSummary: string,
  originalScript: string,
  newKeywords: string
): Promise<SuggestedTopic[]> => {
  try {
    const ai = createAI();
    
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        role: 'user',
        parts: [{ text: `당신은 유튜브 콘텐츠 전문가입니다.

      **이미 분석된 대본 구조:**
      ${structureSummary}

      **과제:**
      위에 분석된 구조, 스토리텔링 기법, 제목 패턴을 **그대로 적용**하여,
      아래 새로운 키워드가 포함된 주제 5개를 제안하세요.

      **필수 요구사항:**
      - 분석된 구조와 기법을 정확히 적용
      - 제목 패턴 유지 (숫자 사용, 키워드 배치 등)
      - 새로운 키워드 필수 포함: ${newKeywords}
      - 등장인물과 사건은 완전히 다르게
      - 원본 이야기 카피 절대 금지

      **참고용 원본 대본:**
      "${originalScript}"

      5개의 새로운 주제를 JSON 배열로 반환하세요.` }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { 
                type: Type.STRING, 
                description: "분석된 제목 패턴을 적용하고 새 키워드가 포함된 주제 제목" 
              },
              rationale: { 
                type: Type.STRING, 
                description: "분석된 구조를 어떻게 적용했고, 새 키워드를 어떻게 활용했는지 설명" 
              },
            },
            required: ["title", "rationale"],
          },
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as SuggestedTopic[];
    }
    throw new Error('주제 재생성 결과를 받지 못했습니다.');
  } catch (error: any) {
    console.error('Error regenerating topics:', error);
    
    if (error.message?.includes('quota') || error.message?.includes('exceeded')) {
      throw new Error('설정한 API 키의 사용 할당량을 초과했습니다. Google AI Studio에서 새 API 키를 발급받거나 유료 플랜으로 업그레이드하세요.');
    }
    
    throw new Error('주제 재생성에 실패했습니다.');
  }
};
