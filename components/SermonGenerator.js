"use client";

import React, { useState, useCallback } from 'react';
// 모든 필요한 아이콘을 임포트합니다.
import { LoadingSpinner, GoBackIcon, PrintIcon, ZoomInIcon, ZoomOutIcon, FullscreenIcon, CloseIcon } from './IconComponents'; 
import { t } from '../lib/translations'; 


// 🛠️ 1. API 호출 함수: language_code와 data (userId 포함)를 받도록 수정
const callAPI = async (promptText, endpoint = '/api/assistant-chat', data = {}, language_code = 'ko') => {
    try {
        // endpoint를 '/api/assistant-chat'으로 통일하여 AI 응답 로직을 재사용합니다.
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                question: promptText, // AI Assistant API는 prompt 대신 question을 기대할 수 있으므로 통일
                // 🚨 language_code와 data (userId 등) 추가 🚨
                language_code: language_code, 
                ...data 
            }), 
        });

        const textResponse = await response.clone().text();

        if (!response.ok) {
            console.error(`[API Error] Status ${response.status} failed. Raw Response: ${textResponse.substring(0, 200)}...`);
            // 401 오류 메시지를 포함하여 null 반환
            return null; 
        }

        if (textResponse.trim() === '') {
            console.warn("[API Warning] 200 OK but response body is completely empty.");
            return null;
        }

        let result;
        try {
            result = JSON.parse(textResponse);
        } catch (e) {
            console.error("[API CRITICAL ERROR] Failed to parse JSON response. Raw Text:", textResponse.substring(0, 200), e);
            return null;
        }
        
        // assistant-chat API는 'response' 필드를 반환하므로, 그에 맞게 조정
        let finalResultText = result.response || result.text || (result.data ? result.data.text : null);

        if (!finalResultText || typeof finalResultText !== 'string') {
            console.error("[API CRITICAL ERROR] Parsed JSON has no valid text field or is not a string.", result);
            return null;
        }
        
        return finalResultText; 
        
    } catch (error) {
        console.error("API Fetch Network Error:", error);
        return null; 
    }
};


// 💡 다국어 지원을 위한 언어/역본 매핑 함수 (러시아어, 베트남어, 중국어 추가)
const getTargetVersion = (lang) => {
    switch (lang) {
        case 'en':
            return { language: 'English', version: 'NIV (New International Version)' };
        case 'es': // 스페인어는 5개 언어에 포함되지 않았으나 혹시 몰라 유지
            return { language: 'Spanish', version: 'Reina-Valera 1960' };
        case 'ru':
            return { language: 'Russian', version: 'Синодальный перевод (Synodal Translation)' };
        case 'vi':
            return { language: 'Vietnamese', version: 'Kinh Thánh Tiếng Việt Bản Dịch Mới (Vietnamese New Version)' };
        case 'zh':
            return { language: 'Chinese', version: 'Simplified Chinese Union Version (简体中文和合本)' };
        case 'ko':
        default:
            return { language: 'Korean', version: 'Korean Revised Version - 개역개정' };
    }
};


