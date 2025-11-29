'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

// DUMMY ID 생성 함수 (인라인 정의)
const generateId = () => Math.random().toString(36).substring(2, 9);

// 로컬 저장소 키 정의
const STORAGE_KEY = 'sermonAssistantChatHistory'; 

// 🚨 FIX: 삭제된 '/api/assistant-chat' 대신 새로운 API 경로를 사용하도록 수정합니다.
// '설교-generator'의 경로를 '/api/sermon-generator'로 가정합니다.
const CHAT_ENDPOINT = '/api/sermon-generator'; 
const API_BASE_URL = ''; // 상대 경로 사용
const GEMINI_STUDIO_URL = "https://aistudio.google.com/app/apikey";

// 💡 Custom Modal Hook/Logic (커스텀 모달 상태 관리)
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
    
    // 모달을 통한 실제 실행 함수
    const confirmAction = () => {
        if (modalAction) {
            modalAction();
        }
        closeModal();
    };

    return { isModalOpen, openModal, closeModal, confirmAction };
};


// 💡 Custom Modal Component (SermonAssistantComponent 바깥으로 분리)
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


// 💡 MessageComponent (마크다운 처리 포함)
const MessageComponent = ({ message, lang }) => { 
    const isUser = message.role === 'user';
    const content = message.content; 
    
    const renderContent = (text) => {
        if (!text) return null;
        
        let processedText = text;
        
        // 1. 코드 블록 처리
        if (processedText.includes('```')) {
            return (
                <pre className="whitespace-pre-wrap font-mono p-3 my-2 bg-gray-600 dark:bg-gray-900 rounded-lg overflow-x-auto text-sm text-white">
                    {processedText}
                </pre>
            );
        }

        // 2. 제목 (H3) 처리
        processedText = processedText.replace(
            /###\s(.*?)\n/g, 
            '<h3 class="text-lg font-bold mt-4 mb-2 text-indigo-500">$1</h3>'
        );
        
        // 3. 목록 (-) 처리
        processedText = processedText.replace(
            /^\s*-\s(.*?)$/gm, 
            '<li class="mb-1 ml-2 pl-2 list-disc list-inside">$1</li>'
        );
        // 목록 ul 감싸기
        if (processedText.includes('<li') && !processedText.startsWith('<ul')) {
            processedText = `<ul>${processedText}</ul>`;
        }

        // 4. 볼드 처리: **...**
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // 5. 줄 바꿈 처리
        processedText = processedText.replace(/\n/g, '<br/>');

        // 6. 연속된 <br/>을 하나로 줄임
        processedText = processedText.replace(/(<br\/>\s*){3,}/g, '<br/><br/>');

        // 텍스트만 남아 있을 경우
        return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
    };
    
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[80%] p-4 rounded-xl shadow-lg transition-all duration-300 ${
                isUser 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-100'
            }`}>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                    {renderContent(content)}
                </div>
            </div>
            {/* 메시지 내용이 'errorApiKeyOrServer'일 때 발생하는 불필요한 공백을 줄이기 위해 빈 div 제거 */}
            {!content.includes("errorApiKeyOrServer") && <div className="w-4 h-4" />}
        </div>
    );
};

// 💡 SermonAssistantComponent 정의
const SermonAssistantComponent = ({ 
    user, 
    lang, 
    t,    
    onGoBack,
    openLoginModal, 
    sermonCount, 
    setSermonCount, 
    onLimitReached,
    userSubscription
}) => {
    
    // 🚨 [수정 1]: messages 상태를 localStorage에서 로드
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
    
    // 💡 Custom Modal Hooks 사용
    const { isModalOpen, openModal, closeModal, confirmAction } = useModal();

    // 🚨 [추가 1]: messages 상태가 변경될 때마다 localStorage에 저장
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    // 🚨 [수정 2]: 초기 메시지 설정 (localStorage에 기록이 없을 때만)
    useEffect(() => {
        if (messages.length === 0) { 
            const initialMessage = { 
                id: 'initial', 
                content: t('sermonAssistantInitialDescription', lang), 
                role: 'assistant' 
            };
            setMessages([initialMessage]);
        }
    }, [lang, t]); // messages가 비어있을 때만 실행

    // 자동 스크롤 로직
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    
    // 🚨 FIX 2: 메시지 목록이 업데이트될 때만 스크롤을 실행
    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    // ... (isScriptureRequest, getFullPath, handleAiResponse 로직은 메시지 상태 업데이트 로직과 충돌하지 않도록 그대로 유지)
    // 🚨 성경 구절 형식 판단 (강해설교 기능 활성화)
    const isScriptureRequest = (text) => {
        const scriptureRegex = /(\d*\s*\p{L}+\s*\d+[:\s]\d+)|(\p{L}+\s*\d+)/u;
        return scriptureRegex.test(text);
    };

    // API 호출 경로 생성 
    const getFullPath = () => {
        return `${API_BASE_URL}${CHAT_ENDPOINT}`; 
    }
    
    // API 호출 및 응답 처리
    const handleAiResponse = useCallback(async (userMessage) => {
        if (isLoading || !user) return;
        
        setIsLoading(true);

        const fullUrl = getFullPath(); 
        const requestType = isScriptureRequest(userMessage) ? 'scripture' : 'general';

        // 1. 유저 메시지 및 로딩 메시지 설정
        const newUserMessage = { id: generateId(), content: userMessage, role: 'user' };
        const loadingMessageId = generateId();
        
        // 'initial' 및 'error' 메시지는 히스토리에서 제외하고, 새 메시지를 추가
        const historyForAPI = messages.filter(msg => msg.id !== 'initial' && msg.id !== 'error' && msg.role !== 'error' && !msg.isError);
        
        setMessages(prev => {
            // 이전 오류 메시지들을 제거하고 새로운 메시지들을 추가합니다.
            const cleanedHistory = prev.filter(msg => msg.id !== 'initial' && !msg.isError);
            return [
                ...cleanedHistory, 
                newUserMessage, 
                { id: loadingMessageId, content: t('aiIsThinking', lang), role: 'assistant' }
            ];
        });
        
        // 2. API 호출
        try {
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: userMessage, 
                    lang: lang, 
                    type: requestType, 
                    history: historyForAPI, 
                    userId: user.uid,
                    userSubscription: userSubscription,
                    sermonCount: sermonCount 
                    // memo_text 필드는 채팅에서는 보내지 않습니다.
                }), 
            });

            // 3. 응답 에러 처리 (403/제한 도달 처리 포함)
            if (!response.ok) {
                let errorDetails = t('errorProcessingRequest', lang) || `요청 처리 중 오류 발생 (Status: ${response.status})`;
                let isAuthError = false;
                
                try {
                    const contentType = response.headers.get("content-type");
                    if (contentType && contentType.includes("application/json")) {
                        const errorJson = await response.json();
                        errorDetails = errorJson.response || errorJson.message || JSON.stringify(errorJson);
                        
                        if (response.status === 403 || (errorJson.message && errorJson.message.includes('Limit Reached'))) {
                            onLimitReached(); 
                            setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
                            return; 
                        }
                        
                        // 401, 403, 404, 500 오류 또는 메시지에 'API 키' 포함 시 인증 오류로 간주
                        if (response.status === 401 || response.status === 403 || response.status === 404 || response.status === 500 || errorDetails.includes('API 키') || errorDetails.includes('API Key') || response.status === 500) {
                            isAuthError = true;
                            // 404 오류는 API 라우트 경로 문제이므로, 개발자에게 확인하도록 메시지를 변경했습니다.
                            errorDetails = response.status === 404 
                                ? t('errorProcessingRequest', lang) + ` (오류: API 경로를 찾을 수 없음 - ${fullUrl})`
                                : t('errorApiKeyOrServer', lang) || "API 키 문제 또는 서버 오류가 발생했습니다. 키를 확인해 주세요.";
                        }
                        
                        // 400 Bad Request (Missing prompt) 오류 발생 시 로직
                        if (response.status === 400 && errorDetails.includes('Missing prompt')) {
                            // 입력이 비어있었다는 의미이므로, 오류 메시지를 사용자가 이해하기 쉽게 변경합니다.
                            errorDetails = t('input_empty_error', lang) || "입력 내용이 비어있습니다. 질문을 입력해주세요.";
                            isAuthError = false; // API 키 오류가 아님
                        }

                    } else {
                        const textError = await response.text(); 
                        errorDetails = (t('errorApiKeyOrServer', lang) || "API 키 문제 또는 서버 오류가 발생했습니다. 키를 확인해 주세요.") + ` (Status: ${response.status})`;
                        isAuthError = true; 
                        console.error("Non-JSON API Response:", textError);
                    }
                } catch (e) {
                    errorDetails = (t('errorApiKeyOrServer', lang) || "API 키 문제 또는 서버 오류가 발생했습니다. 키를 확인해 주세요.") + ` (Status: ${response.status})`;
                    isAuthError = true; 
                }
                
                // 로딩 메시지 제거 후 오류 메시지 추가
                setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
                setMessages(prev => [...prev, { id: generateId(), content: errorDetails, role: 'assistant', isAuthError: isAuthError, isError: true }]);
                return;
            }

            const data = await response.json();
            
            // 4. 로딩 메시지 제거 후 실제 응답 추가
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
            
            const aiResponseContent = data.response || t('aiAssistantDefaultResponse', lang); 

            setMessages(prev => [...prev, { 
                id: generateId(), 
                content: aiResponseContent, 
                role: 'assistant' 
            }]);
            
            // 5. 성공 시: sermonCount 상태를 1 증가시켜 UI에 반영
            if (data.message === 'Success' && setSermonCount) {
                setSermonCount(prev => prev + 1);
            }

        } catch (error) {
            console.error("AI Assistant API Catch Error:", error.message);
            // 로딩 메시지 제거
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
            // 최종 네트워크/파싱 오류 메시지 추가 (API 키 에러로 처리)
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
        
        // 🚨 [FIX]: 빈 입력 방어 로직 재강화.
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
    
    // 💡 새 함수: Gemini Studio로 이동
    const handleGoToGeminiStudio = () => {
        window.open(GEMINI_STUDIO_URL, '_blank');
    };
    
    // 🚨 [NEW]: 대화 기록을 실제로 삭제하는 로직 (Modal Confirm 시 실행됨)
    const handleClearChat = useCallback(() => {
        setMessages([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
        // 삭제 성공 후 사용자에게 피드백 제공 (옵션)
        // setErrorMessage(t('chatClearedSuccess', lang));
    }, []);

    // 대화 내용 초기화 요청 (Custom Modal 호출)
    const handleClearChatRequest = () => {
        // Modal을 호출하고, 확인 버튼 클릭 시 handleClearChat이 실행되도록 설정
        openModal(handleClearChat);
    }

    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-100 dark:bg-slate-900">
            {/* Header and Back Button */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10 flex justify-between items-center">
                {/* ⬅️ 뒤로가기 버튼: 디자인 개선 */}
                <button 
                    onClick={onGoBack} 
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <svg className="w-6 h-6 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    {t('goBack', lang)} 
                </button>
                {/* 대화 초기화 버튼: 디자인 개선 */}
                <button 
                    onClick={handleClearChatRequest} 
                    className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                >
                    {t('clearChat', lang)}
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages
                    .filter(message => message.content && message.content.trim() !== '') // 💡 메시지 내용이 비어있으면 렌더링하지 않음
                    .map((message) => (
                    <div key={message.id}>
                        <MessageComponent message={message} lang={lang} />
                        
                        {/* 💡 오류 메시지 아래에 '키 확인' 버튼 노출 (API 키 오류로 추정될 때) */}
                    {message.isError && message.isAuthError && ( // isError 플래그 사용
                            <div className="flex justify-center mt-2">
                                <button 
                                    onClick={handleGoToGeminiStudio}
                                    className="px-4 py-2 text-sm bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition shadow-md focus:outline-none focus:ring-4 focus:ring-yellow-500 focus:ring-opacity-50"
                                >
                                    Gemini API 키 확인 / 발급
                                </button>
                            </div>
                        )}
                        
                        {/* 🚨 401 오류 발생 시 로그인 유도 메시지 추가 */}
                        {message.content.includes("API 키 인증에 실패했습니다") && !user && (
                            <div className="text-center mt-2 text-sm text-red-500">
                                {t('loginToUseFeature', lang)} 또는 API 키를 확인하세요.
                            </div>
                        )}
                    </div> // 맵핑된 요소의 닫는 <div> 태그
                ))}
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
                    {/* 전송 버튼: 디자인 개선 */}
                    <button
                        onClick={handleSendClick}
                        disabled={isLoading || !currentInput.trim() || !user} 
                        className={`p-3 rounded-full transition-colors ${
                            isLoading || !currentInput.trim() || !user 
                                ? 'bg-indigo-300 dark:bg-indigo-700/50 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50'
                        }`}
                    >
                        {/* Send Icon */}
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                </div>
                {!user && (
                    <p className="text-xs text-red-500 text-center mt-2">{t('loginToUseFeature', lang)}</p>
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