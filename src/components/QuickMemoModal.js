'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Save, FileText, Loader2, Mic, AlertTriangle } from 'lucide-react'; 

// STT 기능 활성화 여부
const STT_ENABLED = true;

// 🚨 [최대 녹음 시간] 10초
const MAX_RECORDING_TIME = 10000; // 10초 제한 (ms) 
const MAX_LENGTH = 150; 


// --- [헬퍼 함수] ---

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 6L6 18" /><path d="M6 6L18 18" /></svg>
);

const MicIcon = ({ recording }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={recording ? "#EF4444" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-8 w-8 transition-colors ${recording ? 'animate-pulse text-red-500' : 'text-gray-600'}`}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
);

const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const seconds = totalSeconds % 60;
    const padding = seconds < 10 ? '0' : '';
    return `00:${padding}${seconds}`;
};

const getSttLanguageCode = (appLang) => {
    switch (appLang) {
        case 'ko': return 'ko-KR';
        case 'en': return 'en-US';
        case 'zh': return 'zh-CN'; 
        case 'ru': return 'ru-RU'; 
        case 'vi': return 'vi-VN'; 
        default: return 'en-US';
    }
}


// --- [메인 컴포넌트] ---

// 🚨 [수정]: initialModeIsManual prop을 받아 초기 모드를 설정합니다.
const QuickMemoModal = ({ onClose, userId, db, t, lang, onMemoSaved, initialModeIsManual = false }) => {
    
    // 1. STT 관련 상태 및 Ref
    const [memoText, setMemoText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    
    // 🚨 [핵심 수정]: initialModeIsManual을 isManualMode의 초기값으로 사용합니다.
    const [isManualMode, setIsManualMode] = useState(initialModeIsManual); 

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    
    const [elapsedTime, setElapsedTime] = useState(0); 

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    const [isSaving, setIsSaving] = useState(false);
    

    // 2. 인증 및 DB 설정 확인
    const initialError = useMemo(() => {
        if (!userId) return t('loginToUseFeature', lang) || 'Login is required.';
        if (!db) return t('auth_error_desc', lang) || 'Database is not initialized.';
        return '';
    }, [userId, db, t, lang]);
    
    useEffect(() => {
        if (initialError) {
            setError(initialError);
            // 에러 발생 시 항상 수동 모드로 전환 (로그인 오류 등)
            setIsManualMode(true); 
        } else if (!STT_ENABLED) {
            // STT 비활성화 시 항상 수동 모드로 전환
            setIsManualMode(true);
        }
        // 초기값은 useState(initialModeIsManual)에서 이미 설정되었으므로 별도의 조건부 setSate는 필요 없습니다.
    }, [initialError]);

    const getQuickMemoCollectionRef = useCallback(() => {
        if (!db || !userId) {
            if (!error) setError(t('auth_error_desc', lang) || 'Database is not initialized.');
            return null;
        }
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        return collection(db, `artifacts/${appId}/users/${userId}/quick_memos`);
    }, [db, userId, t, lang, error]);


    // 3. 음성 텍스트 변환 (STT API 호출)
    const convertSpeechToText = useCallback(async () => {
        if (audioChunksRef.current.length === 0) {
            setIsConverting(false);
            setError(t('stt_failed_fallback', lang) || 'No audio recorded. Please use manual input.');
            setIsManualMode(true);
            return;
        }
        
        // 🚨 STT 변환 시작 메시지
        setMessage(t('converting_text', lang) || 'Converting speech to text...');
        setIsConverting(true);

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' }); 
        const formData = new FormData();
        formData.append('audio', audioBlob, `quick_memo_${Date.now()}.webm`); 
        formData.append('lang', getSttLanguageCode(lang)); 

        let transcribedText = '';

        try {
            const response = await fetch('/api/stt-converter', { 
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse server error response.' }));
                throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            transcribedText = data.text; 

        } catch (e) {
            console.error("STT API Error:", e);
            setError(t('conversion_error', lang) || `Error occurred during speech-to-text conversion: ${e.message}`);
            setIsManualMode(true);
            return;
        } finally {
            setIsConverting(false);
        }

        if (transcribedText) {
            const trimmedText = transcribedText.trim().substring(0, MAX_LENGTH);
            setMemoText(trimmedText);
            const successMessage = (t('memo_converted_success', lang) || 'Text conversion complete: "{0}"').replace('{0}', trimmedText);
            setMessage(successMessage);
            setIsManualMode(true); // 변환 완료 후 수동 입력 모드로 전환하여 텍스트 수정 및 저장 유도
        } else {
            setError(t('stt_failed_fallback', lang) || 'Text conversion failed: Using base memo.');
            setIsManualMode(true);
        }
    }, [t, lang]);


    // 4. STT 녹음 중지 및 변환 시작
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);


    // 5. 타이머 및 자동 정지 로직 (stopRecording에 의존)
    useEffect(() => {
        let intervalId;
        if (isRecording) {
            setElapsedTime(0); 
            const startTime = Date.now();
            intervalId = setInterval(() => {
                const timePassed = Date.now() - startTime;
                const newTime = Math.min(timePassed, MAX_RECORDING_TIME);
                setElapsedTime(newTime);
                
                if (newTime >= MAX_RECORDING_TIME) {
                    stopRecording(); 
                }

            }, 100); 
        } else {
            clearInterval(intervalId);
        }
        return () => clearInterval(intervalId);
    }, [isRecording, stopRecording]); 


    // 6. STT 녹음 시작
    const startRecording = useCallback(async () => {
        if (isRecording || isConverting || !STT_ENABLED) return;

        setError('');
        setMessage('');

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
            setMessage(t('memo_recording', lang) || 'Recording... Speak now (max 10 seconds)');
            setIsManualMode(false); // 녹음 시작 시 STT 모드로 전환
            
        } catch (err) {
            console.error("Error accessing microphone or starting recording:", err);
            setError(t('conversion_error', lang) || 'Microphone access error. Please use manual input.');
            setIsRecording(false);
            setIsManualMode(true); // 마이크 접근 오류 시 수동 모드로 폴백
        }
    }, [isRecording, isConverting, t, lang, convertSpeechToText]); 


    // 7. 텍스트 저장 (Firestore)
    const saveMemo = async () => {
        if (!memoText.trim()) {
            setError(t('memo_empty_error', lang) || 'Please enter or record a memo first.');
            return;
        }

        const memosRef = getQuickMemoCollectionRef();
        if (!memosRef) return; 
        
        setIsSaving(true);
        setError('');

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
        } finally {
            setIsSaving(false);
        }
    };
    

    // 8. 모달 본문 렌더링
    const renderContent = () => {
        
        if (!STT_ENABLED || isManualMode) {
            // 수동 모드 렌더링
            return (
                <div className="flex flex-col space-y-4 pt-4">
                    {isManualMode && !STT_ENABLED && (
                             <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm font-medium">
                                 <AlertTriangle className="w-4 h-4 inline mr-2" />
                                 {t('stt_disabled_notice', lang) || "STT 기능이 비활성화되어 수동 입력 모드로 전환되었습니다."}
                             </div>
                    )}

                    <p className="text-gray-700 font-semibold">{t('memo_recorded_text', lang) || `Recorded Text (Max ${MAX_LENGTH} chars):`}</p>
                    <textarea
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value.substring(0, MAX_LENGTH))}
                        rows={3}
                        placeholder={t('enter_memo_manually', lang) || "Enter your inspired meditation memo here..."}
                        className="p-3 bg-gray-100 rounded-lg text-gray-800 break-words border border-gray-300 focus:ring-yellow-500 focus:border-yellow-500"
                    />
                    
                    <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{memoText.length}{t('memo_length_unit', lang) || `/${MAX_LENGTH} chars`}</span>
                        {STT_ENABLED && (
                            // 수동 모드에서 STT 모드로 돌아가는 버튼
                            <button 
                                onClick={() => { 
                                    setIsManualMode(false); 
                                    setError(''); 
                                    setMessage(''); 
                                    setMemoText(''); // 텍스트 지우고 STT 모드로 전환
                                }} 
                                disabled={isConverting} 
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                {t('stt_record_button', lang) || 'Record with STT'}
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={saveMemo} 
                        disabled={memoText.trim().length === 0 || isSaving}
                        className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition duration-300 disabled:opacity-50 flex items-center justify-center"
                    >
                        {isSaving ? (
                            <span className="flex items-center">
                                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                {t('saving', lang) || '저장 중...'}
                            </span>
                        ) : (
                            t('memo_save_button', lang) || 'Save Memo'
                        )}
                    </button>
                </div>
            );
        }


        // STT 활성화 모드일 때 (녹음/변환 중심) - isManualMode=false 일 때만 렌더링됨
        const guideText = t('memo_start_guide', lang) || 'Press the microphone to record a short inspiration memo (max 10 seconds).';
        const isButtonDisabled = isConverting || error || initialError || isSaving;

        return (
            <div className="flex flex-col items-center space-y-6 pt-8">
                
                {/* 🚨 [타이머 표시 및 상태 메시지 통합] */}
                <div className="text-center h-12 flex items-center justify-center">
                    {isRecording ? (
                        <div className="text-xl font-bold text-red-500 flex items-center">
                            <span className="text-lg mr-2">{t('time_remaining', lang) || 'Time: '}</span>
                            {formatTime(elapsedTime)} / {formatTime(MAX_RECORDING_TIME)}
                        </div>
                    ) : isConverting ? (
                        <span className="flex items-center text-yellow-600 font-medium">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('converting_text', lang) || 'Converting speech to text...'}
                        </span>
                    ) : (
                        <span className="text-gray-600 font-medium">{guideText}</span>
                    )}
                </div>

                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isButtonDisabled}
                    className={`p-8 rounded-full shadow-2xl transition-all duration-300 ${isRecording ? 'bg-red-200 ring-4 ring-red-400' : 'bg-yellow-400 hover:bg-yellow-500'} ${isButtonDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <MicIcon recording={isRecording} />
                </button>
                
                <p className="text-sm text-gray-500">
                    {isRecording ? t('memo_stop_record', lang) || 'Stop Recording' : t('memo_start_record', lang) || 'Start Recording'}
                </p>

                {/* STT 모드에서 수동 입력으로 폴백하는 버튼 */}
                <button onClick={() => { setIsManualMode(true); setError(''); setMessage(''); }} disabled={isRecording || isConverting || isSaving} className="text-sm text-blue-600 hover:text-blue-800 font-medium mt-4">
                    {t('enter_memo_manually', lang) || 'Enter text manually'}
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
                className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 animate-in fade-in zoom-in relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold text-gray-900">{t('quickMemoSermon', lang) || 'Quick Memo Sermon'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition"><CloseIcon /></button>
                </div>
                
                {/* 에러/메시지 표시 */}
                {(error || message) && (
                    <div className="p-3 mb-4 rounded-lg text-sm font-medium" style={{ backgroundColor: error ? '#fee2e2' : '#d1fae5', color: error ? '#991b1b' : '#065f46' }}>
                        {error || message}
                    </div>
                )}

                {renderContent()}

            </div>
            
        </div>
    );
};

export default QuickMemoModal;