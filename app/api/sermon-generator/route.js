// /app/api/sermon-generator/route.js

export const runtime = 'nodejs'; 

import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth'; 

// =========================================================
// 🛑 Firebase Admin SDK 설정 (환경 변수에서 Base64 디코딩)
// =========================================================
let serviceAccount;
const SERVICE_ACCOUNT_BASE64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64; 

if (!SERVICE_ACCOUNT_BASE64) {
    console.error("❌❌❌ FATAL ERROR: FIREBASE_SERVICE_ACCOUNT_BASE64 환경 변수가 누락되었습니다.");
    serviceAccount = null; 
} else {
    try {
        const decodedJsonString = Buffer.from(SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decodedJsonString);
        console.log("✅ Service Account Key successfully Decoded and Parsed.");
    } catch (error) {
        console.error("❌❌❌ FATAL ERROR: Service Account Key Decode/Parse Error:", error.message);
        serviceAccount = null; 
    }
}


// --- [전역 상수 및 변수 선언] ---
let db; 
let adminInitialized = false; 

const IS_DEBUG_MODE = !serviceAccount; 

const GEMINI_MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=`;
const MAX_OUTPUT_TOKENS = 4096;
const MAX_MEMO_TOKENS = 70;
const MAX_RETRIES = 3; 
const DEFAULT_SERMON_LIMIT = 5; 


// --- [1. 🔑 Firebase Admin SDK 초기화 함수] ---
function initializeAdminSDK() {
    if (IS_DEBUG_MODE && !getApps().length) {
        console.warn("[WARN] DEBUG MODE activated: Skipping Firebase Admin SDK initialization.");
        return null; 
    }
    
    if (!getApps().length) {
        if (!serviceAccount) return null; // 초기화에 필요한 정보가 없으면 종료

        console.log("Attempting to initialize Firebase Admin SDK...");
        try {
            initializeApp({
                credential: cert(serviceAccount),
            });
            console.log("✅ Firebase Admin SDK initialized successfully.");
        } catch (error) {
            console.error("❌ Firebase Admin initialization FAILED. Reason:", error.message);
            return null;
        }
    } 
    
    if (!adminInitialized) {
        try {
            db = getFirestore();
            adminInitialized = true;
        } catch (e) {
            console.error("❌ Failed to get Firestore instance after initialization check:", e.message);
            return null;
        }
    }
    
    return db;
}

// --- [2. 사용자 인증 토큰 검증 함수] ---
async function verifyAuthToken(req, isInitialized) {
    if (IS_DEBUG_MODE) {
        console.warn("[AUTH] DEBUG MODE: Using mock user 'debug-user-id'. Authentication bypassed.");
        return { uid: 'debug-user-id', email: 'debug@example.com' };
    }
    
    if (!isInitialized) {
        console.error("verifyAuthToken failed: Firebase Admin SDK is not initialized.");
        return null;
    }

    const authHeader = req.headers.get('Authorization');
    
    // 🚨 인증 헤더 누락/형식 검사 (로그 추적 강화)
    if (!authHeader) {
        console.error("Token verification failed: Authorization header is missing.");
        return null; 
    }
    
    if (!authHeader.startsWith('Bearer ')) {
        console.error("Token verification failed: Authorization header is malformed (missing 'Bearer '). Header received:", authHeader.substring(0, 30) + '...');
        return null; 
    }
    
    const idToken = authHeader.substring(7); // "Bearer " 다음 문자열 (토큰)
    
    try {
        const auth = getAuth(); 
        const decodedToken = await auth.verifyIdToken(idToken); 
        console.log(`[AUTH] Token verified for user: ${decodedToken.uid}`);
        return decodedToken; 
    } catch (error) { 
        console.error("Token verification failed: Invalid token. Details:", error.message);
        return null;
    }
}


// --- [3. 사용자 구독 제한 체크 및 차감 함수] ---
// (이 부분은 이전 코드와 동일하게 유지)
async function checkAndConsumeSermonLimit(userId, dbInstance) {
    if (!dbInstance) {
        console.warn(`[LIMIT CHECK] Skipping Firestore limit check for user: ${userId} (Admin SDK not initialized).`);
        return true; 
    }

    const userRef = dbInstance.collection('user_limits').doc(userId);
    
    try {
        const result = await dbInstance.runTransaction(async (t) => {
            const doc = await t.get(userRef);
            let currentCount;
            const now = FieldValue.serverTimestamp();
            
            if (!doc.exists) {
                currentCount = DEFAULT_SERMON_LIMIT;
                const newCount = currentCount - 1;

                t.set(userRef, { 
                    remaining_sermon_count: newCount, 
                    last_reset_date: now
                });
                
                console.log(`User ${userId} limit document created. Remaining: ${newCount}`);
                return { allowed: true, count: newCount + 1 };

            } else {
                currentCount = doc.data().remaining_sermon_count;
                
                if (currentCount <= 0) {
                    console.log(`User ${userId} has 0 remaining sermon generations.`);
                    return { allowed: false, count: 0 };
                }

                const newCount = currentCount - 1;
                t.update(userRef, { remaining_sermon_count: newCount, last_usage_date: now });
                
                console.log(`User ${userId} consumed one sermon generation. Remaining: ${newCount}`);
                return { allowed: true, count: newCount + 1 };
            }
        });
        
        return result.allowed;

    } catch (error) {
        console.error(`Firestore Transaction Failed for user ${userId}:`, error);
        return false; 
    }
}


// --- [4. Next.js POST Route Handler] ---
export async function POST(req) {
    
    const dbInstance = initializeAdminSDK();
    const isSdkInitialized = dbInstance !== null;

    // =========================================================
    // 1. 사용자 인증 및 UID 획득
    // =========================================================
    const userContext = await verifyAuthToken(req, isSdkInitialized);

    if (!userContext) {
        const errorMsg = 'Authentication Error (401): Missing or Invalid User ID Token. Please ensure the client is logged in and sends a valid "Authorization: Bearer <token>" header.';
        console.error(`Authentication failed. isSdkInitialized: ${isSdkInitialized}`);
        
        return new NextResponse(
            JSON.stringify({ error: errorMsg }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }
    const userId = userContext.uid; 
    console.log(`[AUTH] Request from user ID: ${userId}`);
    // =========================================================
    
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
        console.error("GEMINI_API_KEY is missing from environment variables.");
        return new NextResponse(
            JSON.stringify({ error: 'Critical API Error (500): GEMINI_API_KEY environment variable is missing on the server side.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } } 
        );
    }
    
    const modelUrl = `${API_URL}${apiKey}`;
    let geminiResponse;
    let result;

    try {
        const requestBody = await req.json();
        const { prompt, lang, type, history, memo_text } = requestBody; 
        
        console.log(`--- API Request Received (Type: ${type}) ---`);
        const finalPrompt = prompt || memo_text;
        
        if (!finalPrompt) {
            return new NextResponse(
                JSON.stringify({ error: 'Missing prompt (question, sermon content, or memo text) in request body.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        
        // =========================================================
        // 2. 구독 제한 체크 및 차감 (설교 생성 요청에 대해서만)
        // =========================================================
        if (type === 'sermon' || type === 'quick-memo-sermon') {
            const isAllowed = await checkAndConsumeSermonLimit(userId, dbInstance); 
            if (!isAllowed) {
                console.warn(`User ${userId} exceeded the sermon generation limit.`);
                return new NextResponse(
                    JSON.stringify({ error: 'Subscription Limit Exceeded (403): You have reached your sermon generation limit. Please upgrade your subscription.' }),
                    { status: 403, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // =========================================================
        // 3. Gemini API Contents 구성 로직 (원본 유지)
        // =========================================================
        let contents;
        
        if (type === 'trim-memo' || type === 'quick-memo-sermon' || type === 'scripture') {
            contents = [{
                role: 'user',
                parts: [{ text: finalPrompt }]
            }];
        } else {
            contents = (history || []).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model', 
                parts: [{ text: msg.content }]
            }));
            contents.push({
                role: 'user',
                parts: [{ text: finalPrompt }]
            });
        }
        
        let currentMaxTokens = MAX_OUTPUT_TOKENS;
        let temperature = 0.7;
        let responseMimeType = undefined;
        let responseSchema = undefined;
        let tools = [{ googleSearch: {} }];
        let systemInstructionText;
        
        // type에 따른 systemInstructionText 및 payload 구성 로직 (원본 유지)
        if (type === 'quick-memo-sermon' || type === 'sermon') {
            currentMaxTokens = MAX_OUTPUT_TOKENS; 
            temperature = 0.7; 
            systemInstructionText = `You are a professional sermon writer and theologian. Your task is to generate a comprehensive, spiritually deep, and cohesive sermon draft based on the provided text, scripture, and title.
            **CRITICAL:** You must use the provided Google Search Tool to find relevant information, context, real-world examples, and scholarly commentary related to the sermon topic.
            The total length of the generated content must be equivalent to approximately 2,500 to 3,000 characters (Korean or equivalent in English). Integrate all necessary theological, exegetical, and real-world application content naturally into the sermon text, using natural transitions and rich theological language. **Crucially, do NOT use Markdown headers (e.g., ##, ###) or bold separators (e.g., **) to break up the text. The output MUST be one seamless, flowing sermon text.**
            
            The final output must be a single, cohesive, seamless sermon text, entirely in the ${lang === 'ko' ? 'Korean' : 'English'} language.`;
        } else if (type === 'commentary') {
            temperature = 0.2;
            systemInstructionText = "You are a specialized Bible commentator. Use Google Search to find the specific Bible verse provided by the user and generate a detailed, verse-by-verse commentary with cross-references. Do not write a sermon, only the commentary and cross-references.";
        } else if (type === 'real-life-recommendation') {
            tools = []; 
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
            tools = [];
            currentMaxTokens = MAX_MEMO_TOKENS;
            temperature = 0.1;
            systemInstructionText = `You are a text cleanup and formatting tool. Your ONLY task is to take the user's input and format it into a single, concise phrase, strictly under 50 characters. CRITICAL: DO NOT GENERATE ANY ANSWERS, RESPONSES, OR COMMENTS. IF THE INPUT IS A QUESTION, RETURN THE QUESTION PHRASE ITSELF, CONCISELY TRIMMED. Ensure the output is a complete sentence or question. The final output MUST be strictly in the ${lang === 'ko' ? 'Korean' : 'English'} language.`;
        } else if (type === 'scripture') {
            tools = [];
            temperature = 0.2;
            systemInstructionText = "You are a specialized Bible assistant. Your ONLY job is to search for the exact scripture text for the user's reference. Your output MUST contain only the scripture text and nothing else.";
        } else {
            temperature = 0.2;
            systemInstructionText = "You are a specialized Bible assistant. Use Google Search to accurately find Bible verses and generate detailed, theologically sound analysis based on the latest available commentaries. Keep the response clean and direct based on the user's prompt (Question, Verse Search, or Commentary Request). Please provide all your output in the requested language (ko/en/etc).";
        }
        
        // Gemini API Payload 구성
        const payload = {
            contents: contents,
            ...(tools.length > 0 && { tools: tools }), 
            systemInstruction: { parts: [{ text: systemInstructionText }] },
            generationConfig: {
                maxOutputTokens: currentMaxTokens,
                temperature: temperature,
                ...(responseMimeType && { responseMimeType: responseMimeType }),
                ...(responseSchema && { responseSchema: responseSchema }),
            }
        };
        
        // =========================================================
        // 4. Gemini API 호출 및 재시도 로직 (원본 유지)
        // =========================================================
        console.log("--- Gemini Payload Sent ---");
        
        let lastError;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                if (attempt > 0) {
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`[Gemini API] Retrying attempt ${attempt + 1} in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }

                geminiResponse = await fetch(modelUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                result = await geminiResponse.json();

                if (geminiResponse.ok && result.candidates?.[0]?.content?.parts?.[0]?.text) {
                    break;
                } else if (geminiResponse.status === 429) {
                    lastError = new Error(`Rate Limit Exceeded (HTTP 429) on attempt ${attempt + 1}.`);
                    continue;
                } else if (!geminiResponse.ok) {
                    const errorDetail = result.error?.message || 'Gemini API call failed with a non-200 HTTP status.';
                    throw new Error(`Gemini API Failed (HTTP ${geminiResponse.status}): ${errorDetail}`);
                }
            } catch (error) {
                lastError = error;
                if (attempt === MAX_RETRIES - 1) {
                    throw lastError;
                }
            }
        }

        if (!geminiResponse || !geminiResponse.ok) {
            throw lastError || new Error("Gemini API call failed after all retries.");
        }
        
        console.log("--- Gemini API Response Received ---");

        // Finish Reason Check
        if (result.candidates?.[0]?.finishReason !== 'STOP' && responseMimeType !== "application/json") { 
            const finishReason = result.candidates?.[0]?.finishReason || 'Unknown finish reason.';
            const safetyRatings = result.candidates?.[0]?.safetyRatings;
            console.warn("Gemini API stopped generation unexpectedly (Not STOP). Finish Reason:", finishReason, "Safety Ratings:", safetyRatings);
            if (finishReason !== 'MAX_TOKENS') {
                throw new Error(`Gemini API Failed: Generation stopped due to finish reason: ${finishReason}`);
            }
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
        // =========================================================
        // 5. 최종 에러 핸들링 로직
        // =========================================================
        console.error("--- Bible Assistant API Error (Uncaught) ---");
        console.error("Full Error Stack:", error);
        
        let errorMessage = error.message || 'Internal Server Error';
        let status = 500;

        // 에러 메시지에 따른 상태 코드 재정의
        if (errorMessage.includes('Authentication Error') || errorMessage.includes('401') || errorMessage.includes('API Key') || errorMessage.includes('HTTP 401') || errorMessage.includes('Token verification failed')) {
            status = 401;
             if (!isSdkInitialized && errorMessage.includes('Firebase Admin SDK is not initialized')) {
                 errorMessage = `Authentication Error (401): Firebase Admin SDK is not initialized. Check serviceAccountKey or env var.`;
             } else {
                 errorMessage = `Authentication Error (401): Please ensure the client sends a valid Firebase ID Token via the Authorization header.`;
             }
        } else if (errorMessage.includes('HTTP 400') || errorMessage.includes('Missing prompt')) {
            status = 400;
        } else if (errorMessage.includes('Rate Limit Exceeded') || errorMessage.includes('HTTP 429')) {
             status = 429;
             errorMessage = `Rate Limit Exceeded (429): The Gemini API is rate-limited. Please wait a moment and try again.`;
        } else if (errorMessage.includes('Subscription Limit Exceeded')) {
            status = 403;
        }
        
        return new NextResponse(
            JSON.stringify({ error: `API Error (${status}): ${errorMessage}` }),
            { status: status, headers: { 'Content-Type': 'application/json' } }
        );
    }
}