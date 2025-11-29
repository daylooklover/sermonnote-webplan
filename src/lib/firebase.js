// Next.js 환경에서 Firebase 초기화 및 환경 변수 참조
import { initializeApp, getApps, getApp } from 'firebase/app'; 
// getAnalytics import는 서버에서 오류를 일으킬 수 있으므로 제거하거나 주석 처리합니다.
// import { getAnalytics } from 'firebase/analytics'; 

// Your web app's Firebase configuration
// 모든 키와 ID를 .env.local의 NEXT_PUBLIC 환경 변수에서 읽어옵니다.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase (중복 초기화 방지)
// 이미 초기화된 앱이 있다면 기존 앱 인스턴스를 사용하고, 없다면 새로 초기화합니다.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// const analytics = getAnalytics(app); 

// (필요하다면) 외부에서 app 객체를 사용할 수 있도록 export
export { app };