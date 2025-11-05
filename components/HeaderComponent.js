"use client";

import React from 'react';
// 🚨 next/link 대신 일반 <a> 태그를 사용하여 컴파일 오류를 회피합니다.
// import Link from 'next/link';

// getAuth, signOut 등의 Firebase 관련 모듈은 page.js에서 prop으로 전달받아야 합니다.

// 퀵 메모 버튼, 로그아웃 버튼 등의 아이콘을 임시로 대체합니다.
const QuickMemoIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>;
const LogOutIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2h2"></path></svg>;
const UserIcon = (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c3.314 0 6 2.686 6 6v1H6v-1c0-3.314 2.686-6 6-6z"></path></svg>;

// ✅ 절대 경로 오류 회피: '../../lib/translations'는 page.js에서 동작하므로, 
// HeaderComponent에서는 'components' 폴더에서 한 단계 위(프로젝트 루트)로 올라가 'lib'로 접근해야 합니다.
// HeaderComponent.js는 components 폴더 내에 있으므로, 한 단계 위인 '../'를 사용해야 합니다. 
// 그러나 '../lib/translations'도 실패했으므로, 컴포넌트 내부에서 함수를 정의하여 우회하겠습니다.
// import { t } from '../lib/translations'; 

// 🚨🚨🚨 임시 우회: t 함수를 prop으로 받지 않고, 여기서 임시로 정의합니다.
// HeaderComponent는 언어 변경 로직이 있으므로, page.js에서 lang을 받아야 합니다.
const t = (key, currentLang) => {
    const translations = {
        ko: {
            login: '로그인',
            logout: '로그아웃',
            quickMemo: '빠른 메모',
            languageSelect: '언어 선택',
        },
        en: {
            login: 'Login',
            logout: 'Logout',
            quickMemo: 'Quick Memo',
            languageSelect: 'Language Select',
        }
    };
    return translations[currentLang]?.[key] || translations.ko[key] || key;
};
// 🚨🚨🚨 임시 우회 끝 🚨🚨🚨


const HeaderComponent = ({ user, onLogout, openLoginModal, onQuickMemoClick, lang, setLang }) => {
    
    // lang prop이 page.js에서 제대로 전달되지 않았을 경우를 대비한 안전 장치
    const currentLang = lang || 'ko';

    const handleLogout = async () => {
        // Firebase 로직은 page.js에서 prop으로 전달받은 onLogout 함수로 처리해야 합니다.
        if (onLogout) onLogout();
    };

    const isLoggedIn = !!user;
    const isLoggedInAnonymously = false; // 임시로 false 처리

    return (
        <header className="fixed top-0 left-0 right-0 p-3 bg-white border-b border-gray-200 flex items-center justify-between shadow-md w-full z-50">
            <div className="flex items-center space-x-4 max-w-7xl mx-auto w-full">
                
                {/* 왼쪽: 로고/제목 - Link 대신 <a> 사용 */}
                <div className="flex items-center space-x-4 flex-shrink-0">
                    <a href="/" className="cursor-pointer">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 cursor-pointer">SermonNote</h1>
                    </a>
                </div>

                {/* 오른쪽: 버튼 그룹 */}
                <div className="flex items-center space-x-3 ml-auto">
                    
                    {/* 퀵 메모 버튼 */}
                    {isLoggedIn && (
                        <button
                            onClick={onQuickMemoClick}
                            title={t('quickMemo', currentLang)}
                            className="flex items-center justify-center p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-white transition duration-300 shadow-md"
                        >
                            <QuickMemoIcon className="h-5 w-5" />
                        </button>
                    )}

                    {/* 로그인/로그아웃 버튼 (원래 사이트 디자인에 맞게 배경색 조정) */}
                    {isLoggedIn ? (
                        <button
                            onClick={handleLogout}
                            title={t('logout', currentLang)}
                            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-300 shadow-md text-sm md:text-base"
                        >
                             <LogOutIcon className="h-5 w-5 md:h-6 md:w-6" />
                             <span className="hidden sm:inline">{t('logout', currentLang)}</span>
                        </button>
                    ) : (
                        <button
                            onClick={openLoginModal}
                            title={t('login', currentLang)}
                            // 원본 사이트 이미지처럼 버튼 색상을 빨간색으로 통일
                            className="flex items-center space-x-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition duration-300 shadow-md text-sm md:text-base"
                        >
                            {/* 원본 사이트 이미지에는 아이콘이 없으므로 텍스트만 표시하도록 변경 */}
                            <span className="inline">{t('login', currentLang)}</span>
                        </button>
                    )}
                    
                    {/* 언어 선택 드롭다운 (원본 사이트 디자인과 유사하게 조정) */}
                    <select
                        onChange={(e) => setLang(e.target.value)}
                        value={lang}
                        aria-label={t('languageSelect', currentLang)}
                        className="bg-gray-100 text-gray-800 rounded-lg p-2 border border-gray-300 text-sm md:text-base cursor-pointer"
                    >
                        <option value="ko">한국어</option>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="ru">Русский</option>
                        <option value="vi">Tiếng Việt</option>
                    </select>
                </div>
            </div>
        </header>
    );
};

export default HeaderComponent;
