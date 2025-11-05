'use client';

import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app'; 
import { getAuth, onAuthStateChanged, signInWithCustomToken, signInAnonymously, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; 

// --------------------------------------------------
// 💡 FIREBASE CONTEXT & AUTH HOOK DEFINITIONS (유지)
// --------------------------------------------------

// 🚨 중요: 전역 변수를 사용하여 환경 설정 가져오기 및 Fallback 추가
const firebaseConfig = (typeof __firebase_config !== 'undefined' && __firebase_config) 
    ? JSON.parse(__firebase_config) 
    // 👇 FAKE_API_KEY를 실제 유효한 Firebase API 키로 교체해야 합니다.
    : { 
        apiKey: "AIzaSyCpnQe0avt9Rzt69xScI43MyyXxslt6Ff8", // 👈 유효한 키
        authDomain: "sermonnote-live.firebaseapp.com", 
        databaseURL: "https://sermonnote-live-default-rtdb.firebaseio.com",
        projectId: "sermonnote-live",
        storageBucket: "sermonnote-live.firebasestorage.app",
        messagingSenderId: "520754190508",
        appId: "1:520754190508:web:e72b48c3b493d2e63ee709",
        measurementId: "G-FC7PKSSDP3"
    }; 
    
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// 1. Context 생성
const AuthContext = createContext({
    user: null,
    loading: true,
    auth: null,
    db: null,
    authError: null,
});

// 2. AuthProvider 컴포넌트
const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authInstance, setAuthInstance] = useState(null);
    const [dbInstance, setDbInstance] = useState(null);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        if (!firebaseConfig.apiKey || Object.keys(firebaseConfig).length === 0) {
            console.error("Firebase Config is missing the API Key or is empty.");
            setAuthError("Firebase 설정 정보가 누락되었습니다. (API Key 확인 필요)");
            setLoading(false);
            return;
        }

        let app;
        if (getApps().length) {
            app = getApp(); 
        } else {
            app = initializeApp(firebaseConfig);
        }

        const auth = getAuth(app);
        const db = getFirestore(app);
        
        setAuthInstance(auth);
        setDbInstance(db);
        
        let unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            console.log("Auth initialized. User:", currentUser ? currentUser.uid : "Anonymous/None");
        });

        const signInUser = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Firebase Authentication Error during sign-in:", error);
                setAuthError(`로그인 오류: ${error.message}`);
                setLoading(false); 
            }
        };

        signInUser();
        
        return () => unsubscribeAuth();
    }, []); 

    const value = {
        user,
        loading,
        auth: authInstance,
        db: dbInstance,
        authError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// 3. useAuth 커스텀 훅
const useAuth = () => {
    return useContext(AuthContext);
};

// --------------------------------------------------
// 상수 및 번역 헬퍼 (t) 정의 유지 (유지)
// --------------------------------------------------
const HERO_BG_COLOR = '#0f1a30'; 
const BACKGROUND_IMAGE_URL = '/images/background.jpg'; 
const featureItems = [
    { icon: '⚡', title: 'AI 기반, 5배 빠른 설교 완성', summary: 'AI 분석, 초안 작성, 내용 구성까지 시가 초과된 단계까지 초안 작성을 보장하며 시간을 절약합니다.' },
    { icon: '🧠', title: '나만의 설교 스타일 학습 AI', summary: '사용자의 과거 설교 스타일, 어휘, 신학적 관점을 학습하여 목사님만의 개성이 담긴 맞교 초안을 완성합니다.' },
    { icon: '🌍', title: '글로벌 선교를 위한 맞춤형 언어 지원', summary: '영어, 한국어는 물론, 중국어, 러시아어, 베트남어 등 주요 선교 지역 언어로 설교를 생성 및 편집할 수 있습니다.' },
    { icon: '💰', title: '목회 사역을 위한 현명한 투자', summary: 'SermonNote는 단순한 지출이 아닌, 효과적인 사역을 위한 핵심 투자입니다.' },
    { icon: '✍️', title: '영감 보존, 묵상 심화 촉진', summary: '떠오르는 영감을 놓치지 않고 메모하며, 설교 묵상 단계를 체계적으로 심화합니다.' },
    { icon: '🗂️', title: '체계적인 설교 자료 연구 관리', summary: '생성된 모든 설교, 묵상, 노트, 참고 자료를 자동으로 분류하고 정리하여 쉽게 검색하고 재사용합니다.' },
];
const languageOptions = [
    { code: 'ko', nameKey: 'lang_ko' },
    { code: 'en', nameKey: 'lang_en' },
    { code: 'zh', nameKey: 'lang_zh' },
];
const translations = {
    ko: {
        lang_ko: '한국어', lang_en: '영어', lang_zh: '중국어', lang_ru: '러시아어', lang_vi: '베트남어',
        welcome: '환영합니다', logout: '로그아웃', login: '로그인', user: '사용자',
        loadingAuth: '인증 확인 중...',
        selectSermonType: '설교 유형을 선택해 주세요.',
        landingSubtitle: '신앙을 깊게 하고, 통찰력을 정리하세요.',
        start: '시작하기',
        chooseSermonType: '설교 유형 선택',
        chooseSermonTypeDescription: '가장 적합한 설교 유형을 선택하여 말씀 준비를 시작하세요.',
        sermonAssistant: '설교 AI 어시스턴트',
        expositorySermon: '강해 설교',
        realLifeSermon: '삶과 연결된 설교',
        quickMemoSermon: '빠른 메모 설교',
        rebirthSermon: '설교의 재탄생',
        upgradeToPremium: '프리미엄으로 업그레이드',
        limitModalTitle: '무료 사용 한도 도달',
        limitModalDescription: 'AI 설교 초안 생성 횟수 제한에 도달했습니다. 무제한 사용을 위해 프리미엄으로 업그레이드하세요.',
        upgradeButton: '프리미엄 구독',
        closeButton: '닫기',
        goBack: '뒤로',
        clearChat: '대화 초기화',
        sermonAssistantInitialTitle: "AI 설교 도우미",
        sermonAssistantInitialDescription: "질문을 시작하여 설교 초안을 생성하세요.",
        askAQuestionToBegin: "아래 입력창에 주제나 성경 구절을 넣어 시작하세요.",
        startYourSermonConversation: "대화 시작하기",
        aiIsThinking: "AI가 응답을 생성 중입니다...",
        sermonAssistantInputPlaceholder: "설교 주제나 질문을 입력하세요...",
        loginToUseFeature: '로그인이 필요합니다.',
        confirmClearChat: "대화 내용을 모두 초기화하시겠습니까?",
        errorProcessingRequest: "요청 처리 중 오류 발생",
        aiAssistantDefaultResponse: "답변을 받았습니다.",
    },
    en: {
        lang_ko: 'Korean', lang_en: 'English', lang_zh: 'Chinese', lang_ru: 'Russian', lang_vi: 'Vietnamese',
        welcome: 'Welcome', logout: 'Logout', login: 'Login', user: 'User',
        loadingAuth: 'Checking Authentication...',
        selectSermonType: 'Please select sermon type.',
        landingSubtitle: 'Deepen your faith and organize your insights.',
        start: 'Get Started',
        chooseSermonType: 'Choose Sermon Type',
        chooseSermonTypeDescription: 'Select the most suitable sermon type to begin preparing the word.',
        sermonAssistant: 'AI Sermon Assistant',
        expositorySermon: 'Expository Sermon',
        realLifeSermon: 'Real-Life Sermon',
        quickMemoSermon: 'Quick Memo Sermon',
        rebirthSermon: 'Sermon Rebirth',
        upgradeToPremium: 'Upgrade to Premium',
        limitModalTitle: 'Free Usage Limit Reached',
        limitModalDescription: 'You have reached the free limit for AI sermon draft generation. Upgrade to Premium for unlimited use.',
        upgradeButton: 'Subscribe to Premium',
        closeButton: 'Close',
        goBack: 'Back',
        clearChat: 'Clear Chat',
        sermonAssistantInitialTitle: "AI Sermon Assistant",
        sermonAssistantInitialDescription: "Start asking questions to generate your sermon draft.",
        askAQuestionToBegin: "Enter your topic or scripture below to begin.",
        startYourSermonConversation: "Start Conversation",
        aiIsThinking: "AI is thinking...",
        sermonAssistantInputPlaceholder: "Enter your sermon topic or question...",
        loginToUseFeature: 'Login is required.',
        confirmClearChat: "Are you sure you want to clear all messages?",
        errorProcessingRequest: "Error processing request",
        aiAssistantDefaultResponse: "Received response.",
    }
};
const t = (key, lang = 'ko') => translations[lang]?.[key] || translations['ko'][key] || key;


// --------------------------------------------------
// ✅ 헬퍼 및 UI 컴포넌트 인라인 정의 (모두 HomeContent 앞에 배치)
// --------------------------------------------------

const LoadingSpinner = ({ message = '로딩 중...' }) => (
    <div className="flex flex-col items-center justify-center p-4">
        <svg className="animate-spin h-8 w-8 text-red-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm font-medium text-gray-700">{message}</p>
    </div>
);

const LoginModal = ({ onClose, onLoginSuccess }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-75">
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full text-center">
            <h3 className="text-xl font-bold mb-4">로그인 필요</h3>
            <p className="mb-6 text-gray-600">
                실제 서비스에서는 여기에서 이메일/소셜 로그인을 진행합니다.
            </p>
            <button 
                onClick={onLoginSuccess}
                className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
            >
                로그인 진행 (시뮬레이션)
            </button>
        </div>
    </div>
);

const LimitReachedModal = ({ onClose, lang, onGoToUpgrade }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-75">
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full text-center">
            <h3 className="text-2xl font-bold mb-4 text-red-600">🚨 {t('limitModalTitle', lang)}</h3>
            <p className="mb-6 text-gray-600">
                {t('limitModalDescription', lang)}
            </p>
            <button 
                onClick={onGoToUpgrade}
                className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition mb-3"
            >
                {t('upgradeButton', lang)}
            </button>
            <button 
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
            >
                {t('closeButton', lang)}
            </button>
        </div>
    </div>
);

// 아이콘 컴포넌트 인라인 정의 (유지)
const PlusCircleIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const BibleIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25V4.5m-8.69 4.31l1.77 1.77M18 10.5h4.5m-5.69 5.69l1.77 1.77M12 21.75V19.5m-8.69-4.31l1.77-1.77M18 13.5h4.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>);
const RealLifeIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75v.008m-7.5 0v.008m7.5 0h-7.5m7.5 0h-7.5m7.5 0v11.25m-7.5-11.25v11.25m7.5 0h-7.5m7.5 0h-7.5m0 0v1.5m7.5-1.5v1.5m0 0h-7.5m7.5 0h-7.5m0 0H6.5a2.25 2.25 0 00-2.25 2.25v.5m17.5-3.5a2.25 2.25 0 00-2.25-2.25H6.5a2.25 2.25 0 00-2.25 2.25v.5m17.5-3.5v.5m-15.75 3.5a2.25 2.25 0 00-2.25 2.25v.5m-1.5-2.75v.5" /></svg>);
const QuickMemoIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);
const RebirthIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.648v-4.992h-.001M19.648 2.985H14.656m-4.63 1.965-2.864 2.864m2.864 2.864L14.656 19.648M19.648 14.656v4.992h-.001M2.985 9.348H7.977" /></svg>);
const PremiumIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.109a.562.562 0 00.475.345l5.518.442a.563.563 0 01.322.99l-4.267 3.896a.562.562 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.6l-4.725-2.885a.562.562 0 00-.586 0L6.974 19.53a.562.562 0 01-.84-.6l1.285-5.386a.562.562 0 00-.182-.557L3.99 10.38a.562.562 0 01.322-.99l5.518-.442a.562.562 0 00.475-.345l2.125-5.11z" /></svg>);


