"use client"; 

import React from 'react';
import { useAuth } from '../contexts/AuthContext'; // AuthContext.js에서 내보낸 useAuth를 사용
import ClientOnlyWrapper from './ClientOnlyWrapper'; // 1. ClientOnlyWrapper 임포트

// 실제 인증 상태에 따라 UI를 렌더링하는 내부 컴포넌트
function AuthStatusContent({ openLoginModal }) {
    // AuthContext에서 user, loading, logout 상태를 가져옵니다.
    const { user, loading, logout } = useAuth(); 

    // 1. 로딩 상태 처리: ClientOnlyWrapper 외부에서는 빈 div/스켈레톤을 렌더링하도록 처리했으므로,
    // 여기서는 로딩 중일 때 추가적인 처리가 필요 없습니다. (하지만 안전을 위해 로딩 상태를 명시적으로 처리할 수도 있습니다.)
    if (loading) {
        // ClientOnlyWrapper가 마운트된 후에도 AuthProvider가 로딩 중일 경우 (일반적이지 않음)
        return (
            <div className="flex items-center space-x-2">
                 <div className="w-16 h-4 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
        );
    }

    // 2. 로그인된 상태: 사용자 정보 및 로그아웃 버튼 표시
    if (user) {
        return (
            <div className="flex items-center space-x-4">
                {/* user.email 대신 user.uid의 처음 8자리를 표시합니다. */}
                <p className="text-sm font-medium text-gray-700">{user.email || `User ID: ${user.uid.substring(0, 8)}...`}</p>
                <button
                    onClick={logout} 
                    className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                >
                    로그아웃
                </button>
            </div>
        );
    }

    // 3. 로그아웃된 상태: 로그인 버튼 표시
    return (
        <button
            onClick={openLoginModal} // prop으로 받은 모달 열기 함수 사용
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
        >
            로그인
        </button>
    );
}

// 최종적으로 외부로 export 되는 컴포넌트: Content를 Wrapper로 감쌉니다.
export default function AuthStatus({ openLoginModal }) {
    // 2. AuthStatusContent를 ClientOnlyWrapper로 감싸서, 서버에서 렌더링되는 것을 방지합니다.
    return (
        <ClientOnlyWrapper>
            <AuthStatusContent openLoginModal={openLoginModal} />
        </ClientOnlyWrapper>
    );
}
