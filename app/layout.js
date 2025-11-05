// app/layout.js

import { Inter } from 'next/font/google';
import './globals.css';

// 1. 방금 만든 Providers.js 파일을 임포트합니다.
// (경로는 @/components/Providers 또는 ../components/Providers 일 수 있습니다)
import Providers from '@/components/Providers'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SermonNote',
  description: 'AI Sermon Assistant',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
       
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}