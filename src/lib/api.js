import { getAuth } from 'firebase/auth'; // Firebase Auth Client SDK
// 만약 'firebaseConfig' 파일에서 앱 객체를 가져온다면 아래 주석을 해제하세요.
// import { app } from './firebaseConfig'; 

/**
 * 서버 API (/api/sermon-generator)에 안전하게 요청을 보냅니다.
 * 이 함수는 자동으로 Firebase ID 토큰을 획득하여 Authorization 헤더에 추가합니다.
 * @param {string} type - 요청 타입 ('quick-memo-sermon', 'real-life-recommendation' 등)
 * @param {object} payload - 서버에 보낼 데이터 (prompt, history 등)
 * @returns {Promise<object>} 서버 응답 데이터
 */
export async function callSermonGenerator(type, payload) {
    // 1. Firebase Auth 인스턴스 및 현재 사용자 가져오기
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
        // 사용자 객체가 없으면 인증 오류 발생
        console.error("Authentication Error: Current user is null. Please log in.");
        // 로그인 페이지로 리디렉션하거나 사용자에게 알리는 것이 좋습니다.
        throw new Error("Authentication Error (401): Please log in again.");
    }
    
    // 2. ✅ 수정 및 필수 로직: 유효한 ID 토큰을 비동기적으로 획득
    const idToken = await user.getIdToken(); 
    
    // 3. 서버 API 호출
    const response = await fetch('/api/sermon-generator', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 🚨 획득한 토큰을 Authorization 헤더에 Bearer와 함께 추가합니다.
            'Authorization': `Bearer ${idToken}` 
        },
        body: JSON.stringify({ type, ...payload })
    });

    const result = await response.json();

    if (!response.ok) {
        // 서버에서 401, 403 (구독 제한 초과), 500 (API 키 오류) 등의 오류가 발생한 경우 처리
        console.error(`API Call Failed (${response.status}):`, result.error);
        throw new Error(result.error || `Server returned status ${response.status}`);
    }
    
    return result;
}