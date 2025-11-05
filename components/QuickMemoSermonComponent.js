"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';


// 🚨 경로 오류 해결 및 't is not defined' 에러 방지를 위해 t 함수를 임시로 컴포넌트 외부에서 정의합니다.
// (번역 키를 찾지 못할 경우, 기본값 또는 키를 그대로 반환)
const t = (key, lang, ...args) => {
    // 임시 로직: 기본 언어가 한국어일 때 기본 텍스트를 반환한다고 가정
    const defaultTexts = {
        'toneCalm': '보통 (차분하고 설명적)',
        'lengthMedium': '2000자 내외',
        'draftStarting': '초안 생성을 시작합니다. AI가 아이디어를 구상 중입니다...',
        'error': '에러',
        'goBack': '뒤로가기',
        'quickMemoSermonTitle': '빠른 메모 설교 작성',
        'quickMemoSermonDesc': '선택된 영감 메모를 기반으로 AI 설교 초안을 생성합니다.',
        'step2Options': '2단계: 설교 초안 생성 옵션',
        'sermonTone': '설교 톤',
        'toneWitty': '위트 있는',
        'tonePassionate': '열정적인',
        'toneAcademic': '학술적인',
        'draftLength': '초안 길이',
        'lengthShort': '짧게 (1000자 내외)',
        'lengthLong': '길게 (4000자 내외)',
        'startAIGeneration': 'AI 설교 초안 생성 시작',
        'step3GeneratedDraft': '3단계: 생성된 설교 초안',
        'draftMaximize': '초안 확대',
        'pressGenerateButton': '생성 버튼을 눌러 초안을 만드세요.',
        'selectMemoPrompt': '메모를 선택하여 생성을 시작하세요.',
        'aiNoteSermonDraft': 'Gemini API를 사용하여 음성 텍스트를 기반으로 설교 초안을 작성합니다.',
        'generatedDraftTitle': '생성된 설교 초안 전문',
        'print': '인쇄하기',
        'close': '닫기',
        'step1MemoSelection': '1단계: 영감 메모 선택',
        'selected': '개 선택됨',
        'recordMemoPrompt': '우측 하단의 메모 버튼을 눌러 영감을 기록하세요.',
        'memoDataLoading': '메모 데이터 로딩 중...',
        'memoSavingOrDeleting': '메모 저장/삭제 중...',
        'sermonGenerationFailed': '설교 생성 실패',
        // args가 있는 경우 처리 (예: limitMessage)
        'memoLimitMessage': (args.length > 1) ? `일일 메모 제한: ${args[1]} / ${args[0]}` : null
    };

    const text = defaultTexts[key] || key;

    if (key === 'memoLimitMessage' && args.length > 1) {
        return text;
    }
    
    // 기본값이나 키를 반환
    return text;
};


// Lucide Icons (기존 아이콘 정의 유지)
const TrashIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1.1-.9 2-2 2H7c-1.1 0-2-.9-2-2V6"/><path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2"/></svg>);
const SermonIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><polyline points="10 8 16 8"/><polyline points="10 12 16 12"/><polyline points="10 16 16 16"/></svg>);
const CheckIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>);
const MaximizeIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>);
const PrinterIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2H3v7"/><path d="M18 9V2h3v7"/><rect width="18" height="12" x="3" y="10" rx="2"/><path d="M12 20V10"/></svg>);

