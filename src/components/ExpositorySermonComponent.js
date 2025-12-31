'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ArrowLeft, Search, Loader2, Zap, AlertTriangle, MessageSquare } from 'lucide-react';
// 🚨 Gemini SDK 임포트
import { GoogleGenerativeAI } from "@google/generative-ai";

const SUBSCRIPTION_LIMITS = {
    free: { commentary: 5, sermon: 2 },
    basic: { commentary: 10, sermon: 5 },
    premium: { commentary: 9999, sermon: 9999 },
};

const ExpositorySermonComponent = ({
    setSermonDraft,
    commentaryCount = 0,
    userSubscription = 'free',
    setErrorMessage,
    errorMessage,
    lang = 'ko',
    user,
    openLoginModal,
    onLimitReached,
    sermonCount = 0,
    canGenerateSermon = false,
    canGenerateCommentary = false,
    onGoBack,
    t = (key) => key,
    loading = false
}) => {

    const [scriptureInput, setScriptureInput] = useState('');
    const [scriptureText, setScriptureText] = useState('');
    const [commentary, setCommentary] = useState('');
    const [commentaryLoading, setCommentaryLoading] = useState(false);
    const [scriptureLoading, setScriptureLoading] = useState(false);
    const [sermonLoading, setSermonLoading] = useState(false);

    // 🚨 [핵심 수정] 서버 fetch 대신 Gemini SDK 직접 호출 함수
    const callGeminiDirectly = useCallback(async (prompt, type) => {
        try {
            if (!user) {
                openLoginModal?.();
                throw new Error("로그인이 필요합니다.");
            }

            // 환경변수 확인 (NEXT_PUBLIC_ 접두사 필수)
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            
            // 모델 고정: gemini-1.5-flash
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            // 다국어 성경 설정
            const langMap = {
                ko: { name: "Korean", bible: "개역개정" },
                en: { name: "English", bible: "NIV/KJV" },
                zh: { name: "Chinese", bible: "CUV" },
                ru: { name: "Russian", bible: "Synodal" },
                vi: { name: "Vietnamese", bible: "Bản Truyền Thống" }
            };
            const target = langMap[lang] || langMap.ko;

            // 시스템 지시문 구성
            let systemInstruction = `당신은 세계적인 성경 전문가입니다. 모든 답변은 반드시 '${target.name}'으로 작성하세요. `;
            if (type === 'fetch_scripture') {
                systemInstruction += `오직 ${target.bible} 버전의 성경 본문 텍스트만 출력하세요. 다른 설명은 금지합니다.`;
            } else if (type === 'commentary') {
                systemInstruction += `해당 구절에 대한 깊이 있는 신학적 주석과 강해를 작성하세요.`;
            } else if (type === 'sermon') {
                systemInstruction += `성도들에게 감동을 주는 체계적인 설교 원고를 작성하세요.`;
            }

            const result = await model.generateContent(`${systemInstruction}\n\nUser Request: ${prompt}`);
            const response = await result.response;
            return response.text();

        } catch (error) {
            console.error(`[Gemini Error - ${type}]:`, error.message);
            throw error;
        }
    }, [user, lang, openLoginModal]);

    const safeSetErrorMessage = useCallback((msg) => {
        if (typeof setErrorMessage === 'function') {
            setErrorMessage(msg);
            setTimeout(() => setErrorMessage(''), 5000);
        }
    }, [setErrorMessage]);

    const { remainingCommentary, sermonLimit } = useMemo(() => {
        const subscriptionKey = userSubscription?.toLowerCase() || 'free';
        const limits = SUBSCRIPTION_LIMITS[subscriptionKey] || SUBSCRIPTION_LIMITS['free'];
        return {
            remainingCommentary: Math.max(0, limits.commentary - commentaryCount),
            sermonLimit: limits.sermon
        };
    }, [userSubscription, commentaryCount]);

    const isAnyLoading = scriptureLoading || commentaryLoading || sermonLoading || loading;
    const translate = useCallback((key, fallback) => t(key, lang) || fallback, [t, lang]);

    const handleGetScripture = useCallback(async () => {
        if (!user) { openLoginModal?.(); return; }
        if (scriptureInput.trim() === '') return;

        setScriptureLoading(true);
        setScriptureText(translate('gettingScripture', "성경 구절을 검색 중입니다..."));

        try {
            const text = await callGeminiDirectly(scriptureInput, 'fetch_scripture');
            setScriptureText(text || '');
        } catch (error) {
            setScriptureText('');
            safeSetErrorMessage(error.message || translate('generationFailed', "구절 검색 중 오류 발생"));
        } finally {
            setScriptureLoading(false);
        }
    }, [scriptureInput, user, openLoginModal, callGeminiDirectly, translate, safeSetErrorMessage]);

    const handleGetCommentaryAndReferences = useCallback(async () => {
        if (!user) { openLoginModal?.(); return; }
        if (!scriptureText) return;
        if (!canGenerateCommentary) { onLimitReached?.(); return; }

        setCommentaryLoading(true);
        try {
            const text = await callGeminiDirectly(scriptureInput, 'commentary');
            setCommentary(text || '');
        } catch (error) {
            safeSetErrorMessage(error.message || "주석 생성 중 오류가 발생했습니다.");
        } finally {
            setCommentaryLoading(false);
        }
    }, [user, scriptureText, scriptureInput, canGenerateCommentary, onLimitReached, callGeminiDirectly, safeSetErrorMessage, openLoginModal]);

    const handleGenerateSermon = useCallback(async () => {
        if (!user || !commentary || !canGenerateSermon) return;
        
        setSermonLoading(true);
        try {
            const result = await callGeminiDirectly(commentary, 'sermon');
            if (result) {
                const formattedTitle = `[강해설교: ${scriptureInput}]`;
                const finalDraft = `${formattedTitle}\n\n${result}`;
                setSermonDraft(finalDraft);
            }
        } catch (error) {
            safeSetErrorMessage(error.message || translate('generationFailed', "설교 생성 오류"));
        } finally {
            setSermonLoading(false);
        }
    }, [user, commentary, canGenerateSermon, callGeminiDirectly, scriptureInput, setSermonDraft, translate, safeSetErrorMessage]);

    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="p-4 bg-white dark:bg-gray-800 border-b flex items-center justify-between sticky top-0 z-10">
                <button onClick={onGoBack} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition">
                    <ArrowLeft className="w-5 h-5 mr-2" /> {translate('goBack', '뒤로가기')}
                </button>
                <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 dark:text-white">
                    {translate('expositorySermonTitle', '강해설교 도우미')}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="font-mono">{sermonCount}/{sermonLimit}</span>
                </div>
            </header>

            <div className="max-w-4xl mx-auto w-full p-6 space-y-8 flex-1">
                {errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center animate-pulse">
                        <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
                        <p className="text-sm">{errorMessage}</p>
                    </div>
                )}

                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800 dark:text-white">
                        <span className="w-7 h-7 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full mr-3 text-xs font-bold">1</span>
                        {translate('scriptureTitle', '성경 본문 설정')}
                    </h2>
                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={scriptureInput}
                            onChange={(e) => setScriptureInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGetScripture()}
                            placeholder="예: 사도행전 4:7-10"
                            className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition"
                        />
                        <button 
                            onClick={handleGetScripture} 
                            disabled={isAnyLoading || !scriptureInput.trim()} 
                            className="px-5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition shadow-sm"
                        >
                            {scriptureLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        </button>
                    </div>
                    {scriptureText && (
                        <div className="mt-5 p-5 bg-indigo-50/50 dark:bg-indigo-900/20 border-l-4 border-indigo-500 rounded-r-xl">
                            <p className="font-bold text-indigo-700 dark:text-indigo-300 mb-2">{scriptureInput}</p>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{scriptureText}</p>
                        </div>
                    )}
                </section>

                <section className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold flex items-center text-gray-800 dark:text-white">
                            <span className="w-7 h-7 flex items-center justify-center bg-green-100 text-green-600 rounded-full mr-3 text-xs font-bold">2</span>
                            {translate('aiCommentaryTitle', '본문 주석 및 강해')}
                        </h2>
                        <span className="text-xs font-semibold px-2 py-1 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-md">
                            {remainingCommentary}회 남음
                        </span>
                    </div>
                    <button 
                        onClick={handleGetCommentaryAndReferences} 
                        disabled={!scriptureText || isAnyLoading} 
                        className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-40 transition flex items-center justify-center shadow-sm"
                    >
                        {commentaryLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <MessageSquare className="w-5 h-5 mr-2" />}
                        {translate('getCommentary', '주석 생성 시작')}
                    </button>
                    {commentary && (
                        <div className="mt-5 p-5 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl shadow-inner">
                            <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap text-sm leading-relaxed">{commentary}</p>
                        </div>
                    )}
                </section>

                <section className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-red-100 dark:border-red-900/30 text-center">
                    <h2 className="text-lg font-bold mb-6 flex items-center justify-center text-gray-800 dark:text-white">
                        <span className="w-7 h-7 flex items-center justify-center bg-red-100 text-red-600 rounded-full mr-3 text-xs font-bold">3</span>
                        {translate('generateSermonFromCommentary', '설교 초안 완성')}
                    </h2>
                    <button 
                        onClick={handleGenerateSermon} 
                        disabled={!commentary || isAnyLoading} 
                        className="w-full md:w-max px-12 py-4 bg-red-600 text-white font-extrabold text-lg rounded-2xl shadow-red-200 dark:shadow-none shadow-xl hover:bg-red-700 hover:-translate-y-1 transition disabled:opacity-40 disabled:translate-y-0 flex items-center justify-center mx-auto"
                    >
                        {sermonLoading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Zap className="w-6 h-6 mr-2" />}
                        {translate('generateSermonFromCommentary', 'AI 강해설교 초안 생성')}
                    </button>
                    <p className="mt-4 text-xs text-gray-400 italic">
                        * 주석 내용을 바탕으로 체계적인 설교 원고를 작성합니다.
                    </p>
                </section>
            </div>
        </div>
    );
};

export default ExpositorySermonComponent;