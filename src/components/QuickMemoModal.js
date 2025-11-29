'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// STT 기능 활성화 여부 (임시 상수)
const STT_ENABLED = true;

// 🚨 [최대 녹음 시간] 10초 유지
const MAX_RECORDING_TIME = 10000; // 10초 제한 (ms) 

// 아이콘 컴포넌트 정의 (유지)
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 6L6 18" /><path d="M6 6L18 18" /></svg>
);

const MicIcon = ({ recording }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={recording ? "#EF4444" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-8 w-8 transition-colors ${recording ? 'animate-pulse text-red-500' : 'text-gray-600'}`}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
);

// 로딩 스피너 컴포넌트 정의 (유지)
const LoadingSpinner = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
);

// 🚨 TrashIcon 정의 추가 (QuickMemoSermonComponent에서 발생한 오류 해결을 위해)
// 이 아이콘은 QuickMemoSermonComponent.jsx에서 사용됩니다.



// 🚨 [복원] 시간 포맷 헬퍼 함수
const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const padding = seconds < 10 ? '0' : '';
    return `00:${padding}${seconds}`;
};


// Quick Memo Modal Component
const QuickMemoModal = ({ onClose, userId, db, t, lang, onMemoSaved }) => {
    
    // 1. STT 관련 상태 및 Ref
    const [memoText, setMemoText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isManualMode, setIsManualMode] = useState(!STT_ENABLED); 

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);
    
    // 🚨 [복원] 경과 시간 상태
    const [elapsedTime, setElapsedTime] = useState(0); 

    const MAX_LENGTH = 50;
    
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    // ... (초기 에러 상태 설정 및 Firestore Ref 로직 유지) ...
    const initialError = useMemo(() => {
        if (!userId) return t('loginToUseFeature') || 'Login is required.';
        if (!db) return t('auth_error_desc') || 'DB is not initialized.';
        return '';
    }, [userId, db, t]);
    
    useEffect(() => {
        if (initialError) {
            setError(initialError);
        }
    }, [initialError]);

    const getQuickMemoCollectionRef = useCallback(() => {
        if (!db || !userId) {
            if (!error) setError(t('auth_error_desc') || 'DB is not initialized.');
            return null;
        }
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        return collection(db, `artifacts/${appId}/users/${userId}/quick_memos`);
    }, [db, userId, t, error]);


    // 🚨 [복원] 타이머 로직 (elapsedTime 업데이트)
    useEffect(() => {
        let intervalId;
        if (isRecording) {
            setElapsedTime(0); // 녹음 시작 시 타이머 초기화
            const startTime = Date.now();
            intervalId = setInterval(() => {
                const timePassed = Date.now() - startTime;
                setElapsedTime(Math.min(timePassed, MAX_RECORDING_TIME)); 
            }, 100); 
        } else {
            clearInterval(intervalId);
        }
        return () => clearInterval(intervalId);
    }, [isRecording]);


    // 2. STT 관련 함수
    const startRecording = useCallback(async () => {
        if (isRecording || isConverting || !STT_ENABLED) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // 🚨 오디오 포맷을 STT API가 예상하는 형식으로 설정 (예: wav/webm_opus)
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' }); 
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach(track => track.stop());
                convertSpeechToText();
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setMemoText('');
            setError('');
            
            // 10초 텍스트 반영
            const recordingMessage = (t('memo_recording', lang) || 'Recording... Speak now (max 10 seconds)').replace('(최대 3초)', '(최대 10초)').replace('(max 3 seconds)', '(max 10 seconds)');
            setMessage(recordingMessage);
            
            // 10초 후 자동 정지
            recordingTimerRef.current = setTimeout(() => {
                stopRecording();
            }, MAX_RECORDING_TIME);

        } catch (err) {
            console.error("Error accessing microphone or starting recording:", err);
            setError(t('conversion_error', lang) || 'Error accessing microphone. Please use manual input.');
            setIsRecording(false);
            setIsManualMode(true); 
        }
    }, [isRecording, isConverting, t, lang]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            clearTimeout(recordingTimerRef.current);
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setMessage(t('converting_text', lang) || 'Converting speech to text...');
            setIsConverting(true);
        }
    }, [isRecording, t, lang]);

    const convertSpeechToText = useCallback(async () => {
        if (audioChunksRef.current.length === 0) {
            setIsConverting(false);
            setError(t('stt_failed_fallback', lang) || 'No audio recorded. Please use manual input.');
            setIsManualMode(true);
            return;
        }
        // 🚨 MIME Type을 MediaRecorder 생성 시 사용한 것으로 통일
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' }); 
        const formData = new FormData();
        formData.append('audio', audioBlob, `quick_memo_${Date.now()}.webm`); // 파일 확장자 변경
        formData.append('lang', lang); 

        let transcribedText = '';

        try {
            const response = await fetch('/api/stt-converter', { 
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            transcribedText = data.text; 

        } catch (e) {
            console.error("STT API Error:", e);
            setError(t('conversion_error', lang) || `An error occurred during speech-to-text conversion: ${e.message}`);
            setIsManualMode(true);
            setIsConverting(false); 
            return;
        } finally {
            setIsConverting(false);
        }

        if (transcribedText) {
            const trimmedText = transcribedText.trim().substring(0, MAX_LENGTH);
            setMemoText(trimmedText);
            const successMessage = (t('memo_converted_success', lang) || 'Text conversion complete: "{0}"').replace('{0}', trimmedText);
            setMessage(successMessage);
            setIsManualMode(true); 
        } else {
            setError(t('stt_failed_fallback', lang) || 'Text conversion failed: Using base memo.');
            setIsManualMode(true);
        }
    }, [t, lang]);


    // 3. 텍스트 저장 (Firestore) - 로직 유지
    const saveMemo = async () => {
        if (!memoText.trim()) {
            setError(t('memo_empty_error', lang) || 'Please enter or record a memo first.');
            return;
        }

        const memosRef = getQuickMemoCollectionRef();
        if (!memosRef) return; 
        
        try {
            await addDoc(memosRef, {
                text: memoText.substring(0, MAX_LENGTH),
                createdAt: serverTimestamp(),
                status: 'pending', 
                lang: lang,
            });
            
            setMessage(t('memo_saved_success', lang) || 'Memo saved successfully! You can now use it for your quick sermon.');
            setMemoText('');
            onClose(); 
            onMemoSaved(); 

        } catch (e) {
            console.error("Error saving memo:", e);
            setError(t('memo_save_error', lang)?.replace('{0}', e.message) || `Failed to save memo: ${e.message}`);
        }
    };
    

    // 4. 모달 본문 렌더링
    const renderContent = () => {
        
        if (!STT_ENABLED || isManualMode) {
            // 수동 모드 렌더링
            return (
                <div className="flex flex-col space-y-4 pt-4">
                    {isManualMode && !STT_ENABLED && (
                         <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-medium">
                            {t('stt_disabled_notice', lang) || "음성-텍스트 변환(STT) 기능은 현재 비활성화되어 있습니다. 텍스트를 직접 입력해 주세요."}
                        </div>
                    )}

                    <p className="text-gray-700 font-semibold">{t('memo_recorded_text', lang) || `Recorded Text (Max ${MAX_LENGTH} chars):`}</p>
                    <textarea
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value.substring(0, MAX_LENGTH))}
                        rows={3}
                        placeholder={t('enter_memo_manually', lang) || "여기에 영감받은 묵상 메모를 입력하세요..."}
                        className="p-3 bg-gray-100 rounded-lg text-gray-800 break-words border border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{memoText.length}/{MAX_LENGTH}</span>
                        {STT_ENABLED && (
                            <button onClick={() => { setIsManualMode(false); setError(''); setMessage(''); }} disabled={isConverting} className="text-blue-600 hover:text-blue-800 font-medium">
                                STT로 녹음하기
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={saveMemo} 
                        disabled={memoText.trim().length === 0}
                        className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition duration-300 disabled:opacity-50"
                    >
                        {t('memo_save_button', lang) || '메모 저장'}
                    </button>
                </div>
            );
        }


        // STT 활성화 모드일 때
        const guideText = (t('memo_start_guide', lang) || 'Press the microphone to record a short inspiration memo (max 10 seconds).').replace('(최대 3초)', '(최대 10초)').replace('(max 3 seconds)', '(max 10 seconds)');
        const recordingText = (t('memo_recording', lang) || 'Recording... Speak now (max 10 seconds)').replace('(최대 3초)', '(최대 10초)').replace('(max 3 seconds)', '(max 10 seconds)');

        return (
            <div className="flex flex-col items-center space-y-6 pt-8">
                
                {/* 🚨 [타이머 표시] 녹음 중일 때만 표시 */}
                {isRecording && (
                    <div className="text-3xl font-bold text-red-500 absolute top-2 right-6">
                        {formatTime(elapsedTime)} / {formatTime(MAX_RECORDING_TIME)}
                    </div>
                )}
                
                <div className="text-center text-gray-600 font-medium h-12 flex items-center justify-center">
                    {isConverting ? (
                        <span className="flex items-center text-yellow-600">
                             <LoadingSpinner className="w-5 h-5 mr-2" /> {t('converting_text', lang) || 'Converting speech to text...'}
                        </span>
                    ) : isRecording ? (
                        <span className="text-red-500">{recordingText}</span>
                    ) : (
                        guideText
                    )}
                </div>

                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isConverting}
                    className={`p-5 rounded-full shadow-xl transition-all duration-300 ${isRecording ? 'bg-red-200 ring-4 ring-red-400' : 'bg-yellow-400 hover:bg-yellow-500'}`}
                >
                    <MicIcon recording={isRecording} />
                </button>
                
                <p className="text-sm text-gray-500">
                    {isRecording ? t('memo_stop_record', lang) || 'Stop Recording' : t('memo_start_record', lang) || 'Start Recording'}
                </p>

                <button onClick={() => { setIsManualMode(true); setError(''); setMessage(''); }} disabled={isRecording || isConverting} className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-4">
                    {t('enter_memo_manually', lang) || '텍스트 직접 입력하기'}
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
                // 🚨 [핵심 수정] 타이머 표시를 위해 'relative' 클래스 추가
                className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 animate-in fade-in zoom-in relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold text-gray-900">{t('quickMemoSermon', lang) || '빠른 메모 설교'}</h3>
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