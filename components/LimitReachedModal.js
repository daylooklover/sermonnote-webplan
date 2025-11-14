// components/LimitReachedModal.js
'use client';

import React from 'react';

// 🚨 FIX: app/page.js에서 정의한 t 함수를 임시로 복사하거나, 
// 이 모듈에서도 t 함수를 import 해야 합니다. 여기서는 t 함수가 
// '@/lib/translations'에서 가져와진다고 가정합니다.
import { t } from '@/lib/translations'; 

const LimitReachedModal = ({ onClose, lang, onGoToUpgrade }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6 text-center">
                
                {/* 모달 제목 */}
                <h3 className="text-2xl font-bold text-red-600 mb-4">
                    {t('limitModalTitle', lang)}
                </h3>
                
                {/* 모달 내용 */}
                <p className="text-gray-700 mb-6">
                    {t('limitModalDescription', lang)}
                </p>

                <div className="flex justify-center space-x-4">
                    {/* 1. 프리미엄 업그레이드 버튼 */}
                    <button
                        onClick={onGoToUpgrade}
                        className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition"
                    >
                        {t('upgradeButton', lang)}
                    </button>
                    
                    {/* 2. 닫기 버튼 */}
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-md hover:bg-gray-300 transition"
                    >
                        {t('closeButton', lang)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LimitReachedModal;