// --------------------------------------------------
// ⭐️ RenderLandingPage 정의 (HomeContent보다 위로 이동)
// --------------------------------------------------
const RenderLandingPage = ({ onGetStarted, lang, t }) => {
    // HeroSection, FeaturesSection 정의는 코드 길이상 생략하고 리턴 구문만 유지
    const HeroSection = () => (
        <div 
            className="relative w-full min-h-screen flex flex-col items-center justify-center text-white overflow-hidden mt-[-64px]" 
            style={{ 
                backgroundColor: HERO_BG_COLOR, 
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${BACKGROUND_IMAGE_URL}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="absolute inset-0 bg-black opacity-30"></div> 
            <div className="relative text-center max-w-4xl p-8 z-10 pt-[64px]">
                <h1 style={{ fontSize: '7rem', lineHeight: '1.1', fontWeight: 800 }} className="mb-4 drop-shadow-lg">SermonNote</h1>
                <p className="text-xl md:text-2xl font-light mb-8 drop-shadow-md">{t('landingSubtitle', lang)}</p>
                <button onClick={onGetStarted} type="button" className="px-10 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-red-700 transition transform hover:scale-105">{t('start', lang)}</button>
            </div>
        </div>
    );
    const FeaturesSection = () => (
        <div className="w-full bg-white py-16 px-8">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-800 mb-12 border-b-2 border-red-500 pb-2">SermonNote가 목회자님께 드리는 혁신적인 혜택</h2>
                <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">바쁜 일상 속에서 깊이 있는 설교를 준비하는 것은 쉽지 않습니다. SermonNote는 최첨단 AI 기술을 활용하여 목회자님의 시간을 절약하고, 더욱 풍성한 말씀으로 성도들을 양육할 수 있도록 돕습니다. 개인 맞춤형 설교 생성부터 전문 연구 관리까지, 모든 과정을 스마트하게 지원합니다.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {featureItems.map((item, index) => (<div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition hover:shadow-2xl flex flex-col h-full"><div className="4xl mb-4 text-red-500">{item.icon}</div><h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3><p className="text-gray-600 text-sm flex-1">{item.summary}</p></div>))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-full flex flex-col items-center">
            <HeroSection />
            <FeaturesSection />
        </div>
    );
};


