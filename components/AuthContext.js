// components/AuthContext.js

"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";

// 1. Context 생성
const AuthContext = createContext({
    user: null,
    db: null,
    loading: true,
});

// 2. Custom Hook
export const useAuth = () => {
    return useContext(AuthContext);
};

// 3. Provider Component
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth) {
            console.error("Firebase Auth 인스턴스가 null입니다.");
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        db,
        loading,
    };

    // 🚨🚨🚨 Hydration 오류 해결 🚨🚨🚨
    // 로딩 중일 때는 "Firebase 인증..." 메시지 대신 null을 반환하여
    // 서버 렌더링(null)과 클라이언트 렌더링(null)을 일치시킵니다.
    // AuthProvider는 이미 <Providers>로 감싸져 있으므로,
    // 이 시점에서는 앱의 메인 레이아웃이 이미 렌더링된 상태입니다.
    if (loading) {
        return null; // "Firebase 인증..." 메시지 제거
    }
    // 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};