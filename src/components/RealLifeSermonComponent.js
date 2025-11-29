'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// 🚨 [FIX]: 아이콘 경로를 절대 경로로 수정합니다.
import { GoBackIcon, LoadingSpinner, SearchIcon, PlusCircleIcon, RealLifeIcon } from '@/components/IconComponents.js'; 
import { SUBSCRIPTION_LIMITS } from '@/lib/constants'; 
// API 호출 경로 및 상수
const API_ENDPOINT = '/api/sermon-generator'; 
const MAX_SERMON_COUNT = 5; 

// 💡 RealLifeSermonComponent 정의
const RealLifeSermonComponent = ({
    setSermonDraft, 
    user, 
    userSubscription, 
    setErrorMessage, 
    errorMessage, // 🚨 [FIX] errorMessage prop 추가
    lang, 
    openLoginModal, 
    onLimitReached, 
    sermonCount, 
    canGenerateSermon, 
    handleAPICall, // 👈 중앙 집중식 API 호출 함수
    onGoBack,
    t // 👈 t 함수는 prop으로 받습니다.
}) => {
    
    // 상태 관리
    const [topicInput, setTopicInput] = useState('');
    const [recommendations, setRecommendations] = useState([]); // AI 추천 목록
    const [selectedRecommendation, setSelectedRecommendation] = useState(null); // 사용자가 선택한 추천
    
    const [isRecommending, setIsRecommending] = useState(false); // 추천 로딩 상태
    const [isSermonLoading, setIsSermonLoading] = useState(false); // 설교 생성 로딩 상태

    // 에러 메시지를 안전하게 설정하는 헬퍼 함수
    const safeSetErrorMessage = useCallback((msg) => {
        if (typeof setErrorMessage === 'function') {
            setErrorMessage(msg);
        }
    }, [setErrorMessage]);

    // 💡 설교 생성 가능 횟수 표시
    const remainingSermons = useMemo(() => {
        const limit = userSubscription === 'premium' ? 9999 : (SUBSCRIPTION_LIMITS[userSubscription]?.sermon || MAX_SERMON_COUNT);
        return limit - sermonCount;
    }, [userSubscription, sermonCount]);


    // --------------------------------------------------
    // 1. AI 성경/제목 추천 받기 (Gemini API: type='real-life-recommendation')
    // --------------------------------------------------
    const handleTopicRecommendation = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!topicInput.trim()) { safeSetErrorMessage(t('enterTopic', lang)); return; }

        setIsRecommending(true);
        safeSetErrorMessage('');
        setRecommendations([]);
        setSelectedRecommendation(null);

        try {
            const promptText = `Real-life topic: "${topicInput}". Recommend 3 scripture/title options.`;
            
            // ✅ API 호출: handleAPICall 사용, type: real-life-recommendation (JSON 응답 스키마 사용)
            const responseText = await handleAPICall(
                promptText, 
                API_ENDPOINT, 
                'real-life-recommendation'
            );

            if (!responseText) {
                // 이 부분이 실행되는 것은 API 호출이 실패했다는 의미입니다.
                // handleAPICall에서 에러 메시지를 설정했으므로 여기서 추가 설정은 생략
                return;
            }
            
            // 🚨 JSON 응답 파싱 (서버에서 JSON을 반환한다고 가정)
            let parsedRecommendations = [];
            try {
                parsedRecommendations = JSON.parse(responseText);
                if (!Array.isArray(parsedRecommendations)) throw new Error("Not Array");
            } catch (e) {
                console.error("Failed to parse recommendation JSON:", e);
                // JSON 파싱 실패 시, API 키 오류로 처리 (Gemini에서 JSON 포맷을 지키지 못했을 때)
                safeSetErrorMessage(t('invalidApiResponse', lang) + " (JSON 파싱 오류)"); 
                return;
            }

            setRecommendations(parsedRecommendations.slice(0, 3)); // 최대 3개만 표시

        } catch (error) {
            console.error("Recommendation API Call Failed:", error);
            // 404 오류가 여기로 잡히며, 이 메시지를 출력합니다.
            safeSetErrorMessage(t('recommendationFailed', lang) + ` (오류: ${error.message})`);
        } finally {
            setIsRecommending(false);
        }
    }, [user, topicInput, lang, safeSetErrorMessage, openLoginModal, handleAPICall, t]);


    // --------------------------------------------------
    // 2. 설교 초안 생성 (Gemini API: type='sermon')
    // --------------------------------------------------
    const handleSermonGeneration = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!selectedRecommendation) { safeSetErrorMessage("먼저 추천 목록에서 하나를 선택해 주세요."); return; }
        
        // 🚨 제한 로직 활성화
        if (!canGenerateSermon) { safeSetErrorMessage(t('sermonLimitError', lang)); onLimitReached(); return; }

        setIsSermonLoading(true);
        safeSetErrorMessage('');

        const { scripture, title } = selectedRecommendation;
        
        try {
            // 🚨 [설교 생성 프롬프트]: 주제, 성경구절, 제목을 모두 포함하여 상세 요청
            const promptText = 
                `Write a detailed, full-length sermon (between 2500 and 3000 characters) on the topic of "${topicInput}" using the central theme and scripture: Title: "${title}", Scripture: "${scripture}". ` +
                `Focus on applying the biblical truth to the real-life topic "${topicInput}". ` +
                `The output must be a ready-to-deliver sermon text written in a direct preaching style (설교체), NOT just a hierarchical outline. DO NOT use Markdown headers. ` +
                `RESPOND IN THE LANGUAGE SPECIFIED BY THE LANGUAGE CODE: ${lang}.`;
            
            // ✅ API 호출: handleAPICall 사용, type: sermon
            const sermonResult = await handleAPICall(
                promptText, 
                API_ENDPOINT, 
                'sermon'
            );

            if (sermonResult) {
                setSermonDraft(sermonResult); // 부모 컴포넌트에 초안 전달 (모달 트리거)
            } else {
                // handleAPICall에서 에러 메시지를 이미 설정했으므로 여기서 추가 설정은 생략
            }
            
        } catch (error) {
            console.error("Sermon Generation API Call Failed:", error);
            safeSetErrorMessage(t('sermonGenerationFailed', lang));
        } finally {
            setIsSermonLoading(false);
        }
    }, [
        user, selectedRecommendation, topicInput, lang, canGenerateSermon, 
        safeSetErrorMessage, openLoginModal, onLimitReached, handleAPICall, setSermonDraft, t
    ]);
    
    // --------------------------------------------------
    // 3. UI 렌더링
    // --------------------------------------------------
    const isLoading = isRecommending || isSermonLoading;
    
    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-100 dark:bg-slate-900 p-6 sm:p-8">
            
            {/* Header and Back Button */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 flex items-center justify-between sticky top-0 z-10">
                <button 
                    onClick={onGoBack} 
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg"
                >
                    <GoBackIcon className="w-5 h-5 mr-1" />
                    {t('goBack', lang)} 
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center"><RealLifeIcon className="w-6 h-6 mr-2 text-red-500" />{t('realLifeSermon', lang)}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">{t('sermonLimit', lang, remainingSermons)}</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full space-y-6">
                
                {/* Topic Input Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        {t('enterRealLifeTopic', lang)}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('realLifeSermonDescription', lang)}</p>
                    
                    <input
                        type="text"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        placeholder={t('topicPlaceholder', lang)}
                        className="w-full p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={isLoading}
                    />
                    
                    <button
                        onClick={handleTopicRecommendation}
                        disabled={!topicInput.trim() || isLoading}
                        className="mt-4 w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition disabled:opacity-50"
                    >
                        {isRecommending ? <LoadingSpinner className="w-5 h-5 inline mr-2 animate-spin" /> : t('recommendScripture', lang)}
                    </button>
                </div>

                {/* Recommendation Output Section */}
                {recommendations.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                            {t('aiScriptureRecommendation', lang)}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('recommendationInstruction', lang)}</p>

                        <div className="space-y-3">
                            {recommendations.map((rec, index) => (
                                <div 
                                    key={index}
                                    onClick={() => setSelectedRecommendation(rec)}
                                    className={`p-4 rounded-lg border cursor-pointer transition ${
                                        selectedRecommendation?.scripture === rec.scripture
                                            ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500 shadow-md'
                                            : 'bg-gray-50 dark:bg-gray-700 border-gray-300 hover:border-purple-400'
                                    }`}
                                >
                                    <p className="font-semibold text-gray-800 dark:text-white">{rec.title}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{rec.scripture}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Sermon Generation Button */}
                {recommendations.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                            {t('generateSermonFromSelection', lang)}
                        </h2>
                        <button
                            onClick={handleSermonGeneration}
                            disabled={!selectedRecommendation || isLoading || remainingSermons <= 0}
                            className="px-8 py-4 bg-red-600 text-white font-extrabold text-lg rounded-xl shadow-lg hover:bg-red-700 transition disabled:opacity-50"
                        >
                            {isSermonLoading ? t('generatingSermon', lang) : t('generateSermonFromSelection', lang)}
                        </button>
                        {isSermonLoading && <LoadingSpinner message={t('generatingSermon', lang)} className="mt-4" />}
                    </div>
                )}

                {/* Error Message Display */}
                {errorMessage && errorMessage.length > 0 && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center font-medium">
                        🚨 {errorMessage}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RealLifeSermonComponent;