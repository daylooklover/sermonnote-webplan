'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getAuth, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, onSnapshot, query, orderBy, getDoc, setDoc, updateDoc, where, serverTimestamp } from 'firebase/firestore';
import Link from 'next/link';

// 다른 컴포넌트들을 정확한 경로로 불러옵니다.
import RealLifeSermonComponent from '@/components/RealLifeSermonComponent';
import PremiumSubscriptionPage from '@/components/PremiumSubscriptionPage';
import QuickMemoModal from '@/components/QuickMemoModal';
import ExpositorySermonComponent from '@/components/ExpositorySermonComponent';
import QuickMemoSermonComponent from '@/components/QuickMemoSermonComponent';
import SermonTypeGrid from '@/components/SermonTypeGrid';
import LoginModal from '@/components/LoginModal';
import { t } from '@/lib/translations';
import { useAuth } from '@/lib/authContext';
import LandingPage from '@/components/LandingPage';
// Firebase utilities
import { app, auth, db, incrementUsageCount, SUBSCRIPTION_LIMITS, addQuickMemo, checkDailyMemoLimit } from '@/lib/firebase';

// 아이콘 컴포넌트
import {
    LogOutIcon, PlusCircleIcon, SearchIcon, SaveIcon, EditIcon, PrintIcon, CloseIcon, FullscreenIcon, MicIcon,
    BookmarkIcon, UserIcon, QuickMemoIcon, GoBackIcon, CheckIcon, BibleIcon, LoadingSpinner, SecureIcon, ShareIcon, RealLifeIcon
} from '@/components/IconComponents';

// API 호출을 위한 헬퍼 함수
const callAPI = async (promptText, generationConfig = {}) => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, generationConfig }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse server error response.' }));
        throw new Error(errorData.message || 'Server responded with an error.');
    }
    const data = await response.json();
    return data.text;
};

