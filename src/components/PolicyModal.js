'use client';

import React from 'react';
// 🚨 파일이 src/components에 있다면 utils 경로는 아래와 같습니다.
import { t } from '../utils/i18n'; 

/**
 * 정책(환불, 개인정보, 약관)을 보여주는 다국어 모달 컴포넌트
 */
const PolicyModal = ({ isOpen, onClose, title, contentKey, lang = 'ko' }) => {
    // 모달이 닫혀있으면 렌더링하지 않음
    if (!isOpen) return null;

    // 배경 클릭 시 닫기
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
            onClick={handleOverlayClick}
        >
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* 헤더 섹션 */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">
                        {/* 🚨 PremiumSubscriptionPage에서 번역되어 넘어온 제목 표시 */}
                        {title}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-400"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                {/* 본문 섹션: i18n 함수를 통해 언어별 정책 내용 출력 */}
                <div className="p-6 overflow-y-auto text-gray-600 leading-relaxed text-sm md:text-base">
                    <div className="whitespace-pre-wrap">
                        {/* 🚨 contentKey(예: refundPolicyContent)를 받아 해당 언어로 번역 */}
                        {t(contentKey, lang)}
                    </div>
                </div>

                {/* 푸터 섹션 */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-md"
                    >
                        {/* 닫기 버튼 텍스트도 간단히 대응 */}
                        {lang === 'ko' ? '닫기' : (lang === 'ru' ? 'Закрыть' : 'Close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PolicyModal;