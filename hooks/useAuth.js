'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --------------------------------------------------
// 🚨 중요: 전역 변수를 사용하여 환경 설정 가져오기 및 Fallback 추가 (수정됨)
// --------------------------------------------------
const firebaseConfig = (typeof __firebase_config !== 'undefined' && __firebase_config) 
    ? JSON.parse(__firebase_config) 
    : { apiKey: 'FAKE_API_KEY', authDomain: 'fake-domain.firebaseapp.com', projectId: 'fake-project' }; // ⭐️ Fallback 설정 추가
    
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// 1. Context 생성
const AuthContext = createContext({
    user: null,
    loading: true,
    auth: null,
    db: null,
    authError: null,
});

// 2. AuthProvider 컴포넌트
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authInstance, setAuthInstance] = useState(null);
    const [dbInstance, setDbInstance] = useState(null);
    const [authError, setAuthError] = useState(null);

    // Firebase 앱 초기화 및 인증/DB 인스턴스 설정
    useEffect(() => {
        // Fallback 추가로 이 조건은 이제 Firebase API 키가 실제로 누락되었을 때만 걸립니다.
        // FAKE_API_KEY가 사용될 경우, 이 조건은 통과합니다.
        if (!firebaseConfig.apiKey || Object.keys(firebaseConfig).length === 0) {
            console.error("Firebase Config is missing the API Key or is empty.");
            setAuthError("Firebase 설정 정보가 누락되었습니다. (API Key 확인 필요)");
            setLoading(false);
            return;
        }

        let unsubscribeAuth = () => {}; // 초기 unsubscribe 함수

        try {
            // Firebase 앱 초기화
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            
            setAuthInstance(auth);
            setDbInstance(db);
            
            // --------------------------------------------------
            // ⭐️ 1. onAuthStateChanged 리스너 설정 (클린업을 위해 최상위로 이동)
            // --------------------------------------------------
            unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                // 🚨 인증 상태 변화가 감지되면 로딩 종료 (signInWithCustomToken/signInAnonymously 성공 후에도 호출됨)
                setLoading(false);
                console.log("Auth initialized. User:", currentUser ? currentUser.uid : "Anonymous/None");
            });

            // --------------------------------------------------
            // ⭐️ 2. Custom/익명 로그인 실행
            // --------------------------------------------------
            const signInUser = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Firebase Authentication Error during sign-in:", error);
                    setAuthError(`로그인 오류: ${error.message}`);
                    // 로그인 실패 시에도 로딩 스피너에서 벗어날 수 있도록 합니다.
                    setLoading(false); 
                }
            };

            signInUser();

        } catch (error) {
            console.error("Firebase Initialization Error:", error);
            setAuthError("Firebase 초기화 중 심각한 오류가 발생했습니다.");
            setLoading(false);
        }
        
        // useEffect 클린업: onAuthStateChanged 구독 해제
        return () => unsubscribeAuth();
    }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 실행

    const value = {
        user,
        loading,
        auth: authInstance,
        db: dbInstance,
        authError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. useAuth 커스텀 훅
export const useAuth = () => {
    return useContext(AuthContext);
};
