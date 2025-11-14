'use client'; 

import { Inter } from 'next/font/google';
import './globals.css';

import { ChatProvider } from '@/components/ChatContext'; 

const inter = Inter({ subsets: ['latin'] });

// ❌ 오류를 유발하는 metadata 상수를 제거합니다.
// export const metadata = {
//   title: 'SermonNote',
//   description: 'AI Sermon Assistant',
// };

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        
        <ChatProvider>
          {children}
        </ChatProvider>
        
      </body>
    </html>
  );
}