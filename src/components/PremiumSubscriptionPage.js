'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { REFUND_POLICY_KEY, PRIVACY_POLICY_KEY, TERMS_OF_SERVICE_KEY } from '../constants/policyKeys';
import { ANNUAL_DISCOUNT_RATE, PADDLE_CLIENT_TOKEN, PADDLE_PRICE_IDS } from '../constants/pricing';
import { t } from '../utils/i18n';
import PolicyModal from './PolicyModal';

// 💡 가격 계산 헬퍼 함수
const calculateAnnualPrice = (monthlyPrice, discountRate) => {
    const annualBase = monthlyPrice * 12;
    const discountedPrice = annualBase * (1 - discountRate); 
    return discountedPrice.toFixed(2);
};

// 💡 아이콘 컴포넌트
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 flex-shrink-0 mt-0.5">
        <path d="M20 6 9 17l-5-5"/>
    </svg>
);

const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const LoadingSpinner = ({ message }) => (
    <div className="flex items-center justify-center space-x-2">
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm font-medium text-white">{message}</span>
    </div>
);

const PremiumSubscriptionPage = ({ user, lang = 'ko', onReturnToSelection }) => {
    const [isAnnual, setIsAnnual] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [policyContent, setPolicyContent] = useState({ title: '', contentKey: '' });
    
    useEffect(() => {
        if (typeof window.Paddle === 'undefined' && PADDLE_CLIENT_TOKEN) {
            const script = document.createElement('script');
            script.src = 'https://cdn.paddle.com/paddle/paddle.js';
            script.onload = () => {
                if (window.Paddle) {
                    try {
                        window.Paddle.Setup({ token: PADDLE_CLIENT_TOKEN });
                    } catch (e) {
                        console.error("Paddle SDK Setup Failed:", e);
                    }
                }
            };
            document.head.appendChild(script);
        }
    }, []);

    const initiatePayment = useCallback((priceId, planId) => {
        setIsProcessing(true); 
        setPaymentError(null);

        if (typeof window.Paddle === 'undefined' || !user?.email || !user?.uid) {
            setIsProcessing(false);
            setPaymentError(t('paddle_sdk_error', lang));
            return;
        }
        
        const paddleMetadata = { 
            selectedPlan: planId, 
            billingCycle: isAnnual ? 'annual' : 'monthly',
            user_id: user.uid,
        };

        try {
            window.Paddle.Checkout.open({
                items: [{ priceId: priceId, quantity: 1 }], 
                customer: { email: user.email, name: user.displayName || 'Customer' },
                customData: paddleMetadata,
                successCallback: () => {
                    setIsProcessing(false);
                    setShowSuccessModal(true); 
                },
                closeCallback: () => {
                    setIsProcessing(false);
                },
            });
        } catch (error) {
            setIsProcessing(false);
            setPaymentError(t('paddle_sdk_error', lang));
        }
    }, [user, isAnnual, lang]); 

    const handleFreeAction = useCallback(() => {
        if (onReturnToSelection) onReturnToSelection();
    }, [onReturnToSelection]);

    const handleStandardPayment = useCallback(() => {
        const priceId = isAnnual ? PADDLE_PRICE_IDS.standard_annual : PADDLE_PRICE_IDS.standard_monthly;
        initiatePayment(priceId, 'standard');
    }, [isAnnual, initiatePayment]);

    const handlePremiumPayment = useCallback(() => {
        const priceId = isAnnual ? PADDLE_PRICE_IDS.premium_annual : PADDLE_PRICE_IDS.premium_monthly;
        initiatePayment(priceId, 'premium');
    }, [isAnnual, initiatePayment]);

    const handlePolicyClick = useCallback((policyType) => {
        let content;
        if (policyType === 'refund') {
            content = { title: t('viewRefundPolicy', lang), contentKey: 'refundPolicyContent' };
        } else if (policyType === 'privacy') {
            content = { title: t('viewPrivacyPolicy', lang), contentKey: 'privacyPolicyContent' };
        } else if (policyType === 'terms') { 
            content = { title: t('viewTermsOfService', lang), contentKey: 'termsOfServiceContent' };
        } else return;

        setPolicyContent(content);
        setIsPolicyModalOpen(true);
    }, [lang]);

    const maxDiscountRate = Math.round(ANNUAL_DISCOUNT_RATE * 100);

 // ... 상단 코드 생략 ...

    const currentPlans = useMemo(() => {
        const monthlyStandard = 20; 
        const monthlyPremium = 40;  
        
        return [
            {
                id: 'free',
                title: t('planFreeMember', lang),
                description: t('freePlanDescription', lang),
                priceMonthly: 0,
                priceAnnual: 0,
                isPrimary: false,
                features: [
                    // 💡 무료 회원: 설교 및 주석 통합 월 4회 제한 적용
                    `${t('sermonGenTimes_free', lang)} (월 4회)`, 
                    `${t('aiAnnotationTimes_free', lang)} (월 4회)`, 
                    t('textEditor', lang), 
                    t('archiveAccessRestricted', lang), 
                    t('archiveShareLimited_free', lang),
                ],
                buttonAction: handleFreeAction 
            },
            {
                id: 'standard',
                title: t('planStandardMember', lang),
                description: t('standardPlanDescription', lang),
                priceMonthly: monthlyStandard,
                priceAnnual: calculateAnnualPrice(monthlyStandard, ANNUAL_DISCOUNT_RATE), 
                isPrimary: false,
                features: [
                    // 💡 스탠다드 회원: 월 설교 및 주석 생성 100회로 상향
                    `${t('sermonGenTimes_std', lang)} (월 100회)`, 
                    `${t('aiAnnotationTimes_std', lang)} (월 100회)`, 
                    t('advancedTextEditor', lang), 
                    t('archiveAccessFull', lang), 
                    t('archiveShareLimited_std', lang), 
                    t('limitedSupport', lang),
                ],
                buttonAction: handleStandardPayment
            },
            {
                id: 'premium',
                title: t('planPremiumMember', lang),
                description: t('premiumPlanDescription', lang),
                priceMonthly: monthlyPremium, 
                priceAnnual: calculateAnnualPrice(monthlyPremium, ANNUAL_DISCOUNT_RATE), 
                isPrimary: true,
                features: [
                    t('sermonGenTimes_prem', lang), // 무제한 또는 최고 한도
                    t('unlimitedAnnotation', lang), 
                    t('advancedTextEditor', lang), 
                    t('archiveAccessFull', lang), 
                    t('archiveShareLimited_prem', lang), 
                    t('unlimitedSupport', lang),
                ],
                buttonAction: handlePremiumPayment
            },
        ];
    }, [lang, handleFreeAction, handleStandardPayment, handlePremiumPayment]); 

// ... 하단 코드 생략 ...

    if (isProcessing) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center w-full">
                <div className="bg-blue-600 p-8 rounded-lg shadow-2xl">
                    <LoadingSpinner message={t('auth_processing', lang)} />
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            <PolicyModal
                isOpen={isPolicyModalOpen}
                onClose={() => setIsPolicyModalOpen(false)}
                title={policyContent.title}
                contentKey={policyContent.contentKey}
                lang={lang}
            />
            
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
                        <SuccessIcon />
                        <h3 className="text-xl font-bold mb-2">{t('subscriptionSuccessful', lang)}</h3>
                        <p className="text-gray-600 mb-6">{t('welcomePremiumTier', lang)}</p>
                        <button onClick={() => setShowSuccessModal(false)} className="w-full px-4 py-2 font-semibold rounded-lg bg-blue-600 text-white">
                            {t('startWritingSermons', lang)}
                        </button>
                    </div>
                </div>
            )}
            
            <div className="w-full">
                <header className="text-center mb-16 max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">{t('chooseYourPlan', lang)}</h2>
                    <p className="text-xl text-gray-600 mt-4">{t('planSubtitle', lang)}</p>
                </header>
                
                {paymentError && (
                    <div className="w-full max-w-4xl mx-auto p-4 mb-10 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-medium">
                        🚨 {paymentError}
                    </div>
                )}
                
                <div className="flex justify-center mb-14">
                    <div className="relative p-1 bg-gray-200 rounded-full flex items-center shadow-inner">
                        <button onClick={() => setIsAnnual(false)} className={`px-8 py-2 text-sm font-bold rounded-full transition-all ${!isAnnual ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
                            {t('monthly', lang)}
                        </button>
                        <button onClick={() => setIsAnnual(true)} className={`px-8 py-2 text-sm font-bold rounded-full transition-all ${isAnnual ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>
                            {t('annually', lang)}
                        </button>
                        <span className="absolute -right-12 -top-6 bg-red-500 text-white text-[10px] font-bold py-1 px-3 rounded-full shadow-lg rotate-3">
                            {t('saveUpTo', lang, maxDiscountRate)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch">
                    {currentPlans.map((plan) => (
                        <div key={plan.id} className={`bg-white rounded-3xl p-8 flex flex-col h-full border-2 transition-all duration-300 relative ${plan.isPrimary ? 'border-blue-500 shadow-2xl scale-105 z-10' : 'border-transparent shadow-md hover:shadow-xl'}`}>
                            {plan.isPrimary && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold py-1 px-4 rounded-full uppercase tracking-widest shadow-md">
                                    {t('bestValue', lang)}
                                </span>
                            )}
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.title}</h3>
                            <p className="text-sm text-gray-500 mb-6 min-h-[40px] leading-relaxed">{plan.description}</p>
                            
                            <div className="mb-8">
                                <span className="text-4xl font-black text-gray-900">
                                    {plan.id === 'free' ? t('price_free', lang) : `$${isAnnual ? plan.priceAnnual : plan.priceMonthly}`}
                                </span>
                                <span className="text-gray-500 ml-1 text-sm font-medium">
                                    {plan.id !== 'free' && `/${isAnnual ? t('year', lang) : t('month', lang)}`}
                                </span>
                                <p className="text-[10px] text-blue-500 mt-2 font-bold h-4">
                                    {isAnnual && plan.id !== 'free' && `${t('saveVsMonthly', lang, maxDiscountRate)} ($${(plan.priceAnnual/12).toFixed(2)}/${t('month', lang)})`}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {plan.features.map((feature, fIndex) => (
                                    <li key={fIndex} className="flex items-start">
                                        <CheckIcon />
                                        <span className="ml-3 text-sm text-gray-600 leading-tight">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button onClick={plan.buttonAction} className={`w-full py-4 font-bold rounded-2xl transition-all shadow-lg active:scale-95 ${plan.isPrimary ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
                                {plan.id === 'free' ? t('selectPlan', lang) : t('subscribeNow', lang)}
                            </button>
                        </div>
                    ))}
                </div>

                <footer className="mt-24 text-center text-[11px] text-gray-400 max-w-4xl mx-auto pb-10">
                    <p className="mb-4">{t('paymentNote', lang)}</p>
                    <div className="flex justify-center items-center gap-6 flex-wrap">
                        <button onClick={() => handlePolicyClick('refund')} className="hover:text-blue-500 transition underline underline-offset-4">
                            {t('viewRefundPolicy', lang)}
                        </button>
                        <span className="text-gray-200">|</span>
                        <button onClick={() => handlePolicyClick('privacy')} className="hover:text-blue-500 transition underline underline-offset-4">
                            {t('viewPrivacyPolicy', lang)}
                        </button>
                        <span className="text-gray-200">|</span>
                        <button onClick={() => handlePolicyClick('terms')} className="hover:text-blue-500 transition underline underline-offset-4">
                            {t('viewTermsOfService', lang)}
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default PremiumSubscriptionPage;