// --------------------------------------------------
// 설교 유형별 임시 상세 컴포넌트 (인라인 정의)
// --------------------------------------------------

// DUMMY ID 생성 함수 (인라인 정의)
const generateId = () => Math.random().toString(36).substring(2, 9);

// API 호출 상수 (Next.js 환경에서 사용)
const CHAT_ENDPOINT = '/api/assistant-chat';
const API_BASE_URL = ''; // 상대 경로 사용
const GEMINI_STUDIO_URL = "https://aistudio.google.com/app/apikey";

// 💡 MessageComponent (마크다운 처리 포함)
const MessageComponent = ({ message, lang, onGenerateSermonDraft }) => { 
    const isUser = message.role === 'user';
    const content = message.content; 
    
    // ReactMarkdown 및 remarkGfm이 없다고 가정하고, 마크다운 처리를 기본 HTML로 대체합니다.
    const renderContent = (text) => {
        if (!text) return null;
        let html = text.replace(/\n/g, '<br/>');
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };
    
    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
            <div className={`max-w-[80%] p-3 rounded-xl shadow-md ${
                isUser 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-700 text-gray-100 dark:bg-gray-800 dark:text-gray-100'
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
    lang, 
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
    const messagesEndRef = React.useRef(null);

    // 자동 스크롤 로직
    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(scrollToBottom, [messages]);

    // 컴포넌트 마운트 시 초기 메시지 설정 (t 함수의 임시 번역 사용)
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { id: 'initial', content: t('sermonAssistantInitialDescription', lang) || "안녕하세요! 설교 준비를 도와드릴 AI 어시스턴트입니다. 주제나 구절을 알려주세요.", role: 'assistant' }
            ]);
        }
    }, [messages.length, lang]);
    
    // API 호출 경로 생성
    const getFullPath = () => {
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
        
        // 'initial' 및 'error' 메시지는 히스토리에서 제외하고, 새 메시지를 추가
        const historyForAPI = messages.filter(msg => msg.id !== 'initial' && msg.id !== 'error' && msg.role !== 'error');
        
        setMessages(prev => [
            ...historyForAPI, 
            newUserMessage, 
            { id: loadingMessageId, content: t('aiIsThinking', lang) || "AI가 응답을 생성 중입니다...", role: 'assistant' }
        ]);
        
        // 2. API 호출
        try {
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: userMessage, 
                    language_code: lang, 
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
                
                setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
                setMessages(prev => [...prev, { id: 'error', content: errorDetails, role: 'assistant', isAuthError: isAuthError }]);
                return;
            }

            const data = await response.json();
            
            // 4. 로딩 메시지 제거 후 실제 응답 추가
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
            
            const aiResponseContent = data.response || (t('aiAssistantDefaultResponse', lang) || "답변을 받았습니다.").replace('{message}', userMessage);

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
            setMessages(prev => [...prev, { id: generateId(), content: t('errorProcessingRequest', lang) || "네트워크 오류가 발생했습니다.", role: 'assistant', isAuthError: true }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, user, messages, lang, userSubscription, sermonCount, user.uid, getFullPath, setSermonCount, onLimitReached]);


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
    
    // 대화 내용 초기화
    const handleClearChat = () => {
        if (confirm(t('confirmClearChat', lang) || "대화 내용을 모두 초기화하시겠습니까?")) {
            setMessages([]);
        }
    }


    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-100 dark:bg-slate-900">
            {/* Header and Back Button */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-10 flex justify-between items-center">
                <button onClick={onGoBack} className="flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    {t('goBack', lang) || '뒤로'} 
                </button>
                <button onClick={handleClearChat} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition">
                    {t('clearChat', lang) || '대화 초기화'}
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isInitialScreen ? (
                    // ... 초기 화면 로직 (t 함수의 임시 번역 사용)
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 dark:text-gray-400">
                        <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 dark:text-white">
                            {t('sermonAssistantInitialTitle', lang) || "AI 설교 도우미"}
                        </h1>
                        <p className="text-lg mb-8">
                            {t('sermonAssistantInitialDescription', lang) || "질문을 시작하여 설교 초안을 생성하세요."}
                        </p>
                        
                        <div className="p-8 bg-gray-200 dark:bg-gray-700 rounded-xl shadow-inner max-w-md w-full">
                            <p className="mb-4 font-semibold dark:text-gray-200">{t('askAQuestionToBegin', lang) || "아래 입력창에 주제나 성경 구절을 넣어 시작하세요."}</p>
                            <button
                                onClick={() => setMessages(prev => prev.filter(msg => msg.id !== 'initial'))} 
                                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                            >
                                {t('startYourSermonConversation', lang) || "대화 시작하기"}
                            </button>
                        </div>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id}>
                            <MessageComponent message={message} lang={lang} />
                            
                            {/* 💡 오류 메시지 아래에 '키 확인' 버튼 노출 */}
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
                        placeholder={isLoading ? (t('aiIsThinking', lang) || "생각 중...") : (t('sermonAssistantInputPlaceholder', lang) || "설교 주제나 질문을 입력하세요...")}
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
                        {/* Send Icon */}
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </button>
                </div>
                {!user && (
                    <p className="text-xs text-red-500 text-center mt-2">{t('loginToUseFeature', lang) || '로그인이 필요합니다.'}</p>
                )}
            </div>
        </div>
    );
}
// --------------------------------------------------
// ExpositorySermonComponent, RealLifeSermonComponent 등 나머지 컴포넌트 코드는 유지
// --------------------------------------------------
const ExpositorySermonComponent = ({ onGoBack }) => (
    <div className="w-full min-h-screen bg-white p-12">
        <h2 className="text-3xl font-bold mb-6 text-green-600">📖 강해 설교 (임시)</h2>
        <p className="text-gray-700 mb-8">특정 성경 본문을 심층 분석하여 구조화된 설교를 작성하는 화면입니다.</p>
        <button onClick={onGoBack} className="mt-8 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">{'<< 설교 유형 선택 화면으로 돌아가기'}</button>
    </div>
);

const RealLifeSermonComponent = ({ onGoBack }) => (
    <div className="w-full min-h-screen bg-white p-12">
        <h2 className="text-3xl font-bold mb-6 text-red-600">🍎 삶과 연결된 설교 (임시)</h2>
        <p className="text-gray-700 mb-8">현실적인 삶의 문제와 성경적 해답을 연결하는 설교를 준비하는 화면입니다.</p>
        <button onClick={onGoBack} className="mt-8 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">{'<< 설교 유형 선택 화면으로 돌아가기'}</button>
    </div>
);

const QuickMemoSermonComponent = ({ onGoBack }) => (
    <div className="w-full min-h-screen bg-white p-12">
        <h2 className="text-3xl font-bold mb-6 text-yellow-600">✍️ 빠른 메모 설교 (임시)</h2>
        <p className="text-gray-700 mb-8">떠오른 짧은 영감이나 묵상 메모를 빠르게 설교 형태로 확장하는 화면입니다.</p>
        <button onClick={onGoBack} className="mt-8 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">{'<< 설교 유형 선택 화면으로 돌아가기'}</button>
    </div>
);

const RebirthSermonFeature = ({ onGoBack }) => (
    <div className="w-full min-h-screen bg-white p-12">
        <h2 className="text-3xl font-bold mb-6 text-purple-600">🔄 설교의 재탄생 (임시)</h2>
        <p className="text-gray-700 mb-8">기존 설교 파일을 업로드하여 AI를 통해 재구성하고 업데이트하는 화면입니다.</p>
        <button onClick={onGoBack} className="mt-8 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition">{'<< 설교 유형 선택 화면으로 돌아가기'}</button>
    </div>
);

const PremiumSubscriptionPage = ({ onGoBack }) => (
    <div className="w-full min-h-screen bg-gray-50 p-12 flex flex-col items-center">
        <div className="max-w-xl text-center bg-white p-10 rounded-xl shadow-2xl border-t-4 border-yellow-500">
            <h2 className="text-4xl font-extrabold mb-4 text-yellow-700">👑 프리미엄으로 업그레이드 (임시)</h2>
            <p className="text-lg text-gray-700 mb-6">프리미엄 구독을 통해 모든 기능을 무제한으로 사용하세요.</p>
            <button className="w-full px-8 py-3 bg-yellow-500 text-white text-xl font-bold rounded-lg hover:bg-yellow-600 transition transform hover:scale-105">
                지금 프리미엄 시작하기
            </button>
            <button 
                onClick={onGoBack} 
                className="mt-6 text-sm text-gray-500 hover:text-gray-800 transition"
            >
                {'<< 설교 유형 선택 화면으로 돌아가기'}
            </button>
        </div>
    </div>
);