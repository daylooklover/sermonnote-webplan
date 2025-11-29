// src/components/LoadingSpinner.js
"use client";
import React from 'react';

/**
 * 앱의 초기 로딩 상태 또는 데이터 로딩 상태를 표시하는 전용 컴포넌트입니다.
 * 사용자 인증 로직이나 모달 호출 로직은 Home.js에서 관리되어야 하므로, 
 * 이 컴포넌트에서는 관련 코드를 모두 제거했습니다.
 */
export default function LoadingSpinner() {
    return (
        // 화면 전체를 덮는 오버레이
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
                {/* SVG 로딩 애니메이션 (Tailwind CSS 기본 패턴) */}
                <svg 
                    className="animate-spin h-10 w-10 text-blue-600" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                >
                    <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                    ></circle>
                    <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                </svg>
                <p className="mt-4 text-lg text-gray-700">로딩 중...</p>
            </div>
        </div>
    );
}