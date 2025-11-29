"use client"; // 이 파일이 클라이언트 측에서 실행되어야 함을 명시

// 🚨🚨🚨 중요: AuthProvider 컴포넌트가 @/hooks/useAuth 파일 내에서 
// 'export const AuthProvider' 형태로 정의되어 있어야 합니다.
import { AuthProvider } from "@/hooks/useAuth"; 

/**
 * RootLayout에서 사용되어 앱 전반에 걸쳐
 * Firebase 인증 컨텍스트를 제공하는 컴포넌트입니다.
 */
export default function Providers({ children }) {
    return (
        <AuthProvider>
            {/* 하위 컴포넌트(페이지 내용)를 감쌉니다. */}
            {children}
        </AuthProvider>
    );
}