// src/components/LandingPage.js

'use client';

import React from 'react';

// t 함수는 '@/lib/translations'에서 임포트되었다고 가정합니다.

// --------------------------------------------------
// 상수 정의 (배경색 및 이미지 경로)
// --------------------------------------------------
const HERO_BG_COLOR = '#0f1a30'; 
const BACKGROUND_IMAGE_URL = '/images/background.jpg'; // public/images/background.jpg 경로

// --------------------------------------------------
// LandingPage 컴포넌트 정의
// --------------------------------------------------
const LandingPage = ({ onGetStarted, lang, t, user, openLoginModal }) => {
    
    // 💡 1. 특징 카드 6개 배열 정의 (누락 없이 이 위치에 정의되어야 함)
    const featureItems = [
        // 첫 번째 줄 (3개)
        { icon: '⚡', title: t('featureAI', lang) || 'AI 기반, 5배 빠른 설교 완성', summary: t('featureAISummary', lang) || 'AI 분석, 초안 작성, 내용 구성까지 시간을 절약합니다.' },
        { icon: '🧠', title: t('featureLearn', lang) || '나만의 설교 스타일 학습 AI', summary: t('featureLearnSummary', lang) || '사용자의 과거 스타일을 학습하여 목사님만의 개성이 담긴 초안을 완성합니다.' },
        { icon: '🌍', title: t('featureGlobal', lang) || '글로벌 선교를 위한 맞춤형 언어 지원', summary: t('featureGlobalSummary', lang) || '영어, 한국어는 물론, 주요 선교 지역 언어로 설교를 생성 및 편집할 수 있습니다.' },
        
        // 두 번째 줄 (3개)
        { icon: '💰', title: '목회 사역을 위한 현명한 투자', summary: 'SermonNote는 단순한 지출이 아닌, 효과적인 사역을 위한 핵심 투자입니다.' },
        { icon: '✍️', title: '영감 보존, 묵상 심화 촉진', summary: '떠오르는 영감을 놓치지 않고 메모하며, 설교 묵상 단계를 체계적으로 심화합니다.' },
        { icon: '🗂️', title: '체계적인 설교 자료 연구 관리', summary: '생성된 모든 설교, 묵상, 노트, 참고 자료를 자동으로 분류하고 정리하여 쉽게 검색하고 재사용합니다.' },
    ];

    // 💡 2. HeroSection 컴포넌트 정의 (LandingPage 컴포넌트 내부)
    const HeroSection = () => (
        <div 
            className="relative w-full h-[60vh] md:h-[80vh] flex flex-col items-center justify-center text-white overflow-hidden" 
            style={{ 
                backgroundColor: HERO_BG_COLOR, 
                // 💡 CSS 배경 이미지 URL을 직접 문자열로 적용하여 경로 문제를 우회합니다.
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${BACKGROUND_IMAGE_URL}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {/* 오버레이 효과 */}
            <div className="absolute inset-0 bg-black opacity-30"></div> 
            
            {/* 컨텐츠 영역 */}
            <div className="relative text-center max-w-4xl p-8 z-10">
                <h1 className="text-5xl md:text-7xl font-extrabold mb-4 drop-shadow-lg">
                    SermonNote
                </h1>
                <p className="text-xl md:text-2xl font-light mb-8 drop-shadow-md">
                    {t('landingSubtitle', lang) || "신앙을 깊게 하고, 통찰력을 정리하세요."}
                </p>
                <button 
                    onClick={onGetStarted} 
                    type="button"
                    className="px-10 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-red-700 transition transform hover:scale-105"
                >
                    {t('start', lang) || '시작하기'}
                </button>
            </div>
        </div>
    );
    
    // 💡 3. FeaturesSection 컴포넌트 정의 (LandingPage 컴포넌트 내부)
    const FeaturesSection = () => (
        <div className="w-full bg-white py-16 px-8">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-800 mb-12 border-b-2 border-red-500 pb-2">
                    SermonNote가 목회자님께 드리는 혁신적인 혜택
                </h2>
                <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
                    바쁜 일상 속에서 깊이 있는 설교를 준비하는 것은 쉽지 않습니다. SermonNote는 최첨단 AI 기술을 활용하여 목회자님의 시간을 절약하고, 더욱 풍성한 말씀으로 성도들을 양육할 수 있도록 돕습니다. 개인 맞춤형 설교 생성부터 전문 연구 관리까지, 모든 과정을 스마트하게 지원합니다.
                </p>
                
                {/* 6개의 카드 렌더링 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {featureItems.map((item, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition hover:shadow-2xl flex flex-col h-full">
                            <div className="text-4xl mb-4 text-red-500">{item.icon}</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                            <p className="text-gray-600 text-sm flex-1">{item.summary}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // LandingPage 최종 리턴
    return (
        <div className="w-full min-h-full flex flex-col items-center">
            <HeroSection />
            <FeaturesSection />
        </div>
    );
};

export default MainLanding;