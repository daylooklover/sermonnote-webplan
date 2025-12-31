'use client';

import React, { useMemo } from 'react';
import { UserIcon } from '@/components/IconComponents';
import { t } from '@/lib/translations';

const LandingPage = ({ onGetStarted, user, onLogout, openLoginModal, lang, setLang }) => {
    // 🎨 이미지 및 색상 설정 (안전하게 함수 내부에 배치)
    const HERO_IMG = '/images/background.jpg';
    const HERO_BG = '#0f172a';

    // 1. 전체 특징 아이템 정의
    const allFeatures = useMemo(() => [
        { icon: '⚡', title: t('feature1Title', lang), summary: t('feature1Description', lang) },
        { icon: '🧠', title: t('feature2Title', lang), summary: t('feature2Description', lang) },
        { icon: '🌍', title: t('feature3Title', lang), summary: t('feature3Description', lang) },
        { icon: '💰', title: t('feature4Title', lang), summary: t('feature4Description', lang) },
        { icon: '✍️', title: t('feature5Title', lang), summary: t('feature5Description', lang) },
        { icon: '🗂️', title: t('feature6Title', lang), summary: t('feature6Description', lang) },
    ], [lang]);

    // 2. 🚀 4시간마다 순서를 바꾸는 셔플 로직
    const shuffledFeatures = useMemo(() => {
        const items = [...allFeatures];
        const timeSeed = Math.floor(Date.now() / (1000 * 60 * 60 * 4)); 
        
        for (let i = items.length - 1; i > 0; i--) {
            const j = (timeSeed + i) % (i + 1);
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }, [allFeatures]);

    const topFeatures = shuffledFeatures.slice(0, 2);
    const bottomFeatures = shuffledFeatures.slice(2);

    return (
        <div className="w-full bg-gray-50 dark:bg-gray-900 font-sans">
       
{/* --- 웅장한 Hero Section (재민이의 필살기) --- */}
<div 
    className="relative flex flex-col items-center justify-center min-h-[85vh] text-center p-8 text-white overflow-hidden"
    style={{
        backgroundColor: '#0f172a', 
        // 🚀 핵심: 아래 경로를 '토씨 하나 틀리지 말고' 그대로 넣으세요. 따옴표 필수!
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url("/images/background.jpg")', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex' // 레이아웃 강제 활성화
    }}
>
                {/* 우측 상단 메뉴 */}
                <div className="absolute top-0 right-0 p-6 flex items-center space-x-4 z-30">
                    {!user ? (
                        <button
                            onClick={openLoginModal}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition"
                        >
                            <UserIcon className="w-5 h-5" />
                            <span>Login</span>
                        </button>
                    ) : (
                        <button onClick={onLogout} className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition font-bold">Logout</button>
                    )}
                    <select
                        onChange={(e) => setLang(e.target.value)}
                        value={lang}
                        className="bg-black/30 text-white rounded-lg p-2 border border-white/20 backdrop-blur-md outline-none cursor-pointer"
                    >
                        <option value="ko" className="text-black">한국어</option>
                        <option value="en" className="text-black">English</option>
                        <option value="zh" className="text-black">中文</option>
                        <option value="ru" className="text-black">Русский</option>
                        <option value="vi" className="text-black">Tiếng Việt</option>
                    </select>
                </div>
                
                {/* 메인 로고 및 슬로건 */}
                <div className="relative z-10">
                    <h1 className="text-7xl md:text-9xl font-black mb-6 drop-shadow-2xl tracking-tighter">SermonNote</h1>
                    <p className="text-2xl md:text-3xl font-light mb-12 drop-shadow-lg opacity-90 max-w-3xl mx-auto leading-relaxed">
                        Deepen Your Faith, Organize Your Insights.
                    </p>
                    <button
                        onClick={onGetStarted || openLoginModal}
                        className="px-14 py-6 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-2xl transition transform hover:scale-110 text-3xl"
                    >
                        {t('getStarted', lang)}
                    </button>
                </div>

                {/* 은은한 입자 효과 */}
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
            </div>

            {/* --- Features Section (2+4 구조) --- */}
            <section className="py-24 px-8 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-gray-100 mb-6 tracking-tight">{t('featuresTitle', lang)}</h2>
                    <div className="w-24 h-2 bg-red-600 mx-auto rounded-full"></div>
                </div>

                {/* 🚀 상단 핵심 2개 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
                    {topFeatures.map((item, index) => (
                        <div key={`top-${index}`} className="group flex flex-col items-center justify-center p-14 bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-gray-700 transition-all hover:-translate-y-3">
                            <div className="text-9xl mb-8 group-hover:scale-110 transition-transform drop-shadow-md">{item.icon}</div>
                            <h3 className="text-4xl font-black text-gray-800 dark:text-gray-100 mb-5 text-center">{item.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-xl text-center leading-relaxed">{item.summary}</p>
                        </div>
                    ))}
                </div>

                {/* 🚀 하단 나머지 4개 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {bottomFeatures.map((item, index) => (
                        <div key={`bottom-${index}`} className="flex flex-col items-center p-10 bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl border border-gray-50 dark:border-gray-700 transition-all hover:shadow-2xl hover:-translate-y-2">
                            <div className="text-5xl mb-6">{item.icon}</div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3 text-center leading-tight">{item.title}</h3>
                            <p className="text-base text-gray-500 dark:text-gray-400 text-center leading-relaxed line-clamp-4">{item.summary}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="py-16 bg-gray-900 text-gray-400 text-center">
                <p className="mb-6 text-base font-semibold tracking-widest uppercase">{t('privacyPolicy', lang)} | {t('termsOfService', lang)}</p>
                <p className="text-sm opacity-50">&copy; {new Date().getFullYear()} SermonNote. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;