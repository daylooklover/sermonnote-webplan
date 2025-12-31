// src/components/PricingSection.js
'use client';

import React, { useState, useMemo } from 'react';
import { ANNUAL_DISCOUNT_RATE, DUMMY_PRICE_IDS } from '@/constants/pricing'; 
import PaddleCheckout from './PaddleCheckout'; // 결제 로직을 분리한 컴포넌트

// =========================================================================
// 1. 가격 플랜 데이터 정의 (스크린샷 기반)
// =========================================================================

const BASE_PRICING_DATA = [
    { 
        id: 'standard', 
        title: '스탠다드', 
        monthlyPrice: 9.99, // 예시 가격
        features: [
            '설교 생성 5회/월', 
            'AI 주석 5회/월', 
            '일반 텍스트 에디터',
            '아카이브 접근은 제한됨',
            '아카이브 공유 제한'
        ], 
        isPopular: false 
    },
    { 
        id: 'premium', 
        title: '프리미엄 (Premium)', 
        monthlyPrice: 24.99, // 예시 가격
        features: [
            '🔥 AI 요약/정리 무제한', 
            '프리미엄 템플릿 사용', 
            '우선 기술 지원', 
            'KaTeX 수식 렌더링 지원'
        ], 
        isPopular: true 
    },
];

// =========================================================================
// 2. PricingSection 컴포넌트
// =========================================================================

export default function PricingSection({ userId, userEmail, t, lang, onSubscriptionSuccess }) { // userId를 props로 받도록 추가
    const [isAnnual, setIsAnnual] = useState(false);

    const discountedPricing = useMemo(() => {
        return BASE_PRICING_DATA.map(plan => {
            const annualPrice = plan.monthlyPrice * 12;
            const discountedAnnualPrice = annualPrice * (1 - ANNUAL_DISCOUNT_RATE);
            
            // 🚨 Price ID 선택: 선택된 주기에 맞는 Price ID를 DUMMY_PRICE_IDS에서 가져옵니다.
            const priceId = isAnnual 
                ? DUMMY_PRICE_IDS[`${plan.id}_annual`] 
                : DUMMY_PRICE_IDS[`${plan.id}_monthly`];

            return {
                ...plan,
                annualPrice: discountedAnnualPrice.toFixed(2),
                billingCycle: isAnnual ? 'annual' : 'monthly',
                priceId: priceId, // PaddleCheckout 컴포넌트로 전달할 Price ID
            };
        });
    }, [isAnnual, DUMMY_PRICE_IDS]);

    const localize = (key, defaultText) => t ? t(key, lang) : defaultText;
    
    return (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50">
            
            {/* 제목 및 부제 */}
            <h2 className="text-4xl font-extrabold mb-4 text-gray-900">
                {localize('chooseYourPlan', '최적의 플랜을 선택하세요')}
            </h2>
            <p className="text-lg text-gray-600 mb-10">
                {localize('billingCycleSubtitle', '언제든지 취소할 수 있습니다.')}
            </p>

            {/* 구독 주기 토글 버튼 */}
            <div className="bg-gray-100 p-1 rounded-full flex mb-12 shadow-inner border border-gray-200">
                <button
                    onClick={() => setIsAnnual(false)}
                    className={`px-8 py-3 rounded-full font-bold transition duration-300 text-base ${
                        !isAnnual ? 'bg-white text-red-700 shadow-lg transform scale-[1.03]' : 'text-gray-600 hover:text-red-500'
                    }`}
                >
                    {localize('monthly', '월간')}
                </button>
                <button
                    onClick={() => setIsAnnual(true)}
                    className={`px-8 py-3 rounded-full font-bold transition duration-300 relative text-base ${
                        isAnnual ? 'bg-white text-red-700 shadow-lg transform scale-[1.03]' : 'text-gray-600 hover:text-red-500'
                    }`}
                >
                    {localize('annual', '연간')}
                    <span className="absolute -top-3 right-0 bg-red-600 text-white text-xs font-semibold px-4 py-1 rounded-full transform rotate-3 shadow-md whitespace-nowrap">
                        {Math.round(ANNUAL_DISCOUNT_RATE * 100)}% 할인
                    </span>
                </button>
            </div>
            
            {/* 핵심: 가격 카드 컨테이너 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                
                {discountedPricing.map((plan) => (
                    
                    <div 
                        key={plan.id} 
                        className={`relative p-8 bg-white rounded-3xl shadow-xl flex flex-col h-full transition transform duration-300 
                            ${plan.isPopular ? 'border-4 border-red-500 hover:shadow-2xl' : 'border border-gray-200 hover:shadow-lg'}
                        `}
                    >
                        {/* 뱃지 */}
                        {plan.isPopular && (
                            <div className="absolute top-0 right-0 -mt-4 -mr-4">
                                <span className="inline-block bg-red-600 text-white text-xs font-semibold px-4 py-1 rounded-full shadow-lg">
                                    {localize('mostPopular', '가장 인기 많음')}
                                </span>
                            </div>
                        )}
                        
                        {/* 카드 상단: 제목 및 가격 */}
                        <h3 className="text-3xl font-extrabold mb-1 text-gray-900">
                            {plan.title}
                        </h3>
                        
                        <p className="text-sm text-gray-500 mb-6 min-h-[40px]">
                            {localize(`${plan.id}Description`, plan.id === 'premium' ? 'AI 무제한 사용과 모든 고급 기능을 활용하는 최상위 플랜입니다.' : '설교 초안을 작성하고 기본 AI 기능을 사용하는 플랜입니다.')}
                        </p>

                        <div className="my-4">
                            <span className="text-5xl font-bold text-gray-900">
                                ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                            </span>
                            <span className="text-gray-500 text-xl font-medium ml-2">
                                {isAnnual ? '/년' : '/월'}
                            </span>
                            {isAnnual && (
                                <p className="text-sm text-green-600 font-semibold mt-1">
                                    월 $ {(plan.annualPrice / 12).toFixed(2)} (할인 적용)
                                </p>
                            )}
                        </div>
                        <hr className="my-6 border-gray-200" />
                        
                        {/* 기능 목록 */}
                        <ul className="space-y-3 flex-grow mb-8">
                            {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-start text-gray-700">
                                    <span className="text-red-500 mr-2 mt-1">✓</span>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>

                        {/* 결제 버튼 (mt-auto로 항상 하단에 위치) */}
                        <div className="mt-auto pt-4">
                            <PaddleCheckout 
                                planId={plan.id}
                                priceId={plan.priceId} // 선택된 Price ID를 전달
                                billingCycle={plan.billingCycle}
                                userId={userId} // 웹훅 customData로 전달될 사용자 ID
                                email={userEmail}
                                t={t}
                                lang={lang}
                                onSubscriptionSuccess={onSubscriptionSuccess}
                                buttonText={localize('subscribeNow', '구독하기')}
                            />
                        </div>
                    </div>
                ))}
            </div>
            
        </div>
    );
}