// src/constants/pricing.js

// ==================================
// 1. PADDLE CLIENT SIDE 설정
// ==================================
// 현재 Sandbox 테스트용으로 사용되는 Public Key
export const PADDLE_CLIENT_TOKEN = 'live_e95dfa166e207cd259b4b157fbd'; 


// ==================================
// 2. PADDLE PRICE ID 설정 (Catalog에서 확인된 4개의 Live ID)
// ==================================
export const PADDLE_PRICE_IDS = {
    // 🚨 Premium 플랜 ($40/월, $384/년)
    premium_monthly: 'pri_01kdp96t8rjgsm875qkfp2gx4y', 
    premium_annual: 'pri_01kdp98n5ambh62njcrmq9bvcc', 

    // 🚨 Standard 플랜 ($20/월, $192/년)
    standard_monthly: 'pri_01kdp90zntk7s19bq21pvxcb13', 
    standard_annual: 'pri_01kdp950wshrdkxf5mjdpw78hz', 
};


// ==================================
// 3. 기타 상수
// ==================================
export const ANNUAL_DISCOUNT_RATE = 0.2;