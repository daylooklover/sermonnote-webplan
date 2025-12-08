'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// 아이콘 라이브러리 추가 및 통일 (lucide-react를 사용한다고 가정)
import { ArrowLeft, Search, BookOpen, Loader2, Zap, AlertTriangle, MessageSquare } from 'lucide-react'; 

import { SUBSCRIPTION_LIMITS } from '@/lib/constants'; 

const API_ENDPOINT = '/api/sermon-generator'; 
const MAX_COMMENTARY_COUNT = 5; 

// 💡 LoadingSpinner 컴포넌트 재정의 (lucide-react의 Loader2 사용)
const LoadingSpinner = ({ message, className = "" }) => (
    <div className={`flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400 ${className}`}>
        <Loader2 className="w-5 h-5 mr-2 animate-spin text-indigo-500" />
        {message}
    </div>
);

const ExpositorySermonComponent = ({
    setSermonDraft, 
    userId, 
    commentaryCount, 
    userSubscription, 
    setErrorMessage, 
    errorMessage,
    lang, 
    user, 
    openLoginModal, 
    onLimitReached, 
    sermonCount, 
    canGenerateSermon, 
    canGenerateCommentary, 
    handleAPICall,
    onGoBack,
    t,
    loading 
}) => {
    
    // --- [State Definitions] ---
    const [scriptureInput, setScriptureInput] = useState('');
    const [scriptureText, setScriptureText] = useState('');
    const [commentary, setCommentary] = useState('');
    const [crossReferences, setCrossReferences] = useState([]);
    
    const [commentaryLoading, setCommentaryLoading] = useState(false);
    const [scriptureLoading, setScriptureLoading] = useState(false);
    const [sermonLoading, setSermonLoading] = useState(false);

    // --- [Helper Functions & Memos] ---
    const safeSetErrorMessage = useCallback((msg) => {
        if (typeof setErrorMessage === 'function') {
            setErrorMessage(msg);
            const timer = setTimeout(() => setErrorMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [setErrorMessage]);
    
    const remainingCommentary = useMemo(() => {
        const limit = userSubscription === 'premium' ? 9999 : (SUBSCRIPTION_LIMITS[userSubscription]?.commentary || MAX_COMMENTARY_COUNT);
        return limit - commentaryCount;
    }, [userSubscription, commentaryCount]);

    const isAnyLoading = scriptureLoading || commentaryLoading || sermonLoading;


    // --- [API Call Handlers (Core Logic Maintained)] ---

    const handleGetCommentaryAndReferences = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!canGenerateCommentary) { safeSetErrorMessage(t('commentaryLimitError', lang)); onLimitReached(); return; } 
        if (scriptureText.trim() === '') { safeSetErrorMessage(t("enterScriptureReference", lang) || "먼저 성경 구절을 검색해 주세요."); return; } 

        setCommentaryLoading(true);
        setCommentary(t('generating', lang) || "주석을 생성 중입니다...");
        setCrossReferences([]);
        safeSetErrorMessage('');

        try {
            const langCode = lang === 'ko' ? 'Korean' : lang === 'en' ? 'English' : lang === 'zh' ? 'Chinese' : lang === 'ru' ? 'Russian' : 'Vietnamese';
            
            const promptText = `Based on the scripture text: "${scriptureText}", provide a highly detailed expository commentary. The commentary section must include: 
            1. **Original Language Analysis**: Brief linguistic insights (e.g., key Hebrew/Greek words).
            2. **Theological Issues**: Discussion of central theological concepts or problems.
            3. **Contextual Cross-references**: Relevant background and cross-references.
            
            After the detailed commentary, provide a separate "Cross-References:" section with a list of 3-5 related verses, each with a brief explanation. Format the entire response with a clear "Commentary:" section and a "Cross-References:" section.
            
            Ensure the entire response is written in ${langCode}.`;

            const fullResponse = await handleAPICall(promptText, API_ENDPOINT, 'commentary', loading); 
            
            if (!fullResponse) {
                setCommentary(t('generationFailed', lang) || "주석 생성에 실패했습니다.");
                return;
            }
            
            const commentaryMatch = fullResponse.match(/Commentary:\s*([\s\S]*?)(?=Cross-References:|$)/i);
            const referencesMatch = fullResponse.match(/Cross-References:\s*([\s\S]*)/i);
            
            if (commentaryMatch) {
                setCommentary(commentaryMatch[1].trim());
            } else {
                setCommentary(fullResponse.replace(/Cross-References:/i, '').trim()); 
            }

            if (referencesMatch) {
                const references = referencesMatch[1].trim()
                    .split('\n')
                    .map(line => line.trim().replace(/^[\*\-\s\d\.]+/, '').trim()) 
                    .filter(line => line.length > 0);
                setCrossReferences(references);
            } else {
                setCrossReferences([]);
            }
            
        } catch (error) {
            setCommentary(t('generationFailed', lang) || "주석 생성 중 오류 발생"); 
            console.error("Commentary API Call Failed:", error);
            safeSetErrorMessage(t('generationFailed', lang));
        } finally {
            setCommentaryLoading(false);
        }
    }, [
        scriptureText, canGenerateCommentary, 
        user, openLoginModal, onLimitReached, lang, safeSetErrorMessage, handleAPICall, t, loading 
    ]); 

    const handleGetScripture = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (scriptureInput.trim() === '') { safeSetErrorMessage(t('enterScriptureReference', lang) || "성경 구절을 입력해 주세요."); return; }
        
        setScriptureLoading(true);
        setScriptureText(t('gettingScripture', lang) || "성경 구절을 찾는 중...");
        safeSetErrorMessage('');
        
        try {
            const promptText = `Please provide the full text for the following scripture reference. If the reference includes multiple verses, ensure each verse is separated by a newline character (\n). Your output MUST contain only the scripture text and nothing else. Scripture: "${scriptureInput}"`;
            
            const text = await handleAPICall(promptText, API_ENDPOINT, 'scripture', loading); 
            
            if (!text || text.trim() === '') {
                setScriptureText((t('generationFailed', lang) || "구절 검색 실패") + " (" + (t('apiReturnedEmptyResponse', lang) || "응답 없음") + ")");
                if (!text) safeSetErrorMessage(t('generationFailed', lang));
                setCommentary(''); 
                setCrossReferences([]);
                return;
            }

            setScriptureText(text);
            setCommentary(''); 
            setCrossReferences([]);
        } catch (error) {
            setScriptureText(t('generationFailed', lang) || "구절 검색 중 오류 발생");
            console.error("Scripture API Call Failed:", error); 
            safeSetErrorMessage(t('generationFailed', lang));
        } finally {
            setScriptureLoading(false);
        }
    }, [scriptureInput, setScriptureText, lang, user, openLoginModal, safeSetErrorMessage, handleAPICall, t, loading]); 

    const handleGenerateSermon = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!commentary || commentary.trim() === '' || sermonLoading) return;
        
        if (!canGenerateSermon) { safeSetErrorMessage(t('sermonLimitError', lang)); onLimitReached(); return; }

        setSermonLoading(true); 
        safeSetErrorMessage('');
        
        try {
            const langCode = lang === 'ko' ? 'Korean' : lang === 'en' ? 'English' : lang === 'zh' ? 'Chinese' : lang === 'ru' ? 'Russian' : 'Vietnamese';
            
            const promptText = 
                `Write a detailed, full-length sermon (between 2500 and 3000 characters) based ONLY on the following detailed commentary and scripture text. ` +
                `The output must be a ready-to-deliver sermon text written in a direct preaching style (설교체), NOT just a hierarchical outline. ` + 
                `DO NOT use Markdown section headers (like #, ##, or ###). ` +
                `RESPOND IN THE LANGUAGE SPECIFIED BY THE LANGUAGE CODE: ${langCode}. Commentary: "${commentary}" Scripture: "${scriptureText}"`;
            
            const sermonResult = await handleAPICall(promptText, API_ENDPOINT, 'sermon', loading); 

            if (sermonResult) {
                setSermonDraft(sermonResult);
            } else {
                safeSetErrorMessage(t('generationFailed', lang)); 
            }
            
        } catch (error) {
            console.error("Sermon Generation API Call Failed:", error);
            safeSetErrorMessage(t('generationFailed', lang));
        } finally {
            setSermonLoading(false);
        }
    }, [
        commentary, scriptureText, handleAPICall, lang, user, openLoginModal, safeSetErrorMessage, setSermonDraft, 
        t, canGenerateSermon, onLimitReached, sermonLoading, loading 
    ]); 

    const handleAddSelectedText = useCallback((e) => {
        const selectedText = window.getSelection().toString();
        if (selectedText && selectedText.trim()) {
            setSermonDraft(prevDraft => prevDraft ? `${prevDraft}\n\n[${t('addedEmphasis', lang) || '강조'}] ${selectedText}` : selectedText);
            safeSetErrorMessage(`"${selectedText.substring(0, 30)}..." ${t('addedToDraft', lang) || '초안에 추가됨'}`);
        }
    }, [setSermonDraft, safeSetErrorMessage, lang, t]);


    
    // UI 렌더링
    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900">
            
            {/* Header Area (Sticky Top) */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-md flex items-center justify-between sticky top-0 z-10">
                <button 
                    onClick={onGoBack} 
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    {t('goBack', lang) || '뒤로가기'}
                </button>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('expositorySermonTitle', lang) || '강해설교 도우미'}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">{t('sermonLimit', lang) || '설교 제한'}: {sermonCount || 0}/{userSubscription?.sermonLimit || 5}</span>
                </div>
            </div>
            
            {/* Main Content Area */}
            <div className="max-w-4xl mx-auto w-full p-6 space-y-8 flex-1">
                
                {/* 🚨 Error Message Bar */}
                {errorMessage && errorMessage.length > 0 && (
                    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 rounded-lg text-center font-medium shadow-md">
                        <AlertTriangle className="w-5 h-5 inline mr-2 align-middle" />
                        {errorMessage}
                    </div>
                )}

                {/* ========================================================= */}
                {/* Step 1: 성경 구절 검색 (Search) */}
                {/* ========================================================= */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border-t-4 border-blue-500 transition hover:shadow-xl">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                        <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 dark:bg-blue-900/30 rounded-full mr-3 text-sm font-extrabold">1</span>
                        {t('scriptureTitle', lang) || '성경 구절 검색'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('expositoryDescription', lang) || '강해설교를 시작할 성경 구절을 입력해 주세요. (예: 요한복음 3:16)'}</p>
                    
                    <div className="flex space-x-3">
                        <input
                            type="text"
                            value={scriptureInput}
                            onChange={(e) => setScriptureInput(e.target.value)}
                            placeholder={t('scripturePlaceholder', lang) || '성경 구절 입력'}
                            className="flex-1 p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                            disabled={isAnyLoading}
                        />
                        <button
                            onClick={handleGetScripture}
                            disabled={isAnyLoading || !scriptureInput.trim() || !user}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {scriptureLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('getScripture', lang) || '구절 가져오기'}
                        </button>
                    </div>

                    {scriptureText && (
                        <div className="mt-5 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-xl shadow-inner">
                            <p className="font-bold text-blue-800 dark:text-blue-300 mb-2">{scriptureInput || (t('scriptureText', lang) || '성경 구절')}</p>
                            <p 
                                className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed cursor-pointer" 
                                onMouseUp={handleAddSelectedText}
                            >
                                {scriptureText}
                            </p>
                        </div>
                    )}
                </div>
                
                {/* ========================================================= */}
                {/* Step 2: AI 주석 생성 및 참고 구절 */}
                {/* ========================================================= */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border-t-4 border-green-500 transition hover:shadow-xl">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center justify-between">
                        <span className="flex items-center">
                            <span className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 dark:bg-green-900/30 rounded-full mr-3 text-sm font-extrabold">2</span>
                            {t('aiCommentaryTitle', lang) || 'AI 주석 및 강해'}
                        </span>
                        {/* 잔여 횟수 표시 */}
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${remainingCommentary > 0 ? 'bg-green-50 text-green-700 dark:bg-green-800 dark:text-green-300' : 'bg-red-50 text-red-700 dark:bg-red-800 dark:text-red-300'}`}>
                            {userSubscription === 'premium' ? (t('premiumUnlimited', lang) || '무제한') : `${t('commentaryLimit', lang) || '주석 제한'}: ${remainingCommentary}회`}
                        </span>
                    </h2>
                    
                    {/* 액션 버튼 */}
                    <div className="flex justify-end items-center mb-5">
                        <button
                            onClick={handleGetCommentaryAndReferences}
                            disabled={!scriptureText || isAnyLoading || remainingCommentary <= 0 || commentaryLoading}
                            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {commentaryLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('getCommentary', lang) || '주석 생성'}
                        </button>
                    </div>

                    {commentary && (
                        <>
                            {/* 주석 내용 카드 */}
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-xl shadow-inner mb-6">
                                <h3 className="font-bold text-lg text-green-800 dark:text-green-300 mb-2">{t('commentaryContent', lang) || '주석 내용'}</h3>
                                <p 
                                    className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed cursor-pointer"
                                    onMouseUp={handleAddSelectedText}
                                >
                                    {commentary}
                                </p>
                            </div>
                            
                            {/* 참고 구절 목록 */}
                            {crossReferences.length > 0 && (
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-inner">
                                    <h3 className="text-md font-bold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center">
                                        <BookOpen className="w-5 h-5 mr-2" />
                                        {t('crossReferencesTitle', lang) || '참고 구절'}
                                    </h3>
                                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 text-sm">
                                        {crossReferences.map((ref, index) => (
                                            <li 
                                                key={index}
                                                className="cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-300 transition"
                                                onMouseUp={handleAddSelectedText}
                                            >
                                                {ref}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                {/* ========================================================= */}
                {/* Step 3: 설교 초안 생성 (Generate Sermon) */}
                {/* ========================================================= */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border-t-4 border-red-500 text-center transition hover:shadow-xl">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center justify-center">
                        <span className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 dark:bg-red-900/30 rounded-full mr-3 text-sm font-extrabold">3</span>
                        {t('generateSermonFromCommentary', lang) || '설교 초안 생성'}
                    </h2>
                    
                    <button
                        onClick={handleGenerateSermon}
                        disabled={!commentary || sermonLoading || !canGenerateSermon || isAnyLoading}
                        className="px-10 py-4 bg-red-600 text-white font-extrabold text-lg rounded-xl shadow-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center mx-auto"
                    >
                        {sermonLoading ? (
                            <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        ) : (
                            <Zap className="w-6 h-6 mr-2" />
                        )}
                        {sermonLoading ? t('generatingSermon', lang) : t('generateSermonFromCommentary', lang) || '설교 초안 생성 시작'}
                    </button>
                    
                    {/* 안내 메시지 */}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                        {t('sermonGenerationNote', lang) || '주석이 있어야 설교 생성이 가능합니다.'}
                    </p>
                </div>


            </div>
        </div>
    );
};

export default ExpositorySermonComponent;