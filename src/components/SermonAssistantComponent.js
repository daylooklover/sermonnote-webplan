'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth } from 'firebase/auth'; 
import { Send, LogOut, Trash2, ArrowLeft, Loader2, Key } from 'lucide-react'; // 아이콘 라이브러리 추가 (가정)

// DUMMY ID 생성 함수 (인라인 정의)
const generateId = () => Math.random().toString(36).substring(2, 9);

// 로컬 저장소 키 정의
const STORAGE_KEY = 'sermonAssistantChatHistory'; 
const CHAT_ENDPOINT = '/api/sermon-generator'; 
const API_BASE_URL = ''; 
const GEMINI_STUDIO_URL = "https://aistudio.google.com/app/apikey";

// =========================================================
// 💡 Custom Modal Hooks & Component (변동 없음)
// =========================================================
const useModal = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalAction, setModalAction] = useState(null);

    const openModal = (action) => {
        setModalAction(() => action);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalAction(null);
    };
    
    const confirmAction = () => {
        if (modalAction) {
            modalAction();
        }
        closeModal();
    };

    return { isModalOpen, openModal, closeModal, confirmAction };
};


const CustomConfirmModal = ({ isModalOpen, closeModal, confirmAction, t, lang }) => {
    if (!isModalOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl max-w-sm w-full transform transition-all duration-300 scale-100 opacity-100">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {t('confirmAction', lang)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    {t('confirmClearChat', lang)}
                </p>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={closeModal}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                    >
                        {t('cancel', lang)}
                    </button>
                    <button
                        onClick={confirmAction}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
                    >
                        {t('confirm', lang)}
                    </button>
                </div>
            </div>
        </div>
    );
};


