import React, { useState, useEffect, useCallback, useRef } from 'react';

// DUMMY ID 생성 함수 (인라인 정의)
const generateId = () => Math.random().toString(36).substring(2, 9);

// API 호출 상수 
const CHAT_ENDPOINT = '/api/assistant-chat';
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


// 💡 MessageComponent (마크다운 처리 포함)
const MessageComponent = ({ message, lang }) => { 
    const isUser = message.role === 'user';
    const content = message.content; 
    
    // ReactMarkdown 및 remarkGfm이 없다고 가정하고, 마크다운 처리를 기본 HTML로 대체합니다.
    const renderContent = (text) => {
        if (!text) return null;
        
        let processedText = text;
        
        // 1. 코드 블록 처리 (간단한 백틱 감지)
        if (processedText.includes('```')) {
            // 코드 블록이 있을 경우, 단순 텍스트 처리를 하지 않고 pre 태그로 감싸서 고정폭 폰트와 스타일을 적용합니다.
            return (
                <pre className="whitespace-pre-wrap font-mono p-3 my-2 bg-gray-600 dark:bg-gray-900 rounded-lg overflow-x-auto text-sm text-white">
                    {processedText}
                </pre>
            );
        }

        // 2. 제목 (H3) 처리: '###'을 굵고 크게, 마진을 줍니다.
        processedText = processedText.replace(
            /###\s(.*?)\n/g, 
            '<h3 class="text-lg font-bold mt-4 mb-2 text-indigo-500">$1</h3>'
        );
        
        // 3. 목록 (-) 처리: ul/li 구조로 변경하고 마진을 줍니다.
        processedText = processedText.replace(
            /^\s*-\s(.*?)$/gm, 
            '<li class="mb-1 ml-2 pl-2 list-disc list-inside">$1</li>'
        );
        // 목록이 있다면 ul로 감싸줍니다. (단순 목록만 있다고 가정)
        if (processedText.includes('<li')) {
            processedText = `<ul>${processedText}</ul>`;
        }

        // 4. 볼드 처리: **...**
        processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // 5. 줄 바꿈 처리 (마지막에 적용)
        processedText = processedText.replace(/\n/g, '<br/>');

        // 6. 연속된 <br/>을 하나로 줄임 (과도한 공백 방지)
        processedText = processedText.replace(/(<br\/>\s*){3,}/g, '<br/><br/>');

        // 텍스트만 남아 있을 경우
        return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
    };
    
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            {/* 🚨 AI 메시지 배경색을 밝은 회색으로 변경하여 대비 개선 */}
            <div className={`max-w-[80%] p-4 rounded-xl shadow-lg transition-all duration-300 ${
                isUser 
                    ? 'bg-indigo-600 text-white' // 사용자 메시지 (파랑)
                    : 'bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-100' // AI 메시지 (밝은 배경/짙은 글씨)
            }`}>
                <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                    {renderContent(content)}
                </div>
            </div>
        </div>
    );
};

