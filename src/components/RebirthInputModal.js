import React, { useState } from 'react';

const CloseIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6L6 18" /><path d="M6 6L18 18" /></svg>
);
const RefreshCcwIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.76 2.76L3 7" />
        <path d="M3 3v4h4" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.76-2.76L21 17" />
        <path d="M21 17v-4h-4" />
    </svg>
);
const LoadingSpinner = (props) => (
    <svg {...props} className={`animate-spin h-5 w-5 text-indigo-500 ${props.className || ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 004 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);

const RebirthInputModal = ({ isOpen, onClose, onConfirm, sermon, t, lang }) => {
    if (!isOpen) return null;
    
    const [contextInput, setContextInput] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = async () => {
        if (!contextInput.trim()) return;
        setIsConfirming(true);
        await onConfirm(contextInput);
        // onConfirm이 완료되면 닫기 처리는 상위 컴포넌트(RebirthSermonFeature)가 담당
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                        {t('rebirthInputTitle', lang) || '설교 재탄생을 위한 기록'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition" disabled={isConfirming}><CloseIcon /></button>
                </div>
                
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white line-clamp-1">{sermon.title}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {t('memo_base_text', lang) || '기반 메모'}: {sermon.originalMemo || '없음'}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('localContextInput', lang) || '당신의 교회에 적용할 핵심 피드백/상황'}
                    </label>
                    <textarea
                        value={contextInput}
                        onChange={(e) => setContextInput(e.target.value)}
                        rows="4"
                        placeholder={t('localContextPlaceholder', lang) || '예: 청년들에게 은혜가 필요합니다. 구체적인 현실의 고난을 더 강조해주세요.'}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                        disabled={isConfirming}
                    />
                </div>

                <div className="flex justify-end space-x-3">
                    <button onClick={handleConfirm} className="px-5 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition flex items-center space-x-1" disabled={!contextInput.trim() || isConfirming}>
                        {isConfirming ? <LoadingSpinner className="w-5 h-5 mr-2 text-white" /> : <RefreshCcwIcon className="w-5 h-5"/>}
                        <span>{isConfirming ? (t('generating', lang) || '생성 중...') : (t('rebirthConfirm', lang) || '재탄생 요청')}</span>
                    </button>
                    <button onClick={onClose} className="px-5 py-2 bg-gray-300 text-gray-800 rounded-xl font-semibold hover:bg-gray-400 transition" disabled={isConfirming}>
                        {t('cancel', lang) || '취소'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RebirthInputModal;