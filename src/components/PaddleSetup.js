'use client';

import { useEffect } from 'react';

const PADDLE_VENDOR_ID = Number(process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID);

const PaddleSetup = () => {
    useEffect(() => {
        if (!PADDLE_VENDOR_ID || typeof window === 'undefined') return;

        const scriptId = 'paddle-sdk-script';
        
        const initPaddle = () => {
            // Paddle 객체가 존재하고 setup 함수가 있을 때만 실행
            if (window.Paddle && typeof window.Paddle.setup === 'function') {
                window.Paddle.setup({ vendor: PADDLE_VENDOR_ID });
                console.log("✅ Paddle SDK setup completed.");
            }
        };

        // 1. 이미 스크립트가 있고 Paddle이 로드된 경우
        if (window.Paddle) {
            initPaddle();
            return;
        }

        // 2. 스크립트가 없는 경우 생성
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = "https://cdn.paddle.com/paddle/paddle.js";
            script.async = true;
            
            // 스크립트 로드 완료 시점에 초기화 실행
            script.onload = initPaddle;
            document.body.appendChild(script);
        }

        // 3. paddle-ready 이벤트 백업 (일부 환경용)
        window.addEventListener('paddle-ready', initPaddle, { once: true });

        return () => {
            window.removeEventListener('paddle-ready', initPaddle);
        };
    }, []);

    return null;
};

export default PaddleSetup;