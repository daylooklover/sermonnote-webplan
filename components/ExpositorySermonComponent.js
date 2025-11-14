// src/components/ExpositorySermonComponent.js
'use client';
import React, { useState, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 라이브러리 및 유틸리티
import { SUBSCRIPTION_LIMITS } from '@/lib/constants'; 
import { t } from '@/lib/translations';

// 아이콘
import { GoBackIcon, SearchIcon, BibleIcon, LoadingSpinner } from './IconComponents';

// 🚨 [FIX]: API 호출 시 prompt 외에 lang과 type을 함께 전송하도록 수정합니다.
const callAPI = async (promptText, options = {}) => {
  const { type, lang, generationConfig = {} } = options;
  
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // 🚨 [FIX]: 요청 본문에 lang, type을 포함시켜 서버로 전송합니다.
    body: JSON.stringify({ prompt: promptText, lang, type, generationConfig }),
  });
    
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to parse server error response.' }));
    throw new Error(errorData.message || 'Server responded with an error.');
  }
    
  const data = await response.json();
  return data.text;
};


// onGoBack prop을 사용하여 뒤로가기 기능을 구현합니다.
const ExpositorySermonComponent = ({ setSermonDraft, userId, commentaryCount, userSubscription, setErrorMessage, lang, user, openLoginModal, onLimitReached, sermonCount, canGenerateSermon, canGenerateCommentary, generateSermon, onGoBack }) => {
    
    const [scriptureInput, setScriptureInput] = useState('');
    const [scriptureText, setScriptureText] = useState('');
    const [commentary, setCommentary] = useState('');
    const [crossReferences, setCrossReferences] = useState([]);
    
    const [commentaryLoading, setCommentaryLoading] = useState(false);
    const [scriptureLoading, setScriptureLoading] = useState(false);

    // 🚨 [FIX]: setErrorMessage 호출을 위한 안전 함수를 정의합니다.
    const safeSetErrorMessage = useCallback((message) => {
        if (typeof setErrorMessage === 'function') {
            setErrorMessage(message);
        }
    }, [setErrorMessage]);


    const handleGetCommentaryAndReferences = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!canGenerateCommentary) { safeSetErrorMessage(t('commentaryLimitError', lang)); onLimitReached(); return; }
        if (scriptureInput.trim() === '') { safeSetErrorMessage(t('enterScriptureReference', lang)); return; }

        setCommentaryLoading(true);
        setCommentary(t('generating', lang));
        setCrossReferences([]);
        safeSetErrorMessage('');

        try {
            // 🚨 [FIX]: generateSermon prop을 사용합니다. (app/page.js에서 구현됨)
            const promptText = `Based on the following scripture reference, provide a detailed expository commentary and a list of 3-5 relevant cross-reference verses with a brief explanation for each. Format the response with a clear "Commentary:" section and a "Cross-References:" section.
            Scripture: "${scriptureInput}"`;

            // generateSermon prop은 app/page.js에서 callAPI를 감싸 lang을 처리한다고 가정합니다.
            const fullResponse = await generateSermon(promptText, 'commentary'); 
            
            if (!fullResponse) return;
            
            const commentaryMatch = fullResponse.match(/Commentary:\s*([\s\S]*?)(?=Cross-References:|$)/);
            const referencesMatch = fullResponse.match(/Cross-References:\s*([\s\S]*)/);
            
            if (commentaryMatch) {
                setCommentary(commentaryMatch[1].trim());
            } else {
                setCommentary(fullResponse);
            }

            if (referencesMatch) {
                const references = referencesMatch[1].trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
                setCrossReferences(references);
            }
        } catch (error) {
            setCommentary(t('generationFailed', lang));
            console.error("Commentary API Call Failed:", error);
            safeSetErrorMessage(t('generationFailed', lang));
        } finally {
            setCommentaryLoading(false);
        }
    }, [scriptureInput, setCommentary, setCrossReferences, canGenerateCommentary, userId, commentaryCount, lang, user, openLoginModal, onLimitReached, userSubscription, generateSermon, safeSetErrorMessage]);

    const handleAddSelectedText = useCallback((textToAdd) => {
        if (textToAdd && textToAdd.trim()) {
            setSermonDraft(prevDraft => prevDraft ? `${prevDraft}\n\n${textToAdd}` : textToAdd);
        }
    }, [setSermonDraft]);

    // 🚨 [FIX]: 성경 불러오기 로직 수정 및 안전 코드 적용
    const handleGetScripture = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (scriptureInput.trim() === '') { safeSetErrorMessage(t('enterScriptureReference', lang)); return; }
        
        setScriptureLoading(true);
        setScriptureText(t('gettingScripture', lang));
        safeSetErrorMessage('');
        
        try {
            // 🚨 [FIX]: 프롬프트에 요청 언어를 직접 명시하지 않고, callAPI 옵션을 통해 lang을 서버로 전송합니다.
            const promptText = `Please provide the full text for the following scripture reference: ${scriptureInput}`;
            
            const text = await callAPI(promptText, { lang, type: 'scripture' }); // 👈 lang과 type 전송
            
            if (!text || text.trim() === '') {
                setScriptureText(t('generationFailed', lang) + " (API returned empty response)");
                safeSetErrorMessage(t('generationFailed', lang));
                return;
            }

            setScriptureText(text);
        } catch (error) {
            setScriptureText(t('generationFailed', lang));
            console.error("Scripture API Call Failed:", error); 
            safeSetErrorMessage(t('generationFailed', lang));
        } finally {
            setScriptureLoading(false);
        }
    }, [scriptureInput, setScriptureText, lang, user, openLoginModal, safeSetErrorMessage]);


    // setErrorMessage 호출 시 안전 코드를 적용하고, deps 배열을 정리합니다.
