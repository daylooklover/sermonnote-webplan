'use client';

import React, { useState, useCallback } from 'react';

// Firestore imports
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 6L6 18" /><path d="M6 6L18 18" /></svg>
);

const MicIcon = ({ recording }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={recording ? "#EF4444" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-8 w-8 transition-colors ${recording ? 'animate-pulse text-red-500' : 'text-gray-600'}`}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
);

// 녹음 모달 컴포넌트
const QuickMemoModal = ({ onClose, userId, db, t, lang, onMemoSaved }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [memoText, setMemoText] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [remainingTime, setRemainingTime] = useState(3); // 3초 녹음 제한
    const MAX_LENGTH = 20;

    // 퀵메모 저장을 위한 Firestore 경로 생성
    const getQuickMemoCollectionRef = useCallback(() => {
        if (!db || !userId) {
            setError(t('auth_error_desc') || 'DB is not initialized.');
            return null;
        }
        // Private Data Path: /artifacts/{appId}/users/{userId}/quick_memos
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        return collection(db, `artifacts/${appId}/users/${userId}/quick_memos`);
    }, [db, userId, t]);


    // 1. 녹음 시작 및 텍스트 변환 (임시)
    const startRecording = () => {
        if (!userId) {
            setError(t('loginToUseFeature') || 'Login is required.');
            return;
        }
        
        setError('');
        setMessage('');
        setIsRecording(true);
        setMemoText('');
        setRemainingTime(3);

        const countdown = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(countdown);
                    stopRecording(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // 2. 녹음 종료 및 텍스트 변환 (임시 TTS/STT 로직)
    const stopRecording = (autoStop = false) => {
        setIsRecording(false);
        
        // 🚨 요청사항 1: 20자 이내의 녹음(임시 텍스트 변환)
        const recordedPhrase = autoStop 
            ? t('quick_memo_default_text', lang) || "오늘 말씀 묵상의 핵심 주제는 사랑과 헌신입니다."
            : t('quick_memo_short_text', lang) || "짧은 영감 메모입니다.";
        
        // 20자 이내로 자르기
        const textToSave = recordedPhrase.substring(0, MAX_LENGTH);
        
        setMemoText(textToSave);
        setMessage(t('memo_converted_success', lang) || `Text converted successfully: "${textToSave}"`);
    };
    
    // 3. 녹음된 텍스트 저장 (Firestore)
    const saveMemo = async () => {
        if (!memoText) {
            setError(t('memo_empty_error', lang) || 'Please record a memo first.');
            return;
        }

        const memosRef = getQuickMemoCollectionRef();
        if (!memosRef) return;
        
        try {
            await addDoc(memosRef, {
                text: memoText,
                createdAt: serverTimestamp(),
                status: 'pending', // 설교 생성 전 상태
                lang: lang,
                // userId는 경로에 이미 포함됨
            });
            
            setMessage(t('memo_saved_success', lang) || 'Memo saved successfully! You can now use it for your quick sermon.');
            setMemoText('');
            onMemoSaved(); // 부모 컴포넌트에 저장 완료 알림
            setTimeout(onClose, 1500);

        } catch (e) {
            console.error("Error saving memo:", e);
            setError(t('memo_save_error', lang) || `Failed to save memo: ${e.message}`);
        }
    };
    
    // 4. 모달 본문 렌더링
    const renderContent = () => {
        if (isRecording) {
            return (
                <div className="flex flex-col items-center space-y-6 py-6">
                    <p className="text-4xl font-bold text-red-500">{remainingTime}</p>
                    <MicIcon recording={true} />
                    <p className="text-gray-600 text-sm">{t('memo_recording', lang) || 'Recording... Speak now (Max 3 seconds)'}</p>
                    <button onClick={() => stopRecording()} className="px-6 py-2 bg-gray-400 text-white font-medium rounded-full shadow hover:bg-gray-500 transition">
                        {t('memo_stop_record', lang) || 'Stop Recording'}
                    </button>
                </div>
            );
        }

        if (memoText) {
            return (
                <div className="flex flex-col space-y-4 pt-4">
                    <p className="text-gray-700 font-semibold">{t('memo_recorded_text', lang) || 'Recorded Text (Max 20 chars):'}</p>
                    <div className="p-3 bg-gray-100 rounded-lg text-gray-800 break-words border border-gray-300">
                        {memoText}
                    </div>
                    <button onClick={saveMemo} className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition duration-300">
                        {t('memo_save_button', lang) || 'Save Memo'}
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center space-y-4 py-4">
                <p className="text-gray-600 text-center">{t('memo_start_guide', lang) || 'Press the mic to start recording a quick thought (max 3 seconds).'}</p>
                <button 
                    onClick={startRecording} 
                    className="p-5 bg-yellow-500 text-white rounded-full shadow-2xl transition transform hover:scale-110"
                    aria-label={t('memo_start_record', lang) || 'Start Recording'}
                >
                    <MicIcon recording={false} />
                </button>
            </div>
        );
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-[100] p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 animate-in fade-in zoom-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold text-gray-900">{t('quickMemoSermon', lang) || 'Quick Memo Sermon'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition"><CloseIcon /></button>
                </div>
                
                {/* 에러/메시지 표시 */}
                {(error || message) && (
                    <div className={`p-3 mb-4 rounded-lg text-sm ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {error || message}
                    </div>
                )}

                {renderContent()}

            </div>
        </div>
    );
};

export default QuickMemoModal;