// --------------------------------------------------
// 설교 유형 선택 컴포넌트 (SermonSelection) - 인라인 정의 (유지)
// --------------------------------------------------
const SermonSelection = ({ 
    user, 
    setSelectedSermonType, 
    openLoginModal, 
    onGoToLanding, 
    lang, 
}) => {
    const [sermonTypes, setSermonTypes] = useState(null);

    useEffect(() => {
        const types = [
            { type: 'ai-assistant-sermon', title: t('sermonAssistant', lang), description: 'AI 어시스턴트가 주제, 성경 구절에 맞춰 완벽한 설교를 초안합니다.', icon: <PlusCircleIcon className="w-10 h-10 text-blue-500" /> },
            { type: 'expository-sermon', title: t('expositorySermon', lang), description: '성경 본문을 깊이 있게 분석하고 구조화하여 강해 설교를 작성합니다.', icon: <BibleIcon className="w-10 h-10 text-green-500" /> },
            { type: 'real-life-sermon', title: t('realLifeSermon', lang), description: '현대 사회 이슈나 삶의 고민에 연결된 실생활 적용 설교를 만듭니다.', icon: <RealLifeIcon className="w-10 h-10 text-red-500" /> },
            { type: 'quick-memo-sermon', title: t('quickMemoSermon', lang), description: '짧은 영감, 묵상 노트에서 확장된 설교를 빠르고 쉽게 만듭니다.', icon: <QuickMemoIcon className="w-10 h-10 text-yellow-500" /> },
            { type: 'rebirth-sermon', title: t('rebirthSermon', lang), description: '과거 설교 자료를 업로드하여 AI로 재구성하고 최신 스타일로 바꿉니다.', icon: <RebirthIcon className="w-10 h-10 text-purple-500" /> },
            { type: 'premium-upgrade', title: t('upgradeToPremium', lang), description: '프리미엄 구독을 통해 모든 기능을 무제한으로 사용하세요.', icon: <PremiumIcon className="w-10 h-10 text-yellow-600" /> }
        ];
        setSermonTypes(types);
    }, [lang]); 

    if (!sermonTypes) {
        return <div className="text-center p-8">로딩 중...</div>;
    }
    
    return (
        <div className="w-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans min-h-screen pt-16">
            <main className="text-center space-y-8 p-8 max-w-7xl mx-auto">
                <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
                    {t('chooseSermonType', lang)}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    {t('chooseSermonTypeDescription', lang)}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {sermonTypes.map(sermon => {
                        const handleClick = () => {
                            if (!user && sermon.type !== 'premium-upgrade') { openLoginModal(); } 
                            else { setSelectedSermonType(sermon.type); }
                        };
                        
                        return (
                            <button
                                key={sermon.type}
                                onClick={handleClick}
                                className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 text-left"
                            >
                                <div className="mb-4">{sermon.icon}</div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{sermon.title}</h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{sermon.description}</p>
                            </button>
                        );
                    })}
                </div>
            </main>
            <div className="text-center pb-8">
                <button 
                    onClick={onGoToLanding} 
                    className="mt-6 text-sm text-gray-500 hover:text-gray-800 transition"
                >
                    {'<< 초기 화면으로 돌아가기'}
                </button>
            </div>
        </div>
    );
};