const LoadingSpinner = (props) => (
    <svg {...props} className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// Constants
const API_URL_STREAM = '/api/gemini';
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';


// AI 응답 정제 유틸리티 (유지)
const cleanAiResponse = (text) => {
    if (!text) return '';

    let cleaned = text.trim();

    // 1. AI 인사말 패턴 제거 
    const greetingPattern = /^((\*\*?|\s*|\/)\s*(재민아|장미|박카스|안녕하세요|고마워|감사|thanks|thank you|Hello|Hi)\s*[\w\s,!.?]*)/i;
    
    cleaned = cleaned.replace(greetingPattern, '').trim();

    // 2. 앞부분에 남아있는 불필요한 마크다운 기호 제거 (##, *)
    cleaned = cleaned.replace(/^(#+\s*|\*+\s*)/, '');
    
    return cleaned;
};


// ******************************************************************************
// * QuickMemoSermonComponent 시작
// ******************************************************************************
const QuickMemoSermonComponent = ({ 
    setSermonDraft, onGoBack, 
    isGeneratingSermon, setIsGeneratingSermon, 
    onSetError,
    memos, db, userId,
    lang = 'ko'
}) => {
    
    // 상태 관리 (유지)
    const [selectedMemoIds, setSelectedMemoIds] = useState([]);
    const [sermonTone, setSermonTone] = useState(t('toneCalm', lang) || '보통 (차분하고 설명적)');
    const [sermonLength, setSermonLength] = useState(t('lengthMedium', lang) || '2000자 내외');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [generatedSermon, setGeneratedSermon] = useState('');
    const [sermonLoading, setSermonLoading] = useState(false);
    const [localErrorMessage, setLocalErrorMessage] = useState(''); 

    // 모달/인쇄 관련 useEffect (유지)
    useEffect(() => {
        if (isModalOpen) {
            document.body.classList.add('modal-open-for-print');
        } else {
            document.body.classList.remove('modal-open-for-print');
        }
        return () => {
            document.body.classList.remove('modal-open-for-print');
        };
    }, [isModalOpen]);


    // 메모 선택, 삭제, 설교 생성 함수 (기능 로직 유지)
    const selectedMemos = useMemo(() => {
        return memos?.filter(memo => selectedMemoIds.includes(memo.id)) || [];
    }, [memos, selectedMemoIds]);

    const handleMemoToggle = useCallback((memoId) => {
        setSelectedMemoIds(prevIds => {
            if (prevIds.includes(memoId)) {
                return []; 
            } else {
                return [memoId]; 
            }
        });
        setGeneratedSermon('');
    }, []);

    const deleteMemo = useCallback(async (memoId) => {
        if (!db || !userId) {
            onSetError("삭제 오류: 사용자 인증 또는 DB 연결 실패.");
            return;
        }
        setSermonLoading(true);
        try {
            const docRef = doc(db, 'artifacts', appId, 'users', userId, 'memos', memoId);
            await deleteDoc(docRef);
            setSelectedMemoIds(prevIds => prevIds.filter(id => id !== memoId));
            setLocalErrorMessage('');
        } catch (error) {
            console.error("메모 삭제 오류:", error);
            setLocalErrorMessage(`메모 삭제 실패: ${error.message}`);
        } finally {
            setSermonLoading(false);
        }
    }, [db, userId, onSetError]);


    const generateSermon = useCallback(async () => {
        if (selectedMemos.length === 0 || sermonLoading || isGeneratingSermon) return;

        setIsGeneratingSermon(true);
        setSermonLoading(true); 
        setGeneratedSermon(t('draftStarting', lang) || '초안 생성을 시작합니다. AI가 아이디어를 구상 중입니다...'); 
        onSetError(''); 
        setLocalErrorMessage(''); 

        try {
            const combinedText = selectedMemos.map(m => m.text).join(' | ');
            
            // Prompt 유지
            const promptText = `
                Write a complete, structured sermon draft. The total length should be approximately ${sermonLength}.
                The sermon's tone/style should be ${sermonTone}.
                Use the following memo(s)/inspiration text as the main source of ideas: "${combinedText.substring(0, 3000)}"
                RESPOND IN THE LANGUAGE SPECIFIED BY THE LANGUAGE CODE: ${lang}.
            `; 

            const response = await fetch(API_URL_STREAM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: promptText, 
                    language_code: lang, 
                }),
            });

            if (!response.ok || !response.body) {
                let errorMsg = `서버 응답 오류 (Status: ${response.status}).`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMsg = `${errorData.error}: ${errorData.details || errorData.message}`;
                    } else if (errorData.message) {
                        errorMsg = errorData.message;
                    }
                } catch (e) {
                    const rawText = await response.text().catch(() => 'No response body.');
                    errorMsg = `Raw Server Error (Status ${response.status}): ${rawText.substring(0, 100)}...`;
                }
                throw new Error(errorMsg);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let receivedText = '';

            setGeneratedSermon(''); 

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunkText = decoder.decode(value, { stream: true });
                receivedText += chunkText;
                
                setGeneratedSermon(cleanAiResponse(receivedText)); 
                
                if (receivedText.includes('[STREAM_ERROR]')) {
                    throw new Error(receivedText);
                }
            }

            setGeneratedSermon(cleanAiResponse(receivedText));
            setSermonLoading(false);
            setIsGeneratingSermon(false); 

        } catch (error) {
            const rawErrorMsg = error.message.replace(/\[STREAM_ERROR\]\s*/, '');
            
            setGeneratedSermon(`⚠️ ${t('sermonGenerationFailed', lang) || '설교 생성 실패'}: ${rawErrorMsg.substring(0, 50)}...`);
            
            setLocalErrorMessage(`[설교 생성 오류] ${rawErrorMsg}`);
            onSetError(`[설교 오류] ${rawErrorMsg}`); 

            setSermonLoading(false);
            setIsGeneratingSermon(false); 
        }
    }, [selectedMemos, sermonLoading, isGeneratingSermon, setIsGeneratingSermon, onSetError, sermonLength, sermonTone, lang]);


    // 메모 리스트 UI 렌더링 (로직 유지)
    const renderMemoList = useMemo(() => {
        if (!memos) {
            return (
                <div className="space-y-3 h-96 overflow-y-auto p-4 border border-gray-200 rounded-xl bg-gray-50 flex items-center justify-center">
                    <p className="text-gray-500 text-sm flex items-center space-x-2"><LoadingSpinner /> <span>{t('memoDataLoading', lang) || '메모 데이터 로딩 중...'}</span></p>
                </div>
            );
        }

        return (
            <div className="space-y-3 h-96 overflow-y-auto p-4 border border-gray-200 rounded-2xl bg-white shadow-inner">
                <h3 className="text-xl font-bold text-gray-800 sticky top-0 bg-white pb-3 z-10">
                    {t('step1MemoSelection', lang) || '1단계: 영감 메모 선택'} ({selectedMemos.length} {t('selected', lang) || '개 선택됨'})
                </h3>
                {memos.length === 0 ? (
                    <p className="text-gray-500 text-sm py-4 text-center">{t('recordMemoPrompt', lang) || '우측 하단의 메모 버튼을 눌러 영감을 기록하세요.'}</p>
                ) : (
                    memos.map(memo => (
                        <div 
                            key={memo.id} 
                            className={`p-4 rounded-xl cursor-pointer transition-all duration-200 flex items-start space-x-3 
                                ${selectedMemoIds.includes(memo.id) 
                                    ? 'bg-blue-50 border-blue-500 border-2 ring-2 ring-blue-300' 
                                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                                }`}
                            onClick={() => handleMemoToggle(memo.id)}
                        >
                            {/* 체크박스 영역 */}
                            <div className={`w-5 h-5 flex-shrink-0 mt-1 rounded-full border ${selectedMemoIds.includes(memo.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                {selectedMemoIds.includes(memo.id) && <CheckIcon className="w-4 h-4 text-white mx-auto mt-0.5"/>}
                            </div>
                            
                            {/* 텍스트 내용 */}
                            <div className="flex-grow min-w-0">
                                <p className="text-sm font-medium text-gray-800 line-clamp-2">{memo.text}</p>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-xs text-gray-500">
                                        {new Date(memo.timestamp).toLocaleTimeString(lang === 'ko' ? 'ko-KR' : 'en-US')}
                                    </span>
                                </div>
                            </div>

                            {/* 삭제 버튼 */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); deleteMemo(memo.id); }}
                                className="text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition flex-shrink-0"
                                disabled={sermonLoading || isGeneratingSermon}
                            >
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                        </div>
                    ))
                )}
                {sermonLoading && !isGeneratingSermon && (
                    <p className="text-center text-blue-600 font-semibold flex items-center justify-center space-x-2 py-4">
                        <LoadingSpinner /> <span>{t('memoSavingOrDeleting', lang) || '메모 저장/삭제 중...'}</span>
                    </p>
                )}
            </div>
        );
    }, [memos, selectedMemoIds, sermonLoading, isGeneratingSermon, deleteMemo, handleMemoToggle, selectedMemos.length, lang]);


    return (
        <div className="text-center p-4 min-h-screen bg-gray-50">
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-5xl mx-auto space-y-8 relative">
                
                {/* 뒤로가기 버튼 */}
                <button
                    onClick={onGoBack}
                    className="absolute top-6 left-6 p-2 rounded-full bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-2 font-semibold text-sm"
                >
                    <span className="font-bold text-lg">←</span> {t('goBack', lang) || '뒤로가기'}
                </button>
                
                <h2 className="text-4xl font-extrabold text-gray-800 pt-8">{t('quickMemoSermonTitle', lang) || '빠른 메모 설교 작성'}</h2>
                <p className="text-md text-gray-600">{t('quickMemoSermonDesc', lang) || '선택된 영감 메모를 기반으로 AI 설교 초안을 생성합니다.'}</p>

                {/* 로컬 에러 메시지 배너 */}
                {localErrorMessage && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-xl shadow-inner text-sm font-semibold">
                        **{t('error', lang) || '에러'}:** {localErrorMessage}
                    </div>
                )}
                
                {/* 메인 2단 그리드 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* 1단계 메모 선택 영역 */}
                    <div className="min-h-[400px]">
                        {renderMemoList}
                    </div>

                    <div className="space-y-6">

                        {/* Step 2: 옵션 설정 (★★★ 화면 깨짐 수정 완료 영역 ★★★) */}
                        <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50 shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">{t('step2Options', lang) || '2단계: 설교 초안 생성 옵션'}</h3>
                            
                            {/* 톤 설정 */}
                            <div className="flex items-center space-x-4 mb-3">
                                <label className="text-sm font-medium text-gray-600 w-1/4 text-left">{t('sermonTone', lang) || '설교 톤'}:</label>
                                <select
                                    value={sermonTone}
                                    onChange={(e) => setSermonTone(e.target.value)}
                                    className="flex-grow p-2 border border-gray-300 rounded-lg text-sm bg-white"
                                >
                                    <option value={t('toneCalm', lang) || "보통 (차분하고 설명적)"}>{t('toneCalm', lang) || "보통 (차분하고 설명적)"}</option>
                                    <option value={t('toneWitty', lang) || "유머러스하고 위트 있는"}>{t('toneWitty', lang) || "위트 있는"}</option>
                                    <option value={t('tonePassionate', lang) || "강조적이고 열정적인"}>{t('tonePassionate', lang) || "열정적인"}</option>
                                    <option value={t('toneAcademic', lang) || "학술적이고 심도 있는"}>{t('toneAcademic', lang) || "학술적인"}</option>
                                </select>
                            </div>

                            {/* 길이 설정 */}
                            <div className="flex items-center space-x-4">
                                <label className="text-sm font-medium text-gray-600 w-1/4 text-left">{t('draftLength', lang) || '초안 길이'}:</label>
                                <select
                                    value={sermonLength}
                                    onChange={(e) => setSermonLength(e.target.value)}
                                    className="flex-grow p-2 border border-gray-300 rounded-lg text-sm bg-white"
                                >
                                    <option value={t('lengthShort', lang) || "1000자 내외"}>{t('lengthShort', lang) || "짧게 (1000자 내외)"}</option>
                                    <option value={t('lengthMedium', lang) || "2000자 내외"}>{t('lengthMedium', lang) || "보통 (2000자 내외)"}</option>
                                    <option value={t('lengthLong', lang) || "4000자 내외"}>{t('lengthLong', lang) || "길게 (4000자 내외)"}</option>
                                </select>
                            </div>
                        </div>

                        {/* 생성 버튼 (스타일 개선) */}
                        <button
                            onClick={generateSermon}
                            className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl shadow-xl transition duration-300 disabled:bg-gray-400 disabled:shadow-none flex items-center justify-center space-x-3"
                            disabled={selectedMemos.length === 0 || sermonLoading || isGeneratingSermon}
                        >
                            {(sermonLoading || isGeneratingSermon) && <LoadingSpinner />}
                            <span>{t('startAIGeneration', lang) || 'AI 설교 초안 생성 시작'}</span>
                        </button>

                        {/* Step 3: 생성 결과 확인 */}
                        <div className="p-5 border border-gray-200 rounded-2xl bg-white shadow-lg min-h-[300px] text-left relative">
                            <h3 className="text-xl font-bold text-gray-800 mb-3 border-b pb-2">{t('step3GeneratedDraft', lang) || '3단계: 생성된 설교 초안'}</h3>
                            
                            {/* 확대 버튼 */}
                            {generatedSermon && !generatedSermon.includes('⚠️') && (
                                <div className="absolute top-5 right-5 flex space-x-2">
                                    <button 
                                        onClick={() => setIsModalOpen(true)}
                                        className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
                                        title={t('draftMaximize', lang) || "초안 확대"}
                                    >
                                        <MaximizeIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            )}

                            <div className="text-sm text-gray-800 overflow-y-auto max-h-60 whitespace-pre-wrap">
                                {generatedSermon || (selectedMemos.length > 0 ? (t('pressGenerateButton', lang) || '생성 버튼을 눌러 초안을 만드세요.') : (t('selectMemoPrompt', lang) || '메모를 선택하여 생성을 시작하세요.'))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                    <p>{t('aiNoteSermonDraft', lang) || 'Gemini API를 사용하여 음성 텍스트를 기반으로 설교 초안을 작성합니다.'}</p>
                    <p>Firebase Firestore is used for memo storage in path: /artifacts/{appId}/users/{userId}/memos</p>
                </div>
            </div>

            {/* 설교 초안 전체보기 및 인쇄 모달 */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 modal-content-for-print"> 
                    <div className="absolute inset-0 no-print" onClick={() => setIsModalOpen(false)}></div>
                    
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col p-6 relative z-10"> 
                        <div className="flex justify-between items-center pb-4 border-b no-print">
                            <h3 className="text-2xl font-bold text-gray-800">{t('generatedDraftTitle', lang) || '생성된 설교 초안 전문'}</h3>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => window.print()}
                                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition no-print"
                                    title={t('print', lang) || "인쇄하기"}
                                >
                                    <PrinterIcon className="w-6 h-6"/>
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition no-print"
                                    title={t('close', lang) || "닫기"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto mt-4 p-2 text-base whitespace-pre-wrap leading-relaxed">
                            <div className="printable-sermon-draft">
                                {generatedSermon}
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t flex justify-end no-print">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition"
                            >
                                {t('close', lang) || '닫기'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickMemoSermonComponent;