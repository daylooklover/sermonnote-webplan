"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
// 모든 필요한 아이콘을 임포트합니다. (이 컴포넌트에는 사용되지 않으므로 주석 처리하거나 제거 가능)
// import { LoadingSpinner, GoBackIcon, PrintIcon, ZoomInIcon, ZoomOutIcon, FullscreenIcon, CloseIcon } from './IconComponents'; 
import { t } from '../lib/translations'; 

// ----------------------------------------------------------------------
// 🟢 API 호출 헬퍼 함수 정의 (JSON 안정화를 위해 구조 변경) 🟢
// ----------------------------------------------------------------------
// promptText와 langCode 외에, userId, request_type 등이 포함된 data 객체를 받습니다.
const callAPI = async (promptText, langCode = 'ko', data = {}) => {
    const payload = {
        question: promptText, // /api/assistant-chat의 입력 필드
        language_code: langCode,
        // 🚨 critical fix: userId, request_type 등 모든 데이터 필드를 여기에 병합 🚨
        ...data 
    };

    const response = await fetch('/api/assistant-chat', { // assistant-chat API로 통일
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
        let errorData = {};
        try {
            errorData = await response.json();
        } catch (e) {
            const textError = await response.text();
            throw new Error(`Server responded with status ${response.status}. Error: ${textError.substring(0, 50)}...`);
        }
        throw new Error(errorData.response || errorData.message || `Server responded with status ${response.status}.`);
    }
    
    // 🚨 중복 선언 오류 수정: 'data' -> 'responseData'로 변경
    const responseData = await response.json(); 
    
    // assistant-chat API는 'response' 필드를 반환하므로, 그에 맞게 조정
    return responseData.response || responseData.text;
};

// ----------------------------------------------------------------------
// 🟢 Sub-Component: AI 추천 결과 화면 (Step 2) 🟢
// ----------------------------------------------------------------------
const RecommendationResults = ({ recommendations, inputTopic, onSelect, onBack, t, lang, isLoading }) => {
    
    // ⭐⭐ 수정: 선택된 추천 항목을 내부 상태로 관리합니다. ⭐⭐
    const [selectedRec, setSelectedRec] = useState(null); 

    return (
        <div className="space-y-6 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200">
            <button onClick={onBack} className="flex items-center text-indigo-500 mb-4 hover:text-indigo-400 transition-colors" disabled={isLoading}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                {t('backToInput', lang) || "입력 화면으로 돌아가기"}
            </button>

            <h2 className="text-xl font-bold text-gray-800">{t('aiScriptureRecommendation', lang) || "AI 추천 성경 및 제목"}</h2>
            <p className="text-sm text-gray-500">
                {t('recommendationInstruction', lang) || "아래 추천 목록 중 하나를 선택하여 설교 초안 생성을 진행하세요."}
            </p>

            {/* 사용자가 입력한 내용 요약 */}
            <div className="text-sm bg-gray-100 p-3 rounded-lg text-gray-700 border">
                <strong>{t('inputTopic', lang) || "입력 주제"}:</strong> {inputTopic}
            </div>

            {/* AI 추천 목록 */}
            <div className="space-y-3">
                {recommendations.map((rec, index) => (
                    <button
                        key={index}
                        // ⭐ 수정: 클릭 시 selectedRec 상태 업데이트 ⭐
                        onClick={() => setSelectedRec(rec)}
                        className={`w-full p-4 text-left rounded-lg transition border-2 ${
                            selectedRec?.scripture === rec.scripture 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' 
                                : 'bg-white border-gray-300 hover:bg-gray-50'
                        }`}
                        disabled={isLoading}
                    >
                        <p className="font-bold">{rec.title}</p>
                        <p className={`text-sm ${selectedRec?.scripture === rec.scripture ? 'text-indigo-200' : 'text-gray-400'}`}>{rec.scripture}</p>
                    </button>
                ))}
                {/* AI 추천 목록의 끝 */}
            </div>

            {/* 최종 생성 버튼 */}
            <button
                // ⭐ 수정: onSelect 호출 시 selectedRec을 인수로 전달 ⭐
                // ⭐ 수정: selectedRec이 null이 아닐 때만 버튼이 활성화되도록 함 ⭐
                onClick={() => onSelect(selectedRec)}
                disabled={!selectedRec || isLoading} 
                className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
                {isLoading ? t('generatingSermon', lang) || "설교 생성 중..." : t('generateSermonFromSelection', lang) || "선택 내용으로 설교 초안 생성"}
            </button>
        </div>
    );
};


// ----------------------------------------------------------------------
// 🟢 Main Component: RealLifeSermonComponent (Step 1 & State Management) 🟢
// ----------------------------------------------------------------------
const RealLifeSermonComponent = ({
    user,
    lang,
    t,
    onGoBack,
    openLoginModal,
    setSermonInput,
    sermonCount,
    userSubscription,
    onLimitReached, 
    canGenerateSermon,
    setSermonCount,
    ...commonProps
}) => {
    
    const [step, setStep] = useState(1); 
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [recommendations, setRecommendations] = useState([]); 
    const [showSuccess, setShowSuccess] = useState(false); 
    
    // ⭐⭐ 확대/축소 기능 상태 추가 (현재 사용하지 않지만 변수 유지) ⭐⭐
    const [fontSize, setFontSize] = useState(16); 
    const MAX_FONT = 24;
    const MIN_FONT = 12;

    // ⭐⭐ 인쇄 기능 핸들러 (현재 사용하지 않지만 함수 유지) ⭐⭐
    const handlePrint = () => {
        window.print();
    };
    
    const handleBackToInput = useCallback(() => {
        setStep(1);
        setRecommendations([]);
    }, []);
    
    // 🚨 AI 요청 및 응답 처리 핵심 함수
    const handleSermonGeneration = async (selectedRec = null) => {
        if (!user) { openLoginModal(); return; }
        if (!canGenerateSermon) { onLimitReached(); return; }
        
        // 🚨 Step 1: AI 추천 받기 로직 (selectedRec이 null일 때 실행)
        if (step === 1) {
            
            if (!topic.trim()) {
                alert(t('enterTopic', lang) || "주제를 입력해 주세요.");
                return;
            }
            
            setIsLoading(true);
            
            try {
                // 🚨🚨🚨 Prompt 수정: 추천 제목을 현재 언어(lang)로 요청하도록 강제 지침 추가 🚨🚨🚨
                const recommendationPrompt = 
                    `Based on the real-life topic "${topic}", provide 3 relevant scripture recommendations. ` + 
                    `For each, suggest a brief sermon title in the language specified by the language code: ${lang}. ` + // ⭐️ 수정 핵심 1 ⭐️
                    `Format the output strictly as a JSON array of objects: ` +
                    `[{"title": "Suggested Sermon Title", "scripture": "Book Chapter:Verse-Verse"}, ...] ` +
                    `DO NOT include any text outside of the JSON array. Respond ONLY with the JSON array.`; // JSON 강제 지침 강화

                // 🚨 callAPI 호출 시 userId와 request_type을 data로 전달 🚨
                const dataPayload = { userId: user.uid, request_type: 'recommendation' }; 
                const rawResponse = await callAPI(recommendationPrompt, lang, dataPayload); // lang 전달 확인

                let parsedRecommendations;
                let cleanResponse = rawResponse.trim();
                
                // 🚨🚨🚨 JSON 추출 로직 최종 강화 🚨🚨🚨
                // 1. 마크다운 ```json 제거
                if (cleanResponse.startsWith('```json')) {
                    cleanResponse = cleanResponse.substring(7, cleanResponse.lastIndexOf('```')).trim();
                }
                // 2. JSON 배열 외부의 모든 텍스트 제거 (가장 안전한 방법)
                const firstBracket = cleanResponse.indexOf('[');
                const lastBracket = cleanResponse.lastIndexOf(']');
                
                if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
                    cleanResponse = cleanResponse.substring(firstBracket, lastBracket + 1).trim();
                } else {
                    // JSON 배열 괄호 자체를 못 찾았으면 심각한 오류로 간주
                    throw new Error("AI response did not contain a recognizable JSON array structure.");
                }

                try {
                    parsedRecommendations = JSON.parse(cleanResponse); 
                    if (!Array.isArray(parsedRecommendations) || parsedRecommendations.length === 0) {
                        throw new Error("Parsed content is not a valid list of recommendations.");
                    }
                } catch (jsonError) {
                    console.error("Failed to parse JSON response:", cleanResponse);
                    throw new Error(t('invalidApiResponse', lang) || "AI 응답 형식이 올바르지 않습니다. 서버 로그를 확인하세요. (JSON 파싱 오류)");
                }

                setRecommendations(parsedRecommendations);
                setStep(2); // 🟢 Step 2 (추천 결과 화면)로 전환 🟢
                
            } catch (error) {
                alert(t('recommendationFailed', lang) || `AI 추천을 받는 중 오류가 발생했습니다: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
            return;
        } 
        
        // 🚨 Step 2 -> Step 3: 최종 설교 생성 (selectedRec이 있을 때 실행)
        if (step === 2 && selectedRec) {
            setIsLoading(true);

            try {
                // 🚨🚨🚨 Prompt 수정: 설교 초안을 현재 언어(lang)로 요청하도록 강제 지침 추가 🚨🚨🚨
                const sermonPrompt = 
                    `Write a detailed sermon outline based on the scripture "${selectedRec.scripture}" ` +
                    `and the title "${selectedRec.title}". The sermon should apply to the real-life topic: "${topic}". ` + 
                    `The response should be formatted clearly with sections for Introduction, Body, and Conclusion. ` +
                    `RESPOND IN THE LANGUAGE SPECIFIED BY THE LANGUAGE CODE: ${lang}.`; // ⭐️ 수정 핵심 2 ⭐️

                // 🚨 callAPI 호출 시 userId와 request_type을 data로 전달 🚨
                const dataPayload = { userId: user.uid, request_type: 'sermon_draft' }; 
                const finalSermonDraft = await callAPI(sermonPrompt, lang, dataPayload); // lang 전달 확인

                setSermonInput(finalSermonDraft); 
                
                setSermonCount(prevCount => prevCount + 1);

                setShowSuccess(true); 
                
            } catch (error) {
                alert(t('sermonGenerationFailed', lang) || `설교 생성 중 오류가 발생했습니다: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    // ⭐⭐ Success Modal 컴포넌트 ⭐⭐
    const SuccessModal = () => {
        if (!showSuccess) return null;
        
        useEffect(() => {
            const timer = setTimeout(() => {
                setShowSuccess(false);
                // setSermonInput이 이미 호출되었으므로, 상위 컴포넌트가 전환을 담당하도록 함.
                setTopic(''); 
            }, 1500); // 1.5초 후 닫힘
            return () => clearTimeout(timer);
        }, []);
        
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-8 rounded-xl shadow-2xl text-center">
                    <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <h3 className="2xl font-bold text-gray-800 mb-2">
                        {t('sermonGenerationSuccess', lang) || "설교 초안 생성이 완료되었습니다!"}
                    </h3>
                    <p className="text-gray-600">
                        {t('redirectingToEdit', lang) || "잠시 후 설교문 편집 화면으로 이동합니다."}
                    </p>
                </div>
            </div>
        );
    };

    // 최종 렌더링
    if (step === 2) {
        return (
            <div className="flex flex-col items-center w-full min-h-screen bg-gray-100 text-gray-800 p-8 relative">
                <div className="max-w-3xl w-full">
                    <h1 className="text-3xl font-extrabold mb-8 text-center text-indigo-700">{t('recommendationTitle', lang) || "AI 설교 추천"}</h1>
                    <RecommendationResults 
                        recommendations={recommendations} 
                        inputTopic={topic}
                        onSelect={handleSermonGeneration} 
                        onBack={handleBackToInput} 
                        t={t}
                        lang={lang}
                        isLoading={isLoading}
                    />
                </div>
                <SuccessModal /> 
            </div>
        );
    }
    
    // Step 1 화면 렌더링 (Default)
    return (
        <div className="flex flex-col items-center w-full min-h-screen bg-gray-100 text-gray-800 p-8">
            <div className="max-w-3xl w-full">
                
                {/* 뒤로가기 버튼 */}
                <button onClick={onGoBack} className="flex items-center text-indigo-600 hover:text-indigo-700 transition-colors mb-6" disabled={isLoading}>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    {t('goBack', lang)}
                </button>

                <h1 className="text-3xl font-extrabold mb-8 text-center text-indigo-700">
                    {t('realLifeSermon', lang) || "실생활 설교 생성"}
                </h1>

                {/* 🟢 Step 1: 실생활 설교 입력 모드 🟢 */}
                <div className="space-y-6 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
                    <p className="text-gray-600">{t('realLifeSermonDescription', lang) || "현대 사회의 이슈와 성경적 진리를 연결하여 실제적인 메시지를 전달합니다."}</p>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700">{t('enterRealLifeTopic', lang) || "실생활 적용 주제 입력"}</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder={t('topicPlaceholder', lang) || "예: 직장 내 괴롭힘, 자녀 양육의 어려움, 우울감"}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                
                {/* AI 추천 요청 버튼 (Step 1 동작) */}
                <button
                    onClick={() => handleSermonGeneration(null)} 
                    disabled={isLoading || !topic.trim()} 
                    className="w-full mt-8 py-4 bg-indigo-600 text-white font-bold rounded-lg shadow-xl hover:bg-indigo-700 transition duration-300 disabled:opacity-50"
                >
                    {isLoading ? t('recommending', lang) || "추천 받는 중..." : t('recommendScripture', lang) || "성경/제목 추천 받기"}
                </button>

                {/* 사용량 정보 */}
                <p className="mt-4 text-center text-sm text-gray-500">
                    {userSubscription === 'pro' 
                        ? t('premiumUnlimited', lang) || "프리미엄 구독자는 무제한 사용 가능합니다."
                        : t('sermonLimit', lang)?.replace('{0}', 5 - sermonCount) || `무료 사용자: 설교 생성 ${5 - sermonCount}회 남음`}
                </p>
            </div>
            <SuccessModal /> 
        </div>
    );
};

export default RealLifeSermonComponent;