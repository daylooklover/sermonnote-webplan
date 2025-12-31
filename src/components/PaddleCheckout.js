// src/components/PaddleCheckout.js
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { PADDLE_CLIENT_TOKEN } from '@/constants/pricing'; 

// 헬퍼 컴포넌트 (로딩 스피너)
const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 004 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export default function PaddleCheckout({ 
    planId, 
    priceId, 
    billingCycle, 
    userId, 
    email, 
    t, 
    lang, 
    onSubscriptionSuccess,
    buttonText 
}) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [isSdkReady, setIsSdkReady] = useState(false);

    const localize = (key, defaultText) => t ? t(key, lang) : defaultText;

    // 1. Paddle SDK 로드 및 초기화
    useEffect(() => {
        if (typeof window.Paddle === 'undefined' && PADDLE_CLIENT_TOKEN) {
            const script = document.createElement('script');
            script.src = 'https://cdn.paddle.com/paddle/paddle.js';
            script.onload = () => {
                if (window.Paddle) {
                    try {
                        window.Paddle.Setup({ token: PADDLE_CLIENT_TOKEN });
                        setIsSdkReady(true);
                        console.log("✅ Paddle SDK initialized.");
                    } catch (e) {
                        console.error("❌ Paddle SDK Setup Failed:", e);
                        setError(localize('paddleInitFailed', '결제 시스템 초기화에 실패했습니다.'));
                    }
                } else {
                    setError(localize('paddleLoadFailed', '결제 스크립트 로드에 실패했습니다.'));
                }
            };
            document.head.appendChild(script);
        } else if (typeof window.Paddle !== 'undefined') {
             // 이미 로드된 경우
            setIsSdkReady(true); 
        } else if (!PADDLE_CLIENT_TOKEN) {
             console.error("PADDLE_CLIENT_TOKEN is missing in constants/pricing.");
             setError(localize('configMissing', '결제 설정 키가 누락되었습니다.'));
        }
    }, [localize]);


    // 2. 결제 시작 핸들러
    const initiatePayment = useCallback(() => {
        setIsProcessing(true); 
        setError(null);

        if (!isSdkReady) {
            setError(localize('sdkNotReady', '결제 시스템 준비 중입니다. 잠시 후 다시 시도하세요.'));
            setIsProcessing(false);
            return;
        }

        if (!userId || !email) {
             setError(localize('userAuthRequired', '결제를 위해 로그인 정보가 필요합니다.'));
             setIsProcessing(false);
             return;
        }

        const paddleMetadata = { 
            selectedPlan: planId, 
            billingCycle: billingCycle,
            user_id: userId, // 웹훅으로 전달될 Firebase User ID
        };

        try {
            // 🚨 Paddle V2 Checkout.open 형식 적용
            window.Paddle.Checkout.open({
                // Price ID를 items 배열로 전달
                items: [{ priceId: priceId, quantity: 1 }], 
                
                customer: { email: email }, // 고객 이메일만 전달
                customData: paddleMetadata, // V2에서는 customData
                
                // 성공 시 콜백 (웹훅에서 최종 처리되지만, 클라이언트에서 모달을 띄울 수 있음)
                successCallback: (data) => {
                    console.log('Paddle Checkout Success:', data);
                    setIsProcessing(false);
                    // 상위 컴포넌트로 성공 상태를 알림
                    if (onSubscriptionSuccess) {
                        onSubscriptionSuccess(data); 
                    }
                },
                
                // 닫기/취소 시 콜백
                closeCallback: () => {
                    setIsProcessing(false);
                    // 사용자가 취소했을 때 오류 메시지를 표시하지 않음
                },
            });
        } catch (err) {
            console.error("Paddle Checkout 호출 중 오류 발생:", err);
            setIsProcessing(false);
            setError(localize('paddleCallError', '결제 모달 호출 중 오류 발생'));
        }
    }, [isSdkReady, userId, email, priceId, planId, billingCycle, localize, onSubscriptionSuccess]);


    // UI 렌더링
    const buttonClasses = `
        w-full px-6 py-3 font-bold rounded-xl transition duration-300 shadow-md 
        ${planId === 'premium' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}
    `;

    return (
        <>
            {error && (
                <div className="text-xs text-red-500 mb-2 text-center">
                    🚨 {error}
                </div>
            )}
            <button
                onClick={initiatePayment}
                className={buttonClasses}
                disabled={isProcessing || !isSdkReady}
            >
                {isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                        <LoadingSpinner />
                        <span>{localize('processingPayment', '결제 처리 중...')}</span>
                    </div>
                ) : (
                    buttonText
                )}
            </button>
        </>
    );
}