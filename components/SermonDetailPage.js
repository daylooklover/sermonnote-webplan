"use client";

import React from 'react';

/**
 * 설교의 상세 내용을 표시하는 컴포넌트입니다.
 * * @param {object} props 
 * @param {object} props.selectedSermon - 표시할 설교 객체 (sermon.id, sermon.title, sermon.content, sermon.preacher, sermon.user_id 등 포함)
 * @param {function} props.onClose - 세부 정보 페이지를 닫는 함수
 * @param {function} props.t - 다국어 번역 함수
 * @param {string} props.lang - 현재 언어 코드
 */
export default function SermonDetailPage({ selectedSermon, onClose, t, lang }) {
    if (!selectedSermon) {
        // 설교가 선택되지 않은 경우를 대비한 안전 장치
        return (
            <div className="text-center text-white p-8">
                <p>{t('noSermonSelected', lang) || "선택된 설교가 없습니다."}</p>
                <button 
                    onClick={onClose} 
                    className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                >
                    {t('close', lang) || "닫기"}
                </button>
            </div>
        );
    }

    // 설교 내용의 줄바꿈 처리를 위해 <p> 태그로 변환합니다.
    const formattedContent = selectedSermon.content.split('\n').map((line, index) => (
        <p key={index} className="mb-4 text-gray-300 leading-relaxed indent-4">
            {line}
        </p>
    ));

    // Supabase의 user_id 필드 또는 이전 필드인 userId를 사용합니다.
    const authorId = selectedSermon.user_id || selectedSermon.userId;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl p-6 sm:p-10">
                {/* 닫기 버튼 */}
                <div className="flex justify-end">
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white transition"
                        title={t('close', lang) || "닫기"}
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* 제목 및 메타 정보 */}
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 border-b border-gray-700 pb-3">
                    {selectedSermon.title}
                </h1>
                
                <div className="mb-8 text-sm text-gray-400 flex flex-wrap justify-between">
                    <span className="mr-4">
                        <span className="font-semibold text-gray-200">{t('preacher', lang) || '설교자'}:</span> {selectedSermon.preacher}
                    </span>
                    <span>
                        <span className="font-semibold text-gray-200">{t('authorId', lang) || '작성자 ID'}:</span> {authorId || 'N/A'}
                    </span>
                </div>

                {/* 설교 내용 */}
                <div className="bg-gray-700 p-6 rounded-lg text-lg text-white">
                    <h2 className="text-2xl font-bold text-indigo-400 mb-6">{t('sermonContent', lang) || '설교 본문'}</h2>
                    <div className="whitespace-pre-wrap">
                        {formattedContent}
                    </div>
                </div>

                {/* 하단 닫기 버튼 */}
                <div className="mt-8 text-center">
                    <button 
                        onClick={onClose} 
                        className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-700 transition transform hover:scale-105"
                    >
                        {t('backToList', lang) || "목록으로 돌아가기"}
                    </button>
                </div>
            </div>
        </div>
    );
}