// 💡 SermonAssistantComponent 정의 (고급 AI 채팅 로직)
const SermonAssistantComponent = ({ 
    user, 
    lang, // 🚨 FIX 1: props로 lang과 t를 명시적으로 받습니다.
    t,    // 🚨 FIX 1: t 함수를 prop으로 받습니다.
    onGoBack, 
    openLoginModal, 
    sermonCount, 
    setSermonCount, 
    onLimitReached,
    userSubscription
}) => {
    
    const [messages, setMessages] = useState([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    // 💡 Custom Modal Hooks 사용
    const { isModalOpen, openModal, closeModal, confirmAction } = useModal();


    // 자동 스크롤 로직
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    // messages 또는 lang이 변경될 때 초기 메시지를 다시 설정해야 하므로 lang을 추가합니다.
    useEffect(scrollToBottom, [messages]); 

    // 컴포넌트 마운트 시 초기 메시지 설정
    useEffect(() => {
        // lang이 변경될 때마다 초기 메시지를 현재 언어로 다시 설정합니다.
        const initialMessage = { 
            id: 'initial', 
            content: t('sermonAssistantInitialDescription', lang), 
            role: 'assistant' 
        };
        
        if (messages.length === 0 || messages[0].id === 'initial') {
            setMessages([initialMessage]);
        }
    }, [lang, t]); // 🚨 lang과 t가 변경될 때마다 초기화되도록 수정

    
    // API 호출 경로 생성
    const getFullPath = () => {
        return `${API_BASE_URL}${CHAT_ENDPOINT}`; 
    }
    
    // API 호출 및 응답 처리
    const handleAiResponse = useCallback(async (userMessage) => {
        // user가 없으면 AI 호출 방지 (UI에서 이미 처리되지만 안전을 위해 유지)
        if (isLoading || !user) return;
        
        setIsLoading(true);

        const fullUrl = getFullPath(); 
        
        // 1. 유저 메시지 및 로딩 메시지 설정
        const newUserMessage = { id: generateId(), content: userMessage, role: 'user' };
        const loadingMessageId = generateId();
        
        // 'initial' 및 'error' 메시지는 히스토리에서 제외하고, 새 메시지를 추가
        const historyForAPI = messages.filter(msg => msg.id !== 'initial' && msg.id !== 'error' && msg.role !== 'error');
        
        setMessages(prev => [
            ...historyForAPI, 
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
                    language_code: lang, // 🚨 FIX 2: AI가 해당 언어로 응답하도록 언어 코드 전달
                    history: historyForAPI, 
                    userId: user.uid,
                    userSubscription: userSubscription,
                    sermonCount: sermonCount 
                }), 
            });

            // 3. 응답 에러 처리 (403/제한 도달 처리 포함)
            if (!response.ok) {
                let errorDetails = t('errorProcessingRequest', lang) || `요청 처리 중 오류 발생 (Status: ${response.status})`;
                let isAuthError = false;
                
                try {
                    const errorJson = await response.json();
                    errorDetails = errorJson.response || errorJson.message || JSON.stringify(errorJson);
                    
                    if (response.status === 403 || (errorJson.message && errorJson.message.includes('Limit Reached'))) {
                        onLimitReached(); // Home.js의 제한 도달 모달 호출
                        setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
                        return; // 모달만 띄우고 종료
                    }
                    
                    if (response.status === 401 || response.status === 403 || errorDetails.includes('API 키')) {
                        isAuthError = true;
                    }
                } catch (e) {
                    errorDetails = (t('errorProcessingRequest', lang) || "서버 또는 키 오류가 발생했습니다.") + ` (Status: ${response.status})`;
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
            
            const aiResponseContent = data.response || t('aiAssistantDefaultResponse', lang); // t 함수는 이제 prop으로 사용

            // 🚨 FIX: 배열 리터럴 닫는 괄호 ']' 추가
            setMessages(prev => [...prev, { 
                id: generateId(), 
                content: aiResponseContent, 
                role: 'assistant' 
            }]);
            
            // 🚨 5. 성공 시: sermonCount 상태를 1 증가시켜 UI에 반영
            if (data.message === 'Success' && setSermonCount) {
                setSermonCount(prev => prev + 1);
            }

        } catch (error) {
            console.error("AI Assistant API Catch Error:", error.message);
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
            setMessages(prev => [...prev, { id: generateId(), content: t('errorProcessingRequest', lang) || "네트워크 오류가 발생했습니다.", role: 'assistant', isAuthError: true, isError: true }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, user, messages, lang, userSubscription, sermonCount, getFullPath, setSermonCount, onLimitReached, t]); // 🚨 t를 의존성 배열에 추가


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
    
    // 대화 내용 초기화 (Custom Modal 호출)
    const handleClearChatRequest = () => {
        // 🚨 FIX 3: confirm() 대신 커스텀 모달 오픈
        openModal(() => {
            setMessages([]);
        });
    }

    // 💡 Custom Modal Component
    const CustomConfirmModal = () => {
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


    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-100 dark:bg-slate-900">
            {/* Header and Back Button */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10 flex justify-between items-center">
                <button onClick={onGoBack} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    {t('goBack', lang)} 
                </button>
                <button onClick={handleClearChatRequest} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition">
                    {t('clearChat', lang)}
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isInitialScreen ? (
                    // ... 초기 화면 로직
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 dark:text-gray-400 min-h-[calc(100vh-180px)]">
                        <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 dark:text-white">
                            {t('sermonAssistantInitialTitle', lang)}
                        </h1>
                        <p className="text-lg mb-8 max-w-lg">
                            {t('sermonAssistantInitialDescription', lang)}
                        </p>
                        
                        <div className="p-8 bg-gray-200 dark:bg-gray-700 rounded-xl shadow-inner max-w-md w-full">
                            <p className="mb-4 font-semibold dark:text-gray-200">{t('askAQuestionToBegin', lang)}</p>
                            <button
                                onClick={() => setMessages(prev => prev.filter(msg => msg.id !== 'initial'))} 
                                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-lg"
                            >
                                {t('startYourSermonConversation', lang)}
                            </button>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id}>
                            <MessageComponent message={message} lang={lang} />
                            
                            {/* 💡 오류 메시지 아래에 '키 확인' 버튼 노출 */}
                            {message.isError && message.isAuthError && ( // isError 플래그 사용
                                <div className="flex justify-center mt-2">
                                    <button 
                                        onClick={handleGoToGeminiStudio}
                                        className="px-4 py-2 text-sm bg-yellow-500 text-gray-900 font-semibold rounded-lg hover:bg-yellow-400 transition shadow-md"
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
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'
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
            {/* Custom Modal Render */}
            <CustomConfirmModal />
        </div>
    );
}

// --------------------------------------------------
// ✅ Default Export로 변경
// --------------------------------------------------
export default SermonAssistantComponent;