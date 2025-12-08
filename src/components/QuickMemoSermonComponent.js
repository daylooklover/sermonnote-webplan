'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    collection, 
    query, 
    onSnapshot, 
    limit, 
    getFirestore, 
    doc, 
    deleteDoc 
} from "firebase/firestore";

import QuickMemoModal from '@/components/QuickMemoModal'; 
// Mic 아이콘은 기존 빨간색 버튼이 사용하는 아이콘을 가정하고 남겨둡니다.
import { ArrowLeft, PlusCircle, Trash2, Zap, Loader2, MessageSquare, BookOpen, AlertTriangle, Mic } from 'lucide-react'; 

import { callSermonGenerator } from '@/lib/api'; 
import { SUBSCRIPTION_LIMITS } from '@/lib/constants'; 

const API_ENDPOINT = '/api/sermon-generator'; 
const MAX_MEMO_ITEMS = 10; 
const MAX_SERMON_COUNT = 5; 

// 💡 LoadingSpinner 컴포넌트 (lucide-react 기반)
const LoadingSpinner = ({ className = "", message = "" }) => (
    <div className={`flex items-center justify-center text-sm font-medium ${className}`}>
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        {message}
    </div>
);


// 💡 Quick Memo 리스트 아이템 컴포넌트 
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


// 💡 QuickMemoSermonComponent 정의
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
    sermonCount, 
    canGenerateSermon, 
    onGoBack, 
    t 
}) => {
    
    const [memos, setMemos] = useState([]);
    const [selectedMemo, setSelectedMemo] = useState(null);
    const [isMemosLoading, setIsMemosLoading] = useState(true);
    const [isSermonLoading, setIsSermonLoading] = useState(false); 
    
    // 두 가지 모달 상태를 분리합니다.
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
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const memoDocRef = doc(db, `artifacts/${appId}/users/${userId}/quick_memos/${memoId}`);
            
            await deleteDoc(memoDocRef); 

            if (selectedMemo && selectedMemo.id === memoId) {
                setSelectedMemo(null);
            }

        } catch (error) {
            console.error("Error deleting quick memo:", error);
            safeSetErrorMessage(t('errorDeletingMemo', lang) || "메모 삭제 중 오류가 발생했습니다.");
        }
    }, [db, userId, safeSetErrorMessage, lang, t, selectedMemo]);


    useEffect(() => {
        if (!db || !userId) {
            setIsMemosLoading(false);
            return;
        }

        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const memosRef = collection(db, `artifacts/${appId}/users/${userId}/quick_memos`);
        
        const q = query(memosRef, limit(MAX_MEMO_ITEMS)); 
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMemos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            fetchedMemos.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                return dateB - dateA; 
            });

            setMemos(fetchedMemos);
            setIsMemosLoading(false);
            
            if (selectedMemo && !fetchedMemos.find(m => m.id === selectedMemo.id)) {
                setSelectedMemo(null);
            }

        }, (error) => {
            console.error("Error fetching quick memos:", error);
            safeSetErrorMessage(t('errorProcessingRequest', lang) || "메모 목록을 불러오는 중 오류가 발생했습니다.");
            setIsMemosLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId, safeSetErrorMessage, lang, t, selectedMemo]);

    const handleMemoSelect = useCallback((memo) => {
        setSelectedMemo(memo); 
        safeSetErrorMessage('');
    }, [safeSetErrorMessage]);
    
    const remainingSermons = useMemo(() => {
        const limit = userSubscription === 'premium' ? 9999 : (SUBSCRIPTION_LIMITS[userSubscription]?.sermon || MAX_SERMON_COUNT);
        return limit - sermonCount;
    }, [userSubscription, sermonCount]);


    const handleGenerateSermon = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!selectedMemo) { safeSetErrorMessage(t('selectMemoFirst', lang) || "먼저 리스트에서 묵상 메모를 선택해 주세요."); return; }
        
        if (remainingSermons <= 0 || !canGenerateSermon) { 
            safeSetErrorMessage(t('sermonLimitError', lang)); 
            onLimitReached(); 
            return; 
        }

        setIsSermonLoading(true);
        safeSetErrorMessage('');

        try {
            const sermonResult = await callSermonGenerator('quick-memo-sermon', {
                prompt: `다음 메모 내용을 바탕으로 설교 초안을 작성해주세요: ${selectedMemo.text}`,
                lang: lang,
            });

            if (sermonResult.response && sermonResult.response.length > 0) {
                setSermonDraft(sermonResult.response);
            } else {
                safeSetErrorMessage(t('apiReturnedEmptyResponse', lang));
            }
            
        } catch (error) {
            console.error("Quick Memo Sermon Generation API Call Failed:", error);
            const errorMessage = error.message;

            if (errorMessage.includes('403') || errorMessage.includes('Limit Exceeded')) {
                onLimitReached(); 
            } else if (errorMessage.includes('401')) {
                openLoginModal(); 
            } else {
                safeSetErrorMessage(t('generationFailed', lang) + `: ${errorMessage}`);
            }
        } finally {
            setIsSermonLoading(false);
        }
    }, [
        user, selectedMemo, lang, canGenerateSermon, 
        safeSetErrorMessage, openLoginModal, onLimitReached, setSermonDraft, t, remainingSermons 
    ]); 


    // [수정된 핸들러 1]: +addNewMemo 버튼용 (수동 입력 모달)
    const handleOpenManualMemoModal = () => {
        if (!user) { openLoginModal(); return; }
        setIsManualMemoModalOpen(true); 
    };
    
    // [새로운 핸들러 2]: 오른쪽 하단 아이콘용 (STT 녹음 모달)
    // 이 함수는 빨간색 아이콘에 연결될 것입니다.
    const handleOpenSttMemoModal = () => {
        if (!user) { openLoginModal(); return; }
        setIsSttMemoModalOpen(true); 
    };
    
    // --------------------------------------------------
    // 3. UI 렌더링
    // --------------------------------------------------
    
    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900">
            
            {/* Header Area (Sticky Top) */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 shadow-md flex items-center justify-between sticky top-0 z-10">
                <button 
                    onClick={onGoBack} 
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    {t('goBack', lang) || '뒤로가기'}
                </button>
                <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                    <MessageSquare className="w-6 h-6 mr-2 text-yellow-500" />
                    {t('quickMemoSermon', lang) || '퀵 메모 설교 도우미'}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className={`font-semibold ${remainingSermons <= 0 ? 'text-red-500' : ''}`}>{t('sermonLimit', lang)?.replace('{0}', remainingSermons) || `설교 제한: ${remainingSermons}회`}</span>
                </div>
            </div>

            {/* Error Message Bar (Sticky Positioned) */}
            {errorMessage && errorMessage.length > 0 && (
                <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center font-medium shadow-md sticky top-16 mx-auto w-full max-w-6xl z-10">
                    <AlertTriangle className="w-5 h-5 inline mr-2 align-middle" />
                    {errorMessage}
                </div>
            )}
            
            {/* Main Content: Clear Two-Column Layout */}
            <div className="max-w-6xl mx-auto w-full p-6 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8 flex-1">
                
                {/* Column 1: Memo List (Primary Focus) */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl border-t-4 border-yellow-500 transition hover:shadow-xl h-[85vh] flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex justify-between items-center flex-shrink-0">
                        <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                            <BookOpen className="w-5 h-5 mr-2" /> {t('quickMemoListTitle', lang) || "빠른 묵상 메모 목록"}
                            <span className="text-sm font-normal ml-3 text-gray-500 dark:text-gray-400">({memos.length}/{MAX_MEMO_ITEMS}개)</span>
                        </span>
                        {/* +addNewMemo 버튼에 수동 입력 핸들러 연결 */}
                        <button
                            onClick={handleOpenManualMemoModal} 
                            className="text-sm font-medium text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 transition flex items-center p-2 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        >
                            <PlusCircle className="w-4 h-4 mr-1" />
                            {t('addNewMemo', lang) || '새 메모 추가'}
                        </button>
                    </h2>
                    
                    {isMemosLoading && <LoadingSpinner message={t('loading', lang) || "메모를 불러오는 중..."} className="w-6 h-6 mx-auto text-yellow-500 py-12" />}
                    
                    {!isMemosLoading && memos.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-12">
                            {t('noMemosFound', lang) || "아직 저장된 메모가 없습니다. 메모를 작성하고 설교를 생성하세요."}
                        </p>
                    )}

                    <div className="space-y-3 overflow-y-auto pr-2 flex-1">
                        {memos.map(memo => (
                            <MemoItem 
                                key={memo.id}
                                memo={memo}
                                isSelected={selectedMemo?.id === memo.id}
                                onClick={handleMemoSelect} 
                                onDelete={handleDeleteMemo} 
                                t={t}
                                lang={lang}
                            />
                        ))}
                        {/* Footer Spacer to ensure scrollability */}
                        <div className="h-10" />
                    </div>
                </div>
                
                {/* Column 2: Selected Memo Detail & Action */}
                <div className="lg:col-span-1 flex flex-col space-y-6">
                    {/* 1. Selected Memo Detail Section */}
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

                    {/* 2. Generation Action Button (CTA) */}
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
                            {isSermonLoading ? (
                                <LoadingSpinner message={t('generatingSermon', lang) || '생성 중...'} className="text-white" />
                            ) : (
                                remainingSermons <= 0 ? (t('limitExceededUpgrade', lang) || '제한 초과 (업그레이드)') : (<><Zap className="w-6 h-6 mr-2" />{t('generateSermonFromMemo', lang) || "메모로 설교 초안 생성"}</>)
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            {/* [수정된 모달 렌더링 1]: 수동 입력 모달 렌더링 (+addNewMemo 버튼용) */}
            {isManualMemoModalOpen && (
                <QuickMemoModal
                    onClose={() => setIsManualMemoModalOpen(false)}
                    userId={userId}
                    db={db}
                    t={t}
                    lang={lang}
                    // 수동 모드로 시작하도록 명시적으로 설정
                    initialModeIsManual={true} 
                    onMemoSaved={() => { 
                        setIsManualMemoModalOpen(false); 
                    }}
                />
            )}
            
            {/* [새로운 모달 렌더링 2]: STT 녹음 모달 렌더링 (빨간색 아이콘용) */}
            {isSttMemoModalOpen && (
                <QuickMemoModal
                    onClose={() => setIsSttMemoModalOpen(false)}
                    userId={userId}
                    db={db}
                    t={t}
                    lang={lang}
                    // STT 모드로 시작하도록 명시적으로 설정
                    initialModeIsManual={false} 
                    onMemoSaved={() => { 
                        setIsSttMemoModalOpen(false); 
                    }}
                />
            )}

            {/* 🚨 [삭제된 코드]: 이전에 추가했던 노란색 마이크 아이콘 버튼 제거 */}
            {/* <button
                onClick={handleOpenSttMemoModal}
                className="fixed bottom-4 right-4 p-4 bg-yellow-500 text-white rounded-full shadow-2xl hover:bg-yellow-600 transition-transform duration-200 transform hover:scale-105 z-50"
                title={t('stt_record_button', lang) || 'Record Quick Memo'}
            >
                <Mic className="w-6 h-6" />
            </button> 
            */}

            {/* 💡 참고: 기존 빨간색 아이콘은 이 컴포넌트 외부 (다른 레이아웃 컴포넌트)에 있을 것으로 추정되며,
               그 버튼이 handleOpenSttMemoModal을 호출하도록 연결되어야 합니다. */}
               
        </div>
    );
};

export default QuickMemoSermonComponent;