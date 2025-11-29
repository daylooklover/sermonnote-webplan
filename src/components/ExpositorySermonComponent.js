'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// 아이콘 경로를 절대 경로로 수정합니다.
import { GoBackIcon, SearchIcon, BibleIcon, LoadingSpinner, PlusCircleIcon } from '@/components/IconComponents.js'; 

import { SUBSCRIPTION_LIMITS } from '@/lib/constants'; 

const API_ENDPOINT = '/api/sermon-generator'; 
const MAX_COMMENTARY_COUNT = 5; 

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
    t
}) => {
    
    const [scriptureInput, setScriptureInput] = useState('');
    const [scriptureText, setScriptureText] = useState('');
    const [commentary, setCommentary] = useState('');
    const [crossReferences, setCrossReferences] = useState([]);
    
    const [commentaryLoading, setCommentaryLoading] = useState(false);
    const [scriptureLoading, setScriptureLoading] = useState(false);
    const [sermonLoading, setSermonLoading] = useState(false);

    const safeSetErrorMessage = useCallback((msg) => {
        if (typeof setErrorMessage === 'function') {
            setErrorMessage(msg);
        }
    }, [setErrorMessage]);
    
    const remainingCommentary = useMemo(() => {
        const limit = userSubscription === 'premium' ? 9999 : (SUBSCRIPTION_LIMITS[userSubscription]?.commentary || MAX_COMMENTARY_COUNT);
        return limit - commentaryCount;
    }, [userSubscription, commentaryCount]);

    const handleGetCommentaryAndReferences = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        
        if (!canGenerateCommentary) { safeSetErrorMessage(t('commentaryLimitError', lang)); onLimitReached(); return; } 
        
        if (scriptureText.trim() === '') { safeSetErrorMessage(t("enterScriptureReference", lang)); return; } 

        setCommentaryLoading(true);
        setCommentary(t('generating', lang));
        safeSetErrorMessage('');

        try {
            const langCode = lang === 'ko' ? 'Korean' : lang === 'en' ? 'English' : lang === 'zh' ? 'Chinese' : lang === 'ru' ? 'Russian' : 'Vietnamese';
            
            // 🚨 [백틱 확인 필요] promptText 1
            const promptText = `Based on the scripture text: "${scriptureText}", provide a highly detailed expository commentary. The commentary section must include: 
            1. **Original Language Analysis**: Brief linguistic insights (e.g., key Hebrew/Greek words).
            2. **Theological Issues**: Discussion of central theological concepts or problems.
            3. **Contextual Cross-references**: Relevant background and cross-references.
            
            After the detailed commentary, provide a separate "Cross-References:" section with a list of 3-5 related verses, each with a brief explanation. Format the entire response with a clear "Commentary:" section and a "Cross-References:" section.
            
            Ensure the entire response is written in ${langCode}.`;

            const fullResponse = await handleAPICall(promptText, API_ENDPOINT, 'commentary'); 
            
            if (!fullResponse) {
                setCommentary(t('generationFailed', lang));
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
            }
            
        } catch (error) {
            setCommentary(t('generationFailed', lang)); 
            console.error("Commentary API Call Failed:", error);
            safeSetErrorMessage(t('generationFailed', lang));
        } finally {
            setCommentaryLoading(false);
        }
    }, [
        scriptureText, canGenerateCommentary, 
        user, openLoginModal, onLimitReached, lang, safeSetErrorMessage, handleAPICall, t
    ]); 

    const handleGetScripture = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (scriptureInput.trim() === '') { safeSetErrorMessage(t('enterScriptureReference', lang)); return; }
        
        setScriptureLoading(true);
        setScriptureText(t('gettingScripture', lang));
        safeSetErrorMessage('');
        
        try {
            // 🚨 [백틱 확인 필요] promptText 2
            const promptText = `Please provide the full text for the following scripture reference. If the reference includes multiple verses, ensure each verse is separated by a newline character (\n). Your output MUST contain only the scripture text and nothing else. Scripture: "${scriptureInput}"`;
            
            const text = await handleAPICall(promptText, API_ENDPOINT, 'scripture'); 
            
            if (!text || text.trim() === '') {
                setScriptureText(t('generationFailed', lang) + " (" + t('apiReturnedEmptyResponse', lang) + ")");
                if (!text) safeSetErrorMessage(t('generationFailed', lang));
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
    }, [scriptureInput, setScriptureText, lang, user, openLoginModal, safeSetErrorMessage, handleAPICall, t]); 

    const handleGenerateSermon = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!commentary || commentary.trim() === '' || sermonLoading) return;
        
        if (!canGenerateSermon) { safeSetErrorMessage(t('sermonLimitError', lang)); onLimitReached(); return; }

        setSermonLoading(true); 
        safeSetErrorMessage('');
        
        try {
            const langCode = lang === 'ko' ? 'Korean' : lang === 'en' ? 'English' : lang === 'zh' ? 'Chinese' : lang === 'ru' ? 'Russian' : 'Vietnamese';
            
            // 🚨 [백틱 확인 필요] promptText 3
            const promptText = 
                `Write a detailed, full-length sermon (between 2500 and 3000 characters) based ONLY on the following detailed commentary and scripture text. ` +
                `The output must be a ready-to-deliver sermon text written in a direct preaching style (설교체), NOT just a hierarchical outline. ` + 
                `DO NOT use Markdown section headers (like #, ##, or ###). ` +
                `RESPOND IN THE LANGUAGE SPECIFIED BY THE LANGUAGE CODE: ${langCode}. Commentary: "${commentary}" Scripture: "${scriptureText}"`;
            
            const sermonResult = await handleAPICall(promptText, API_ENDPOINT, 'sermon'); 

            if (sermonResult) {
                setSermonDraft(sermonResult);
            } else {
                safeSetErrorMessage(t('generationFailed', lang)); 
            }
            
        } catch (error) {
            setCommentary(t('generationFailed', lang)); 
            console.error("Sermon Generation API Call Failed:", error);
            safeSetErrorMessage(t('generationFailed', lang));
        } finally {
            setSermonLoading(false);
        }
    }, [
        commentary, scriptureText, handleAPICall, lang, user, openLoginModal, safeSetErrorMessage, setSermonDraft, 
        t, canGenerateSermon, onLimitReached, sermonLoading 
    ]); 

    const handleAddSelectedText = useCallback((e) => {
        const selectedText = window.getSelection().toString();
        if (selectedText && selectedText.trim()) {
            setSermonDraft(prevDraft => prevDraft ? `${prevDraft}\n\n[강조] ${selectedText}` : selectedText);
            safeSetErrorMessage(`"${selectedText.substring(0, 30)}..." ${t('addedToDraft', lang)}`);
        }
    }, [setSermonDraft, safeSetErrorMessage, lang, t]);


    const isAnyLoading = scriptureLoading || commentaryLoading || sermonLoading;
    
    // UI 렌더링
    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-100 dark:bg-slate-900 p-6 sm:p-8">
            
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 flex items-center justify-between sticky top-0 z-10">
                <button 
                    onClick={onGoBack} 
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg"
                >
                    <GoBackIcon className="w-5 h-5 mr-1" />
                    {t('goBack', lang)}
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('expositorySermonTitle', lang)}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">{t('sermonLimit', lang, sermonCount)}</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full space-y-6">
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                        <SearchIcon className="w-6 h-6 mr-2 text-blue-500" />
                        {t('scriptureTitle', lang)}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('expositoryDescription', lang)}</p>
                    
                    <div className="flex space-x-3">
                        <input
                            type="text"
                            value={scriptureInput}
                            onChange={(e) => setScriptureInput(e.target.value)}
                            placeholder={t('scripturePlaceholder', lang)}
                            className="flex-1 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isAnyLoading}
                        />
                        <button
                            onClick={handleGetScripture}
                            disabled={isAnyLoading || !scriptureInput.trim()}
                            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition disabled:opacity-50"
                        >
                            {scriptureLoading ? t('gettingScripture', lang) : t('getScripture', lang)}
                        </button>
                    </div>

                    {scriptureText && (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
                            <p className="font-medium text-blue-800 dark:text-blue-300 mb-2">{scriptureInput}</p>
                            <p 
                                className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap cursor-pointer" 
                                onMouseUp={handleAddSelectedText}
                            >
                                {scriptureText}
                            </p>
                        </div>
                    )}
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                        <BibleIcon className="w-6 h-6 mr-2 text-green-500" />
                        {t('aiCommentaryTitle', lang)}
                        <span className='text-sm text-gray-500 dark:text-gray-400 ml-auto'>
                            {commentaryLoading ? t('generating', lang) : t('aiIsThinking', lang)}
                        </span>
                    </h2>
                    
                    <div className="flex justify-between items-center mb-4">
                        <span className={`text-sm font-medium ${remainingCommentary > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {userSubscription === 'premium' ? t('premiumUnlimited', lang) : t('commentaryLimit', lang, remainingCommentary)}
                        </span>
                        <button
                            onClick={handleGetCommentaryAndReferences}
                            disabled={!scriptureText || isAnyLoading || remainingCommentary <= 0}
                            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-50"
                        >
                            {commentaryLoading ? t('generating', lang) : t('getCommentary', lang)}
                        </button>
                    </div>

                    {commentaryLoading && <LoadingSpinner message={t('generating', lang)} />}
                    {commentary && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                            <p 
                                className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap cursor-pointer"
                                onMouseUp={handleAddSelectedText}
                            >
                                {commentary}
                            </p>
                        </div>
                    )}
                </div>
                
                {crossReferences.length > 0 && (
                    <div className="w-full p-6 rounded-xl bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-left shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                            <PlusCircleIcon className="w-6 h-6 mr-2 text-indigo-500" />
                            {t('crossReferencesTitle', lang)}
                        </h2>
                        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                            {crossReferences.map((ref, index) => (
                                <li 
                                    key={index}
                                    className="cursor-pointer hover:text-indigo-600 transition"
                                    onMouseUp={handleAddSelectedText}
                                >
                                    {ref}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}


                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        {t('generateSermonFromCommentary', lang)}
                    </h2>
                    <button
                        onClick={handleGenerateSermon}
                        disabled={!commentary || sermonLoading || !canGenerateSermon}
                        className="px-8 py-4 bg-red-600 text-white font-extrabold text-lg rounded-xl shadow-lg hover:bg-red-700 transition disabled:opacity-50"
                    >
                        {sermonLoading ? t('generatingSermon', lang) : t('generateSermonFromCommentary', lang)}
                    </button>
                    {sermonLoading && <LoadingSpinner message={t('generatingSermon', lang)} className="mt-4" />}
                </div>

                {errorMessage && errorMessage.length > 0 && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center font-medium">
                        🚨 {errorMessage}
                    </div>
                )}


            </div>
        </div>
    );
};

export default ExpositorySermonComponent;