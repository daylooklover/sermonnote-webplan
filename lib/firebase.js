// lib/firebase.js (새 파일 생성)

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ----------------------------------------------------------------------
// 🔑 Firebase 설정 (새 키를 하드코딩하여 오류 방지)
// ----------------------------------------------------------------------
const firebaseConfig = {
    // 🚨 새로 발급받은 유효한 키로 교체합니다.
    apiKey: "AIzaSyCMmm06VSbyqBXJHXNK8wxrEdg7JC4PQmM", 
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sermonnote-live.firebaseapp.com",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://sermonnote-live-default-rtdb.firebaseio.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sermonnote-live",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sermonnote-live.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "520754190508",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:520754190508:web:e72b48c3b493d2e63ee709",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-FC7PKSSDP3"
};

// ----------------------------------------------------------------------
// 🛑 중복 초기화 방지 로직 (가장 안전한 방식)
// ----------------------------------------------------------------------
const isInitialized = getApps().length > 0;
const app = isInitialized ? getApp() : initializeApp(firebaseConfig); 

const auth = getAuth(app);
const db = getFirestore(app);

// 필요한 인스턴스만 익스포트
export { app, auth, db };