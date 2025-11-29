import { NextResponse } from 'next/server';

// 🚨 Gemini API URL 및 모델 설정
const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=`;
const MAX_OUTPUT_TOKENS = 4096;
const MAX_MEMO_TOKENS = 70; // Quick Memo Trimming용 최대 토큰 (50자 목표)

// Next.js 13+ App Router의 POST 핸들러
export async function POST(req) {
    
    // 🚨 [FIX] GEMINI_API_KEY를 환경 변수에서 읽어옵니다.
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
        // This should be fixed now, but keep the check
        console.error("GEMINI_API_KEY is missing from environment variables.");
        return new NextResponse(
            JSON.stringify({ error: 'Critical API Error (401): GEMINI_API_KEY environment variable is missing on the server side.' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }
    
    const modelUrl = `${API_URL}${apiKey}`;

    try {
        // 🚨 [핵심 수정]: 프론트엔드에서 보낼 수 있는 모든 필드를 파싱합니다.
        const requestBody = await req.json();
        const { prompt, lang, type, history, memo_text } = requestBody; 
        
        // --- DEBUG LOGGING START ---
        console.log("--- API Request Received ---");
        console.log("Type:", type, " | Language:", lang);
        console.log("Input Prompt/Memo Text:", prompt || memo_text);
        // --- DEBUG LOGGING END ---
        
        // 💡 [프롬프트 통합]: prompt 또는 memo_text 중 유효한 값을 사용합니다.
        const finalPrompt = prompt || memo_text;
        
        if (!finalPrompt) {
            // memo_text 필드도 함께 검사하여, 두 필드 모두 없으면 400 에러를 반환합니다.
            return new NextResponse(
                JSON.stringify({ error: 'Missing prompt (question, sermon content, or memo text) in request body.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        // 🚨 [Contents 구성]: history와 현재 prompt를 통합합니다.
        let contents;
        
        // trim-memo, quick-memo-sermon, scripture 요청은 히스토리를 사용하지 않습니다.
        if (type === 'trim-memo' || type === 'quick-memo-sermon' || type === 'scripture') {
            contents = [{
                role: 'user',
                parts: [{ text: finalPrompt }]
            }];
        } else {
            // 채팅(chat) 및 기타 유형은 히스토리를 사용합니다.
            contents = (history || []).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model', 
                parts: [{ text: msg.content }]
            }));
            // 현재 사용자 메시지 추가 (finalPrompt 사용)
            contents.push({
                role: 'user',
                parts: [{ text: finalPrompt }]
            });
        }
        
        let currentMaxTokens = MAX_OUTPUT_TOKENS;
        let temperature = 0.7; // 설교 생성 관련은 창의성을 위해 0.7로 시작합니다.
        let responseMimeType = undefined;
        let responseSchema = undefined;
        let tools = [{ googleSearch: {} }]; // 기본적으로 Google Search Tool 사용
        
        // 🚨 [시스템 지시 정의]
        let systemInstructionText;
        
        if (type === 'quick-memo-sermon' || type === 'sermon') {
            // 💡 Quick Memo 설교 생성 또는 일반 설교 생성 (가장 긴 설교문)
            currentMaxTokens = MAX_OUTPUT_TOKENS; 
            temperature = 0.7; // 창의적인 설교 생성에 적합
            
            // --- DEBUG LOGGING START ---
            console.log(`[SERMON GENERATION PROMPT]: ${finalPrompt.substring(0, 100)}...`); 
            // --- DEBUG LOGGING END ---
            
            systemInstructionText = `You are a professional sermon writer and theologian. Your task is to generate a comprehensive, spiritually deep, and cohesive sermon draft based on the provided text, scripture, and title.
            **CRITICAL:** You must use the provided Google Search Tool to find relevant information, context, real-world examples, and scholarly commentary related to the sermon topic.
            The total length of the generated content must be equivalent to approximately 2,500 to 3,000 characters (Korean or equivalent in English). Integrate all necessary theological, exegetical, and real-world application content naturally into the sermon text, using natural transitions and rich theological language. **Crucially, do NOT use Markdown headers (e.g., ##, ###) or bold separators (e.g., **) to break up the text. The output MUST be one seamless, flowing sermon text.**
            
            The final output must be a single, cohesive, seamless sermon text, entirely in the ${lang === 'ko' ? 'Korean' : 'English'} language.`;
            
        } else if (type === 'commentary') {
            // 강해 설교 주석 생성
            temperature = 0.2; // 사실 기반이므로 낮춥니다.
            systemInstructionText = "You are a specialized Bible commentator. Use Google Search to find the specific Bible verse provided by the user and generate a detailed, verse-by-verse commentary with cross-references. Do not write a sermon, only the commentary and cross-references.";
        
        } else if (type === 'real-life-recommendation') {
            // 생활화 설교 추천 (JSON 응답)
            tools = []; // 🚨 JSON 응답을 위해 Google Search Tool 비활성화
            temperature = 0.7;
            systemInstructionText = "You are a theological recommender. Based on the user's real-life topic, recommend exactly 3 suitable Bible passages (e.g., Genesis 1:1) and corresponding sermon titles in the user's language. Respond ONLY with a JSON array structure: [{\"scripture\":\"Genesis 1:1\", \"title\":\"Creation and Purpose\"}, ...]. CRITICAL: You must return only the JSON array, no text or explanation outside of it.";
            responseMimeType = "application/json";
            responseSchema = {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        "scripture": { "type": "STRING", "description": "The recommended Bible reference (e.g., Romans 12:1-2)." },
                        "title": { "type": "STRING", "description": "The recommended sermon title in the user's language." } 
                    },
                    required: ["scripture", "title"]
                }
            };
        
        } else if (type === 'trim-memo') {
            // 퀵 메모 텍스트 다듬기
            tools = [];
            currentMaxTokens = MAX_MEMO_TOKENS;
            temperature = 0.1;
            systemInstructionText = `You are a text cleanup and formatting tool. Your ONLY task is to take the user's input and format it into a single, concise phrase, strictly under 50 characters. CRITICAL: DO NOT GENERATE ANY ANSWERS, RESPONSES, OR COMMENTS. IF THE INPUT IS A QUESTION, RETURN THE QUESTION PHRASE ITSELF, CONCISELY TRIMMED. Ensure the output is a complete sentence or question. The final output MUST be strictly in the ${lang === 'ko' ? 'Korean' : 'English'} language.`;
        
        } else if (type === 'scripture') {
             // 성경 구절 검색 (히스토리 사용 안 함)
             tools = [];
             temperature = 0.2;
             systemInstructionText = "You are a specialized Bible assistant. Your ONLY job is to search for the exact scripture text for the user's reference. Your output MUST contain only the scripture text and nothing else.";
        
        } else {
            // 기본 (AI 설교 어시스턴트 채팅 - type: 'chat')
            temperature = 0.2;
            systemInstructionText = "You are a specialized Bible assistant. Use Google Search to accurately find Bible verses and generate detailed, theologically sound analysis based on the latest available commentaries. Keep the response clean and direct based on the user's prompt (Question, Verse Search, or Commentary Request). Please provide all your output in the requested language (ko/en/etc).";
        }
        
        // 🚨 Gemini API Payload
        const payload = {
            // 1. 컨텐츠 
            contents: contents,
            
            // 2. 도구 (Google Search Grounding) - 조건부 사용
            // tools 배열이 비어 있으면 해당 속성은 전송되지 않습니다.
            ...(tools.length > 0 && { tools: tools }), 
            
            // 3. 시스템 지시 
            systemInstruction: { parts: [{ text: systemInstructionText }] },

            // 4. 생성 설정 
            generationConfig: {
                maxOutputTokens: currentMaxTokens,
                temperature: temperature,
                ...(responseMimeType && { responseMimeType: responseMimeType }),
                ...(responseSchema && { responseSchema: responseSchema }),
            }
        };
        
        // --- DEBUG LOGGING START ---
        console.log("--- Gemini Payload Sent ---");
        console.log("Model Type:", type, " | Response Mime Type:", responseMimeType || "TEXT");
        // --- DEBUG LOGGING END ---

        let response;
        try {
            // 🚨 Gemini API 호출
            response = await fetch(modelUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (fetchError) {
            console.error("Gemini API Fetch Error (Network Level):", fetchError);
            throw new Error(`Network failure calling Gemini API: ${fetchError.message}`);
        }

        const result = await response.json();
        
        // --- DEBUG LOGGING START ---
        console.log("--- Gemini API Response Received ---");
        console.log("HTTP Status:", response.status);
        console.log("Response Body (Truncated):", JSON.stringify(result).substring(0, 300) + '...');
        // --- DEBUG LOGGING END ---

        // 🚨 [FIX] API 호출이 실패했거나 STOP 사유가 아닌 경우 오류 처리
        // response.ok가 false이면 HTTP 상태 코드 4xx, 5xx 이므로 즉시 에러 처리
        if (!response.ok) {
            const errorDetail = result.error?.message || 'Gemini API call failed with a non-200 HTTP status.';
            console.error("Gemini API Non-OK Response Error:", result);
            throw new Error(`Gemini API Failed (HTTP ${response.status}): ${errorDetail}`);
        }
        
        if (result.candidates?.[0]?.finishReason !== 'STOP') {
            const finishReason = result.candidates?.[0]?.finishReason || 'Unknown finish reason.';
            const safetyRatings = result.candidates?.[0]?.safetyRatings;
            console.error("Gemini API stopped generation unexpectedly. Finish Reason:", finishReason, "Safety Ratings:", safetyRatings);
            throw new Error(`Gemini API Failed: Generation stopped due to finish reason: ${finishReason}`);
        }
        
        const responseText = result.candidates[0].content.parts[0].text;
        
        // Return successful response
        return new NextResponse(
            JSON.stringify({ 
                response: responseText, 
                message: "Success" 
            }), 
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error("--- Bible Assistant API Error (Uncaught) ---");
        console.error("Full Error Stack:", error);
        
        const errorMessage = error.message || 'Internal Server Error';
        let status = 500;

        // Check for specific error types to return correct status codes
        if (errorMessage.includes('401') || errorMessage.includes('API Key') || errorMessage.includes('HTTP 401')) {
            status = 401;
            errorMessage = `API Key Error: Please ensure your environment has a valid Gemini API Key. Details: ${errorMessage}`;
        } else if (errorMessage.includes('HTTP 400') || errorMessage.includes('Missing prompt')) {
            status = 400;
        } else if (errorMessage.includes('HTTP 429')) {
             status = 429;
             errorMessage = `Rate Limit Exceeded: The Gemini API is rate-limited. Please wait a moment and try again. Details: ${errorMessage}`;
        }
        
        return new NextResponse(
            JSON.stringify({ error: `API Error (${status}): ${errorMessage}` }),
            { status: status, headers: { 'Content-Type': 'application/json' } }
        );
    }
}