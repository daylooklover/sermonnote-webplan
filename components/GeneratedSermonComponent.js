// src/components/GeneratedSermonComponent.js
"use client";
import React, { useState } from 'react';
import { GoBackIcon, LoadingSpinner } from './IconComponents'; 
import { t } from '@/lib/translations';

const GeneratedSermonComponent = ({ sermonDraft, onGoBack, lang }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(sermonDraft);

    const handlePrint = () => {
        window.print();
    };

    const handleSaveEdit = () => {
        setIsEditing(false);
        // 필요하다면 여기서 editedContent를 서버에 저장하는 로직을 추가할 수 있습니다.
    };

    const handleCancelEdit = () => {
        setEditedContent(sermonDraft);
        setIsEditing(false);
    };

    return (
        <div className="text-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl mx-auto space-y-6 relative">
                {/* 상단 버튼 그룹 */}
                <div className="flex items-center space-x-2 absolute top-4 left-4 z-10">
                    <button
                        onClick={onGoBack}
                        className="p-2 rounded-full bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
                        aria-label={t('goBack', lang)}
                    >
                        <GoBackIcon className="w-5 h-5" />
                        <span className="font-semibold text-sm hidden sm:inline">{t('goBack', lang)}</span>
                    </button>
                    <button
                        onClick={handlePrint}
                        className="p-2 rounded-full bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
                        aria-label={t('print', lang)}
                    >
                        <span className="font-bold">🖨️</span>
                        <span className="font-semibold text-sm hidden sm:inline">{t('print', lang)}</span>
                    </button>
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleSaveEdit}
                                className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors duration-200 flex items-center space-x-2"
                                aria-label={t('save', lang)}
                            >
                                <span className="font-bold">✅</span>
                                <span className="font-semibold text-sm hidden sm:inline">{t('save', lang)}</span>
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200 flex items-center space-x-2"
                                aria-label={t('cancel', lang)}
                            >
                                <span className="font-bold">❌</span>
                                <span className="font-semibold text-sm hidden sm:inline">{t('cancel', lang)}</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2 rounded-full bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2"
                            aria-label={t('edit', lang)}
                        >
                            <span className="font-bold">✏️</span>
                            <span className="font-semibold text-sm hidden sm:inline">{t('edit', lang)}</span>
                        </button>
                    )}
                </div>

                <h2 className="text-3xl font-extrabold text-gray-800 pt-8">{t('generatedSermonTitle', lang)}</h2>
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left whitespace-pre-wrap">
                    {isEditing ? (
                        <textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            className="w-full h-96 p-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    ) : (
                        <p className="text-gray-600">{editedContent}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeneratedSermonComponent;