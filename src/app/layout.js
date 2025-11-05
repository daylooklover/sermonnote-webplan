// app/layout.jsx

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; // 이 줄을 주석 해제하여 전역 스타일을 불러옵니다.

import { AuthProvider } from "@/lib/authContext"; // AuthProvider 임포트

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

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}