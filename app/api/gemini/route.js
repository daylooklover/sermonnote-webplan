import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

// 🚨 [FIX]: 서버 API의 최대 실행 시간을 60초로 설정합니다 (Timeout 방지)
export const config = {
    runtime: 'nodejs', // Vercel 또는 Next.js 환경에 맞게 nodejs 또는 edge로 설정
    maxDuration: 60, // 최대 실행 시간을 60초로 늘립니다.
};

// ⚠️ 환경 변수에서 API 키를 가져옵니다.
// 이 부분은 실제 프로젝트 환경에 맞게 수정이 필요할 수 있습니다.
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); 


export async function POST(request) {
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
        console.error('Gemini API Error:', error);

        return NextResponse.json(
            { message: 'Failed to generate content.', detail: error.message },
            { status: 500 }
        );
    }
}