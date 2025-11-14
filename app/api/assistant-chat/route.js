import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// --------------------------------------------------
// 🚨 중요: Gemini API 키를 환경 변수에서 로드
// --------------------------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set in environment variables.");
}

// Next.js 서버 환경에서만 실행되므로 키가 안전합니다.
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const CHAT_MODEL = "gemini-2.5-flash";
const FREE_USAGE_LIMIT = 5; // 무료 사용자는 5회로 제한 (임시)

// --------------------------------------------------
// ✨ Caching Layer: 인메모리 캐시 (서버리스 함수 재사용 시 유지됨)
// --------------------------------------------------
const responseCache = new Map();
const CACHE_TTL = 3600000; // 1시간 (3600000ms) 동안 캐시 유지

// --------------------------------------------------
// 시스템 메시지: AI의 역할 정의
// --------------------------------------------------
const SYSTEM_INSTRUCTIONS = (language) => `
당신은 전 세계 목회자들을 돕는 'SermonNote'의 전문 설교 AI 어시스턴트입니다.
당신의 역할은 다음과 같습니다:
1. 사용자가 제공하는 주제, 성경 구절, 또는 질문에 대해 깊이 있는 신학적 통찰을 제공합니다.
2. 설교 초안, 본문 해석, 적용점, 예화 아이디어 등을 구조화하여 답변합니다.
3. 답변은 항상 사용자 언어(${language})에 맞춰서 명확하고 존중하는 어조로 작성합니다.
4. 마크다운(Markdown) 형식을 적극적으로 활용하여 답변을 보기 쉽게 구성합니다.
5. 단순한 답변 대신, 다음 질문을 유도하거나 사용자의 생각을 확장시키는 질문을 하나 덧붙여 대화를 이어가세요.
6. **절대 설교 전체를 한번에 작성하려고 하지 말고, 대화를 통해 초안을 다듬어 나가도록 유도합니다.**
`;

// --------------------------------------------------
// POST 요청 핸들러: 클라이언트의 채팅 메시지를 받아서 AI에 전달
// --------------------------------------------------
export async function POST(request) {
    try {
        const { message, language_code, history, userId, userSubscription, sermonCount } = await request.json();

        // 1. API 키 유효성 및 환경 확인
        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { response: "API 키가 서버에 설정되지 않았습니다. 관리자에게 문의하세요.", message: "API Key Missing" },
                { status: 500 }
            );
        }

        // 2. 사용 제한 검사
        if (userSubscription === 'free' && sermonCount >= FREE_USAGE_LIMIT) {
            return NextResponse.json(
                { response: `무료 사용 한도(${FREE_USAGE_LIMIT}회)에 도달했습니다. 프리미엄으로 업그레이드하세요.`, message: "Limit Reached" },
                { status: 403 }
            );
        }

        // --------------------------------------------------
        // ✨ Caching Check: 캐시 확인 (message와 language_code로 키 생성)
        // --------------------------------------------------
        const cacheKey = `${language_code}:${message}`;
        const cachedItem = responseCache.get(cacheKey);

        if (cachedItem && Date.now() < cachedItem.expiry) {
             console.log("Cache HIT: Returning cached response.");
             return NextResponse.json({ 
                response: cachedItem.response,
                message: "Success (from cache)" 
            });
        }
        // --------------------------------------------------
        // 캐시 확인 끝

        // 3. 히스토리 변환 (Gemini API 형식에 맞게)
        // 캐시를 사용하는 경우, 히스토리 없이 순수 메시지와 시스템 프롬프트만으로 응답이 나와야 
        // 완벽하게 동일한 캐시 결과를 기대할 수 있으나, SermonNote는 대화형이므로 
        // 히스토리가 있는 요청은 캐시 미스가 나도록 설계했습니다.
        
        const contents = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model', // Gemini API는 'model'을 사용
            parts: [{ text: msg.content }]
        }));

        contents.push({ role: 'user', parts: [{ text: message }] });

        // 4. Gemini API 호출
        const response = await ai.models.generateContent({
            model: CHAT_MODEL,
            contents: contents,
            config: {
                systemInstruction: SYSTEM_INSTRUCTIONS(language_code || 'ko'), // 한국어 기본값
                temperature: 0.7,
            }
        });

        const aiResponseText = response.text;

        // --------------------------------------------------
        // ✨ Caching Save: 캐시에 응답 저장
        // --------------------------------------------------
        responseCache.set(cacheKey, {
            response: aiResponseText,
            expiry: Date.now() + CACHE_TTL,
        });
        // --------------------------------------------------
        
        // 5. 응답 반환
        return NextResponse.json({ 
            response: aiResponseText,
            message: "Success" 
        });

    } catch (error) {
        console.error("Gemini API Route Error:", error);
        
        const errorMessage = error.message || "알 수 없는 API 오류";
        let status = 500;
        
        // 흔히 발생하는 인증 또는 할당량 오류에 대한 상태 코드 지정
        if (errorMessage.includes("API key not valid")) {
            status = 401; // Unauthorized
        } else if (errorMessage.includes("quota")) {
            status = 429; // Too Many Requests (할당량 초과)
        }

        return NextResponse.json(
            { response: "서버 내부 오류가 발생했습니다. 메시지를 확인하세요.", message: errorMessage },
            { status: status }
        );
    }
}