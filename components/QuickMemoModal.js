"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react'; 
import { ReactMic } from 'react-mic';
import { MicIcon, SaveIcon, CloseIcon, LoadingSpinner } from './IconComponents'; 
// 🚨 이 부분이 누락되었습니다. 't' 함수를 가져옵니다.
import { t } from '../lib/translations'; 


// 🚨 API 호출 경로 고정 (Gemini API를 통한 STT를 가정)
const TRANSCRIBE_FULL_URL = '/api/gemini'; 

// Firestore Setup: appId를 외부에서 가져옵니다.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// ----------------------------------------------------------------------
// 🟢 API 호출 헬퍼 함수 정의 🟢
// ----------------------------------------------------------------------
const callSTTAPI = async (base64Audio, lang) => {
    // ... (기존 로직 그대로 유지)
    const langName = {
        'ko': 'Korean', 
        'en': 'English', 
        'vi': 'Vietnamese', 
        'ru': 'Russian', 
        'zh': 'Chinese'
    }[lang] || 'Korean';

    const sttPrompt = `Transcribe the following audio data into a clean, well-formatted text memo in ${langName}. Do not add any commentary, only return the transcribed text.`;
    
    const payload = {
        language_code: lang, 
        contents: [
            {
                role: "user",
                parts: [
                    { text: sttPrompt },
                    {
                        inlineData: {
                            mimeType: 'audio/webm',
                            data: base64Audio,
                        },
                    },
                ]
            }
        ],
    };

    const response = await fetch(TRANSCRIBE_FULL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        let errorDetail = `Status: ${response.status} failed to transcribe audio.`;
        try {
            const errorJson = await response.json();
            if (errorJson.error) {
                errorDetail = `${errorDetail} Server Error: ${errorJson.error}`;
                if (errorJson.details) {
                    errorDetail += ` (${errorJson.details.substring(0, 100)}...)`;
                }
            }
        } catch (e) {
            const errorText = await response.text();
            errorDetail = `${errorDetail} Raw Server Detail: ${errorText.substring(0, 100)}...`;
        }
        throw new Error(errorDetail);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || data.text || '';
};
// ----------------------------------------------------------------------


const QuickMemoModal = ({ 
    isOpen, 
    onClose, 
    memoCount, 
    memoLimit, 
    lang, 
    openLoginModal, 
    user, 
    db, 
    onMemoAdded 
}) => { 
    const [memoText, setMemoText] = useState(''); 
    const [record, setRecord] = useState(false);
    const [isLoading, setIsLoading] = useState(false); 
    const [modalErrorMessage, setModalErrorMessage] = useState(''); 

    // ... (나머지 로직은 그대로 유지)

    useEffect(() => { 
        if (isOpen) { 
            setModalErrorMessage(''); 
            setMemoText(''); 
            setRecord(false); 
        } 
    }, [isOpen]); 
    
    // 녹음 시작/중지 토글 핸들러 (로직 그대로 유지)
    const handleStartStopRecording = () => {
        if (!user) { 
            openLoginModal(); 
            return; 
        } 
        
        if (memoCount >= memoLimit && !record) {
            setModalErrorMessage(t('memoLimitReached', lang) || `메모는 하루 ${memoLimit}개로 제한됩니다.`); 
            return;
        }
        
        if (!record && typeof navigator !== 'undefined' && navigator.mediaDevices) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(() => {
                    setRecord(true);
                    setMemoText(''); 
                    setModalErrorMessage(t('recording', lang) || '녹음 중...');
                })
                .catch((err) => {
                    console.error("마이크 접근 거부됨:", err);
                    setModalErrorMessage(t('microphoneDenied', lang) || '마이크 접근이 거부되었습니다. 브라우저 설정을 확인해 주세요.');
                });
        } else if (record) {
            setRecord(false); 
            setModalErrorMessage(t('processingAudio', lang) || '녹음 중지. 텍스트 변환 중...');
        }
    };

    // 녹음 완료 후 (오디오 데이터 수신) 핸들러 (로직 그대로 유지)
    const onStop = async (recordedBlob) => {
        setRecord(false);
        
        if (recordedBlob.blob.size < 1000) { 
            setModalErrorMessage(t('noAudioData', lang) || '녹음된 오디오 데이터가 너무 작습니다. 다시 시도하세요.'); 
            setIsLoading(false);
            return; 
        } 
        
        setIsLoading(true); 
        setModalErrorMessage(t('generating', lang) || '텍스트 변환 중...'); 
        
        try {
            const base64Audio = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    if (base64) resolve(base64);
                    else reject(new Error("Base64 encoding failed."));
                };
                reader.onerror = reject;
                reader.readAsDataURL(recordedBlob.blob);
            });
            
            const transcript = await callSTTAPI(base64Audio, lang);
            
            const cleanedTranscript = transcript && transcript.trim() ? transcript.trim() : null;
            
            if (cleanedTranscript) { 
                setMemoText(cleanedTranscript); 
                setModalErrorMessage(t('transcriptionSuccess', lang) || '변환 완료! 저장할 수 있습니다.'); 
            } else { 
                setMemoText(''); 
                setModalErrorMessage(t('aiTranscriptionFailed', lang) || '음성 인식이 불가능하거나 내용이 없습니다. 직접 입력해주세요.'); 
            } 
        } catch (error) {
            console.error('Transcription failed:', error); 
            setMemoText(''); 
            setModalErrorMessage(t('aiTranscriptionFailed', lang) || `STT 요청 실패: ${error.message}`); 
        } finally { 
            setIsLoading(false); 
        }
    };

    // 최종 저장 핸들러 (로직 그대로 유지)
    const handleAddMemo = async () => { 
        if (!user) { 
            openLoginModal(); 
            return; 
        } 
        if (memoText.trim() === '' || isLoading) { 
            setModalErrorMessage(t('enterMemoContent', lang) || '메모 내용을 입력해 주세요.'); 
            return; 
        } 
        
        if (!db || !user?.uid) {
            setModalErrorMessage(t('dbConnectionFailed', lang) || '데이터베이스 연결에 실패했습니다. 로그인 상태를 확인해주세요.');
            return; 
        }
        
        if (memoCount >= memoLimit) {
            setModalErrorMessage(t('memoLimitReached', lang) || `메모는 하루 ${memoLimit}개로 제한됩니다.`); 
            return;
        }

        setIsLoading(true); 
        setModalErrorMessage(''); 

        try { 
            const memosCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'memos');
            await addDoc(memosCollectionRef, {
                text: memoText.trim(),
                timestamp: Date.now(),
                userId: user.uid,
            });
            
            setMemoText(''); 
            setModalErrorMessage(t('saveDraftSuccess', lang) || '메모가 성공적으로 저장되었습니다.'); 
            
            setTimeout(() => {
                onClose(); 
                if (onMemoAdded) { onMemoAdded(); }
            }, 500); 

        } catch (error) { 
            setModalErrorMessage(error.message || t('failedToSaveMemo', lang) || '메모 저장에 실패했습니다.'); 
            console.error(error); 
        } finally { 
            setIsLoading(false); 
        } 
    }; 

    if (!isOpen) return null; 

    const getButtonText = () => {
        if (isLoading) {
            return t('saving', lang) || '저장 중';
        }
        return t('save', lang) || '저장';
    };
    
    return ( 
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4"> 
            {/* 퀵 녹음창 크기 조절: max-w-lg (이전 수정 내용 유지) */}
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200"> 
                <div className="flex justify-between items-center mb-4"> 
                    {/* t 함수 오류 수정: 이제 정상 작동 */}
                    <h3 className="text-xl font-bold text-gray-900">{t('quickMemoSermonTitle', lang) || '퀵 메모 설교'}</h3> 
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition"><CloseIcon /></button> 
                </div> 
                <div className="space-y-4"> 
                    {modalErrorMessage && (
                        <div className={`p-3 rounded-xl ${modalErrorMessage.includes('성공') || modalErrorMessage.includes('Success') || modalErrorMessage.includes('완료') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {modalErrorMessage}
                        </div>
                    )} 
                    <div> 
                        <p className="text-sm text-gray-500"> 
                            {t('memoLimitMessage', lang, memoLimit, memoCount) || `일일 메모 제한: ${memoCount} / ${memoLimit}`} 
                        </p> 
                    </div> 
                    
                    <div className="flex flex-col items-center">
                        <ReactMic
                            record={record}
                            className="sound-wave" 
                            onStop={onStop}
                            strokeColor={record ? "#E53E3E" : "#4299E1"}
                            backgroundColor="#FAFAFA"
                            mimeType="audio/webm"
                            height={50} 
                            width={280} 
                        />
                        {record && <p className="text-xs text-red-500 mt-1">{t('recordingInProgress', lang) || "녹음 중... 다시 누르면 중지됩니다."}</p>}
                    </div>

                    <textarea 
                        value={memoText} 
                        onChange={(e) => setMemoText(e.target.value)} 
                        placeholder={t('quickMemoPlaceholder', lang) || '영감을 받은 메모를 입력해 주세요...'} 
                        rows="4" 
                        className="w-full p-3 rounded-md bg-gray-100 text-gray-800 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                        disabled={record || isLoading}
                    /> 
                    <div className="flex justify-between items-center space-x-2"> 
                        <button 
                            onClick={handleStartStopRecording} 
                            className={`flex items-center justify-center w-1/2 py-3 rounded-md font-semibold text-white transition ${record ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-800'}`} 
                            disabled={isLoading} 
                        > 
                            {isLoading ? <LoadingSpinner /> : <MicIcon />} 
                            <span className="ml-2">{record ? t('stopRecording', lang) || '녹음 중지' : t('voiceMemo', lang) || '음성 메모'}</span> 
                        </button> 
                        <button 
                            onClick={handleAddMemo} 
                            className="flex items-center justify-center py-3 rounded-md font-semibold text-white bg-green-500 hover:bg-green-600 transition w-1/2" 
                            disabled={memoText.trim() === '' || isLoading || record} 
                        > 
                            {isLoading ? <LoadingSpinner /> : <SaveIcon />} 
                            <span className="ml-2">{getButtonText()}</span> 
                        </button>
                    </div> 
                </div> 
            </div> 
        </div> 
    ); 
}; 

export default QuickMemoModal;