// --------------------------------------------------
// ⭐️ AI 채팅 로직으로 대체된 SermonAssistantComponent (유지)
// --------------------------------------------------
const generateId = () => Math.random().toString(36).substring(2, 9);
const CHAT_ENDPOINT = '/api/assistant-chat';
const API_BASE_URL = ''; 
const GEMINI_STUDIO_URL = "https://aistudio.google.com/app/apikey";

const MessageComponent = ({ message, lang, onGenerateSermonDraft }) => { 
    const isUser = message.role === 'user';
    const content = message.content; 
    
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
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (messages.length === 0) {
            setMessages([
                { id: 'initial', content: t('sermonAssistantInitialDescription', lang) || "안녕하세요! 설교 준비를 도와드릴 AI 어시스턴트입니다. 주제나 구절을 알려주세요.", role: 'assistant' }
            ]);
        }
    }, [messages.length, lang]);
    
    const getFullPath = () => {
        return `${API_BASE_URL}${CHAT_ENDPOINT}`; 
    }
    
    const handleAiResponse = useCallback(async (userMessage) => {
        if (isLoading || !user) return;
        
        setIsLoading(true);

        const fullUrl = getFullPath(); 
        
        const newUserMessage = { id: generateId(), content: userMessage, role: 'user' };
        const loadingMessageId = generateId();
        
        const historyForAPI = messages.filter(msg => msg.id !== 'initial' && msg.id !== 'error' && msg.role !== 'error');
        
        setMessages(prev => [
            ...historyForAPI, 
            newUserMessage, 
            { id: loadingMessageId, content: t('aiIsThinking', lang) || "AI가 응답을 생성 중입니다...", role: 'assistant' }
        ]);
        
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

            if (!response.ok) {
                let errorDetails = t('errorProcessingRequest', lang) || `요청 처리 중 오류 발생 (Status: ${response.status})`;
                let isAuthError = false;
                
                try {
                    const errorJson = await response.json();
                    errorDetails = errorJson.response || errorJson.message || JSON.stringify(errorJson);
                    
                    if (response.status === 403 || (errorJson.message && errorJson.message.includes('Limit Reached'))) {
                        onLimitReached(); 
                        setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
                        return; 
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
            
            setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
            
            const aiResponseContent = data.response || (t('aiAssistantDefaultResponse', lang) || "답변을 받았습니다.").replace('{message}', userMessage);

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
            setMessages(prev => [...prev, { id: generateId(), content: t('errorProcessingRequest', lang) || "네트워크 오류가 발생했습니다.", role: 'assistant', isAuthError: true }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, user, messages, lang, userSubscription, sermonCount, user?.uid, getFullPath, setSermonCount, onLimitReached]); // user.uid 추가 수정

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
    
    const handleGoToGeminiStudio = () => {
        window.open(GEMINI_STUDIO_URL, '_blank');
    };

    const isInitialScreen = messages.length === 0 || (messages.length === 1 && messages[0].id === 'initial');
    
    const handleClearChat = () => {
        if (window.confirm(t('confirmClearChat', lang) || "대화 내용을 모두 초기화하시겠습니까?")) {
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
// 설교 유형별 임시 상세 컴포넌트 (인라인 정의 - 유지)
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

// --------------------------------------------------
// 메인 컴포넌트: Home (Provider를 사용하도록 변경)
// --------------------------------------------------

function HomeContent() {
    // ⭐️ Context Provider가 Home을 감싸므로, useAuth를 여기서 호출
    const { user, loading, auth, db, authError } = useAuth(); 

    // 상태 정의 (유지)
    const [sermonCount, setSermonCount] = useState(0); 
    const [userSubscription, setUserSubscription] = useState('free'); 
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('landing'); 
    const [selectedSermonType, setSelectedSermonType] = useState('sermon-selection'); 
    const [lang, setLang] = useState('ko');
    const isFirebaseError = authError ? authError.includes("Firebase") : false; 
    
    // 핸들러 정의 (유지)
    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = useCallback(() => { setIsLoginModalOpen(false); setViewMode('sermon'); }, []); 
    const handleLimitReached = useCallback(() => {
        if (userSubscription === 'free') {
            setIsLimitModalOpen(true);
        }
    }, [userSubscription]);
    const closeLimitModal = useCallback(() => {
        setIsLimitModalOpen(false);
    }, []);
    const handleGoToUpgradePage = useCallback(() => {
        setIsLimitModalOpen(false);
        setSelectedSermonType('premium-upgrade'); 
        setViewMode('sermon');
    }, []);
    const handleLogout = useCallback(() => { 
        if (auth) { 
            signOut(auth); // Firebase signOut 함수 사용
            setViewMode('landing'); 
            setSelectedSermonType('sermon-selection'); 
            setSermonCount(0); 
            setUserSubscription('free'); 
        } 
    }, [auth]);
    const handleLogoClick = useCallback(() => { setViewMode('landing'); setSelectedSermonType('sermon-selection'); }, []); 
    const handleLoginSuccess = useCallback(() => { 
        setIsLoginModalOpen(false); 
        setViewMode('sermon'); 
        setSelectedSermonType('sermon-selection'); 
    }, []);
    const handleGetStarted = useCallback(() => {
        if (user && !isFirebaseError) {
            setViewMode('sermon');
            setSelectedSermonType('sermon-selection');
        } else {
            openLoginModal();
        }
    }, [user, openLoginModal, isFirebaseError]); 
    
    // 설교 유형에 따른 컴포넌트 렌더링 함수
    const renderSermonComponent = () => {
        const onGoToSelection = () => setSelectedSermonType('sermon-selection');
        
        const commonProps = {
            user: user,
            onGoBack: onGoToSelection, 
            lang: lang,
            sermonCount: sermonCount,
            setSermonCount: setSermonCount, 
            userSubscription: userSubscription, 
            onLimitReached: handleLimitReached, 
            openLoginModal: openLoginModal,
        };

        switch (selectedSermonType) {
            case 'sermon-selection':
                return (
                    <SermonSelection 
                        user={user}
                        setSelectedSermonType={setSelectedSermonType}
                        openLoginModal={openLoginModal}
                        lang={lang}
                        onGoToLanding={() => setViewMode('landing')}
                    />
                );
            case 'ai-assistant-sermon':
                return <SermonAssistantComponent {...commonProps} />;
            case 'expository-sermon':
                return <ExpositorySermonComponent {...commonProps} />;
            case 'real-life-sermon':
                return <RealLifeSermonComponent {...commonProps} />;
            case 'quick-memo-sermon':
                return <QuickMemoSermonComponent {...commonProps} />;
            case 'rebirth-sermon':
                return <RebirthSermonFeature {...commonProps} />;
            case 'premium-upgrade':
                return <PremiumSubscriptionPage {...commonProps} />;
            default:
                return (
                    <div className="p-16 text-center text-red-500 w-full min-h-screen">
                        <p className="text-xl mb-4">🚨 오류: 알 수 없는 설교 유형입니다.</p>
                        <button onClick={onGoToSelection} className="mt-4 px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">
                            선택 화면으로 돌아가기
                        </button>
                    </div>
                );
        }
    };


    // 🚨 메인 로딩 처리
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-700 bg-gray-50">
                <LoadingSpinner message={t('loadingAuth', lang)} />
                {authError && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                        🚨 {authError}
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-gray-100 text-gray-800 font-sans min-h-screen">
            
            {/* 상단 헤더 */}
            <header className="flex justify-between items-center w-full px-8 py-4 bg-white shadow-md sticky top-0 z-30">
                <span
                    onClick={handleLogoClick}
                    className="text-2xl font-bold text-gray-800 cursor-pointer"
                >
                    SermonNote
                </span>
                <div className="flex items-center space-x-4">
                    {/* AI 사용 횟수 표시 (임시) */}
                    <span className="text-sm font-medium text-gray-600">
                        AI 사용: {sermonCount}회
                    </span>
                    {/* 로그인/로그아웃 버튼 */}
                    {user && !isFirebaseError ? ( 
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">{t('logout', lang)}</button>
                    ) : ( 
                        <button onClick={openLoginModal} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                            {t('login', lang)}
                        </button>
                    )}
                    {/* 언어 선택 */}
                    <select value={lang} onChange={(e) => setLang(e.target.value)} className="p-2 border rounded-lg bg-white text-gray-800">
                        {languageOptions.map(option => (<option key={option.code} value={option.code}>{t(option.nameKey, lang)}</option>))}
                    </select>
                </div>
            </header>

            {/* 메인 콘텐츠 영역 (랜딩 페이지 또는 서비스) */}
            <main className="flex-1 flex flex-col items-center w-full">
                {isFirebaseError && (
                    <div className="w-full p-4 bg-red-100 text-red-700 border-b border-red-400 text-center font-medium">
                        🚨 Firebase 연동에 문제가 있습니다. 서비스 접속이 제한됩니다: {authError}
                    </div>
                )}
                
                {viewMode === 'landing' || isFirebaseError ? (
                    <RenderLandingPage 
                        onGetStarted={handleGetStarted} 
                        lang={lang} 
                        t={t}
                    />
                ) : (
                    <div className="w-full">
                        {renderSermonComponent()}
                    </div>
                )}
            </main>

            {/* 하단 모달 및 버튼 */}
            {isLoginModalOpen && <LoginModal onClose={closeLoginModal} onLoginSuccess={handleLoginSuccess} />}
            {/* ✅ 제한 도달 모달 렌더링 */}
            {isLimitModalOpen && (
                <LimitReachedModal 
                    onClose={closeLimitModal} 
                    lang={lang} 
                    onGoToUpgrade={handleGoToUpgradePage}
                />
            )}
            
            <button /* 퀵메모 버튼 */
                onClick={() => alert("Quick Memo Not implemented in this context")}
                className="fixed bottom-8 right-8 p-5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-2xl transition z-40 transform hover:scale-110"
            >
                <QuickMemoIcon className="w-6 h-6" />
            </button>
        </div>
    );
}


// --------------------------------------------------
// ⭐️ export default: HomeContent를 AuthProvider로 감싸서 export
// --------------------------------------------------
export default function Home() {
    return (
        <AuthProvider>
            <HomeContent />
        </AuthProvider>
    );
}