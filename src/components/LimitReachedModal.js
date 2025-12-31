// components/LimitReachedModal.js
'use client';

import React from 'react';

/**
 * 💡 사용 횟수 제한 도달 팝업 모달 컴포넌트
 * 이 컴포넌트는 모든 텍스트를 상위 컴포넌트(HomeContent.js 등)로부터 props로 전달받아 사용합니다.
 */
const LimitReachedModal = ({ 
    isOpen = true, // 모달 열림 상태 (기본값 true)
    onClose, 
    onUpgrade, 
    // lang, // 사용되지 않는 props 제거 (번역된 텍스트를 받으므로 불필요)
    // 텍스트 props: 상위 컴포넌트에서 번역된 내용을 전달받음
    title,          // '🚫 AI 초안 생성 횟수 제한 도달'
    description,    // '오늘 제공된 AI... 내일 00시 정각에 초기화됩니다.'
    upgradeButton,  // '프리미엄 구독하기'
    closeButton     // '닫기'
}) => {
    
    if (!isOpen) return null;

    // 업그레이드 버튼 표시 여부 확인
    const showUpgrade = !!(onUpgrade && upgradeButton);

    return (
        // 배경 오버레이: 고정 위치, 검은색 투명 배경, 높은 z-index
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[5000]">
            
            {/* 모달 컨테이너: 중앙 배치, 흰색 배경, 그림자 */}
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 mx-4 text-center transform transition-all duration-300 scale-100 opacity-100">
                
                {/* 1. 🛑 제목 영역 (강조) */}
                <div className="mb-6">
                    <h3 className="text-3xl font-extrabold text-red-600">
                        {title}
                    </h3>
                </div>
                
                {/* 2. 📝 내용 영역 (메시지 내용 강화 적용) */}
                {/* description은 여러 줄일 수 있으므로 whitespace-pre-wrap으로 줄바꿈을 허용합니다. */}
                <p className="text-gray-700 mb-8 whitespace-pre-wrap leading-relaxed">
                    {description}
                </p>

                {/* 3. 🖱️ 버튼 영역 */}
                <div className="flex flex-col space-y-3">
                    
                    {/* 프리미엄 업그레이드 버튼 (Primary Action) */}
                    {showUpgrade && (
                        <button
                            onClick={onUpgrade}
                            className="w-full px-6 py-3 bg-red-600 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-red-700 transition transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-red-300"
                        >
                            {upgradeButton}
                        </button>
                    )}
                    
                    {/* 닫기 버튼 (Secondary Action) */}
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition focus:outline-none focus:ring-2 focus:ring-gray-400"
                    >
                        {closeButton}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LimitReachedModal;