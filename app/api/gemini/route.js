import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// 🚨 [FIX]: 서버 API의 최대 실행 시간을 60초로 설정합니다 (Timeout 방지)
export const config = {
    runtime: 'nodejs', // Vercel 또는 Next.js 환경에 맞게 nodejs 또는 edge로 설정
    maxDuration: 60, // 최대 실행 시간을 60초로 늘립니다.
};

// ⚠️ 환경 변수에서 API 키를 가져옵니다.
const API_KEY = process.env.GEMINI_API_KEY;

// 1. API 키 유효성 검사 및 초기화
if (!API_KEY) {
    console.error("환경 변수 'GEMINI_API_KEY'가 설정되지 않았습니다.");
    // 이 경우 gemini 객체를 생성하지 않습니다.
}

const gemini = new GoogleGenAI({ apiKey: API_KEY });


export async function POST(request) {
    // API 키가 없는 경우 500 에러 대신 503 Service Unavailable을 반환하여 설정 오류임을 명확히 합니다.
    if (!API_KEY) {
        return NextResponse.json(
            { message: 'Server configuration error: GEMINI_API_KEY is missing.' },
            { status: 503 } 
        );
    }
    
    try {
        // 프론트엔드에서 전송된 데이터(prompt, lang, type 등)를 받습니다.
        const { prompt, lang, type, generationConfig } = await request.json(); 

        if (!prompt) {
            return NextResponse.json({ message: 'Prompt is required.' }, { status: 400 });
        }

        // 언어 코드를 실제 언어 이름으로 변환합니다.
        const languageMap = {
            'ko': 'Korean',
            'en': 'English',
            'zh': 'Chinese',
            'ru': 'Russian',
            'vi': 'Vietnamese',
        };
        const requestedLanguage = languageMap[lang] || 'English';

        // 최종 프롬프트에 요청 언어를 명시적으로 추가하여 다국어 요청을 처리합니다.
        const finalPrompt = `${prompt}\n\n**The entire response must be provided in ${requestedLanguage}.**`;

        // 2. Gemini API 호출
        // ⭐️ 이 부분이 이미 최신 SDK 방식인 'gemini.models.generateContent'로 수정되어 있습니다.
        const response = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
            config: { 
                ...generationConfig,
            }
        });
        const responseText = response.text; 

        return NextResponse.json({ text: responseText });

    } catch (error) {
        console.error('Gemini API Error:', error.message);

        // API 호출 실패 시 발생하는 오류를 500으로 처리합니다.
        return NextResponse.json(
            { 
                message: 'Failed to generate content due to an internal server or API error.', 
                detail: error.message 
            },
            { status: 500 }
        );
    }
}