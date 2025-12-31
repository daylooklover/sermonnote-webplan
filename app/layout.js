import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/firebase'; 
import PaddleSetup from '@/components/PaddleSetup';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: '通하는 전파 - 말씀노트',
  description: 'AI Gemini 2.5 Flash 기반 설교 보조 도구',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        {/* 모든 페이지에서 로그인 정보를 사용할 수 있도록 감쌉니다. */}
        <AuthProvider>
          {children}
          
          {/* 결제 로직은 유저 정보와 연동될 수 있도록 Provider 내부에 둡니다. */}
          <PaddleSetup />
        </AuthProvider>
      </body>
    </html>
  );
}