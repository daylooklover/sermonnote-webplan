import React, { useState, useCallback } from 'react';

// DUMMY API 헬퍼 함수 정의 (다국어 지원을 위해 langCode 전달)
const callAPI = async (promptText, langCode = 'ko', data = {}) => {
    // 이 부분은 임시 함수이므로 실제 API 호출 코드로 대체해야 합니다.
    console.log(`[API CALL - EXPOSITORY] Prompt: ${promptText}, Lang: ${langCode}`);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    
    // AI가 요청된 언어로 응답하도록 시뮬레이션
    return { response: `[${langCode}] This is a detailed expository sermon outline based on the scripture you provided, generated in your chosen language. Thank you for using SermonNote AI.`, success: true };
};

// ExpositorySermonComponent 정의
const ExpositorySermonComponent = ({ 
    onGoBack, 
    t, 
    lang, 
    // AI 관련 props는 이 컴포넌트가 확장될 때 사용됩니다.
    user,
    sermonCount,
    setSermonCount,
    onLimitReached
}) => {
    
    // 임시 상태 (실제 구현 시 필요)
    const [scripture, setScripture] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sermonDraft, setSermonDraft] = useState(null);

    const handleGenerate = async () => {
        if (isLoading || !scripture.trim()) return;
        if (!user) { alert(t('loginToUseFeature', lang)); return; }
        
        // 사용량 제한 체크 (추가적인 로직이 필요할 수 있습니다.)
        // if (!canGenerateSermon) { onLimitReached(); return; }

        setIsLoading(true);
        try {
            // 🚨 FIX: Prompt에 언어 코드를 명시적으로 지정하여 다국어 AI 응답 유도
            const prompt = `Write an expository sermon outline on the scripture: ${scripture}. RESPOND IN THE LANGUAGE SPECIFIED BY THE LANGUAGE CODE: ${lang}.`;
            
            // 🚨 FIX: callAPI 호출 시 lang 코드 전달 (AI 다국어 지원)
            const result = await callAPI(prompt, lang, { userId: user.uid, request_type: 'expository_sermon' });
            
            setSermonDraft(result.response);
            setSermonCount(prev => prev + 1);
        } catch (error) {
            alert((t('errorProcessingRequest', lang) || '요청 처리 중 오류 발생') + `: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full min-h-screen bg-gray-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-2xl space-y-6">
                
                {/* 🚨 FIX: 뒤로가기 버튼 추가 🚨 */}
                <button 
                    onClick={onGoBack} 
                    className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 font-semibold text-base mb-4"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    {t('goBack', lang) || '뒤로'}
                </button>

                <h2 className="text-3xl font-extrabold text-green-700">{t('expositorySermon', lang) || '강해 설교'}</h2>
                <p className="text-gray-600">{t('expositoryDesc', lang) || '성경 본문을 깊이 있게 분석하고 구조화하여 강해 설교를 작성합니다.'}</p>
                
                {/* 임시 입력 및 출력 필드 */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700">{t('scriptureInput', lang) || '성경 구절 입력 (예: 요한복음 3:16)'}</label>
                    <input 
                        type="text" 
                        value={scripture} 
                        onChange={(e) => setScripture(e.target.value)} 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                        placeholder={t('scripturePlaceholder', lang) || '예: 로마서 8장 28절'}
                        disabled={isLoading}
                    />
                    <button 
                        onClick={handleGenerate} 
                        className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                        disabled={isLoading || !scripture.trim()}
                    >
                        {isLoading ? <span className="animate-spin">⚙️</span> : null}
                        <span>{isLoading ? t('generatingSermon', lang) || '설교 생성 중...' : t('generateSermon', lang) || '설교 초안 생성'}</span>
                    </button>
                </div>

                {sermonDraft && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-left text-sm">
                        <h3 className="font-bold mb-2 text-green-700">{t('generatedDraft', lang) || '생성된 초안:'}</h3>
                        {sermonDraft}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExpositorySermonComponent;