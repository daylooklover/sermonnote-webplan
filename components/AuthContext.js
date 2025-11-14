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
        
        // ⭐️ FIX: authInstance와 dbInstance를 동기적으로 설정하여 다음 렌더링에 반영
        setAuthInstance(auth);
        setDbInstance(db);
        
        let unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            // 이 리스너는 인증 상태가 변경될 때마다 호출되며, 로딩을 false로 설정합니다.
            setUser(currentUser);
            setLoading(false); 
            console.log("Auth initialized. User:", currentUser ? currentUser.uid : "Anonymous/None");
        });

        const signInUser = async () => {
            try {
                // 이미 onAuthStateChanged 리스너가 사용자 상태를 감지하고 있으므로
                // 여기서는 토큰이 있을 경우에만 명시적 사인을 시도합니다.
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else if (!auth.currentUser) {
                    // ⭐️ 익명 로그인을 시도하여 currentUser가 null이 되지 않도록 합니다.
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Firebase Authentication Error during sign-in:", error);
                setAuthError(`로그인 오류: ${error.message}`);
                setLoading(false); 
            }
        };

        // ⭐️ FIX: authInstance가 설정된 후, 비동기 로그인 로직을 시작
        signInUser();
        
        return () => unsubscribeAuth();
    }, []); // 초기 로드 시에만 실행되도록 빈 배열 유지

    // ⭐️ useAuth에서 auth는 authInstance로 통일하여 전달합니다.
    const value = { user, loading, authInstance: authInstance, db: dbInstance, authError, handleLogout };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. useAuth 커스텀 훅
export const useAuth = () => {
    // ⭐️ FIX: authInstance를 auth가 아닌 authInstance 키로 전달하므로, useAuth에서 authInstance로 받도록 합니다.
    const context = useContext(AuthContext);
    const { authInstance, ...rest } = context;
    
    // app/page.js의 useAuth 구조 (authInstance와 db를 별도로 받지 않고 모두 rest에 포함된 채로 받음)에 맞춰
    // authInstance를 auth 키로 전달받도록 context 정의부를 수정했습니다.
    return context; // context에는 { user, loading, authInstance, db, authError, handleLogout }가 포함됨
};