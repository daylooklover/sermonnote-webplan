// src/lib/api.js

/**
 * AI API 엔드포인트 호출을 처리하는 범용 함수
 * @param {string} prompt - AI에게 보낼 프롬프트 텍스트
 * @param {object} options - 추가 옵션 (예: lang, type)
 * @returns {Promise<string>} - API 응답 텍스트
 */
export async function callAPI(prompt, options = {}) {
    // 🚀 [개선]: 기본 옵션 설정
    const { lang = 'ko', type = 'text' } = options;

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                lang: lang,
                type: type, // 'scripture' 또는 다른 타입
            }),
        });

        if (!response.ok) {
            // 서버에서 에러 응답(4xx, 5xx)이 온 경우
            const errorData = await response.json();
            
            // 🚀 [수정/개선]: 서버에서 반환한 상세 에러 메시지(detail)를 활용합니다.
            const detailMessage = errorData.detail || errorData.message || 'Unknown error';
            
            console.error(`Server API Error (${response.status}):`, errorData);
            
            // 클라이언트에게 반환될 에러 메시지에 상세 정보를 포함시킵니다.
            throw new Error(`API call failed with status ${response.status}: ${detailMessage}`);
        }

        const data = await response.json();
        
        // 🚀 [개선]: 서버 응답 데이터를 콘솔에 출력하여 디버깅을 돕습니다.
        console.log(`[callAPI] Server response data for type=${type}:`, data);
        
        // 서버 응답 구조: { text: '...', result: '...' }를 따릅니다.
        // text 필드가 가장 중요하며, 없으면 result, 그마저도 없으면 빈 문자열 반환
        return data.text || data.result || ''; 

    } catch (error) {
        // 네트워크 오류 또는 상위 블록에서 던진 에러 처리
        console.error("API Fetch Error:", error);
        
        // 이미 상세한 에러 메시지가 포함되어 있으므로, 그것을 그대로 던지거나 기본 메시지를 사용합니다.
        throw new Error(error.message || "Failed to communicate with the API server.");
    }
}