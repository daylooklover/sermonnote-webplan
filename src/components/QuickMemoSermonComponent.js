'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    collection, 
    query, 
    onSnapshot, 
    limit, 
    doc, 
    deleteDoc 
} from "firebase/firestore";
// 🚨 Gemini 직접 호출을 위한 라이브러리 추가
import { GoogleGenerativeAI } from "@google/generative-ai";

import QuickMemoModal from '@/components/QuickMemoModal'; 
import { ArrowLeft, PlusCircle, Trash2, Zap, Loader2, MessageSquare, BookOpen, AlertTriangle } from 'lucide-react'; 

const MAX_MEMO_ITEMS = 10; 

const LoadingSpinner = ({ className = "", message = "" }) => (
    <div className={`flex items-center justify-center text-sm font-medium ${className}`}>
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        {message}
    </div>
);

const MemoItem = ({ memo, isSelected, onClick, onDelete, t, lang }) => {
    const formattedDate = memo.createdAt?.toDate 
        ? memo.createdAt.toDate().toLocaleDateString(lang, { 
            year: 'numeric', month: '2-digit', day: '2-digit', 
            hour: '2-digit', minute: '2-digit', hour12: true 
        }).replace(/\./g, '').trim() 
        : '...';

    const handleDeleteClick = (e) => {
        e.stopPropagation(); 
        if (confirm(t('confirmDeleteMemo', lang) || "정말로 이 메모를 삭제하시겠습니까?")) {
            onDelete(memo.id);
        }
    };
    
    return (
        <div 
            onClick={() => onClick(memo)}
            className={`p-4 rounded-xl shadow-lg border cursor-pointer transition-all duration-200 relative group dark:text-gray-100 ${
                isSelected 
                    ? 'bg-yellow-500 text-white border-yellow-700 shadow-xl scale-[1.01] dark:bg-yellow-600'
                    : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:bg-yellow-50 dark:hover:bg-gray-600'
            }`}
        >
            <p className={`font-bold text-lg break-words pr-10 ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{memo.text}</p>
            <p className={`text-xs mt-1 ${isSelected ? 'text-yellow-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {formattedDate} 
            </p>
            
            <button
                onClick={handleDeleteClick}
                className={`absolute top-4 right-4 p-1 rounded-full opacity-70 transition-opacity 
                ${isSelected ? 'text-white hover:bg-yellow-700' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
            >
                <Trash2 className="w-5 h-5" /> 
            </button>
        </div>
    );
};

const QuickMemoSermonComponent = ({
    setSermonDraft, 
    user, 
    userId, 
    db,
    userSubscription = 'free', 
    setErrorMessage, 
    errorMessage, 
    lang, 
    openLoginModal, 
    onLimitReached, 
    sermonCount = 0,
    sermonLimit = 5,
    canGenerateSermon = false, 
    onGoBack, 
    t,
    refreshUserData
}) => {
    
    const [memos, setMemos] = useState([]);
    const [selectedMemo, setSelectedMemo] = useState(null);
    const [isMemosLoading, setIsMemosLoading] = useState(true);
    const [isSermonLoading, setIsSermonLoading] = useState(false); 
    const [isManualMemoModalOpen, setIsManualMemoModalOpen] = useState(false); 
    const [isSttMemoModalOpen, setIsSttMemoModalOpen] = useState(false);     

    const safeSetErrorMessage = useCallback((msg) => {
        if (typeof setErrorMessage === 'function') {
            setErrorMessage(msg);
            const timer = setTimeout(() => setErrorMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [setErrorMessage]);

    const handleDeleteMemo = useCallback(async (memoId) => {
        if (!db || !userId) {
            safeSetErrorMessage(t('loginToUseFeature', lang) || '로그인이 필요합니다.');
            return;
        }
        try {
            const appId = "default-app-id";
            const memoDocRef = doc(db, `artifacts/${appId}/users/${userId}/quick_memos/${memoId}`);
            await deleteDoc(memoDocRef); 
            if (selectedMemo && selectedMemo.id === memoId) setSelectedMemo(null);
        } catch (error) {
            safeSetErrorMessage(t('errorDeletingMemo', lang) || "메모 삭제 중 오류가 발생했습니다.");
        }
    }, [db, userId, safeSetErrorMessage, lang, t, selectedMemo]);

    useEffect(() => {
        if (!db || !userId) { setIsMemosLoading(false); return; }
        const appId = "default-app-id";
        const memosRef = collection(db, `artifacts/${appId}/users/${userId}/quick_memos`);
        const q = query(memosRef, limit(MAX_MEMO_ITEMS)); 
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMemos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedMemos.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                return dateB - dateA; 
            });
            setMemos(fetchedMemos);
            setIsMemosLoading(false);
        }, (error) => {
            setIsMemosLoading(false);
        });
        return () => unsubscribe();
    }, [db, userId]);

    const handleMemoSelect = useCallback((memo) => {
        setSelectedMemo(memo); 
        safeSetErrorMessage('');
    }, [safeSetErrorMessage]);
    
    const remainingSermons = useMemo(() => {
        return Math.max(0, sermonLimit - sermonCount);
    }, [sermonLimit, sermonCount]);

    // 🚨 [핵심 수정] Gemini 직접 호출 로직
    const handleGenerateSermon = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!selectedMemo) { 
            safeSetErrorMessage(t('selectMemoFirst', lang) || "먼저 리스트에서 묵상 메모를 선택해 주세요."); 
            return; 
        }
        
        if (remainingSermons <= 0 || !canGenerateSermon) { 
            safeSetErrorMessage(t('sermonLimitError', lang)); 
            onLimitReached(); 
            return; 
        }

        setIsSermonLoading(true);
        safeSetErrorMessage('');

        try {
            // SDK 초기화
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const targetLang = lang === 'ko' ? 'Korean' : 'English';
            const systemPrompt = `당신은 목회자를 돕는 전문 설교 가이드입니다. 사용자가 작성한 짧은 묵상 메모를 바탕으로, 성도들에게 은혜를 끼칠 수 있는 체계적이고 깊이 있는 설교 초안을 ${targetLang}으로 작성하세요.`;

            const result = await model.generateContent(`${systemPrompt}\n\n묵상 메모 내용: ${selectedMemo.text}`);
            const response = await result.response;
            const resultText = response.text();

            if (resultText && resultText.trim().length > 0) {
                const memoSnippet = selectedMemo.text.substring(0, 20).trim();
                const formattedTitle = `[묵상노트: ${memoSnippet}${selectedMemo.text.length > 20 ? '...' : ''}]`;
                const finalDraft = `${formattedTitle}\n\n${resultText}`;
                
                setSermonDraft(finalDraft);

                if (typeof refreshUserData === 'function') {
                    await refreshUserData();
                }
            } else {
                safeSetErrorMessage(t('apiReturnedEmptyResponse', lang) || "응답 생성에 실패했습니다.");
            }
            
        } catch (error) {
            console.error("Gemini Generation Failed:", error);
            safeSetErrorMessage(`${t('generationFailed', lang) || '생성 실패'}: ${error.message}`);
        } finally {
            setIsSermonLoading(false);
        }
    }, [user, selectedMemo, lang, canGenerateSermon, remainingSermons, safeSetErrorMessage, openLoginModal, onLimitReached, setSermonDraft, t, refreshUserData]);

    const handleOpenManualMemoModal = useCallback(() => {
        if (!user) { openLoginModal(); return; }
        setIsManualMemoModalOpen(true); 
    }, [user, openLoginModal]);

    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-md flex items-center justify-between sticky top-0 z-10">
                <button onClick={onGoBack} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    {t('goBack', lang) || '뒤로가기'}
                </button>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                    <MessageSquare className="w-6 h-6 mr-2 text-yellow-500" />
                    {t('quickMemoSermon', lang) || '퀵 메모 설교 도우미'}
                </h1>

                <div className="flex items-center space-x-2 text-sm">
                    <div className="text-sm font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-1.5 rounded-full border border-red-100 dark:border-red-800 shadow-inner">
                        {t('sermonLimit', String(remainingSermons))}
                    </div>
                </div>
            </header>

            {errorMessage && (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center font-medium shadow-md sticky top-16 mx-auto w-full max-w-6xl z-10">
                    <AlertTriangle className="w-5 h-5 inline mr-2 align-middle" />
                    {errorMessage}
                </div>
            )}
            
            <div className="max-w-6xl mx-auto w-full p-6 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 flex-1">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border-t-4 border-yellow-500 transition hover:shadow-xl h-[85vh] flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex justify-between items-center flex-shrink-0">
                        <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                            <BookOpen className="w-5 h-5 mr-2" /> {t('quickMemoListTitle', lang) || "빠른 묵상 메모 목록"}
                            <span className="text-sm font-normal ml-3 text-gray-500 dark:text-gray-400">({memos.length}/{MAX_MEMO_ITEMS}개)</span>
                        </span>
                        <button onClick={handleOpenManualMemoModal} className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 transition flex items-center p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20">
                            <PlusCircle className="w-4 h-4 mr-1" />
                            {t('addNewMemo', lang) || '새 메모 추가'}
                        </button>
                    </h2>
                    
                    {isMemosLoading && <LoadingSpinner message={t('loading', lang) || "메모를 불러오는 중..."} className="w-6 h-6 mx-auto text-yellow-500 py-12" />}
                    
                    <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                        {memos.map(memo => (
                            <MemoItem key={memo.id} memo={memo} isSelected={selectedMemo?.id === memo.id} onClick={handleMemoSelect} onDelete={handleDeleteMemo} t={t} lang={lang} />
                        ))}
                    </div>
                </div>
                
                <div className="lg:col-span-1 flex flex-col space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex-grow">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                            <MessageSquare className='w-4 h-4 mr-2 text-indigo-500' />
                            {t('selectedMemoTitle', lang) || "선택된 묵상 내용"}
                        </h2>
                        <div className={`p-4 rounded-xl break-words min-h-[120px] flex items-center justify-center text-left ${selectedMemo ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700' : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <p className={`text-sm ${selectedMemo ? 'text-gray-800 dark:text-gray-100 font-medium' : 'text-gray-500 dark:text-gray-400 italic'}`}>
                                {selectedMemo ? selectedMemo.text : (t('selectMemoInstruction', lang) || '위 목록에서 설교 초안을 만들 메모를 선택하세요.')}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border-t-4 border-red-600 text-center flex-shrink-0">
                        <p className={`text-md font-bold mb-4 ${remainingSermons <= 0 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                            {t('remainingSermons', lang) || '남은 설교 생성 횟수'}: 
                            <span className="text-2xl font-extrabold text-red-600 dark:text-red-400 ml-2">{remainingSermons}</span>회
                        </p>
                        <button
                            onClick={handleGenerateSermon}
                            disabled={!selectedMemo || isSermonLoading || remainingSermons <= 0} 
                            className="px-8 py-4 bg-red-600 text-white font-extrabold text-lg rounded-xl shadow-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center w-full"
                        >
                            {isSermonLoading ? <LoadingSpinner message={t('generatingSermon', lang) || '생성 중...'} className="text-white" /> : <><Zap className="w-6 h-6 mr-2" />{t('generateSermonFromMemo', lang) || "메모로 설교 초안 생성"}</>}
                        </button>
                    </div>
                </div>
            </div>
            
            {isManualMemoModalOpen && (
                <QuickMemoModal onClose={() => setIsManualMemoModalOpen(false)} userId={userId} db={db} t={t} lang={lang} initialModeIsManual={true} onMemoSaved={() => setIsManualMemoModalOpen(false)} />
            )}
            
            {isSttMemoModalOpen && (
                <QuickMemoModal onClose={() => setIsSttMemoModalOpen(false)} userId={userId} db={db} t={t} lang={lang} initialModeIsManual={false} onMemoSaved={() => setIsSttMemoModalOpen(false)} />
            )}
        </div>
    );
};

export default QuickMemoSermonComponent;