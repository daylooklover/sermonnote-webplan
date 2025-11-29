// index.js (Firebase Functions의 최종 비동기/Promise 해결 코드 - 최적화)

// Firebase Functions SDK는 ESM 환경에서 import * as로 가져옵니다.
import * as functions from 'firebase-functions';

/**
 * firebase-frameworks 모듈을 비동기적으로 로드하고,
 * 모듈 객체 내에서 Next.js 핸들러 함수를 안전하게 찾아 호출합니다.
 */
const loadNextAppHandler = async () => {
    // 1. 동적 import()를 사용하여 모듈 전체를 비동기적으로 가져옵니다.
    // 이는 ERR_REQUIRE_ASYNC_MODULE 오류를 우회하기 위해 필수적입니다.
    const mod = await import('firebase-frameworks');
    
    // 2. 모듈 객체(mod) 내에서 'framework' Named Export를 우선 확인합니다.
    let frameworksFunction = mod.framework; 

    // 3. 만약 mod.framework가 함수가 아니면 (undefined 또는 다른 값), mod.default를 시도합니다.
    if (typeof frameworksFunction !== 'function') {
        frameworksFunction = mod.default;
    }
    
    // 4. 최종적으로 함수가 아닌 경우 (안전 확인), 명확한 에러를 발생시킵니다.
    if (typeof frameworksFunction !== 'function') {
         throw new Error("Could not find Next.js framework handler in 'firebase-frameworks' module. Please ensure the 'firebase-frameworks' package is correctly installed and compatible.");
    }
    
    // 5. 찾은 함수(frameworksFunction)를 'next' 인자와 함께 호출하여 핸들러를 반환합니다.
    return frameworksFunction('next');
};

// 6. exports를 Promise로 래핑하여 CLI가 비동기 로드를 완료할 때까지 기다리도록 합니다.
export const nextServer = loadNextAppHandler().then(handler => {
    // 핸들러가 준비되면, functions.https.onRequest로 래핑하여 Cloud Function을 정의합니다.
    return functions.https.onRequest(handler);
});