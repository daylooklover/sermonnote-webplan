'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app'; 
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; 

// --------------------------------------------------
// 💡 FIREBASE CONFIGURATION & CONTEXT
// --------------------------------------------------

// 주의: 보안을 위해 실제 키는 환경 변수 (process.env.NEXT_PUBLIC_...) 사용을 권장합니다.
// 이 코드는 환경 변수가 없을 때 사용되는 Fallback 값입니다.
const firebaseConfig = (typeof __firebase_config !== 'undefined' && __firebase_config) 
    ? JSON.parse(__firebase_config) 
    : { 
        apiKey: "AIzaSyCMmm06VSbyqBXJHXNK8wxrEdg7JC4PQmM", // 실제 키로 변경 필요
        authDomain: "sermonnote-live.firebaseapp.com", 
        databaseURL: "https://sermonnote-live-default-rtdb.firebaseio.com",
        projectId: "sermonnote-live",
        storageBucket: "sermonnote-live.firebasestorage.app",
        messagingSenderId: "520754190508",
        appId: "1:520754190508:web:e72b48c3b493d2e63ee709",
        measurementId: "G-FC7PKSSDP3"
    }; 
    
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// 1. Context 생성
const AuthContext = createContext({
    user: null, loading: true, auth: null, db: null, authError: null,
    handleLogout: () => Promise.resolve(), // handleLogout 포함
});

// 2. AuthProvider 컴포넌트
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authInstance, setAuthInstance] = useState(null);
    const [dbInstance, setDbInstance] = useState(null);
    const [authError, setAuthError] = useState(null);

    // handleLogout 함수 정의
    const handleLogout = useCallback(async () => {
        if (authInstance) {
            try {
                await signOut(authInstance); 
                setUser(null); // 로그아웃 성공 시 user 상태 초기화
            } catch (error) {
                console.error("Logout Error:", error); 
                setAuthError("로그아웃 오류 발생: " + error.message);
            }
        }
    }, [authInstance]); // authInstance를 의존성 배열에 사용

    useEffect(() => {
        if (!firebaseConfig.apiKey || Object.keys(firebaseConfig).length === 0) {
            setAuthError("Firebase 설정 정보가 누락되었습니다. (API Key 확인 필요)");
            setLoading(false);
            return;
        }

        let app;
        if (getApps().length) { app = getApp(); } else { app = initializeApp(firebaseConfig); }

        const auth = getAuth(app);
        const db = getFirestore(app);
        
        setAuthInstance(auth);
        setDbInstance(db);
        
        let unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            console.log("Auth initialized. User:", currentUser ? currentUser.uid : "Anonymous/None");
        });

        const signInUser = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    if (!auth.currentUser) {
                        await signInAnonymously(auth);
                    }
                }
            } catch (error) {
                console.error("Firebase Authentication Error during sign-in:", error);
                setAuthError(`로그인 오류: ${error.message}`);
                setLoading(false); 
            }
        };

        signInUser();
        
        return () => unsubscribeAuth();
    }, []); // initialAuthToken이 변경될 여지가 있다면 [initialAuthToken]을 추가하세요.

    const value = { user, loading, auth: authInstance, db: dbInstance, authError, handleLogout };
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