'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 🚨 Firebase SDK 임포트
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // 👈 Firestore 임포트 (DB 인스턴스를 가져옴)

// -----------------------------------------------------------------------------
// ⭐️ 1. Firebase 설정 (필수 수정: 여기에 실제 환경 변수 또는 값을 넣어주세요) ⭐️
// -----------------------------------------------------------------------------
const firebaseConfig = {
    // 💡 .env.local 파일에서 NEXT_PUBLIC_ 접두사를 사용해 가져오는 것이 일반적입니다.
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// -----------------------------------------------------------------------------
// 2. 인스턴스 초기화 (앱이 한 번만 초기화되도록 처리)
// -----------------------------------------------------------------------------
let app;
let authInstance;
let dbInstance;

try {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app); // 👈 Firestore DB 인스턴스 생성
} catch (error) {
    console.error("Firebase 초기화 중 오류 발생:", error.message);
    // 초기화 실패 시 인스턴스를 null로 설정하여 앱에서 처리 가능하도록 함
    authInstance = null;
    dbInstance = null;
}

// -----------------------------------------------------------------------------
// 3. Context 및 Hook 정의
// -----------------------------------------------------------------------------

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState('');

    // Firebase 인증 상태 구독
    useEffect(() => {
        if (!authInstance) {
            setAuthError("Firebase 인증 인스턴스를 찾을 수 없습니다. 설정 파일을 확인하세요.");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            setAuthError('');
        }, (error) => {
            console.error("인증 상태 변경 중 오류 발생:", error);
            setAuthError(`Firebase 인증 오류: ${error.message}`);
            setLoading(false);
        });

        // 클린업 함수
        return () => unsubscribe();
    }, []);

    // --------------------------------------------------
    // 인증 핸들러 (선택 사항이지만 일반적으로 필요함)
    // --------------------------------------------------
    const handleLogout = useCallback(async () => {
        if (!authInstance) return;
        try {
            await signOut(authInstance);
        } catch (error) {
            console.error("로그아웃 오류:", error);
            setAuthError(`로그아웃 실패: ${error.message}`);
        }
    }, []);

    // 💡 (로그인/가입 함수는 LoginModal 등에서 직접 호출하거나, 여기에 추가 정의 가능)

    // --------------------------------------------------
    // Context Value 정의
    // --------------------------------------------------
    const value = {
        user,
        loading,
        authError,
        handleLogout,
        authInstance, 
        dbInstance, // 👈 퀵메모에서 필요했던 Firestore DB 인스턴스를 제공합니다.
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};