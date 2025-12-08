import React, { useState, useEffect, useCallback, useRef } from 'react';
// 아이콘 컴포넌트 경로에 맞게 수정하세요.
import { LoadingSpinner, ChatIcon, CloseIcon } from '@/components/IconComponents.js'; 

const CopilotPanel = ({
    isOpen, onClose, userId, t, lang, setLang, languageOptions, 
    handleAPICall, setErrorMessage, 
    sermonCount, sermonLimit, userSubscription, openLoginModal
}) => {
    
    // --- 1. 상태 관리 ---
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    // RAG 기반 Q&A 전용 엔드포인트 (백엔드 구현 예정)
    const API_ENDPOINT_QA = '/api/sermon-copilot-qa';
    const isFreeTier = userSubscription === 'free';
    const isLimit = sermonCount >= sermonLimit;
    const canAskQuestion = !isLimit || !isFreeTier; 

    // --- 2. 이펙트 및 스크롤 ---
    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    // 언어 변경 핸들러
    const handleLangChange = useCallback((e) => {
        // 부모 컴포넌트(app/page.js)의 setLang 함수를 호출하여 언어 상태를 업데이트합니다.
        setLang(e.target.value);
    }, [setLang]);


    // --- 3. API 호출 핸들러 (RAG 로직 실행) ---
    const handleSendMessage = useCallback(async (text) => {
        if (!userId) {
            openLoginModal();
            return;
        }
        if (!text.trim() || isLoading) return;
        
        if (!canAskQuestion) {
             setMessages(prev => [...prev, { 
                 role: 'assistant', 
                 content: t('limitModalDescription'), 
                 timestamp: new Date() 
             }]);
             return;
        }

        const userMessage = { role: 'user', content: text, timestamp: new Date() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // handleAPICall은 HomeContent에서 전달받은 공통 함수입니다.
            const responseText = await handleAPICall(
                text, 
                API_ENDPOINT_QA, 
                'qa-copilot' 
            );

            if (responseText) {
                const aiMessage = { role: 'assistant', content: responseText, timestamp: new Date() };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                 setErrorMessage(t('errorProcessingRequest', lang) + ': API returned null response.'); 
            }
        } catch (error) {
            setErrorMessage(t('errorProcessingRequest', lang) + ': ' + error.message); 
        } finally {
            setIsLoading(false);
        }
    // 의존성 배열에 lang을 추가하여 t 함수가 최신 언어 상태를 사용하도록 합니다.
    }, [userId, isLoading, handleAPICall, openLoginModal, setErrorMessage, t, canAskQuestion, sermonCount, sermonLimit, lang]);


    // --- 4. 렌더링 (사이드 패널 UI) ---
    return (
        <div 
            className={`fixed top-0 right-0 h-full w-full md:w-[400px] shadow-2xl bg-white dark:bg-gray-800 transition-transform duration-500 ease-in-out z-[100] ${
                isOpen ? 'translate-x-0' : 'translate-x-full' 
            } flex flex-col`}
            aria-hidden={!isOpen}
        >
            {/* 헤더 */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    {/* ChatIcon이 없다면 💬 텍스트를 사용하세요 */}
                    <ChatIcon className="w-6 h-6 mr-2 text-red-500" /> 
                    <h2 className="text-xl font-bold">{t('copilotAssistant', lang)}</h2> 
                </div>
                
                {/* 언어 선택 드롭다운 */}
                <div className="flex items-center space-x-2">
                    <select 
                        value={lang} 
                        onChange={handleLangChange} 
                        className="p-1 border text-sm rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-red-500 focus:border-red-500"
                    >
                        {languageOptions.map(option => (
                            <option key={option.code} value={option.code}>
                                {t(option.nameKey, lang)}
                            </option>
                        ))}
                    </select>
                    
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <CloseIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" /> 
                    </button>
                </div>
            </div>

            {/* 채팅 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {messages.length === 0 && (
                     <div className="bg-red-50 dark:bg-red-900/50 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                         <p className="font-semibold mb-1">{t('copilotAssistant', lang)}</p> 
                         <p>{t('copilotDesc', lang)}</p> 
                     </div>
                 )}

                {/* 메시지 렌더링 */}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl shadow-sm text-sm ${
                            msg.role === 'user' 
                                ? 'bg-red-600 text-white' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {/* 로딩 표시 */}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-xl shadow-sm">
                            <LoadingSpinner message={t('aiIsThinking', lang)} /> 
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* 입력창 영역 */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                        placeholder={t('copilotInputPlaceholder', lang) || "질문을 입력하세요..."} 
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-red-500 dark:bg-gray-700 dark:text-gray-100"
                        disabled={isLoading || !canAskQuestion}
                    />
                    <button
                        onClick={() => handleSendMessage(input)}
                        className={`px-4 py-2 rounded-lg text-white transition text-sm ${
                            isLoading || !input.trim() || !canAskQuestion
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-red-600 hover:bg-red-700'
                        }`}
                        disabled={isLoading || !input.trim() || !canAskQuestion}
                    >
                        {t('start', lang)} 
                    </button>
                </div>
                 {isLimit && <p className="text-red-500 text-xs mt-1">{t('limitReached', lang)}: {t('limitModalDescription', lang)}</p>} 
            </div>
        </div>
    );
};

export default CopilotPanel;