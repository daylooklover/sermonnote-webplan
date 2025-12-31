'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { GoBackIcon, LoadingSpinner, RealLifeIcon } from '@/components/IconComponents.js'; 
import { SUBSCRIPTION_LIMITS } from '@/lib/constants'; 
import { CheckCircle2, Zap, AlertTriangle } from 'lucide-react';
// 🚨 Gemini 직접 호출을 위한 라이브러리 추가
import { GoogleGenerativeAI } from "@google/generative-ai";

const MAX_SERMON_COUNT = 5; 

const RealLifeSermonComponent = ({
    setSermonDraft, 
    user, 
    userSubscription = 'free', 
    setErrorMessage, 
    errorMessage, 
    lang = 'ko', 
    openLoginModal, 
    onLimitReached, 
    sermonCount = 0,
    sermonLimit = 5,
    canGenerateSermon = false, 
    onGoBack,
    t, 
    refreshUserData
}) => {
    
    const [topicInput, setTopicInput] = useState('');
    const [recommendations, setRecommendations] = useState([]); 
    const [selectedRecommendation, setSelectedRecommendation] = useState(null); 
    const [isRecommending, setIsRecommending] = useState(false); 
    const [isSermonLoading, setIsSermonLoading] = useState(false); 

    const safeSetErrorMessage = useCallback((msg) => {
        if (typeof setErrorMessage === 'function') {
            setErrorMessage(msg);
            if (msg) setTimeout(() => setErrorMessage(''), 5000);
        }
    }, [setErrorMessage]);

    const remainingSermons = useMemo(() => {
        const limitValue = userSubscription === 'premium' ? 9999 : (SUBSCRIPTION_LIMITS[userSubscription]?.sermon || MAX_SERMON_COUNT);
        const calc = limitValue - sermonCount;
        return calc < 0 ? 0 : calc;
    }, [userSubscription, sermonCount]);

    // 🚨 [수정] Gemini 직접 호출 공통 함수 (404 에러 방지)
    const callGeminiDirectly = useCallback(async (prompt, type) => {
        try {
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // 다국어 성경 버전 매핑
            const langMap = {
                ko: { name: "Korean", bible: "개역개정" },
                en: { name: "English", bible: "NIV/KJV" },
                zh: { name: "Chinese", bible: "CUV" },
                ru: { name: "Russian", bible: "Synodal" },
                vi: { name: "Vietnamese", bible: "Bản Truyền Thống" }
            };
            const target = langMap[lang] || langMap.ko;

            let systemInstruction = `당신은 세계적인 성경 전문가입니다. 모든 답변은 반드시 '${target.name}'으로 작성하세요. `;
            
            if (type === 'recommend_scripture') {
                systemInstruction += `사용자의 상황에 적합한 성경 구절과 설교 제목 3개를 추천하세요. 
                반드시 다음 JSON 형식으로만 응답하세요: [{"scripture": "본문주소", "title": "설교제목"}]`;
            } else if (type === 'sermon') {
                systemInstruction += `성도들에게 감동을 주는 전문적인 설교 원고를 작성하세요.`;
            }

            const result = await model.generateContent(`${systemInstruction}\n\nUser Request: ${prompt}`);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini 호출 오류:", error);
            throw error;
        }
    }, [lang]);

    const extractJsonArray = (text) => {
        try {
            const jsonMatch = text.match(/\[[\s\S]*\]/); 
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            return JSON.parse(text);
        } catch (e) {
            return null;
        }
    };

    // 1단계: 주제 기반 추천 (직접 호출 방식으로 변경)
    const handleTopicRecommendation = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!topicInput.trim()) { safeSetErrorMessage(t('enterRealLifeTopic', lang)); return; }

        setIsRecommending(true);
        safeSetErrorMessage('');
        setRecommendations([]);
        setSelectedRecommendation(null);

        try {
            const promptText = `Situation: "${topicInput}"`;
            const responseText = await callGeminiDirectly(promptText, 'recommend_scripture');

            if (responseText) {
                const parsed = extractJsonArray(responseText);
                if (parsed && Array.isArray(parsed)) {
                    setRecommendations(parsed.slice(0, 3));
                } else {
                    throw new Error("Invalid Format");
                }
            }
        } catch (error) {
            safeSetErrorMessage(t('errorProcessingRequest', lang));
        } finally {
            setIsRecommending(false);
        }
    }, [user, topicInput, lang, safeSetErrorMessage, openLoginModal, callGeminiDirectly, t]);

    // 2단계: 설교 생성 (직접 호출 방식으로 변경)
    const handleSermonGeneration = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!selectedRecommendation) return;
        if (!canGenerateSermon) { onLimitReached(); return; }

        setIsSermonLoading(true);
        safeSetErrorMessage('');

        const { scripture, title } = selectedRecommendation;
        
        try {
            const promptText = `Situation: "${topicInput}", Title: "${title}", Verse: "${scripture}". Write a professional sermon draft.`;
            const sermonResult = await callGeminiDirectly(promptText, 'sermon');

            if (sermonResult) {
                setSermonDraft(sermonResult);
                if (typeof refreshUserData === 'function') await refreshUserData(); 
            }
        } catch (error) {
            safeSetErrorMessage(t('generationFailed', lang));
        } finally {
            setIsSermonLoading(false);
        }
    }, [user, selectedRecommendation, topicInput, canGenerateSermon, onLimitReached, callGeminiDirectly, setSermonDraft, t, safeSetErrorMessage, refreshUserData]);

    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-slate-900">
            <header className="p-4 bg-white dark:bg-gray-800 border-b flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <button onClick={onGoBack} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-600 transition-colors">
                    <GoBackIcon className="w-5 h-5 mr-1" /> {t('goBack', lang)} 
                </button>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                    <RealLifeIcon className="w-6 h-6 mr-2 text-red-500" /> {t('realLifeSermon', lang)}
                </h1>
                <div className="text-sm font-bold text-red-600 bg-red-50 px-4 py-1.5 rounded-full border border-red-100 shadow-inner">
                    {t('sermonLimit', lang, (sermonLimit - sermonCount).toString())}
                </div>
            </header>

            <div className="max-w-3xl mx-auto w-full p-6 space-y-6">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border-t-4 border-red-600">
                    <h2 className="text-lg font-bold mb-4 flex items-center text-gray-800 dark:text-white">
                        <Zap className="w-5 h-5 mr-2 text-yellow-500" /> {t('enterRealLifeTopic', lang)}
                    </h2>
                    <textarea
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        placeholder={t('topicPlaceholder', lang)}
                        className="w-full p-5 rounded-xl bg-gray-50 dark:bg-gray-700 border-2 border-transparent focus:border-red-500 outline-none h-32 resize-none text-lg transition-all dark:text-white"
                        disabled={isSermonLoading}
                    />
                    <button
                        onClick={handleTopicRecommendation}
                        disabled={!topicInput.trim() || isRecommending || isSermonLoading}
                        className="mt-5 w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center text-lg shadow-lg disabled:opacity-50"
                    >
                        {isRecommending ? <LoadingSpinner className="mr-2" /> : <Zap className="mr-2 w-5 h-5 text-yellow-400" />}
                        {t('recommendScriptureBtn', lang)}
                    </button>
                </div>

                {recommendations.length > 0 && (
                    <div className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-5">
                        <h3 className="text-lg font-bold px-1 flex items-center text-gray-800 dark:text-white">
                            <CheckCircle2 className="w-5 h-5 mr-2 text-green-500" /> 
                            {t('recommendedVersesTitle', lang)}
                        </h3>
                        <div className="grid gap-3">
                            {recommendations.map((rec, index) => (
                                <div 
                                    key={index}
                                    onClick={() => setSelectedRecommendation(rec)}
                                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                                        selectedRecommendation?.scripture === rec.scripture
                                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 ring-2 ring-red-100 shadow-md'
                                        : 'border-gray-200 bg-white dark:bg-gray-800 hover:border-red-300'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1">
                                            <p className={`font-black text-xl mb-1 ${selectedRecommendation?.scripture === rec.scripture ? 'text-red-700 dark:text-red-400' : 'text-gray-800 dark:text-white'}`}>{rec.title}</p>
                                            <p className="text-sm font-medium text-gray-500 italic">{rec.scripture}</p>
                                        </div>
                                        {selectedRecommendation?.scripture === rec.scripture && <CheckCircle2 className="text-red-500 w-7 h-7" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleSermonGeneration}
                            disabled={!selectedRecommendation || isSermonLoading || remainingSermons <= 0}
                            className="w-full py-5 bg-red-600 text-white font-black text-2xl rounded-2xl shadow-2xl hover:bg-red-700 active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center"
                        >
                            {isSermonLoading ? (
                                <><LoadingSpinner className="mr-2" /> {t('generatingSermon', lang)}</>
                            ) : (
                                t('generateSermonFromSelected', lang)
                            )}
                        </button>
                    </div>
                )}

                {errorMessage && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl flex items-center shadow-lg">
                        <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span className="text-sm font-medium">{errorMessage}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RealLifeSermonComponent;