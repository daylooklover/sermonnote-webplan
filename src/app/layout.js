// app/layout.jsx

import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script"; // ⭐️ [NEW] Next.js Script 컴포넌트 임포트
import "./globals.css";

import { AuthProvider } from "@/lib/authContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SermonNote",
  description: "AI-powered sermon preparation tool",
};

// 🚨 [주의] 이 환경 변수는 NEXT_PUBLIC_ 접두사가 붙어 클라이언트에서 사용 가능해야 합니다.
const PADDLE_VENDOR_ID = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        {/* ⭐️ [NEW] Paddle.js 스크립트 로드 및 초기화 */}
        {PADDLE_VENDOR_ID && (
            <>
                <Script 
                    src="https://cdn.paddle.com/paddle/paddle.js" 
                    strategy="lazyOnload" // ⭐️ 페이지 로드 후 비동기 로드
                    id="paddle-sdk"
                />
                <Script id="paddle-setup" strategy="afterInteractive">
                    {`
                        // Paddle Setup은 스크립트 로드 후 실행되어야 합니다.
                        Paddle.Setup({ 
                            vendor: ${PADDLE_VENDOR_ID},
                            // 💡 추가 설정이 필요하면 여기에 추가합니다. (예: Checkout Language)
                        });
                    `}
                </Script>
            </>
        )}
        
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}