'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Send, LogOut, Trash2, ArrowLeft, Loader2, MessageSquare } from 'lucide-react'; 
// 🚨 직접 Gemini 호출을 위한 라이브러리 추가
import { GoogleGenerativeAI } from "@google/generative-ai";

const generateId = () => Math.random().toString(36).substring(2, 9);
const STORAGE_KEY = 'sermonAssistantChatHistory'; 

// ---------------------------------------------------------
// 2. Custom Hooks
// ---------------------------------------------------------
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
        if (modalAction) modalAction();
        closeModal();
    };

    return { isModalOpen, openModal, closeModal, confirmAction };
};

// ---------------------------------------------------------
// 3. UI 컴포넌트
// ---------------------------------------------------------
const CustomConfirmModal = ({ isModalOpen, closeModal, confirmAction, t, lang }) => {
    if (!isModalOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-2xl max-w-sm w-full">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('confirmClearChat', lang)}</h3>
                <div className="flex justify-end space-x-3">
                    <button onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition">취소</button>
                    <button onClick={confirmAction} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition">삭제</button>
                </div>
            </div>
        </div>
    );
};

const MessageComponent = ({ message, lang }) => { 
    const isUser = message.role === 'user';
    const content = message.content; 
    
    const renderContent = (text) => {
        if (!text) return null;
        let processedText = text
            .replace(/###\s(.*?)\n/g, '<h3 class="text-lg font-bold mt-4 mb-2 text-indigo-400">$1</h3>')
            .replace(/^\s*-\s(.*?)$/gm, '<li class="mb-1 ml-2 list-disc list-inside">$1</li>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br/>');
        return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
    };
    
    const messageClasses = message.isError 
        ? 'bg-red-100 text-red-800' 
        : (isUser ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-md');
            
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
            {!isUser && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center mr-3 text-white flex-shrink-0">🤖</div>}
            <div className={`max-w-[75%] p-4 rounded-xl ${messageClasses} ${isUser ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                <div className="text-sm leading-relaxed">{renderContent(content)}</div>
            </div>
            {isUser && <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center ml-3 text-white flex-shrink-0">👤</div>}
        </div>
    );
};

// ---------------------------------------------------------
// 4. 메인 컴포넌트
// ---------------------------------------------------------
const SermonAssistantComponent = ({ 
    user, lang, t, onGoBack, openLoginModal, 
    commentaryCount = 0, limit = 50, handleLogout, refreshUserData 
}) => {
    const [messages, setMessages] = useState([]);
    const [currentInput, setCurrentInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { isModalOpen, openModal, closeModal, confirmAction } = useModal();

    useEffect(() => {
        const savedHistory = localStorage.getItem(STORAGE_KEY);
        if (savedHistory) {
            try { setMessages(JSON.parse(savedHistory)); } catch (e) { setMessages([]); }
        } else {
            setMessages([{ 
                id: 'initial', 
                content: t('sermonAssistantInitialDescription', lang) || "안녕하세요! 설교 준비를 돕는 AI입니다.", 
                role: 'assistant' 
            }]);
        }
    }, [lang, t]);

    useEffect(() => {
        if (messages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    const handleClearChat = useCallback(() => {
        const initialMsg = [{ 
            id: 'initial', 
            content: t('sermonAssistantInitialDescription', lang), 
            role: 'assistant' 
        }];
        setMessages(initialMsg);
        localStorage.removeItem(STORAGE_KEY);
    }, [lang, t]);

    // 🚨 [핵심 수정] Gemini 직접 호출 로직 (서버 API 대체)
    const handleAiResponse = useCallback(async (userMessage) => {
        if (isLoading || !user) return;
        setIsLoading(true);

        const newUserMessage = { id: generateId(), content: userMessage, role: 'user' };
        const loadingId = generateId();
        
        setMessages(prev => [...prev.filter(m => m.id !== 'initial'), newUserMessage, { id: loadingId, content: "답변 생성 중...", role: 'assistant' }]);
        
        try {
            // 환경변수에서 API 키 로드 (NEXT_PUBLIC_ 접두사 확인 필수)
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            
            // 모델 설정: gemini-1.5-flash
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            // 시스템 지시문 구성
            const targetLang = lang === 'en' ? 'English' : 'Korean';
            const chatHistory = messages.slice(-4).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
            
           const systemPrompt = `당신은 '말씀으로 세상을 통하게 하는 [통(通)하는 전파] 말씀노트'의 전문 설교 어시스턴트입니다. 목회자의 설교 준비를 돕기 위해 성경에 근거한 깊이 있는 통찰을 ${targetLang}으로 제공하세요.\n\n이전 대화 내역:\n${chatHistory}`;

            const result = await model.generateContent(`${systemPrompt}\n\nUser Request: ${userMessage}`);
            const response = await result.response;
            const aiContent = response.text();

            setMessages(prev => prev.filter(msg => msg.id !== loadingId));
            setMessages(prev => [...prev, { id: generateId(), content: aiContent, role: 'assistant' }]);

            if (refreshUserData) await refreshUserData();
        } catch (error) {
            console.error("Gemini Error:", error);
            setMessages(prev => prev.filter(msg => msg.id !== loadingId));
            setMessages(prev => [...prev, { id: generateId(), content: "응답 생성 중 오류가 발생했습니다. API 키나 네트워크를 확인하세요.", role: 'assistant', isError: true }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, user, messages, lang, refreshUserData]);

    const handleSendClick = () => {
        if (!user) { openLoginModal(); return; }
        const input = currentInput.trim();
        if (input && !isLoading) {
            setCurrentInput('');
            handleAiResponse(input);
        }
    };

    return (
        <div className="flex flex-col h-screen max-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="p-4 bg-white dark:bg-gray-800 border-b flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onGoBack} className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
                    <h1 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-white"><MessageSquare className="w-5 h-5 text-indigo-500" /> Sermon Assistant</h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-red-600 bg-red-50 px-4 py-1.5 rounded-full border border-red-100">
                        {t('commentaryLimit', String(limit - commentaryCount))}
                    </div>
                    <button onClick={() => openModal(handleClearChat)} className="p-2 text-gray-400 hover:text-red-500 transition" title="대화 삭제"><Trash2 className="w-5 h-5" /></button>
                    {handleLogout && <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 transition"><LogOut className="w-5 h-5" /></button>}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div className="max-w-3xl mx-auto">
                    {messages.map((message) => <MessageComponent key={message.id} message={message} lang={lang} />)}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <footer className="p-4 bg-white dark:bg-gray-800 border-t shadow-2xl">
                <div className="max-w-3xl mx-auto flex items-center space-x-3">
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendClick()}
                        placeholder={isLoading ? "응답 생성 중..." : "주제나 성경 구절을 입력하세요."}
                        disabled={isLoading || !user}
                        className="flex-1 p-3 rounded-xl bg-gray-100 dark:bg-gray-700 border outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-white"
                    />
                    <button
                        onClick={handleSendClick}
                        disabled={isLoading || !currentInput.trim()}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </footer>

            <CustomConfirmModal isModalOpen={isModalOpen} closeModal={closeModal} confirmAction={confirmAction} t={t} lang={lang} />
        </div>
    );
};

export default SermonAssistantComponent;