const handleGenerateSermon = useCallback(async () => {
    // ... (로직 유지)

    setCommentaryLoading(true); 
    safeSetErrorMessage('');
    
    try {
        const promptText = `Based on the following commentary, write a detailed sermon in ${lang === 'ko' ? 'Korean' : 'English'}. Note: "${commentary}"`;
        
        // 🚨 [FIX 1]: generateSermon의 결과를 받습니다.
        const sermonResult = await generateSermon(promptText, 'sermon'); 

        // 🚨 [FIX 2]: 결과를 setSermonDraft prop을 통해 부모에게 전달합니다.
        if (sermonResult) {
            setSermonDraft(sermonResult); // 👈 설교 초안을 저장합니다.
        }
        
    } catch (error) {
        // ... (오류 처리 유지)
    } finally {
        setCommentaryLoading(false);
    }
}, [commentary, generateSermon, canGenerateSermon, lang, user, openLoginModal, onLimitReached, userSubscription, sermonCount, safeSetErrorMessage, setSermonDraft]); // 👈 setSermonDraft 의존성 추가
    return (
        <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto w-full relative">
            
            {/* 뒤로가기 버튼: onGoBack prop을 사용하여 설교 유형 화면으로 돌아갑니다. */}
            <button 
                onClick={onGoBack} 
                className="absolute top-2 left-0 p-2 text-gray-600 hover:text-gray-800 transition duration-150 z-10" 
            >
                <GoBackIcon className="w-6 h-6" />
            </button>

            <h2 className="text-4xl font-extrabold text-gray-800">{t('expositorySermonTitle', lang)}</h2>
            <p className="text-lg text-gray-600 mb-4">{t('expositoryDescription', lang)}</p>
            
            {userSubscription !== 'premium' && (
                <p className="text-sm text-gray-500 mb-4">
                    {t('commentaryLimit', lang, Math.max(0, userSubscription && SUBSCRIPTION_LIMITS[userSubscription]?.commentary ? SUBSCRIPTION_LIMITS[userSubscription].commentary - commentaryCount : 0))}
                </p>
            )}

            <div className="w-full flex space-x-2">
                <input
                    type="text"
                    value={scriptureInput}
                    onChange={(e) => setScriptureInput(e.target.value)}
                    placeholder={t('scripturePlaceholder', lang)}
                    className="flex-grow p-4 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleGetScripture}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400"
                    disabled={scriptureInput.trim() === '' || scriptureLoading}
                >
                    {scriptureLoading ? t('gettingScripture', lang) : t('getScripture', lang)}
                </button>
            </div>

            {scriptureText && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left whitespace-pre-wrap">
                    <p className="font-semibold text-gray-800 mb-2">{t('scriptureTitle', lang)}</p>
                    <p className="text-gray-600" onMouseUp={() => handleAddSelectedText(window.getSelection().toString())}>{scriptureText}</p>
                    <button
                        onClick={handleGetCommentaryAndReferences}
                        className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full"
                        disabled={!canGenerateCommentary || commentaryLoading}
                    >
                        {commentaryLoading ? t('generating', lang) : t('getCommentary', lang)}
                    </button>
                </div>
            )}
            
            {crossReferences.length > 0 && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left">
                    <p className="font-semibold text-gray-800 mb-2">{t('crossReferencesTitle', lang)}</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {crossReferences.map((ref, index) => (
                            <li key={index}>{ref}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            {commentary && (
                <div className="w-full p-4 rounded-xl bg-white border border-gray-300 text-left whitespace-pre-wrap">
                    <p className="font-semibold text-gray-800 mb-2">{t('aiCommentaryTitle', lang)}</p>
                    <p className="text-gray-600">{commentary}</p>
                  <button
    onClick={handleGenerateSermon}
    className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 w-full"
    // 🚨 [FIX]: canGenerateSermon 조건을 완전히 제거하여 버튼을 강제로 활성화합니다.
    disabled={commentaryLoading || commentary.trim() === ''} // ✅ 이 줄로 수정
>
    {commentaryLoading ? t('generating', lang) : t('generateSermonFromCommentary', lang)}
</button>
                </div>
            )}
            
        </div>
    );
};

export default ExpositorySermonComponent;