import { Inter } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

// Inter 폰트를 설정합니다.
const inter = Inter({ subsets: ['latin'] });

// 메타데이터 설정 (Next.js 13/14 App Router 방식)
export const metadata = {
  title: 'SermonNote',
  description: 'AI Sermon Assistant',
};

/**
 * 앱의 루트 레이아웃 컴포넌트입니다.
 * 🚨 [HYDRATION FIX]: html 태그와 body 태그 주변의 불필요한 공백을 모두 제거했습니다.
 */
export default function RootLayout({ children }) {
    // HomeContent.js에서 정의한 Vendor ID를 상수로 정의하거나 직접 사용합니다.
    const PADDLE_VENDOR_ID = 42407; 

    // 🚨 [최종 수정]: 태그 주변의 모든 줄 바꿈과 공백을 제거하여 Hydration 오류를 방지합니다.
    return (
        <html lang="ko"><body className={inter.className}>
            {children}

            {/* ⭐️ Paddle SDK 스크립트 삽입 (결제 오류 해결 핵심) ⭐️ */}
            <Script 
                src="https://cdn.paddle.com/paddle/paddle.js"
                strategy="afterInteractive" // 페이지 로드 후 SDK 로드
            />

            {/* 🚨 Paddle Setup 스크립트를 Next.js Script 컴포넌트를 사용하여 인라인으로 삽입 */}
            <Script id="paddle-setup" strategy="afterInteractive">
                {`
                    // SDK가 로드되었는지 확인하고 초기화합니다.
                    if (typeof window.Paddle !== 'undefined') {
                        window.Paddle.setup({ 
                            vendor: ${PADDLE_VENDOR_ID}, 
                        });
                        console.log("Paddle SDK Loaded and Setup complete. Vendor ID:", ${PADDLE_VENDOR_ID});
                    } else {
                        // SDK가 아직 로드되지 않은 경우, window.onload 이벤트에서 한 번 더 시도합니다.
                        window.addEventListener('load', () => {
                            if (typeof window.Paddle !== 'undefined') {
                                window.Paddle.setup({ vendor: ${PADDLE_VENDOR_ID} });
                                console.log("Paddle SDK Loaded and Setup (on load). Vendor ID:", ${PADDLE_VENDOR_ID});
                            }
                        });
                    }
                `}
            </Script>

        </body></html>
    );
}