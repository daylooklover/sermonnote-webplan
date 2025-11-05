"use client"; 
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { t } from '../lib/translations'; 
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 

// DUMMY ID 생성 함수 (utils.js에 정의되어 있지 않다면 사용)
const generateId = () => Math.random().toString(36).substring(2, 9);

// API 호출 상수 (Next.js 환경에서 사용)
// 서버의 파일 경로에 따라 CHAT_ENDPOINT가 '/api/assistant-chat'임을 확인했습니다.
const CHAT_ENDPOINT = '/api/assistant-chat';
const API_BASE_URL = ''; // 상대 경로 사용

// 대화 메시지 구조 컴포넌트
const MessageComponent = ({ message, lang, onGenerateSermonDraft }) => { 
    const isUser = message.role === 'user';
    const content = message.content; 
    
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[80%] p-3 rounded-xl shadow-md ${
                isUser 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-700 text-gray-100 dark:bg-gray-800 dark:text-gray-100'
            }`}>
                <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
};


export default function SermonAssistantComponent({ 
    user, 
    lang, // Home.js로부터 받은 현재 언어 코드 (ko, en, vi, ru 등)
    onGoBack, 
    openLoginModal, 
    setSermonInput,
    // Home.js에서 전달받은 props
    sermonCount, // 현재 사용 횟수
    setSermonCount, // 사용 횟수 업데이트 함수
    onLimitReached, // 제한 도달 시 호출될 콜백 함수
    ...commonProps
}) {
    
    const [messages, setMessages] = useState([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // 💡 Gemini Studio 링크
    const GEMINI_STUDIO_URL = "https://aistudio.google.com/app/apikey";

    // 자동 스크롤 로직 유지
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(scrollToBottom, [messages]);

    // 컴포넌트 마운트 시 초기 메시지 설정 유지
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { id: 'initial', content: t('sermonAssistantInitialDescription', lang), role: 'assistant' }
            ]);
        }
    }, [messages.length, lang]);
    
    // API 호출 경로 생성 (상대 경로 기준)
    const getFullPath = () => {
        // CHAT_ENDPOINT는 '/api/assistant-chat'이므로 API_BASE_URL은 빈 문자열로 유지
        return `${API_BASE_URL}${CHAT_ENDPOINT}`; 
    }
    
    // API 호출 및 응답 처리
    const handleAiResponse = useCallback(async (userMessage) => {
        if (isLoading || !user) return;
        
        setIsLoading(true);

        const fullUrl = getFullPath(); 
        
        // 1. 유저 메시지 및 로딩 메시지 설정
        const newUserMessage = { id: generateId(), content: userMessage, role: 'user' };
        const loadingMessageId = generateId();
        
        setMessages(prev => [
            ...prev.filter(msg => msg.id !== 'initial' && msg.id !== 'error'), 
            newUserMessage, 
            { id: loadingMessageId, content: t('aiIsThinking', lang), role: 'assistant' }
        ]);
        
        // 2. API 호출
        try {
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMessage, 
                    // 🚨🚨🚨 핵심 수정: lang 값을 language_code 필드에 담아 서버로 전송 🚨🚨🚨
                    language_code: lang, 
                    // 'initial' 및 'error' 메시지는 history에서 제외
                    history: messages.filter(msg => msg.id !== 'initial' && msg.id !== 'error'), 
                    userId: user.uid,
                    userSubscription: commonProps.userSubscription,
                    sermonCount: commonProps.sermonCount // 서버로 현재 사용 횟수 전달
                }), 
            });

            // 3. 응답 에러 처리 (404/500/403 대응)
            if (!response.ok) {
                let errorDetails = t('errorProcessingRequest', lang) + ` (Status: ${response.status})`;
                let isAuthError = false;

                try {
                    const errorJson = await response.json();
                    errorDetails = errorJson.response || errorJson.message || JSON.stringify(errorJson);
                    
                    if (response.status === 403 || (errorJson.message && errorJson.message.includes('Limit Reached'))) {
                        // 🚨 403 (Limit Reached) 처리 🚨
                        onLimitReached(); // Home.js의 모달을 띄우는 콜백 호출
                        setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
                        // 제한 도달 메시지를 화면에 추가하지 않고 모달만 띄우기 위해 return
                        return; 
                    }

                    if (response.status === 401 || response.status === 403 || errorDetails.includes('API 키')) {
                        isAuthError = true;
                    }
                } catch (e) {
                    // JSON 파싱 실패 (HTML 에러 페이지를 받은 경우)
                    errorDetails = t('errorProcessingRequest', lang) + ` (서버 연결 또는 키 오류 - Status: ${response.status})`;
                    isAuthError = true; 
                }
                
                setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
                setMessages(prev => [...prev, { id: 'error', content: errorDetails, role: 'assistant', isAuthError: isAuthError }]);
                return;
            }

            const data = await response.json();
            
            // 4. 로딩 메시지 제거 후 실제 응답 추가
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
            
            const aiResponseContent = data.response || t('aiAssistantDefaultResponse', lang).replace('{message}', userMessage);

            setMessages(prev => [...prev, { 
                id: generateId(), 
                content: aiResponseContent, 
                role: 'assistant' 
            }]);
            
            // 🚨 5. 성공 시: Home.js의 sermonCount 상태를 1 증가시켜 즉시 UI에 반영 🚨
            if (data.message === 'Success' && setSermonCount) {
                setSermonCount(prev => prev + 1);
            }


        } catch (error) {
            console.error("AI Assistant API Catch Error:", error.message);
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
            setMessages(prev => [...prev, { id: generateId(), content: t('errorProcessingRequest', lang), role: 'assistant', isAuthError: true }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, user, messages, lang, t, commonProps.userSubscription, commonProps.sermonCount, user.uid, getFullPath, setSermonCount, onLimitReached]); // 의존성 추가


    const handleSendClick = () => {
        if (!user) {
            openLoginModal();
            return;
        }
        const trimmedInput = currentInput.trim();
        if (trimmedInput) {
            setCurrentInput(''); 
            handleAiResponse(trimmedInput);
        }
    };
    
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendClick();
        }
    }, [handleSendClick]);
    
    // 💡 새 함수: Gemini Studio로 이동
    const handleGoToGeminiStudio = () => {
        window.open(GEMINI_STUDIO_URL, '_blank');
    };

    const isInitialScreen = messages.length === 0 || (messages.length === 1 && messages[0].id === 'initial');

    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-100 dark:bg-slate-900">
            {/* Header and Back Button */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10">
                <button onClick={onGoBack} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    {t('goBack', lang)} 
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isInitialScreen ? (
                    // ... 초기 화면 로직 유지 ...
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 dark:text-gray-400">
                        <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 dark:text-white">{t('sermonAssistantInitialTitle', lang)}</h1>
                        <p className="text-lg mb-8">{t('sermonAssistantInitialDescription', lang)}</p>
                        
                        <div className="p-8 bg-gray-200 dark:bg-gray-700 rounded-xl shadow-inner">
                            <p className="mb-4 font-semibold dark:text-gray-200">{t('askAQuestionToBegin', lang)}</p>
                            <button
                                onClick={() => setMessages(prev => prev.filter(msg => msg.id !== 'initial'))} 
                                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                            >
                                {t('startYourSermonConversation', lang)}
                            </button>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id}>
                            <MessageComponent message={message} lang={lang} />
                            
                            {/* 💡 수정 2: 오류 메시지 아래에 '키 확인' 버튼 노출 */}
                            {message.id === 'error' && message.isAuthError && (
                                <div className="flex justify-center mt-2">
                                    <button 
                                        onClick={handleGoToGeminiStudio}
                                        className="px-4 py-2 text-sm bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition"
                                    >
                                        Gemini API 키 확인 / 발급
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 z-10">
                <div className="flex items-center space-x-3 max-w-2xl mx-auto">
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={handleKeyDown} 
                        placeholder={isLoading ? t('aiIsThinking', lang) : t('sermonAssistantInputPlaceholder', lang)}
                        disabled={isLoading || !user}
                        className="flex-1 p-3 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow disabled:opacity-50"
                    />
                    <button
                        onClick={handleSendClick}
                        disabled={isLoading || !currentInput.trim() || !user}
                        className={`p-3 rounded-full transition-colors ${
                            isLoading || !currentInput.trim() || !user 
                                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                    >
                        {/* Send Icon (간단한 SVG 아이콘으로 대체) */}
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                </div>
                {!user && (
                    <p className="text-xs text-red-500 text-center mt-2">{t('loginToUseFeature', lang)}</p>
                )}
            </div>
        </div>
    );
}
