"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { createContext, useContext, useEffect, useState } from "react";

// 1. 환경 변수에서 설정값 불러오기

 const firebaseConfig = {
  apiKey: "AIzaSyDM-_APhiQ5mRWLP1KgXzVSxAPQ3NrwopE", // 이 부분을 수정!
  authDomain: "sermonnote-new-gen-53302.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 2. 초기화 로직 (이름 지정으로 충돌 방지)
const app = getApps().find(a => a.name === "sermon-app") 
  || initializeApp(firebaseConfig, "sermon-app");

export const auth = getAuth(app);
export const db = getFirestore(app);

// 3. 인증 컨텍스트 (AuthProvider 등 기존 로직 유지)
const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setLoading(false);
        });
        return unsubscribe;
      })
      .catch((error) => {
        console.error("인증 초기화 실패:", error);
        setLoading(false);
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default app;