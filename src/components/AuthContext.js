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
// 1. Firebase 설정 (환경 변수에서만 로드)
// -----------------------------------------------------------------------------
const firebaseConfig = {
    // ✅ [수정]: 모든 값을 환경 변수에서만 로드하여 보안을 강화하고 오류 키 하드코딩을 방지합니다.
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    // measurementId는 필수가 아니므로 생략합니다.
};

// -----------------------------------------------------------------------------
// 2. 인스턴스 초기화 및 초기 오류 저장
// -----------------------------------------------------------------------------
let app;
let authInstance;
let dbInstance;
let initialError = ''; 

// API 키 유효성 검사 (키가 없으면 초기화 시도도 하지 않습니다)
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isConfigValid) {
    initialError = "FATAL ERROR: Firebase API Key 또는 Project ID가 환경 변수에서 누락되었습니다. (.env 파일 확인 필요)";
    console.error(initialError);
    authInstance = null;
    dbInstance = null;
} else {
    try {
        // 중복 초기화 방지 로직 (Next.js SSR 환경에서 중요)
        if (typeof window !== 'undefined' && app) {
             // 이미 초기화된 경우 기존 인스턴스를 사용 (선택 사항)
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
    // 🚨 [FIX]: 초기화 실패 시에도 오류 메시지를 반환할 수 있도록 예외 처리
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

    // Firebase 인증 상태 구독
    useEffect(() => {
        // 🚨 1. 초기화 시점에서 발생한 에러를 먼저 처리합니다.
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
        
        // 2. 인증 상태 구독 시작
        const unsubscribe = onAuthStateChanged(authInstance, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            setAuthError(''); // 정상적으로 상태를 가져오면 에러 초기화
        }, (error) => {
            // 인증 과정 중 에러 발생 (만료된 키로 인한 오류도 여기에 포함됩니다)
            console.error("인증 상태 변경 중 오류 발생:", error);
            setAuthError(`Firebase 인증 오류: ${error.message}`);
            setLoading(false);
        });

        // 클린업 함수
        return () => {
            unsubscribe();
        };
    }, []); 

    // --------------------------------------------------
    // 인증 핸들러 (LoginModal 등에서 사용)
    // --------------------------------------------------
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
    
    // 💡 로그인 함수: 오류 처리 강화
    const handleSignIn = useCallback(async (email, password) => {
        if (!authInstance) throw new Error("Firebase Auth instance not available.");
        setAuthError('');
        try {
            return await signInWithEmailAndPassword(authInstance, email, password);
        } catch(error) {
            // 로그인 실패 시 발생하는 오류를 명확히 처리하여 팝업에 표시
             const errorMessage = error.message.includes('api-key-expired') 
                 ? "인증 오류: API 키가 만료되었거나 권한이 없습니다. (개발자 확인 필요)"
                 : error.message;

            setAuthError(errorMessage);
            throw error; // 호출 컴포넌트가 오류를 catch하도록 다시 던집니다.
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
    // Context Value 정의
    // --------------------------------------------------
    const value = {
        user,
        loading,
        authError,
        handleLogout,
        handleSignIn,
        handleSignUp,
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