// =========================================================
// 💡 MessageComponent (UI 개선)
// =========================================================
const MessageComponent = ({ message, lang }) => { 
    const isUser = message.role === 'user';
    const isError = message.isError;
    const isAuthError = message.isAuthError;
    const content = message.content; 
    
    const renderContent = (text) => {
        if (!text) return null;
        
        let processedText = text;
        
        // 코드 블록은 마크다운 처리를 건너뛰고 pre로 직접 렌더링합니다.
        if (processedText.includes('```')) {
            return (
                <pre className="whitespace-pre-wrap font-mono p-3 my-2 bg-gray-800 dark:bg-gray-900 rounded-lg overflow-x-auto text-sm text-white border border-gray-700">
                    {processedText}
                </pre>
            );
        }

        // 마크다운 요소 처리
        processedText = processedText
            .replace(/###\s(.*?)\n/g, '<h3 class="text-lg font-bold mt-4 mb-2 text-indigo-400 dark:text-indigo-300">$1</h3>')
            .replace(/^\s*-\s(.*?)$/gm, '<li class="mb-1 ml-2 pl-2 list-disc list-inside">$1</li>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>')
            .replace(/(<br\/>\s*){3,}/g, '<br/><br/>');

        if (processedText.includes('<li') && !processedText.startsWith('<ul')) {
            processedText = `<ul>${processedText}</ul>`;
        }

        return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
    };
    
    const messageClasses = isError 
        ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border border-red-300 dark:border-red-700'
        : (isUser 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-100 shadow-md border border-gray-200 dark:border-gray-600');
            
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
            {/* 봇 아이콘 (봇 메시지일 때만) */}
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center mr-3 text-white shadow-md flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 15h2m10 0h2M3 8v11a2 2 0 002 2h14a2 2 0 002-2V8M5 8h14a2 2 0 00-2-2H7a2 2 0 00-2 2z"></path></svg>
                </div>
            )}

            <div className={`max-w-[75%] p-4 rounded-xl transition-all duration-300 ${messageClasses} ${isUser ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                    {renderContent(content)}
                </div>
            </div>
            
             {/* 유저 아이콘 (유저 메시지일 때만) */}
             {isUser && (
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center ml-3 text-white shadow-md flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
            )}
        </div>
    );
};


// =========================================================
// 💡 SermonAssistantComponent 정의 (주요 로직은 유지, UI 개선)
// =========================================================
const SermonAssistantComponent = ({ 
    user, 
    lang, 
    t,    
    onGoBack,
    openLoginModal, 
    sermonCount, 
    setSermonCount, 
    onLimitReached,
    userSubscription,
    // 🚨 [추가] 로그아웃 기능을 위한 prop
    handleLogout 
}) => {
    
    // ... (Hooks 및 상태 정의는 원본과 동일)
    const [messages, setMessages] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedHistory = localStorage.getItem(STORAGE_KEY);
            try {
                return savedHistory ? JSON.parse(savedHistory) : [];
            } catch (e) {
                console.error("Failed to parse chat history from localStorage", e);
                return [];
            }
        }
        return [];
    });

    const [currentInput, setCurrentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    const { isModalOpen, openModal, closeModal, confirmAction } = useModal();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    useEffect(() => {
        if (messages.length === 0) { 
            const initialMessage = { 
                id: 'initial', 
                content: t('sermonAssistantInitialDescription', lang) || "안녕하세요! 저는 성경 전문 비서입니다. 성경 구절 검색, 주석 요청 또는 다른 질문이 있으시면 언제든지 말씀해주세요. 어떻게 도와드릴까요?",
                role: 'assistant' 
            };
            setMessages([initialMessage]);
        }
    }, [lang, t]); 

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); };
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const isScriptureRequest = (text) => {
        const scriptureRegex = /(\d*\s*\p{L}+\s*\d+[:\s]\d+)|(\p{L}+\s*\d+)/u;
        return scriptureRegex.test(text);
    };

    const getFullPath = () => {
        return `${API_BASE_URL}${CHAT_ENDPOINT}`; 
    }
    
    
    // =========================================================================
    // 🛑 [FIX] handleAiResponse: ID Token 획득 로직 포함 및 개선된 에러 처리
    // =========================================================================
    const handleAiResponse = useCallback(async (userMessage) => {
        if (isLoading || !user) return;
        
        setIsLoading(true);

        const fullUrl = getFullPath(); 
        const requestType = isScriptureRequest(userMessage) ? 'scripture' : 'general';

        const newUserMessage = { id: generateId(), content: userMessage, role: 'user' };
        const loadingMessageId = generateId();
        
        const historyForAPI = messages.filter(msg => msg.id !== 'initial' && msg.id !== 'error' && msg.role !== 'error' && !msg.isError);
        
        setMessages(prev => {
            const cleanedHistory = prev.filter(msg => msg.id !== 'initial' && !msg.isError && msg.id !== loadingMessageId);
            return [
                ...cleanedHistory, 
                newUserMessage, 
                { id: loadingMessageId, content: t('aiIsThinking', lang) || "AI 비서가 응답을 준비하고 있습니다...", role: 'assistant' }
            ];
        });
        
        let idToken;
        try {
            const auth = getAuth();
            idToken = await user.getIdToken(); 
        } catch (tokenError) {
            console.error("❌ Failed to get ID Token:", tokenError);
            const errorMsg = t('loginToUseFeature', lang) || "인증 토큰 획득에 실패했습니다. 다시 로그인해주세요.";
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
            setMessages(prev => [...prev, { id: generateId(), content: errorMsg, role: 'assistant', isAuthError: true, isError: true }]);
            setIsLoading(false);
            return; 
        }

        try {
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`, 
                },
                body: JSON.stringify({ 
                    prompt: userMessage, 
                    lang: lang, 
                    type: requestType, 
                    history: historyForAPI, 
                    userId: user.uid,
                    userSubscription: userSubscription,
                    sermonCount: sermonCount 
                }), 
            });

            if (!response.ok) {
                let errorDetails = t('errorProcessingRequest', lang) || `요청 처리 중 오류 발생 (Status: ${response.status})`;
                let isAuthError = false;
                
                try {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const errorJson = await response.json();
                        errorDetails = errorJson.error || errorJson.message || JSON.stringify(errorJson);
                        
                        if (response.status === 403 || errorDetails.includes('Limit Exceeded')) {
                            onLimitReached(); 
                            errorDetails = t('limitReachedMessage', lang) || "사용 제한에 도달했습니다.";
                        }
                        
                        if (response.status === 401 || errorDetails.includes('Authentication Error')) {
                             errorDetails = t('errorApiKeyOrServer', lang) || "인증 토큰이 유효하지 않습니다. 다시 로그인해주세요.";
                             isAuthError = true;
                        } else if (response.status === 500) {
                            errorDetails = t('errorApiKeyOrServer', lang) || "서버 내부 오류가 발생했습니다. 키를 확인해 주세요.";
                            isAuthError = true;
                        }

                    }
                } catch (e) {
                    errorDetails = (t('errorApiKeyOrServer', lang) || "네트워크 오류 또는 서버 오류가 발생했습니다.") + ` (Status: ${response.status})`;
                    isAuthError = true; 
                }
                
                setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
                setMessages(prev => [...prev, { id: generateId(), content: errorDetails, role: 'assistant', isAuthError: isAuthError, isError: true }]);
                return;
            }

            const data = await response.json();
            
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
            
            const aiResponseContent = data.response || t('aiAssistantDefaultResponse', lang); 

            setMessages(prev => [...prev, { 
                id: generateId(), 
                content: aiResponseContent, 
                role: 'assistant' 
            }]);
            
            if (data.message === 'Success' && setSermonCount) {
                setSermonCount(prev => prev + 1);
            }

        } catch (error) {
            console.error("AI Assistant API Catch Error:", error.message);
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
            setMessages(prev => [...prev, { id: generateId(), content: t('errorApiKeyOrServer', lang) || "네트워크 오류 또는 API 키 문제가 발생했습니다.", role: 'assistant', isAuthError: true, isError: true }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, user, messages, lang, userSubscription, sermonCount, setSermonCount, onLimitReached, t]); 


    const handleSendClick = useCallback(() => {
        if (!user) {
            openLoginModal();
            return;
        }
        const trimmedInput = currentInput.trim();
        
        if (trimmedInput === '') {
            console.warn("Input is empty, preventing API call.");
            return;
        }
        
        if (trimmedInput) {
            setCurrentInput(''); 
            handleAiResponse(trimmedInput);
        }
    }, [currentInput, user, openLoginModal, handleAiResponse]);
    
    
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendClick();
        }
    }, [handleSendClick]); 
    
    const handleGoToGeminiStudio = () => {
        window.open(GEMINI_STUDIO_URL, '_blank');
    };
    
    const handleClearChat = useCallback(() => {
        setMessages([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const handleClearChatRequest = () => {
        openModal(handleClearChat);
    }

    return (
        <div className="flex flex-col h-screen max-h-screen bg-gray-50 dark:bg-gray-900 font-sans antialiased">
            
            {/* ========================================================= */}
            {/* ⬆️ Header Area (Sticky Top) */}
            {/* ========================================================= */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-lg flex justify-between items-center flex-shrink-0">
                
                {/* 왼쪽: 뒤로가기 / 로고 */}
                <button 
                    onClick={onGoBack} 
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <ArrowLeft className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium hidden sm:inline">{t('goBack', lang) || '뒤로가기'}</span>
                </button>
                
                {/* 중앙: 제목 / 사용량 */}
                <div className="text-center flex-grow">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white hidden sm:inline">Sermon Assistant AI Chat</h1>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        AI Usage: {sermonCount || 0}/{userSubscription?.limit || 50}회
                    </div>
                </div>

                {/* 오른쪽: 초기화 / 로그아웃 */}
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={handleClearChatRequest} 
                        className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition tooltip"
                        title={t('clearChat', lang) || '대화 초기화'}
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                    {handleLogout && (
                        <button 
                            onClick={handleLogout} 
                            className="p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition tooltip"
                            title={t('logout', lang) || '로그아웃'}
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* ========================================================= */}
            {/* 💬 Chat Area (Scrollable Middle) */}
            {/* ========================================================= */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 pt-8" style={{ scrollBehavior: 'smooth' }}>
                <div className="max-w-3xl mx-auto">
                    {messages
                        .filter(message => message.content && message.content.trim() !== '')
                        .map((message) => (
                        <div key={message.id}>
                            <MessageComponent message={message} lang={lang} />
                            
                            {/* 💡 오류 메시지 아래에 '키 확인' 버튼 노출 */}
                            {message.isError && message.isAuthError && (
                                <div className="flex justify-center mt-4 mb-8">
                                    <button 
                                        onClick={handleGoToGeminiStudio}
                                        className="px-6 py-3 text-sm flex items-center bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition shadow-lg focus:outline-none focus:ring-4 focus:ring-yellow-500 focus:ring-opacity-50"
                                    >
                                        <Key className="w-4 h-4 mr-2" />
                                        {t('checkApiKey', lang) || 'Gemini API 키 확인 / 발급'}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* ========================================================= */}
            {/* ✍️ Input Area (Sticky Bottom) */}
            {/* ========================================================= */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl flex-shrink-0">
                <div className="flex items-center space-x-3 max-w-3xl mx-auto">
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={handleKeyDown} 
                        placeholder={isLoading ? (t('aiIsThinking', lang) || "응답 생성 중...") : (t('sermonAssistantInputPlaceholder', lang) || "주제나 성경 구절을 입력하세요.")}
                        disabled={isLoading || !user}
                        className="flex-1 p-3 rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow disabled:opacity-50"
                    />
                    
                    <button
                        onClick={handleSendClick}
                        disabled={isLoading || !currentInput.trim() || !user} 
                        className={`p-3 rounded-xl transition-all ${
                            isLoading || !currentInput.trim() || !user 
                                ? 'bg-indigo-300 dark:bg-indigo-700/50 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50'
                        }`}
                        title={t('send', lang) || '전송'}
                    >
                        {isLoading ? (
                             <Loader2 className="w-5 h-5 text-white animate-spin" />
                        ) : (
                            <Send className="w-5 h-5 text-white" />
                        )}
                    </button>
                </div>
                {!user && (
                    <p className="text-xs text-red-500 text-center mt-2">{t('loginToUseFeature', lang) || '기능 사용을 위해 로그인 해주세요.'}</p>
                )}
            </div>
            
            {/* Custom Modal Render (props 전달) */}
            <CustomConfirmModal 
                isModalOpen={isModalOpen}
                closeModal={closeModal}
                confirmAction={confirmAction}
                t={t}
                lang={lang}
            />
        </div>
    );
}

// --------------------------------------------------
// ✅ Default Export
// --------------------------------------------------
export default SermonAssistantComponent;