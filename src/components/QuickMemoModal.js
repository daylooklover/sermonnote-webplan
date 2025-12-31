'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Save, FileText, Loader2, Mic, AlertTriangle } from 'lucide-react'; 
import { useAuth } from '@/lib/firebase'; 

const MAX_LENGTH = 150; 

// --- [헬퍼 컴포넌트] ---
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 6L6 18" /><path d="M6 6L18 18" /></svg>
);

const MicIcon = ({ recording }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={recording ? "#EF4444" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-8 w-8 transition-colors ${recording ? 'animate-pulse text-red-500' : 'text-gray-600'}`}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" /></svg>
);

const QuickMemoModal = ({ onClose, userId, db, t, lang, onMemoSaved, initialModeIsManual = false }) => {
    const { user } = useAuth();
    const [memoText, setMemoText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [isManualMode, setIsManualMode] = useState(initialModeIsManual); 
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // 🚨 Web Speech API 객체 참조
    const recognitionRef = useRef(null);

    // 음성 인식 초기화
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false; // 한 문장씩 인식
            recognition.interimResults = false; // 중간 결과 미표시
            recognition.lang = lang === 'ko' ? 'ko-KR' : 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setMemoText(transcript.substring(0, MAX_LENGTH));
                setIsManualMode(true);
                setIsRecording(false);
            };

            recognition.onerror = (event) => {
                console.error("Speech Recognition Error", event.error);
                setError(t('conversion_error', lang) || '음성 인식 오류가 발생했습니다.');
                setIsRecording(false);
                setIsManualMode(true);
            };

            recognition.onend = () => {
                setIsRecording(false);
            };

            recognitionRef.current = recognition;
        } else {
            console.warn("Speech Recognition not supported in this browser.");
            setIsManualMode(true);
        }
    }, [lang, t]);

    const startRecording = useCallback(() => {
        if (!recognitionRef.current) return;
        setError(''); setMessage('');
        try {
            recognitionRef.current.start();
            setIsRecording(true);
            setMemoText('');
        } catch (err) {
            setError('마이크 접근 오류가 발생했습니다.');
            setIsManualMode(true);
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const saveMemo = async () => {
        if (!memoText.trim()) return;
        setIsSaving(true);
        try {
            const appId = "default-app-id";
            const memosRef = collection(db, `artifacts/${appId}/users/${userId}/quick_memos`);
            await addDoc(memosRef, {
                text: memoText.substring(0, MAX_LENGTH),
                createdAt: serverTimestamp(),
                lang: lang,
            });
            onMemoSaved();
            onClose();
        } catch (e) {
            setError(`저장 실패: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-[100] p-4" onClick={onClose}>
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                    <h3 className="text-xl font-bold text-gray-900">{t('quickMemoSermon', lang) || 'Quick Memo'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900"><CloseIcon /></button>
                </div>

                {(error || message) && (
                    <div className={`p-3 mb-4 rounded-lg text-sm font-medium ${error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {error || message}
                    </div>
                )}

                {isManualMode ? (
                    <div className="flex flex-col space-y-4 pt-4">
                        <textarea
                            value={memoText}
                            onChange={(e) => setMemoText(e.target.value.substring(0, MAX_LENGTH))}
                            rows={4}
                            placeholder="메모를 입력하세요..."
                            className="p-3 bg-gray-50 rounded-lg text-gray-800 border focus:ring-2 focus:ring-yellow-500 outline-none"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{memoText.length}/{MAX_LENGTH}</span>
                            <button onClick={() => setIsManualMode(false)} className="text-blue-500 font-bold">다시 녹음하기</button>
                        </div>
                        <button onClick={saveMemo} disabled={!memoText.trim() || isSaving} className="w-full py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg">
                            {isSaving ? <Loader2 className="animate-spin mx-auto" /> : '메모 저장하기'}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-10 space-y-6">
                        <div className="h-10">
                            {isRecording ? <span className="text-red-500 font-bold animate-pulse">말씀을 듣고 있습니다...</span> : <span className="text-gray-400">마이크 아이콘을 눌러 말씀하세요</span>}
                        </div>
                        <button 
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-10 rounded-full transition-all ${isRecording ? 'bg-red-100 ring-4 ring-red-400' : 'bg-yellow-400 hover:scale-105'}`}
                        >
                            <MicIcon recording={isRecording} />
                        </button>
                        <button onClick={() => setIsManualMode(true)} className="text-blue-500 text-sm">직접 입력하기</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuickMemoModal;