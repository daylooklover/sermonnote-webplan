// src/components/CopilotPanel.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LoadingSpinner, CloseIcon } from '@/components/IconComponents.js'; // CloseIcon은 IconComponents.js에 추가했다고 가정
import Image from 'next/image'; // Next.js 환경이라면 Image 사용

const CopilotPanel = ({
    isOpen, onClose, userId, t, lang, handleAPICall, setErrorMessage, 
    sermonCount, sermonLimit, userSubscription, openLoginModal
}) => {
    
    // --- 1. 상태 관리 ---
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    
    // RAG 기반 Q&A 전용 엔드포인트 가정
    const API_ENDPOINT_QA = '/api/sermon-copilot-qa';
    const isFreeTier = userSubscription === 'free';
    const isLimit = sermonCount >= sermonLimit;
    // ⚠️ Q&A 카운트는 HomeContent에서 별도로 관리해야 하지만, 여기서는 sermonLimit을 임시 사용합니다.
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

    // --- 3. API 호출 핸들러 (RAG 로직 실행) ---
    const handleSendMessage = useCallback(async (text) => {
        if (!userId) {
            openLoginModal();
            return;
        }
        if (!text.trim() || isLoading) return;
        
        // 🚨 사용량 제한 체크 (프리미엄이 아니면서, 한도 초과 시)
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
            const responseText = await handleAPICall(
                text, 
                API_ENDPOINT_QA, 
                'qa-copilot' // Q&A 전용 사용량 타입
            );

            if (responseText) {
                const aiMessage = { role: 'assistant', content: responseText, timestamp: new Date() };
                setMessages(prev => [...prev, aiMessage]);
            } else {
                 setErrorMessage(t('errorProcessingRequest') + ': API returned null response.');
            }
        } catch (error) {
            setErrorMessage(t('errorProcessingRequest') + ': ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [userId, isLoading, handleAPICall, openLoginModal, setErrorMessage, t, canAskQuestion]);


    // --- 4. 렌더링 (사이드 패널 UI) ---
    return (
        <div 
            className={`fixed top-0 right-0 h-full w-full md:w-[400px] shadow-2xl bg-white dark:bg-gray-800 transition-transform duration-500 ease-in-out z-[100] ${
                isOpen ? 'translate-x-0' : 'translate-x-full' // 👈 핵심 슬라이드 로직
            } flex flex-col`}
            aria-hidden={!isOpen}
        >
            {/* 헤더 */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                    {/* 임시 로고 아이콘 */}
                    <div className="w-6 h-6 mr-2 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">AI</div>
                    <h2 className="text-xl font-bold">{t('copilotAssistant')}</h2>
                </div>
                
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    {/* CloseIcon은 X 모양 아이콘이라고 가정 */}
                    <CloseIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" /> 
                </button>
            </div>

            {/* 채팅 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 {/* 초기 안내 메시지 (생략) */}
                 {messages.length === 0 && (
                    <div className="bg-red-50 dark:bg-red-900/50 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                        <p className="font-semibold mb-1">{t('copilotAssistant')}</p>
                        <p>{t('copilotDesc')}</p>
                    </div>
                )}

                {/* 메시지 렌더링 (이전 답변의 로직 재사용) */}
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
                            <LoadingSpinner message={t('aiIsThinking')} />
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
                        placeholder={t('copilotInputPlaceholder') || "질문을 입력하세요..."}
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
                 {isLimit && <p className="text-red-500 text-xs mt-1">{t('limitReached')}: {t('limitModalDescription')}</p>}
            </div>
        </div>
    );
};

export default CopilotPanel;