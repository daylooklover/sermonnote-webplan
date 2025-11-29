"use client";

import React, { useState, useEffect } from 'react'; 
import { t } from '../lib/translations'; 

// 아이콘 컴포넌트들 (IconComponents.js 파일에 정의되어 있어야 합니다.)
import { PlusCircleIcon, BibleIcon, RealLifeIcon, QuickMemoIcon, RebirthIcon, PremiumIcon } from './IconComponents';

export default function SermonSelection({ 
    user, 
    setSelectedSermonType, 
    openLoginModal, 
    onGoToRebirthSermon, 
    onGoToLanding, 
    lang, 
    setLang,
    ...commonProps 
}) {
    const [sermonTypes, setSermonTypes] = useState(null);

    // 🚨 [FIX]: 't'를 의존성 배열에서 제거했습니다. 'lang' 변경 시에만 재실행됩니다.
    useEffect(() => {
        // 이 로직은 window 객체가 정의된 브라우저 환경에서만 실행됩니다.
        const types = [
            {
                type: 'ai-assistant-sermon',
                title: t('sermonAssistant', lang) || '설교 AI 어시스턴트',
                description: t('sermonAssistantDescription', lang) || '질의응답을 통해 설교 아이디어를 얻고 초안을 생성합니다.',
                icon: <PlusCircleIcon className="w-10 h-10 text-blue-500" />
            },
            {
                type: 'expository-sermon',
                title: t('expositorySermon', lang) || '강해 설교',
                description: t('expositorySermonDescription', lang) || '성경 본문을 깊이 파고들어 말씀의 의미를 해석합니다.',
                icon: <BibleIcon className="w-10 h-10 text-green-500" />
            },
            {
                type: 'real-life-sermon',
                title: t('realLifeSermon', lang) || '삶과 연결된 설교',
                description: t('realLifeSermonDescription', lang) || '현대 생활의 이슈와 성경적 진리를 연결하여 실용적인 메시지를 전달합니다.',
                icon: <RealLifeIcon className="w-10 h-10 text-red-500" />
            },
            {
                type: 'quick-memo-sermon',
                title: t('quickMemoSermon', lang) || '빠른 메모 설교',
                description: t('quickMemoSermonDescription', lang) || '영감받은 메모를 바탕으로 설교 초안을 손쉽게 작성합니다.',
                icon: <QuickMemoIcon className="w-10 h-10 text-yellow-500" />
            },
            {
                type: 'rebirth-sermon',
                title: t('rebirthSermon', lang) || '설교의 재탄생',
                description: t('rebirthSermonDescription', lang) || '과거와 유명한 설교 내용을 바탕으로 새로운 재해석을 생성합니다.',
                icon: <RebirthIcon className="w-10 h-10 text-purple-500" />
            },
            {
                type: 'premium-upgrade',
                title: t('upgradeToPremium', lang) || '프리미엄으로 업그레이드',
                description: t('premiumSubscriptionDescription', lang) || '프리미엄 구독을 통해 무제한 설교 생성을 경험하세요.',
                icon: <PremiumIcon className="w-10 h-10 text-yellow-600" />
            }
        ];
        setSermonTypes(types);
    }, [lang]); // ⭐️ 't' 제거

    // 데이터가 로딩되지 않았다면 (SSR 단계에서는 항상 null이므로) 로딩 화면 반환
    if (!sermonTypes) {
        return <div className="text-center p-8">로딩 중...</div>;
    }

    return (
        <div className="w-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans min-h-screen pt-16">
            <main className="text-center space-y-8 p-8 max-w-7xl mx-auto">
                <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
                    {t('chooseSermonType', lang) || 'Choose Sermon Type'}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    {t('chooseSermonTypeDescription', lang) || 'Select the most suitable sermon type to start preparing your message.'}
                </p>
                
                {/* ⭐ 핵심 수정: 그리드 클래스 및 최대 너비를 이미지에 맞게 수정하여 3열 정렬 확보 ⭐ */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {sermonTypes.map(sermon => {
                        
                        const handleClick = () => {
                            // 로그인 상태 확인은 Premium 카드를 클릭했을 때만 건너뛰는 것이 맞을 수 있지만,
                            // 현재 로직을 유지하고 Home.js에서 로그인 여부를 확인합니다.
                            if (!user && sermon.type !== 'premium-upgrade') {
                                openLoginModal();
                            } else if (sermon.type === 'rebirth-sermon' && onGoToRebirthSermon) {
                                onGoToRebirthSermon();
                            } else {
                                setSelectedSermonType(sermon.type);
                            }
                        };
                        
                        return (
                            <button
                                key={sermon.type}
                                onClick={handleClick}
                                className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 text-left"
                            >
                                <div className="mb-4">{sermon.icon}</div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{sermon.title}</h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{sermon.description}</p>
                            </button>
                        );
                    })}
                </div>
            </main>
            {/* onGoToLanding 버튼을 추가하여 초기 화면으로 돌아갈 수 있게 합니다. */}
            <div className="text-center pb-8">
                    <button 
                        onClick={onGoToLanding} 
                        className="mt-6 text-sm text-gray-500 hover:text-gray-800 transition"
                    >
                        {'<< 초기 화면으로 돌아가기'}
                    </button>
            </div>
        </div>
    );
}