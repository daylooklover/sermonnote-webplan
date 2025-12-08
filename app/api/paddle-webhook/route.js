// /app/api/paddle-webhook/route.js

/**
 * Next.js App Router 서버 컴포넌트 환경에서 
 * Paddle Webhook을 처리하고 Firebase Admin SDK를 사용하여
 * 구독 정보를 Firestore에 업데이트하는 Route Handler입니다.
 */

// 🚨 Node.js 런타임을 명시합니다.
export const runtime = 'nodejs'; 

import { NextResponse } from 'next/server';
import * as crypto from 'crypto';

// ------------------------------------------------------------------
// 1. Firebase Admin SDK Import 및 초기화 로직 (오류 해결)
// ------------------------------------------------------------------
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore'; 


// 🛑 환경 변수에서 Base64로 인코딩된 JSON 문자열을 디코딩
let serviceAccount;
const SERVICE_ACCOUNT_BASE64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64; 

if (SERVICE_ACCOUNT_BASE64) {
    try {
        const decodedJsonString = Buffer.from(SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
        serviceAccount = JSON.parse(decodedJsonString);
    } catch (error) {
        console.error("❌ Webhook Service Account Key Decode/Parse Error:", error.message);
        serviceAccount = null; 
    }
} else {
    serviceAccount = null; 
}

// --- [전역 변수 선언] ---
let db; 
let adminInitialized = false; 

// 파일이 로드되지 않았거나 디코딩에 실패하면 DEBUG_MODE
const IS_DEBUG_MODE = !serviceAccount; 

const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;


// --- [Admin SDK 초기화 함수] ---
function initializeAdminSDK() {
    // 1. 이미 초기화되었는지 확인 (중복 초기화 방지)
    if (getApps().length) { 
        if (!adminInitialized) { 
            db = getFirestore();
            adminInitialized = true;
        }
        return db;
    }
    
    // 2. 디버그 모드 체크
    if (IS_DEBUG_MODE) {
        console.warn("********************************************************************************");
        console.warn("⚠️ WARNING: Firebase Admin SDK NOT initialized for Webhook. DEBUG MODE.");
        console.warn("********************************************************************************");
        adminInitialized = false;
        return null; 
    }

    // 3. 실제 초기화 시도
    try {
        if (!serviceAccount) {
             throw new Error("Service account object is missing despite non-DEBUG mode.");
        }
        
        initializeApp({
             credential: cert(serviceAccount),
        });

        db = getFirestore();
        adminInitialized = true;
        console.log("✅ Webhook Firebase Admin SDK initialized successfully.");
        return db;

    } catch (error) {
        console.error("❌ Webhook Firebase Admin initialization FAILED. Reason:", error.message);
        adminInitialized = false;
        return null;
    }
}


// ------------------------------------------------------------------
// 2. Next.js POST Route Handler
// ------------------------------------------------------------------
export async function POST(req) {
    
    // 🚨 Admin SDK 초기화 및 db 인스턴스를 가져옵니다.
    const dbInstance = initializeAdminSDK();

    if (!PADDLE_WEBHOOK_SECRET) {
        console.error("PADDLE_WEBHOOK_SECRET is missing.");
        return new NextResponse(
            JSON.stringify({ error: 'Server configuration error: Webhook secret is missing.' }),
            { status: 500 }
        );
    }
    
    if (!dbInstance && !IS_DEBUG_MODE) {
        return new NextResponse(
            JSON.stringify({ error: 'Server configuration error: Firebase Admin failed to initialize.' }),
            { status: 500 }
        );
    }

    // Webhook 요청 검증을 위해 원시 본문(Raw Body)을 가져옵니다.
    const rawBody = await req.text();
    const signature = req.headers.get('Paddle-Signature');

    if (!signature) {
        console.error("Webhook verification failed: Paddle-Signature header missing.");
        return new NextResponse(
            JSON.stringify({ error: 'Signature verification failed.' }),
            { status: 401 }
        );
    }

    // ------------------------------------------------------------------
    // 3. Paddle 서명 검증 로직
    // ------------------------------------------------------------------
    try {
        const hmac = crypto.createHmac('sha256', PADDLE_WEBHOOK_SECRET);
        hmac.update(rawBody);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== signature) {
            console.error(`Webhook verification failed: Invalid signature. Received: ${signature}`);
            return new NextResponse(
                JSON.stringify({ error: 'Signature verification failed.' }),
                { status: 401 }
            );
        }
    } catch (error) {
        console.error("Signature verification error:", error.message);
        return new NextResponse(
            JSON.stringify({ error: 'Internal signature processing error.' }),
            { status: 500 }
        );
    }

    // ------------------------------------------------------------------
    // 4. Webhook 이벤트 처리 (구독 업데이트)
    // ------------------------------------------------------------------
    try {
        const data = JSON.parse(rawBody);
        const eventType = data.event_type;
        const eventData = data.data;

        console.log(`Received Paddle Event: ${eventType} for Subscription ID: ${eventData.id}`);

        // Firebase User ID (이 예제에서는 eventData의 custom_data 필드에 있다고 가정)
        // ⚠️ 실제 구현 시, 사용자 ID를 찾는 로직을 추가해야 합니다.
        const userId = eventData.custom_data?.user_id; 
        
        if (!userId) {
            console.warn("User ID not found in custom_data. Skipping database update.");
            return new NextResponse(null, { status: 200 }); // 200 OK 반환
        }

        const userRef = dbInstance.collection('users').doc(userId);

        if (eventType.startsWith('subscription')) {
            // 구독 관련 이벤트 처리
            const subscriptionStatus = eventData.status; 
            const isPro = (eventData.plan_id === 'YOUR_PRO_PLAN_ID'); // ⚠️ 실제 플랜 ID로 변경

            const updateData = {
                paddleSubscriptionId: eventData.id,
                paddleStatus: subscriptionStatus,
                isSubscribed: subscriptionStatus === 'active' || subscriptionStatus === 'trialing',
                isProUser: isPro,
                lastUpdated: new Date().toISOString(),
                // 필요에 따라 구독 만료일 등 추가
            };

            await userRef.set({ subscription: updateData }, { merge: true });
            console.log(`[DB Update] User ${userId} subscription updated to status: ${subscriptionStatus}`);
        } 
        // else if (eventType.startsWith('payment')) {
        //     // 결제 성공/실패 이벤트 처리 로직 추가
        // }

        return new NextResponse(null, { status: 200 });

    } catch (error) {
        console.error('Webhook Event Processing Error:', error);
        return new NextResponse(
            JSON.stringify({ error: `Event processing failed: ${error.message}` }),
            { status: 500 }
        );
    }
}