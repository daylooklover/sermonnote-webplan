// lib/firebase.js (최종 수정본)

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 1. .env.local 파일에서 환경 변수를 가져옵니다.
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 2. Firebase 앱 초기화 (서버/클라이언트 양용)
// 이미 초기화된 앱이 있는지 확인하여 중복 초기화를 방지합니다.
let firebaseApp;

if (getApps().length === 0) {
    // 앱이 없으면 새로 초기화합니다.
    firebaseApp = initializeApp(firebaseConfig);
} else {
    // 앱이 이미 있으면 기존 앱을 가져옵니다.
    firebaseApp = getApps()[0]; // 또는 getApp()
}

// 3. Auth 및 Firestore 서비스 내보내기
// 이제 firebaseApp은 서버/클라이언트 양쪽에서 항상 유효한 값을 가집니다.
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const app = firebaseApp;