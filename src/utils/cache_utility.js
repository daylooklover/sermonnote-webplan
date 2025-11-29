import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * AI 응답 캐시 로직: 주어진 프롬프트에 대한 AI 응답을 캐시에서 확인하고, 
 * 없으면 API를 호출한 후 결과를 캐시하여 API 비용을 최적화합니다.
 * * @param {string} promptText AI에게 전달할 최종 프롬프트 텍스트
 * @param {string} cacheKey 요청의 고유 키 (프롬프트 + 설정 값들을 조합)
 * @param {Function} apiCallHandler 실제 AI API를 호출하는 함수 (예: handleAPICall)
 * @param {Object} db Firestore 인스턴스
 * @param {string} appId 현재 앱 ID
 * @returns {Promise<string>} AI 응답 텍스트 (캐시 또는 API)
 */
export async function checkCacheAndCallAPI(promptText, cacheKey, apiCallHandler, db, appId) {
    // 🚨 필수: DB 초기화 체크
    if (!db) {
        throw new Error("Firestore database is not initialized.");
    }

    // 1. 캐시 문서 참조 생성
    // public/data/ai_cache 컬렉션을 사용하여 모든 사용자가 캐시를 공유합니다.
    const cacheRef = doc(db, `artifacts/${appId}/public/data/ai_cache`, cacheKey);

    try {
        // 2. 캐시 조회 (읽기)
        const cacheDoc = await getDoc(cacheRef);

        if (cacheDoc.exists()) {
            // 💡 캐시 히트: 저장된 결과를 즉시 반환합니다. (API 비용 절감!)
            console.log("Cache Hit! Returning cached response.");
            return cacheDoc.data().responseText;
        }

        // 3. 캐시 미스: API 호출
        console.log("Cache Miss. Calling AI API...");
        // apiCallHandler는 실제 Gemini API 호출 로직을 포함합니다.
        const aiResponse = await apiCallHandler(promptText); 

        if (aiResponse) {
            // 4. API 결과 캐시에 저장 (쓰기)
            await setDoc(cacheRef, {
                responseText: aiResponse,
                prompt: promptText,
                createdAt: serverTimestamp(),
            });
            console.log("Response cached successfully.");
        }

        return aiResponse;

    } catch (error) {
        // 🚨 캐싱 로직에 오류가 발생하더라도, 핵심 기능(AI 응답 제공)은 계속되어야 합니다.
        // 따라서 캐싱 오류를 기록하고 API 호출 오류만 최종적으로 던집니다.
        console.error("Caching attempt failed, proceeding with API result (if available) or throwing error:", error);
        
        // 만약 API 호출 자체에서 문제가 발생했다면, 해당 오류를 다시 던집니다.
        throw error;
    }
}