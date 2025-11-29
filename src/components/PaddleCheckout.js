import React, { useCallback, useState } from 'react';

// 🚨 Paddle.js 스크립트 로딩은 일반적으로 HTML <head>에서 이루어지지만, 
// 여기서는 컴포넌트 내에서 호출한다고 가정합니다.

const PADDLE_VENDOR_ID = "YOUR_PADDLE_VENDOR_ID"; // 🚨 사용자님의 Paddle Vendor ID를 여기에 입력하세요.
const PADDLE_PLAN_ID = {
    standard: "P_PLAN_STANDARD_ID",
    premium: "P_PLAN_PREMIUM_ID",
};

// 💡 Paddle 결제창을 띄우는 함수를 외부에서 호출할 수 있도록 설계합니다.
const PaddleCheckout = React.memo(({ plan, email, t, lang, onSubscriptionSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = useCallback(() => {
        // Paddle.js가 전역에 로드되었는지 확인합니다.
        if (typeof window.Paddle === 'undefined') {
            alert(t('paddleNotLoaded', lang) || "결제 시스템이 로드되지 않았습니다. 잠시 후 다시 시도해 주세요.");
            return;
        }

        setIsLoading(true);

        window.Paddle.Checkout.open({
            product: PADDLE_PLAN_ID[plan],
            email: email,
            // 🚨 결제 성공 후 호출되는 콜백 함수
            successCallback: (data) => {
                console.log("Paddle Payment Success:", data);
                setIsLoading(false);
                // 💡 상위 컴포넌트에 성공을 알림
                onSubscriptionSuccess(data); 
            },
            // 🚨 결제 취소/닫기 시 호출되는 콜백 함수
            closeCallback: () => {
                setIsLoading(false);
            },
            // 🚨 결제 오류 시 호출되는 콜백 함수
            errorCallback: (error) => {
                console.error("Paddle Payment Error:", error);
                setIsLoading(false);
                alert(t('paddlePaymentError', lang)?.replace('{0}', error.message) || `결제 중 오류가 발생했습니다: ${error.message}`);
            },
            // Paddle에 사용자 ID를 전달하여 구독 상태 추적을 돕습니다.
            passthrough: { user_id: email }, 
        });

    }, [plan, email, t, lang, onSubscriptionSuccess]);

    return (
        <button
            onClick={handleCheckout}
            disabled={isLoading}
            className={`w-full px-6 py-3 font-semibold rounded-xl shadow-lg transition duration-300 flex items-center justify-center 
                ${plan === 'premium' ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:translate-y-[-2px]' : 'bg-gray-700 hover:bg-gray-600 text-white'}
                ${isLoading ? 'bg-gray-500 cursor-wait' : ''}
            `}
        >
            {isLoading ? (
                <span className="animate-spin mr-2">🔄</span>
            ) : (
                t('subscribeNow', lang) || '지금 구독하기'
            )}
        </button>
    );
});

export default PaddleCheckout;