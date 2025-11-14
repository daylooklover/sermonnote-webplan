'use client';

import React, { useState, useEffect } from 'react';
// Firebase 객체들을 가져옵니다. (경로를 '../../lib/firebase'로 수정하여 src 폴더 루트에서 시작)
import { auth, doSignOut } from '../../lib/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';

// 컴포넌트들을 가져옵니다. (경로를 '../../components/...'로 수정)
import HeaderComponent from '../../components/HeaderComponent';
import LoginModal from '../../components/LoginModal'; 

// 임시 로직: Firebase 설정이 완료되어 있다면 로그인/로그아웃 처리가 가능해야 합니다.

export default function Home() {
    const [user, setUser] = useState(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [lang, setLang] = useState('ko'); // 언어 상태 관리 (HeaderComponent에 전달)

    // 1. 인증 상태 변경 감지
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            // 인증 상태가 변경되면 모달을 닫습니다.
            if (currentUser && isLoginModalOpen) {
                setIsLoginModalOpen(false);
            }
        });
        return () => unsubscribe(); // 클린업 함수
    }, [isLoginModalOpen]);

    // 2. HeaderComponent에 전달할 함수 정의
    const handleLogout = async () => {
        try {
            await doSignOut();
            // 로그아웃 후 user 상태는 onAuthStateChanged 리스너가 처리합니다.
        } catch (error) {
            console.error("로그아웃 오류:", error);
        }
    };
    
    // 3. 퀵 메모 클릭 함수 (임시 더미 함수)
    const handleQuickMemoClick = () => {
        console.log("퀵 메모 기능 클릭됨");
        // 여기에 퀵 메모 관련 로직을 추가합니다.
    };

    return (
        <div className="pt-16 min-h-screen bg-gray-50">
            {/* HeaderComponent: openLoginModal 함수를 prop으로 전달 */}
            <HeaderComponent 
                user={user} 
                onLogout={handleLogout}
                openLoginModal={() => setIsLoginModalOpen(true)}
                onQuickMemoClick={handleQuickMemoClick}
                lang={lang}
                setLang={setLang}
            />

            <main className="max-w-7xl mx-auto p-6 mt-4">
                <h2 className="text-3xl font-bold mb-6 text-gray-800">SermonNote 애플리케이션</h2>
                <div className="p-8 bg-white rounded-xl shadow-lg">
                    <p className="text-gray-600">
                        환영합니다! 현재 사용자 상태: 
                        <span className="font-semibold text-red-600 ml-2">
                            {user ? user.email || "익명 사용자" : "로그아웃 상태"}
                        </span>
                    </p>
                    <p className="mt-4 text-sm text-gray-500">
                        이 공간은 메인 페이지 콘텐츠가 표시되는 영역입니다.
                    </p>
                </div>
            </main>

            {/* LoginModal: isLoginModalOpen 상태에 따라 렌더링. Instance prop 전달! */}
            {isLoginModalOpen && (
                <LoginModal 
                    // 🚨 핵심 수정: Firebase Auth 객체를 'Instance' prop으로 전달
                    Instance={auth} 
                    onClose={() => setIsLoginModalOpen(false)}
                    onLoginSuccess={() => console.log("Header Component의 onLoginSuccess 대신 onAuthStateChanged가 모달을 닫습니다.")}
                />
            )}
        </div>
    );
}