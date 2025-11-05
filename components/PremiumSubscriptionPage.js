"use client";

import React, { useState } from 'react';

// Check icon component
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-green-500"><path d="M20 6 9 17l-5-5"/></svg>
);

// Success icon component
const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

// Helper function to calculate annual price with discount
const calculateAnnualPrice = (monthlyPrice, discountRate) => {
    const annualBase = monthlyPrice * 12;
    const discountedPrice = annualBase * (1 - discountRate);
    return Math.round(discountedPrice);
};

// --- 🚨 요금제 데이터 (유지) 🚨 ---
const monthlyStandard = 30;
const annualDiscountStandard = 0.1667; // 16.67% off for $300/year (vs $360)

const monthlyPremium = 60;
const annualDiscountPremium = 0.20; // 20% off for $576/year (vs $720)


// Plan data definition
// 🚨 lang prop을 받아 다국어 처리를 합니다.
const plans = (setShowModal, t, lang) => [ 
    {
        // 🚨 다국어 적용
        name: t('planFreeMember', lang) || 'Free Member', 
        monthlyPrice: 'Free',
        annualPrice: 'Free',
        // 🚨 다국어 적용
        description: t('freePlanDescription', lang) || 'Try SermonNote\'s basic features for free.',
        features: [
            // 🚨 다국어 적용 (변수 치환 필요)
            t('sermonGenTimes', lang, { 0: 5 }) || 'Sermon Generation 5 times/month', 
            t('aiAnnotationTimes', lang, { 0: 5 }) || 'AI Annotation 5 times/month',
            t('textEditor', lang) || 'Text Editor',
        ],
        // 🚨 다국어 적용
        buttonText: t('getStarted', lang) || 'Get Started',
        buttonAction: () => console.log('Free member: Get Started clicked.'),
        isPrimary: false,
    },
    {
        // 🚨 다국어 적용
        name: t('planStandardMember', lang) || 'Standard Member',
        monthlyPrice: `${monthlyStandard} $/month`,
        annualPrice: `${calculateAnnualPrice(monthlyStandard, annualDiscountStandard)} $/year (${Math.round(annualDiscountStandard * 100)}% off)`, 
        monthlyPriceValue: monthlyStandard, 
        annualDiscountRate: Math.round(annualDiscountStandard * 100),
        // 🚨 다국어 적용
        description: t('standardPlanDescription', lang) || 'Provides core features to enhance sermon preparation efficiency.',
        features: [
            // 🚨 다국어 적용
            t('sermonGenTimes', lang, { 0: 100 }) || 'Sermon Generation 100 times/month', 
            t('aiAnnotationTimes', lang, { 0: 100 }) || 'AI Annotation 100 times/month',
            t('advancedTextEditor', lang) || 'Advanced AI Text Editor',
            t('limitedSupport', lang) || 'Priority Tech Support (limited)',
        ],
        // 🚨 다국어 적용
        buttonText: t('subscribeNow', lang) || 'Subscribe Now',
        buttonAction: () => {
            console.log('Standard membership subscription initiated.');
            // 🚨 임시 결제 성공 처리 후 모달 띄우기
            setShowModal(true); 
        },
        isPrimary: false,
    },
    {
        // 🚨 다국어 적용
        name: t('planPremiumMember', lang) || 'Premium Member',
        monthlyPrice: `${monthlyPremium} $/month`,
        annualPrice: `${calculateAnnualPrice(monthlyPremium, annualDiscountPremium)} $/year (${Math.round(annualDiscountPremium * 100)}% off)`, 
        monthlyPriceValue: monthlyPremium, 
        annualDiscountRate: Math.round(annualDiscountPremium * 100),
        // 🚨 다국어 적용
        description: t('premiumPlanDescription', lang) || 'The all-in-one solution for the ultimate sermon experience.',
        features: [
            // 🚨 다국어 적용
            t('unlimitedSermonGen', lang) || 'Unlimited Sermon Generation',
            t('unlimitedAnnotation', lang) || 'Unlimited AI Annotation',
            t('advancedTextEditor', lang) || 'Advanced AI Text Editor',
            t('unlimitedSupport', lang) || 'Priority Tech Support (unlimited)',
        ],
        // 🚨 다국어 적용
        buttonText: t('subscribeNow', lang) || 'Subscribe Now',
        buttonAction: () => {
            console.log('Premium membership subscription initiated.');
            // 🚨 임시 결제 성공 처리 후 모달 띄우기
            setShowModal(true);
        },
        isPrimary: true, // Emphasize this plan
    },
];

