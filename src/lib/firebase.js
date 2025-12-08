// 🚨 이 코드로 AuthProvider.js 파일을 완전히 교체하세요.

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Firebase SDK 임포트
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from 'firebase/auth'; 
import { getFirestore } from 'firebase/firestore'; 

// -----------------------------------------------------------------------------
// 1. Firebase 설정 (환경 변수에서만 로드하며, 공백 방지 위해 .trim() 사용)
// -----------------------------------------------------------------------------
const firebaseConfig = {
    // ✅ 환경 변수 값이 undefined가 아닐 경우에만 .trim()을 적용합니다.
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY.trim() : undefined,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN.trim() : undefined,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID.trim() : undefined,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET.trim() : undefined,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID.trim() : undefined,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ? process.env.NEXT_PUBLIC_FIREBASE_APP_ID.trim() : undefined,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ? process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID.trim() : undefined,
};

// -----------------------------------------------------------------------------
// 2. 인스턴스 초기화 및 초기 오류 저장
// -----------------------------------------------------------------------------
let app;
let authInstance;
let dbInstance;
let initialError = ''; 

// API 키 유효성 검사
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isConfigValid) {
    // 🚨 FATAL ERROR 방지 로직
    initialError = "FATAL ERROR: Firebase API Key 또는 Project ID가 환경 변수에서 누락되었습니다. (.env 파일 확인 필요)";
    console.error(initialError);
    authInstance = null;
    dbInstance = null;
} else {
    try {
        if (typeof window !== 'undefined' && app) {
        } else {
            app = initializeApp(firebaseConfig);
        }
        
        authInstance = getAuth(app);
        dbInstance = getFirestore(app);
        
        console.log("✅ Firebase SDK 초기화 성공."); 
    } catch (error) {
        console.error("FATAL ERROR during initializeApp:", error.message);
        initialError = `Firebase SDK 초기화 실패: ${error.message}`;
        authInstance = null;
        dbInstance = null;
    }
}

// -----------------------------------------------------------------------------
// 3. Context 및 Hook 정의
// -----------------------------------------------------------------------------

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState('');

    useEffect(() => {
        if (initialError) {
            setAuthError(initialError);
            setLoading(false);
            return;
        }
        
        if (!authInstance) {
            setAuthError("Firebase Auth 인스턴스를 사용할 수 없습니다.");
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

        return () => {
            unsubscribe();
        };
    }, []); 

    const handleLogout = useCallback(async () => {
        if (!authInstance) return;
        try {
            await signOut(authInstance);
            setAuthError(''); 
        } catch (error) {
            console.error("로그아웃 오류:", error);
            setAuthError(`로그아웃 실패: ${error.message}`);
        }
    }, []);
    
    // 💡 로그인 함수
    const handleSignIn = useCallback(async (email, password) => {
        if (!authInstance) throw new Error("Firebase Auth instance not available.");
        setAuthError('');
        try {
            return await signInWithEmailAndPassword(authInstance, email, password);
        } catch(error) {
             const errorMessage = error.message.includes('api-key-expired') 
                 ? "인증 오류: API 키가 만료되었거나 권한이 없습니다."
                 : error.message.includes('api-key-not-valid') 
                 ? "인증 오류: API 키 문자열 형식이 잘못되었습니다."
                 : error.message;

            setAuthError(errorMessage);
            throw error; 
        }
    }, []);

    const handleSignUp = useCallback(async (email, password) => {
        if (!authInstance) throw new Error("Firebase Auth instance not available.");
        setAuthError('');
        try {
            return await createUserWithEmailAndPassword(authInstance, email, password);
        } catch(error) {
            setAuthError(error.message);
            throw error; 
        }
    }, []);


    // --------------------------------------------------
    // 🔥 401 오류 해결을 위한 핵심 함수: ID 토큰 가져오기 추가
    // --------------------------------------------------
    const getToken = useCallback(async () => {
        if (!user) {
            // 토큰을 가져올 사용자가 없으면 오류 발생
            throw new Error("Authentication required: No user logged in to retrieve token.");
        }
        try {
            // true를 전달하여 토큰이 만료되었을 경우 강제로 갱신하도록 합니다. (재로그인 필요성 감소)
            const idToken = await user.getIdToken(true); 
            return idToken;
        } catch (error) {
            console.error("Failed to get ID Token:", error);
            throw new Error("Failed to retrieve user ID token for server request.");
        }
    }, [user]); // user 객체가 변경될 때만 함수를 재생성


    // --------------------------------------------------
    // Context Value 정의
    // --------------------------------------------------
    const value = {
        user,
        loading,
        authError,
        handleLogout,
        handleSignIn,
        handleSignUp,
        getToken, // <--- 🔥 새롭게 추가된 함수
        authInstance, 
        dbInstance,
        setAuthError,
        setLoading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};