// 🚨 props에 user 객체를 받고 있다고 가정
const SermonGenerator = ({ lang = 'ko', user, openLoginModal, onSetError, onGoBack }) => { 
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [scriptureInput, setScriptureInput] = useState('창세기 1:1');
    const [scriptureText, setScriptureText] = useState('');
    const [commentary, setCommentary] = useState(''); // AI 심층 강해 (원어 분석, 주석)
    const [sermonDraft, setSermonDraft] = useState(''); // 최종 설교 초안
    const [internalError, setInternalError] = useState(''); 
    
    const [fontSize, setFontSize] = useState(16); 
    const MAX_FONT = 24;
    const MIN_FONT = 12;

    // 모달 상태: 열림 여부와 모달에 표시할 콘텐츠
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: '', text: '' });


    const handlePrint = () => {
        window.print();
    };

    // 모달 열기 함수
    const openModal = (title, text) => {
        setModalContent({ title, text });
        setIsModalOpen(true);
    };

    // 모달 닫기 함수
    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent({ title: '', text: '' });
    };

    const setError = (msg) => {
        setInternalError(msg);
        onSetError(msg);
    };

    const handleNextStep = useCallback((text) => {
        if (step === 1) setScriptureText(text);
        
        setError(''); 
        setStep(prev => prev < 3 ? prev + 1 : prev); 
    }, [step]);
    
    const handleReset = () => {
        setStep(1);
        setScriptureInput('창세기 1:1');
        setScriptureText('');
        setCommentary('');
        setSermonDraft(''); 
        setError('');
        setLoading(false);
        setFontSize(16);
    };

    // UI 컴포넌트: Step1 (강해 구절 입력)
    const renderStep1 = () => {
        const fetchVerse = async () => {
            // 🚨🚨🚨 인증 확인 (Step 1) 🚨🚨🚨
            if (!user || !user.uid) {
                 setError(t('loginToFetchVerse', lang) || '구절을 불러오려면 로그인이 필요합니다.');
                 return openLoginModal();
            }
            if (!scriptureInput.trim()) return setError('강해할 성경 구절을 입력해 주세요.');
            
            setLoading(true);
            setError('');
            
            try {
                const { language, version } = getTargetVersion(lang); 

                // 🚨🚨🚨 수정된 프롬프트: 태그 없이 오직 구절 텍스트만 반환하도록 강제 🚨🚨🚨
                const prompt = `Using Google Search, find the exact ${language} Bible verse text (${version}) for the reference "${scriptureInput}". 
                                 Respond ONLY with the complete verse text, removing any commentary, chapter/verse numbers, and translation names. 
                                 The response must contain ONLY the verse text itself. 
                                 If the verse is not found, respond ONLY with "VERSE NOT FOUND".`;
                
                // 🚨 callAPI 호출 시 userId와 lang 코드 전달 🚨
                const dataPayload = { userId: user.uid };
                const responseText = await callAPI(prompt, '/api/assistant-chat', dataPayload, lang); 
                
                if (!responseText || responseText.toUpperCase().includes("VERSE NOT FOUND")) {
                    setError(t('verseNotFound', lang)?.replace('{0}', scriptureInput) || `오류: 구절을 찾지 못했습니다. (입력: ${scriptureInput})`);
                    setScriptureText('');
                    return;
                }

                // 🚨🚨🚨 수정된 추출 로직: 응답 텍스트 전체(또는 첫 줄)를 구절로 사용 🚨🚨🚨
                // 추가적인 AI 설명이나 주석을 제거하기 위해 첫 줄을 가져옵니다.
                let extractedText = responseText.trim().split('\n')[0].trim();
                
                if (!extractedText || extractedText.length < 5) {
                    // 구절은 찾았는데 텍스트 길이가 5 미만이면 오류 처리
                    setError(t('verseExtractionFailed', lang) || `오류: 구절을 찾았으나, AI 응답 구조가 잘못되었습니다. (구절 텍스트 추출 실패)`);
                    setScriptureText('');
                    return;
                }
                
                handleNextStep(extractedText);

            } catch (err) {
                // 🚨 에러 메시지에 401 오류 정보가 포함되도록 수정
                const errorMsg = err.message || t('errorFetchingVerse', lang) || '구절 불러오기 중 알 수 없는 오류 발생';
                setError(errorMsg); 
                setScriptureText('');
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="space-y-6">
                {internalError && (
                    <div className="bg-red-100 text-red-700 p-4 rounded-xl border border-red-300">
                        <p className="font-semibold">{internalError}</p>
                    </div>
                )}

                <p className="text-gray-600 text-sm italic">
                    **원어 강해** 및 **신학적 분석**을 진행할 성경 구절(책명:장:절)을 입력합니다.
                </p>
                <input
                    type="text"
                    value={scriptureInput}
                    onChange={(e) => setScriptureInput(e.target.value)}
                    placeholder="예: 요한복음 3:16 또는 롬 8:28"
                    className="w-full p-4 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                    onClick={fetchVerse}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400"
                >
                    {loading ? <LoadingSpinner message={t('fetchingVerse', lang) || "구절 불러오는 중..."} /> : t('step1FetchVerse', lang) || '1단계: 구절 불러오기'}
                </button>
                {scriptureText && (
                    <p className="text-sm text-center text-gray-500 italic mt-3 border-t pt-3">**확인된 구절:** {scriptureText}</p>
                )}
            </div>
        );
    };
    
    // UI 컴포넌트: Step2 (심층 강해 생성) 
    const renderStep2 = () => {
        const generateCommentary = async () => { 
            // 🚨🚨🚨 인증 확인 (Step 2) 🚨🚨🚨
            if (!user || !user.uid) {
                setError(t('loginToGenerateCommentary', lang) || '강해를 생성하려면 로그인이 필요합니다.');
                return openLoginModal();
            }
            setLoading(true);
            setError('');
            setCommentary(''); 
            
            try {
                const { language } = getTargetVersion(lang); 

                // 🚨🚨🚨 Step 2 Prompt 수정: 인사말을 제거하고 분석만 요청하도록 강제 🚨🚨🚨
                const prompt = `Based on the scripture reference "${scriptureInput}" and the verse text: "${scriptureText}", perform a detailed expository analysis. The analysis MUST include: 
                                1. **Original Language Analysis (원어 분석):** Focus on 1-2 key Hebrew/Greek words.
                                2. **Theological Context (신학적 배경):** Briefly explain the theological significance.
                                3. **Expository Commentary (강해 주석):** Provide a detailed breakdown of the verse.
                                
                                Format your entire response with clear, labeled, and sequential sections: 'Original Analysis:', 'Theological Context:', 'Commentary:'.
                                
                                **DO NOT include any greetings (e.g., "Hello," "Welcome") or conversational opening/closing statements. Provide ONLY the requested analysis.**`;
                
                // 🚨 callAPI 호출 시 userId와 lang 코드 전달 🚨
                const dataPayload = { userId: user.uid };
                const commentaryText = await callAPI(prompt, '/api/assistant-chat', dataPayload, lang);

                if (!commentaryText) {
                    setError(t('commentaryFailed', lang) || '심층 강해 생성 중 AI가 응답하지 않았습니다.');
                    return;
                }
                
                setCommentary(commentaryText.trim());
                setSermonDraft(''); 
                
                handleNextStep(); 
            } catch (err) {
                setError(err.message || t('commentaryGenerationFailed', lang) || '심층 강해 생성 실패');
            } finally {
                setLoading(false);
            }
        };

        return (
            <div className="space-y-6">
                <p className="text-gray-600 text-sm italic">
                    선택된 구절에 대한 **원어 분석, 신학적 강해**를 먼저 생성합니다.
                </p>
                <div className="bg-amber-50 p-6 rounded-xl theme-serif text-gray-800 border border-amber-200 shadow-inner">
                    <p className="font-bold text-lg mb-2 text-amber-700">강해할 구절: {scriptureInput}</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{scriptureText}</p>
                </div>

                <button
                    onClick={generateCommentary}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400"
                >
                    {loading ? <LoadingSpinner message={t('generatingCommentary', lang) || "심층 강해 생성 중..."} /> : t('step2GenerateCommentary', lang) || '2단계: 심층 강해 생성'}
                </button>
            </div>
        );
    };


    // UI 컴포넌트: Step3 (최종 확인 및 설교 초안 선택적 생성)
    const renderStep3 = () => {
        const generateSermon = async () => {
            // 🚨🚨🚨 인증 확인 (Step 3) 🚨🚨🚨
            if (!user || !user.uid) {
                setError(t('loginToGenerateDraft', lang) || '설교 초안을 생성하려면 로그인이 필요합니다.');
                return openLoginModal();
            }
            setLoading(true);
            setError('');
            
            try {
                const { language } = getTargetVersion(lang);
                
                // 🚨 Step 3 Prompt: 최종 설교 초안을 요청 (응답은 백엔드의 language_code 지시를 따름)
                const prompt = `Based ONLY on the following detailed commentary, write a complete, structured sermon draft (approx. 2000 characters). Commentary: "${commentary}"`;
                
                // 🚨 callAPI 호출 시 userId와 lang 코드 전달 🚨
                const dataPayload = { userId: user.uid };
                const sermonText = await callAPI(prompt, '/api/assistant-chat', dataPayload, lang);

                if (!sermonText) {
                    setError(t('sermonDraftFailed', lang) || '설교 초안 생성 중 AI가 응답하지 않았습니다.');
                    return;
                }
                
                setSermonDraft(sermonText.trim());
            } catch (err) {
                setError(err.message || t('sermonDraftGenerationFailed', lang) || '설교 초안 생성 실패');
            } finally {
                setLoading(false);
            }
        };
        
        const textareaStyle = { fontSize: `${fontSize}px` };

        return (
            <div className="space-y-6">
                     <p className="text-gray-600 text-sm italic">
                         AI가 생성한 원어 강해를 검토하고, 필요하면 아래 버튼을 눌러 **설교 초안을 생성**할 수 있습니다.
                        </p>
                
                {/* 폰트 조절/인쇄 버튼 영역 */}
                <div className="no-print flex justify-end items-center space-x-2 pb-2">
                    <span className="text-sm text-gray-600 mr-2">텍스트 크기:</span>
                    <button
                        onClick={() => setFontSize(s => Math.min(s + 2, MAX_FONT))}
                        disabled={fontSize >= MAX_FONT}
                        className="p-1 border rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        title={t('zoomIn', lang) || "확대"}
                    >
                        <ZoomInIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setFontSize(s => Math.max(s - 2, MIN_FONT))}
                        disabled={fontSize <= MIN_FONT}
                        className="p-1 border rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        title={t('zoomOut', lang) || "축소"}
                    >
                        <ZoomOutIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handlePrint}
                        className="p-1 ml-4 border rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
                        title={t('print', lang) || "인쇄"}
                    >
                        <PrintIcon className="w-5 h-5" />
                    </button>
                </div>
                
                
                <div className="bg-white p-6 rounded-xl text-gray-800 border border-gray-300 shadow-md relative">
                    <p className="font-bold text-lg mb-2 text-blue-600">AI 심층 강해 (원어 분석, 신학 포함)</p>
                    
                    {/* 전체 화면 보기 버튼 */}
                    <button 
                        onClick={() => openModal(t('aiCommentaryTitle', lang) || "AI 심층 강해", commentary)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-blue-500 p-1 rounded-full no-print"
                        title={t('viewFullscreen', lang) || "전체 화면 보기"}
                    >
                        <FullscreenIcon className="w-5 h-5" />
                    </button>
                    
                    <textarea
                        value={commentary} 
                        onChange={(e) => setCommentary(e.target.value)}
                        readOnly={loading}
                        style={textareaStyle} // 폰트 스타일 적용
                        className="w-full h-[500px] p-2 bg-gray-50 rounded-lg text-gray-800 border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={loading ? (t('loadingCommentary', lang) || "강해 내용 로딩 중...") : (t('commentaryPlaceholder', lang) || "강해 내용이 여기에 표시됩니다.")}
                    />
                </div>

                {!sermonDraft && (
                    <button
                        onClick={generateSermon}
                        disabled={loading || !commentary.trim()}
                        className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400"
                    >
                        {loading ? <LoadingSpinner message={t('generatingDraft', lang) || "설교 초안 생성 중..."} /> : t('generateSermonDraftOptional', lang) || '설교 초안 작성하기 (선택 사항)'}
                    </button>
                )}
                
                {(sermonDraft || loading) && (
                    <div className="bg-white p-6 rounded-xl text-gray-800 border border-gray-300 shadow-md mt-6 relative">
                        <p className="font-bold text-xl mb-3 text-red-600">최종 설교 초안</p>

                        {/* 전체 화면 보기 버튼 */}
                        <button 
                            onClick={() => openModal(t('finalSermonDraftTitle', lang) || "최종 설교 초안", sermonDraft)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-red-500 p-1 rounded-full no-print"
                            title={t('viewFullscreen', lang) || "전체 화면 보기"}
                        >
                            <FullscreenIcon className="w-5 h-5" />
                        </button>

                        <textarea
                            value={sermonDraft}
                            onChange={(e) => setSermonDraft(e.target.value)}
                            readOnly={loading}
                            style={textareaStyle} 
                            className="w-full h-64 p-2 bg-gray-50 rounded-lg text-gray-800 resize-none border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder={loading ? (t('loadingDraft', lang) || "설교 초안 생성 중...") : (t('draftPlaceholder', lang) || "설교 초안이 여기에 표시됩니다. 자유롭게 편집하세요.")}
                        />
                    </div>
                )}
                
                    <p className="text-sm text-center text-gray-500 italic mt-4">
                        설교문은 초안이며, 반드시 목회자님의 영감과 체험을 더하여 완성해야 합니다.
                   </p>
            </div>
        );
    };
    
    // 모달 컴포넌트
    const ModalViewer = () => {
        if (!isModalOpen) return null;

        return (
            // 모달 배경 (전체 화면 덮음)
            <div className="modal-viewer fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                {/* 모달 콘텐츠 박스 (컴퓨터 스크린 크기) */}
                <div className="bg-white rounded-xl shadow-2xl p-6 w-[95vw] h-[95vh] flex flex-col">
                    
                    {/* 모달 헤더 */}
                    <div className="flex justify-between items-center border-b pb-4 mb-4 no-print">
                        <h2 className="text-2xl font-bold text-gray-800">{modalContent.title}</h2>
                        <div className="flex space-x-3 items-center">
                            {/* 폰트 조절 버튼 (모달 전용) */}
                            <span className="text-sm text-gray-600">텍스트 크기:</span>
                            <button
                                onClick={() => setFontSize(s => Math.min(s + 2, MAX_FONT))}
                                disabled={fontSize >= MAX_FONT}
                                className="p-1 border rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                title={t('zoomIn', lang) || "확대"}
                            >
                                <ZoomInIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setFontSize(s => Math.max(s - 2, MIN_FONT))}
                                disabled={fontSize <= MIN_FONT}
                                className="p-1 border rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                                title={t('zoomOut', lang) || "축소"}
                            >
                                <ZoomOutIcon className="w-5 h-5" />
                            </button>
                            {/* 인쇄 버튼 */}
                            <button 
                                onClick={handlePrint} 
                                className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                                title={t('print', lang) || "인쇄"}
                            >
                                <PrintIcon className="w-5 h-5" />
                            </button>
                            {/* 닫기 버튼 */}
                            <button onClick={closeModal} className="p-2 text-gray-500 hover:text-gray-800 rounded-full">
                                <CloseIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* 모달 콘텐츠 영역 */}
                    <div className="flex-grow overflow-y-auto print-area">
                        <textarea
                            value={modalContent.text}
                            readOnly
                            style={{ fontSize: `${fontSize}px` }} // 폰트 크기 적용
                            className="w-full h-full p-4 bg-white text-gray-800 resize-none border-none focus:outline-none"
                        />
                    </div>
                </div>
            </div>
        );
    };


    // 최종 렌더링
    const renderContent = () => {
        return (
            <>
                <div className="flex justify-between items-center w-full px-2 py-4 no-print">
                    <button onClick={onGoBack} className="flex items-center text-gray-600 hover:text-gray-800 transition">
                        <GoBackIcon className="w-5 h-5 mr-1" />
                        {t('goBack', lang) || '뒤로가기'}
                    </button>
                    <button onClick={handleReset} className="text-gray-500 hover:text-red-600 transition">
                        {t('reset', lang) || '초기화'}
                    </button>
                </div>
                <div className="max-w-2xl mx-auto space-y-8 p-6 bg-white rounded-2xl shadow-xl">
                    <h1 className="text-3xl font-extrabold text-center text-gray-800 border-b border-gray-200 pb-3">
                        SermonNote 2.0: **{t('expositorySermonTitle', lang) || '원어 강해'}** {t('sermonDraftGenerator', lang) || '설교 초안 생성기'}
                    </h1>

                    {/* 단계 표시기: no-print 클래스 적용 */}
                    <div className="flex justify-between items-center text-sm font-semibold bg-gray-100 p-3 rounded-lg no-print">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`p-2 rounded-lg transition-colors ${step === s ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600'}`}>
                                {t('step', lang) || 'Step'} {s}
                            </div>
                        ))}
                    </div>

                    <div className="border border-gray-200 p-4 rounded-xl shadow-inner">
                        {step === 1 && renderStep1()}
                        {step === 2 && renderStep2()}
                        {step === 3 && renderStep3()}
                    </div>
                </div>

                {/* 모달 뷰어 컴포넌트를 최상위에 배치합니다 */}
                <ModalViewer />
            </>
        );
    };

    return renderContent();
};

export default SermonGenerator;