// Custom Hook for Sermon Generation Logic
const useSermonGeneration = (userId, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, onLimitReached, sermonCount, commentaryCount, userSubscription) => {
    const [isLoading, setIsLoading] = useState(false);
    const [generationError, setGenerationError] = useState(null);

    const generateSermon = useCallback(async (promptText, usageType = 'sermon', generationConfig = {}) => {
        setGenerationError(null);
        if (!user) {
            openLoginModal();
            return null;
        }

        const userLimit = SUBSCRIPTION_LIMITS[userSubscription] || SUBSCRIPTION_LIMITS['free'];

        if (usageType === 'sermon' && (!canGenerateSermon || sermonCount >= userLimit.sermon)) {
            onLimitReached();
            setGenerationError(t('sermonLimitError', lang, Math.max(0, userLimit.sermon - sermonCount)));
            return null;
        }
        if (usageType === 'commentary' && (!canGenerateCommentary || commentaryCount >= userLimit.commentary)) {
            onLimitReached();
            setGenerationError(t('commentaryLimitError', lang, Math.max(0, userLimit.commentary - commentaryCount)));
            return null;
        }

        setIsLoading(true);
        try {
            const text = await callAPI(promptText, generationConfig);
            await incrementUsageCount(usageType, userId, usageType === 'sermon' ? sermonCount : commentaryCount);
            return text;
        } catch (error) {
            console.error(error);
            setGenerationError(t('generationFailed', lang));
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [userId, sermonCount, commentaryCount, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, onLimitReached, userSubscription]);

    return { generateSermon, isLoading, generationError };
};

export default function Home() {
    const [sermonInput, setSermonInput] = useState('');
    const [sermonDraft, setSermonDraft] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [userSubscription, setUserSubscription] = useState('free');
    const [commentaryCount, setCommentaryCount] = useState(0);
    const [sermonCount, setSermonCount] = useState(0);
    const [selectedSermonType, setSelectedSermonType] = useState(null);
    const [lang, setLang] = useState('ko');
    const [memos, setMemos] = useState([]);
    const [isFetchingMemos, setIsFetchingMemos] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginError, setLoginError] = useState('');

    const sermonRef = useRef(null);
    const { user, loading } = useAuth();
    const userId = user?.uid;

    const toggleFullscreen = (content) => {
        // Fullscreen 기능 구현
    };

    const openLoginModal = () => {
        setIsLoginModalOpen(true);
        setLoginError('');
    };
    const closeLoginModal = () => {
        setIsLoginModalOpen(false);
        setLoginError('');
    };

    const onLoginSuccess = () => {
        closeLoginModal();
        setSelectedSermonType('sermon-selection');
    };

    const userLimit = SUBSCRIPTION_LIMITS[userSubscription] || SUBSCRIPTION_LIMITS['free'];
    const canGenerateCommentary = userSubscription === 'premium' || (userLimit && commentaryCount < userLimit.commentary);
    const canGenerateSermon = userSubscription === 'premium' || (userLimit && sermonCount < userLimit.sermon);

    const { generateSermon, isLoading, generationError } = useSermonGeneration(userId, canGenerateSermon, canGenerateCommentary, lang, user, openLoginModal, () => setSelectedSermonType('premium-subscription'), sermonCount, commentaryCount, userSubscription);

    useEffect(() => {
        if (sermonDraft && sermonRef.current) {
            sermonRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [sermonDraft]);

    const handleSendMessage = useCallback(async () => {
        if (!sermonInput.trim()) { setErrorMessage(t('enterMessage', lang)); return; }

        const newChatHistory = [...chatHistory, { role: 'user', text: sermonInput }];
        setChatHistory(newChatHistory);
        setSermonInput('');
        setErrorMessage('');

        try {
            const fullChatPrompt = newChatHistory.map(chat => `${chat.role === 'user' ? 'User' : 'Assistant'}: ${chat.text}`).join('\n');
            const promptText = `Please respond to the following conversation in ${lang === 'ko' ? 'Korean' : 'English'}. Conversation: "${fullChatPrompt}"`;
            const text = await generateSermon(promptText, 'commentary');

            if (text) {
                setChatHistory(prev => [...prev, { role: 'assistant', text: text }]);
            }
        } catch (error) {
            setChatHistory(prev => [...prev, { role: 'assistant', text: t('generationFailed', lang) }]);
            setErrorMessage(t('generationFailed', lang));
        }
    }, [sermonInput, setSermonInput, setErrorMessage, chatHistory, lang, generateSermon]);

    const handleGenerateSermonFromChat = useCallback(async () => {
        if (chatHistory.length === 0) { setErrorMessage(t('noConversationError', lang)); return; }

        try {
            const fullChatPrompt = chatHistory.map(chat => `${chat.role === 'user' ? 'User' : 'Assistant'}: ${chat.text}`).join('\n');
            const promptText = `Based on the following conversation, write a detailed sermon in ${lang === 'ko' ? 'Korean' : 'English'}: "${fullChatPrompt}"`;
            const sermonText = await generateSermon(promptText, 'sermon');
            if (sermonText) setSermonDraft(sermonText);
        } catch (error) {
            setErrorMessage(error.message);
        }
    }, [chatHistory, generateSermon, setSermonDraft, setErrorMessage, lang]);

    const handleSelectText = useCallback(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        if (selectedText.length > 0) {
            setSermonDraft(prevDraft =>
                prevDraft ? prevDraft + '\n\n' + selectedText : selectedText
            );
        }
    }, [setSermonDraft]);

    const handleLimitReached = useCallback(() => {
        setSelectedSermonType('premium-subscription');
    }, [setSelectedSermonType]);

    const handleAddMemo = useCallback(async (content) => {
        if (!user) { openLoginModal(); return; }
        const currentMemoCount = await checkDailyMemoLimit(user.uid);
        if (currentMemoCount >= 5) {
            setErrorMessage(t('memoLimitReached', lang, 5));
            return;
        }
        try {
            await addQuickMemo(user.uid, content);
            setSelectedSermonType('quick-memo-sermon');
        } catch (error) {
            setErrorMessage(t('failedToSaveMemo', lang));
            console.error(error);
        }
    }, [user, openLoginModal, setErrorMessage, lang, setSelectedSermonType]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("로그아웃 실패:", error);
            alert("로그아웃에 실패했습니다. 다시 시도해주세요.");
        }
    };

 // ... (이전 코드 생략) ...

    const renderMainScreen = () => {
        if (!user) {
            return (
                // 여기에 <React.Fragment> 또는 <>...</>를 사용하여 모든 섹션을 감싸줍니다.
                <>
                    <div className="landing-hero-section">
                        <div className="absolute top-0 right-0 p-6 flex items-center space-x-4">
                            <button
                                onClick={openLoginModal}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition duration-300"
                            >
                                <UserIcon className="w-5 h-5" />
                                <span>{t('signUpLogin', lang)}</span> {/* lang prop 추가 */}
                            </button>
                            <select
                                onChange={(e) => setLang(e.target.value)}
                                value={lang}
                                className="bg-gray-100 text-gray-800 rounded-lg p-2 border border-gray-300"
                            >
                                <option value="ko">한국어</option>
                                <option value="en">English</option>
                                <option value="zh">中文</option>
                                <option value="ja">日本語</option>
                                <option value="ru">Русский</option>
                                <option value="vi">Tiếng Việt</option>
                                <option value="fil">Filipino</option>
                            </select>
                        </div>
                        <h1 className="main-logo text-gray-50">SermonNote</h1>
                        <p className="main-slogan text-gray-200">Deepen Your Faith, Organize Your Insights.</p>
                        <button
                            onClick={openLoginModal}
                            className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition duration-300 text-2xl mt-4"
                        >
                            {t('getStarted', lang)} {/* lang prop 추가 */}
                        </button>
                    </div>

                    <section className="py-16 bg-white text-center">
                        <h2 className="text-3xl font-bold mb-8">{t('featuresTitle', lang)}</h2> {/* lang prop 추가 */}
                        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
                            <div className="p-6 rounded-lg shadow-md bg-gray-50">
                                <h3 className="text-xl font-semibold mb-2">{t('feature1Title', lang)}</h3> {/* lang prop 추가 */}
                                <p className="text-gray-700">{t('feature1Description', lang)}</p> {/* lang prop 추가 */}
                            </div>
                            <div className="p-6 rounded-lg shadow-md bg-gray-50">
                                <h3 className="text-xl font-semibold mb-2">{t('feature2Title', lang)}</h3> {/* lang prop 추가 */}
                                <p className="text-gray-700">{t('feature2Description', lang)}</p> {/* lang prop 추가 */}
                            </div>
                            <div className="p-6 rounded-lg shadow-md bg-gray-50">
                                <h3 className="text-xl font-semibold mb-2">{t('feature3Title', lang)}</h3> {/* lang prop 추가 */}
                                <p className="text-gray-700">{t('feature3Description', lang)}</p> {/* lang prop 추가 */}
                            </div>
                        </div>
                    </section>

                    <section className="py-16 bg-gray-50 text-center">
                        <h2 className="text-3xl font-bold mb-8">{t('whySermonNoteTitle', lang)}</h2> {/* lang prop 추가 */}
                        <p className="text-lg text-gray-700 max-w-3xl mx-auto px-4">
                            {t('whySermonNoteDescription', lang)} {/* lang prop 추가 */}
                        </p>
                    </section>

                    <footer className="py-8 bg-gray-800 text-white text-center">
                        <p className="mb-4">{t('privacyPolicy', lang)} | {t('termsOfService', lang)}</p> {/* lang prop 추가 */}
                        <p>&copy; {new Date().getFullYear()} SermonNote. All rights reserved.</p>
                    </footer>
                </>
            );
        }

        switch (selectedSermonType) {
            case 'sermon-assistant':
                return (
                    <div className="text-center">
                        <h2 className="text-4xl font-extrabold text-gray-800">{t('sermonAssistantTitle', lang)}</h2>
                        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">{t('assistantDescription', lang)}</p>
                        {userSubscription !== 'premium' && (
                            <p className="text-sm text-gray-500 mb-4">
                                {t('commentaryLimit', lang, Math.max(0, (SUBSCRIPTION_LIMITS[userSubscription]?.commentary || 0) - commentaryCount))}
                            </p>
                        )}
                        {errorMessage && (
                            <div className="bg-red-200 text-red-800 p-4 rounded-xl mb-4 max-w-2xl mx-auto">
                                {t('errorMessage', lang, errorMessage)}
                            </div>
                        )}
                        <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto w-full">
                            <div className="w-full p-4 rounded-xl bg-gray-200 border border-gray-300 h-96 overflow-y-auto text-left whitespace-pre-wrap">
                                {(chatHistory?.length > 0) ? (
                                    chatHistory.map((chat, index) => (
                                        <div key={index} className={`mb-4 p-3 rounded-lg ${chat.role === 'user' ? 'bg-blue-100 text-right text-gray-800' : 'bg-white text-left text-gray-800'}`}
                                            onMouseUp={chat.role === 'assistant' ? handleSelectText : undefined}>
                                            <p className="font-semibold">{chat.role === 'user' ? (lang === 'ko' ? '나:' : 'You:') : (lang === 'ko' ? 'AI:' : 'AI:')}</p>
                                            <p>{chat.text}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500">{t('initialPrompt', lang)}</p>
                                )}
                            </div>
                            <div className="w-full flex space-x-2">
                                <textarea
                                    value={sermonInput}
                                    onChange={(e) => setSermonInput(e.target.value)}
                                    placeholder={t('inputPlaceholder', lang)}
                                    className="flex-grow p-4 rounded-xl bg-white border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                    rows="2"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 flex items-center justify-center"
                                    disabled={!canGenerateCommentary || !sermonInput.trim() || isLoading}
                                >
                                    {isLoading && <LoadingSpinner />}
                                    <span className={`${isLoading ? 'ml-2' : ''}`}>{t('sendButton', lang)}</span>
                                </button>
                            </div>
                            <button
                                onClick={handleGenerateSermonFromChat}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 w-full flex items-center justify-center"
                                disabled={!canGenerateSermon || chatHistory.length === 0 || isLoading}
                            >
                                {isLoading && <LoadingSpinner />}
                                <span className={`${isLoading ? 'ml-2' : ''}`}>{t('generateSermonFromChat', lang)}</span>
                            </button>
                        </div>
                    </div>
                );
            case 'expository-sermon':
                return <ExpositorySermonComponent {...{ setSermonDraft, userId, commentaryCount, userSubscription, setErrorMessage, lang, user, openLoginModal, onLimitReached: handleLimitReached, sermonCount, canGenerateSermon, canGenerateCommentary }} />;
            case 'real-life-sermon':
                return <RealLifeSermonComponent {...{ setSermonDraft, userId, sermonCount, userSubscription, setErrorMessage, lang, user, openLoginModal, onLimitReached: handleLimitReached, canGenerateSermon }} />;
            case 'quick-memo-sermon':
                return <QuickMemoSermonComponent {...{ setSermonDraft, userId, sermonCount, userSubscription, setErrorMessage, lang, user, openLoginModal, onLimitReached: handleLimitReached, memos, commentaryCount, canGenerateSermon, canGenerateCommentary }} />;
            case 'premium-subscription':
                return <PremiumSubscriptionPage onGoBack={() => setSelectedSermonType(null)} />;
            case 'sermon-selection':
                return (
                    <div className="text-center space-y-8">
                        <h2 className="text-4xl font-extrabold text-gray-800">{t('chooseSermonType', lang)}</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('chooseSermonTypeDescription', lang)}</p>
                        <div className="bg-blue-100 p-6 rounded-xl text-gray-800 max-w-3xl mx-auto border border-blue-200 shadow-md">
                            <p className="text-lg font-semibold">{t('multilingualPromo', lang)}</p>
                            <p className="text-sm text-gray-600 mt-2">
                                ({t('language', lang)}: {t('korean', lang)}, {t('english', lang)}, {t('chinese', lang)}, {t('japanese', lang)}, {t('russian', lang)}, {t('vietnamese', lang)})
                            </p>
                        </div>
                        <SermonTypeGrid
                            setSelectedSermonType={setSelectedSermonType}
                            openLoginModal={openLoginModal}
                            user={user}
                            lang={lang}
                        />
                        <div className="mt-12">
                            <button
                                onClick={user ? () => setSelectedSermonType('premium-subscription') : openLoginModal}
                                className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition duration-300 text-2xl w-full max-w-md mx-auto"
                            >
                                {t('upgradeToPremium', lang)}
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const [quickMemoModalOpen, setQuickMemoModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800 font-sans">
            <header className="p-6 bg-white border-b border-gray-200 flex items-center justify-between shadow-sm">
                <div className="flex items-center space-x-4">
                    <div onClick={() => setSelectedSermonType(null)} className="cursor-pointer">
                        <h1 className="text-3xl font-extrabold text-gray-900">SermonNote</h1>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {user && (
                        <>
                            <p className="text-sm text-gray-600 hidden sm:block">{t('welcome', lang, user.email || '익명 사용자')}</p>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            >
                                <LogOutIcon className="w-5 h-5" />
                                <span>{t('logout', lang)}</span>
                            </button>
                        </>
                    )}
                    <select
                        onChange={(e) => setLang(e.target.value)}
                        value={lang}
                        className="bg-gray-100 text-gray-800 rounded-lg p-2 border border-gray-300"
                    >
                        <option value="ko">한국어</option>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                        <option value="ru">Русский</option>
                        <option value="vi">Tiếng Việt</option>
                        <option value="fil">Filipino</option>
                    </select>
                </div>
            </header>
            <main className="container mx-auto p-8">
                {renderMainScreen()}
                {sermonDraft && (
                    <div ref={sermonRef} className="mt-12 text-left max-w-3xl mx-auto w-full">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-bold text-gray-900">{t('generatedSermonTitle', lang)}</h3>
                            <button onClick={() => toggleFullscreen(sermonDraft)} className="text-gray-500 hover:text-gray-900 transition">
                                <FullscreenIcon />
                            </button>
                        </div>
                        <textarea
                            value={sermonDraft}
                            onChange={(e) => setSermonDraft(e.target.value)}
                            rows={15}
                            className="w-full p-6 rounded-2xl bg-white border border-gray-300 text-gray-800 resize-none shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}
            </main>
            <button
                onClick={() => setQuickMemoModalOpen(true)}
                className="fixed bottom-8 right-8 p-5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-2xl transition z-40 transform hover:scale-110"
            >
                <QuickMemoIcon className="w-6 h-6" />
            </button>
            <LoginModal
                isOpen={isLoginModalOpen}
                onClose={closeLoginModal}
                onLoginSuccess={onLoginSuccess}
                lang={lang} // lang prop을 LoginModal에 전달
            />
            <QuickMemoModal
                isOpen={quickMemoModalOpen}
                onClose={() => setQuickMemoModalOpen(false)}
                onAddMemo={handleAddMemo}
                memoLimit={5}
                lang={lang}
                openLoginModal={openLoginModal}
                user={user}
                onMemoAdded={() => setSelectedSermonType('quick-memo-sermon')}
            />
        </div>
    );
}