// 🚨 Home.js에서 t와 lang prop을 받도록 수정
const PremiumSubscriptionPage = ({ onGoBack, t, lang }) => { 
    const [isAnnual, setIsAnnual] = useState(false);
    // 💡 추가된 상태: 구독 성공 모달
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // 모달을 닫고 메인 화면으로 이동
    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        onGoBack(); 
    }

    // 🚨 t와 lang prop을 plans 함수에 전달
    const currentPlans = plans(setShowSuccessModal, t, lang); 

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                {/* 🚨 다국어 적용 */}
                <h2 className="text-4xl font-extrabold text-white">{t('chooseYourPlan', lang) || 'Choose Your Plan'}</h2>
                {/* 🚨 다국어 적용 */}
                <p className="text-lg text-gray-400 mt-2 max-w-3xl mx-auto">
                    {t('planSubtitle', lang) || 'SermonNote offers a variety of plans optimized for every user.'}
                </p>
            </div>
            
            {/* 가격 토글 버튼 */}
            <div className="flex items-center space-x-3 mb-10 bg-gray-800 p-2 rounded-full shadow-lg">
                {/* 🚨 다국어 적용 */}
                <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-blue-400' : 'text-gray-400'}`}>{t('monthly', lang) || 'Monthly'}</span>
                <button
                    onClick={() => setIsAnnual(!isAnnual)}
                    className={`
                        relative w-14 h-8 flex items-center rounded-full transition-colors duration-300
                        ${isAnnual ? 'bg-blue-600' : 'bg-gray-600'}
                    `}
                >
                    <span
                        className={`
                            absolute w-6 h-6 bg-white rounded-full shadow transition-transform duration-300
                            ${isAnnual ? 'translate-x-7' : 'translate-x-1'}
                        `}
                    />
                </button>
                {/* 🚨 다국어 적용 */}
                <span className={`text-sm font-semibold transition-colors ${isAnnual ? 'text-blue-400' : 'text-gray-400'}`}>
                    {t('annually', lang) || 'Annually'}
                    {/* 🚨 다국어 적용 (변수 치환 필요) */}
                    <span className="text-xs text-yellow-400 font-bold ml-1 hidden sm:inline">({t('saveUpTo', lang, { 0: 20 }) || 'SAVE UP TO 20%'})</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                {currentPlans.map((plan, index) => {
                    const priceDisplay = isAnnual && plan.annualPrice !== 'Free' 
                        ? plan.annualPrice 
                        : plan.monthlyPrice;

                    const periodDisplay = isAnnual && plan.annualPrice !== 'Free' 
                        ? '/year' 
                        : (plan.monthlyPrice !== 'Free' ? '/month' : '');

                    return (
                        <div 
                            key={index}
                            className={`
                                bg-gray-800 p-8 rounded-2xl shadow-xl border 
                                ${plan.isPrimary ? 'border-blue-500 ring-4 ring-blue-500/50' : 'border-gray-700'} 
                                flex flex-col transform transition-all duration-300 hover:scale-[1.03]
                            `}
                        >
                            <div className="relative">
                                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                                {/* 추천 플랜 배지 */}
                                {plan.isPrimary && (
                                    // 🚨 다국어 적용
                                    <span className="absolute top-0 right-0 px-3 py-1 bg-yellow-500 text-gray-900 text-xs font-bold rounded-full transform translate-x-4 -translate-y-4 shadow-md">
                                        {t('bestValue', lang) || 'BEST VALUE'}
                                    </span>
                                )}
                            </div>
                            
                            <p className="text-5xl font-extrabold text-blue-400 mb-1 flex items-baseline">
                                {/* 가격만 추출해서 크게 표시 */}
                                {priceDisplay.split(' ')[0]}
                                <span className="text-xl font-medium ml-1 text-gray-400">{periodDisplay}</span>
                            </p>
                            
                            {/* 연간 할인 정보 표시 */}
                            <p className="text-sm text-gray-400 mb-6">
                                {isAnnual && plan.annualPrice !== 'Free' 
                                    // 🚨 다국어 적용 (변수 치환 필요)
                                    ? t('saveVsMonthly', lang, { 0: plan.annualDiscountRate }) || `Save ${plan.annualDiscountRate}% (vs. monthly)` 
                                    // 🚨 다국어 적용 (변수 치환 필요)
                                    : (plan.monthlyPrice !== 'Free' ? t('billedAnnualy', lang, { 0: plan.monthlyPriceValue * 12 }) || `Billed ${plan.monthlyPriceValue * 12} $/year` : '\u00a0')}
                            </p>
                            
                            <div className="flex-grow">
                                <ul className="text-left space-y-3 mb-8 text-gray-300">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start space-x-3">
                                            <CheckIcon />
                                            {/* feature 자체가 이미 다국어 처리된 문자열입니다. */}
                                            <span className="leading-relaxed">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <button
                                onClick={plan.buttonAction}
                                className={`
                                    w-full px-6 py-3 font-semibold rounded-xl shadow-lg transition duration-300
                                    ${plan.isPrimary ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:translate-y-[-2px]' : 'bg-gray-700 hover:bg-gray-600 text-white'}
                                `}
                            >
                                {plan.buttonText}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            <button
                onClick={onGoBack}
                // 🚨 다국어 적용
                className="mt-12 text-gray-400 hover:text-white transition duration-300 px-4 py-2 rounded-lg border border-gray-700 hover:border-white"
            >
                {t('goBack', lang) || 'Go Back'} ({t('sermonSelectionReturn', lang) || '설교 유형 선택 화면으로 돌아가기'})
            </button>

            {/* 구독 성공 모달 */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-70 flex items-center justify-center p-4">
                    <div className="bg-gray-800 p-8 rounded-xl shadow-2xl text-center max-w-sm w-full border border-green-600">
                        <SuccessIcon />
                        {/* 🚨 다국어 적용 */}
                        <h3 className="text-3xl font-bold text-white mb-2">{t('subscriptionSuccessful', lang) || 'Subscription Successful!'}</h3>
                        {/* 🚨 다국어 적용 */}
                        <p className="text-gray-400 mb-6">
                            {t('welcomePremiumTier', lang) || 'Welcome to the Premium tier. Enjoy unlimited access to all SermonNote features.'}
                        </p>
                        <button
                            onClick={handleCloseSuccess}
                            className="w-full px-6 py-3 font-semibold rounded-xl shadow-lg bg-green-600 hover:bg-green-700 text-white transition duration-300"
                        >
                            {/* 🚨 다국어 적용 */}
                            {t('startWritingSermons', lang) || 'Start Writing Sermons'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PremiumSubscriptionPage;
