import { NextResponse } from 'next/server';

// 🚨 Gemini API URL 및 모델 설정
const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=`;
const MAX_OUTPUT_TOKENS = 4096;

// Next.js 13+ App Router의 POST 핸들러
export async function POST(req) {
    
    // 🚨 [FIX] GEMINI_API_KEY를 환경 변수에서 가져옵니다.
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
        return new NextResponse(
            JSON.stringify({ error: 'Critical API Error (401): GEMINI_API_KEY environment variable is missing on the server side.' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    const modelUrl = `${API_URL}${apiKey}`;

    try {
        // 🚨 [수정]: 프론트엔드에서 보낸 필드 이름에 맞게 prompt와 history를 파싱합니다.
        const { prompt, lang, type, history } = await req.json(); 
        
        if (!prompt) {
            return new NextResponse(
                JSON.stringify({ error: 'Missing prompt (question) in request body.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        // 🚨 [수정]: history와 현재 prompt를 통합하여 Gemini contents 배열을 구성합니다.
        // history는 role과 content (parts 배열 없음)를 가진 객체 배열이어야 합니다.
        // 현재 prompt는 가장 마지막 메시지로 추가됩니다.
        
        let contents = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model', // Gemini API는 'assistant' 대신 'model'을 사용합니다.
            parts: [{ text: msg.content }]
        }));

        // 현재 사용자 메시지 추가
        contents.push({
            role: 'user',
            parts: [{ text: prompt }]
        });
        
        // 🚨 이 API는 성경 구절 검색 및 강해 생성에 사용되므로, Google Search를 활용합니다.
        
        // Gemini API Payload
        const payload = {
            // 1. 컨텐츠 (히스토리 + 현재 사용자 질문)
            contents: contents,
            
            // 2. 도구 (Google Search Grounding) - 최상위 레벨
            tools: [{ googleSearch: {} }],
            
            // 3. 시스템 지시 (SermonGenerator.jsx에서 요청하는 작업 유형에 따라 변경될 수 있음)
            systemInstruction: { parts: [{ text: "You are a specialized Bible assistant. Use Google Search to accurately find Bible verses and generate detailed, theologically sound analysis based on the latest available commentaries. Keep the response clean and direct based on the user's prompt (Question, Verse Search, or Commentary Request). Please provide all your output in the requested language (ko/en/etc)." }] }, // 🚨 언어 지시 추가

            // 4. 생성 설정 (최대 토큰 및 온도)
            generationConfig: {
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                temperature: 0.2, // 성경 구절 검색/강해는 낮은 온도가 적합
            }
        };

        let response;
        try {
            // 🚨 Gemini API 호출
            response = await fetch(modelUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (fetchError) {
            console.error("Gemini API Fetch Error:", fetchError);
            throw new Error(`Network failure calling Gemini API: ${fetchError.message}`);
        }

        const result = await response.json();

        // 🚨 [FIX] API 호출이 실패했거나 STOP 사유가 아닌 경우 오류 처리
        if (!response.ok || result.candidates?.[0]?.finishReason !== 'STOP') {
            const errorDetail = result.error?.message || result.candidates?.[0]?.finishReason || 'Unknown error occurred.';
            throw new Error(`Gemini API Failed: ${errorDetail}`);
        }
        
        const responseText = result.candidates[0].content.parts[0].text;
        
        // Return successful response
        return new NextResponse(
            JSON.stringify({ response: responseText, message: "Success" }), // 'message: Success' 추가하여 클라이언트의 카운터 로직 지원
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error("Bible Assistant API Error:", error);
        
        const errorMessage = error.message || 'Internal Server Error';
        let status = 500;

        // Check if the error contains API key or security rejection messages
        if (errorMessage.includes('401') || errorMessage.includes('invalid') || errorMessage.includes('unregistered') || errorMessage.includes('API Key')) {
            status = 401;
            errorMessage = `API Key Error: Please ensure your environment has a valid Gemini API Key. Details: ${errorMessage}`;
        }
        
        return new NextResponse(
            JSON.stringify({ error: `API Error (${status}): ${errorMessage}` }),
            { status: status, headers: { 'Content-Type': 'application/json' } }
        );
    }
}