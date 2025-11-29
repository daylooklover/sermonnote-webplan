import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, onSnapshot, limit, doc, deleteDoc } from 'firebase/firestore'; 
// GoBackIcon, LoadingSpinner, QuickMemoIcon, TrashIcon은 IconComponents에서 가져옴
import { GoBackIcon, LoadingSpinner, QuickMemoIcon, TrashIcon } from '@/components/IconComponents.js'; 
import { SUBSCRIPTION_LIMITS } from '@/lib/constants'; 
import QuickMemoModal from '@/components/QuickMemoModal.js'; // 모달 컴포넌트

const API_ENDPOINT = '/api/sermon-generator'; 
const MAX_MEMO_ITEMS = 10; 
const MAX_SERMON_COUNT = 5; 

// 💡 Quick Memo 리스트 아이템 컴포넌트
const MemoItem = ({ memo, isSelected, onClick, onDelete, t, lang }) => {
    // 날짜 및 시각 포맷 (ko: 2025. 11. 25. 오후 4:44)
    const formattedDate = memo.createdAt?.toDate 
        ? memo.createdAt.toDate().toLocaleDateString(lang, { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true // 오전/오후 표시
        }).replace(/\./g, '').trim() 
        : '...';

    const handleDeleteClick = (e) => {
        e.stopPropagation(); // 부모 onClick 이벤트 방지
        if (confirm(t('confirmDeleteMemo', lang) || "정말로 이 메모를 삭제하시겠습니까?")) {
            onDelete(memo.id);
        }
    };
    
    return (
        <div 
            onClick={() => onClick(memo)}
            className={`p-4 rounded-xl shadow-md border cursor-pointer transition-all duration-200 relative group ${
                isSelected 
                    ? 'bg-yellow-500 text-white border-yellow-700 shadow-lg scale-[1.02]'
                    : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
            }`}
        >
            <p className="font-semibold text-lg break-words pr-10">{memo.text}</p>
            <p className={`text-sm mt-1 ${isSelected ? 'text-yellow-100' : 'text-gray-500'}`}>
                {formattedDate} 
            </p>
            
            <button
                onClick={handleDeleteClick}
                className={`absolute top-4 right-4 p-1 rounded-full opacity-70 transition-opacity 
                ${isSelected ? 'text-white hover:bg-yellow-600' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
            >
                {/* TrashIcon은 IconComponents.js에서 가져온다고 가정 */}
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
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
    handleAPICall, 
    onGoBack,
    t 
}) => {
    
    const [memos, setMemos] = useState([]);
    const [selectedMemo, setSelectedMemo] = useState(null);
    const [isMemosLoading, setIsMemosLoading] = useState(true);
    const [isSermonLoading, setIsSermonLoading] = useState(false); 
    const [isQuickMemoModalOpen, setIsQuickMemoModalOpen] = useState(false); // 퀵메모 입력 모달 상태

    const safeSetErrorMessage = useCallback((msg) => {
        if (typeof setErrorMessage === 'function') {
            setErrorMessage(msg);
        }
    }, [setErrorMessage]);

    // 💡 메모 삭제 핸들러
    const handleDeleteMemo = useCallback(async (memoId) => {
        // ... (메모 삭제 로직 생략)
    }, [db, userId, safeSetErrorMessage, lang, t, selectedMemo]);


    // 💡 Firestore Quick Memos 리스너
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
            
            // 🚨 선택된 메모가 삭제되었을 경우 초기화
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


    // 💡 설교 생성 가능 횟수 표시
    const remainingSermons = useMemo(() => {
        const limit = userSubscription === 'premium' ? 9999 : (SUBSCRIPTION_LIMITS[userSubscription]?.sermon || MAX_SERMON_COUNT);
        return limit - sermonCount;
    }, [userSubscription, sermonCount]);


    // 💡 설교 초안 생성
    const handleGenerateSermon = useCallback(async () => {
        if (!user) { openLoginModal(); return; }
        if (!selectedMemo) { safeSetErrorMessage(t('selectMemoFirst', lang) || "먼저 리스트에서 묵상 메모를 선택해 주세요."); return; }
        
        if (!canGenerateSermon) { safeSetErrorMessage(t('sermonLimitError', lang)); onLimitReached(); return; }

        setIsSermonLoading(true);
        safeSetErrorMessage('');

        const memoText = selectedMemo.text;
        
        try {
            const sermonResult = await handleAPICall(
                memoText, 
                API_ENDPOINT, 
                'quick-memo-sermon'
            );

            if (sermonResult) {
                setSermonDraft(sermonResult);
            } else {
                if (!errorMessage) safeSetErrorMessage(t('sermonGenerationFailed', lang) || "설교 생성에 실패했습니다.");
            }
            
        } catch (error) {
            console.error("Quick Memo Sermon Generation API Call Failed:", error);
            safeSetErrorMessage(t('sermonGenerationFailed', lang) || "설교 생성 중 오류가 발생했습니다.");
        } finally {
            setIsSermonLoading(false);
        }
    }, [
        user, selectedMemo, lang, canGenerateSermon, 
        safeSetErrorMessage, openLoginModal, onLimitReached, handleAPICall, setSermonDraft, t, errorMessage, sermonCount
    ]);
    
    const handleOpenQuickMemoModal = () => {
        if (!user) { openLoginModal(); return; }
        setIsQuickMemoModalOpen(true);
    };
    
    // --------------------------------------------------
    // 3. UI 렌더링
    // --------------------------------------------------
    
    return (
        // 🚨 [FINAL FIX] min-h-screen을 추가하여 화면 높이를 확보합니다.
        <div className="flex flex-col h-full min-h-screen bg-gray-100 dark:bg-slate-900 p-6 sm:p-8">
            
            {/* Header and Back Button */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md mb-6 flex items-center justify-between sticky top-0 z-10">
                <button 
                    onClick={onGoBack} 
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg"
                >
                    <GoBackIcon className="w-5 h-5 mr-1" />
                    {t('goBack', lang)} 
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center"><QuickMemoIcon className="w-6 h-6 mr-2 text-yellow-500" />{t('quickMemoSermon', lang)}</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">{t('sermonLimit', lang)?.replace('{0}', remainingSermons) || `남은 설교 횟수: ${remainingSermons}회`}</span>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full space-y-6">
                
                {/* Memo List Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex justify-between items-center">
                        {t('quickMemoListTitle', lang) || "빠른 묵상 메모 목록 (최근 10개)"}
                        <button
                            onClick={handleOpenQuickMemoModal}
                            className="text-sm font-medium text-yellow-600 hover:text-yellow-700 transition flex items-center"
                        >
                            <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                            {t('addNewMemo', lang) || '새 메모 추가'}
                        </button>
                    </h2>
                    
                    {isMemosLoading && <LoadingSpinner message={t('loading', lang)} className="w-6 h-6 animate-spin mx-auto text-gray-500" />}
                    
                    {!isMemosLoading && memos.length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                            {t('noMemosFound', lang) || "아직 저장된 메모가 없습니다. '새 메모 추가' 버튼으로 메모를 작성하세요."}
                        </p>
                    )}

                    <div className="space-y-4">
                        {memos.map(memo => (
                            <MemoItem 
                                key={memo.id}
                                memo={memo}
                                isSelected={selectedMemo?.id === memo.id}
                                onClick={setSelectedMemo}
                                onDelete={handleDeleteMemo} 
                                t={t}
                                lang={lang}
                            />
                        ))}
                    </div>
                </div>
                
                {/* Selected Memo Detail / Generation Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-center space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {t('selectedMemoTitle', lang) || "선택된 메모"}
                    </h2>
                    <div className={`p-4 rounded-lg text-gray-800 break-words ${selectedMemo ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-100 text-gray-500'}`}>
                        {selectedMemo ? selectedMemo.text : (t('selectMemoInstruction', lang) || '위 목록에서 설교 초안을 만들 메모를 선택하세요.')}
                    </div>

                    <button
                        onClick={handleGenerateSermon}
                        disabled={!selectedMemo || isSermonLoading || remainingSermons <= 0}
                        className="px-8 py-4 bg-red-600 text-white font-extrabold text-lg rounded-xl shadow-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center w-full"
                    >
                        {isSermonLoading ? (
                            <LoadingSpinner className="w-5 h-5 mr-2 text-white" />
                        ) : (
                            t('generateSermonFromMemo', lang) || "메모로 설교 초안 생성"
                        )}
                    </button>
                </div>
                
                {/* Error Message Display */}
                {errorMessage && errorMessage.length > 0 && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-center font-medium">
                        🚨 {errorMessage} 
                    </div>
                )}
            </div>
            
            {/* Quick Memo Input Modal */}
            {isQuickMemoModalOpen && (
                <QuickMemoModal
                    onClose={() => setIsQuickMemoModalOpen(false)}
                    userId={userId}
                    db={db}
                    t={t}
                    lang={lang}
                    // onMemoSaved 함수는 상위 컴포넌트(HomeContent)에서 관리
                    onMemoSaved={() => { 
                        setIsQuickMemoModalOpen(false); 
                        setSelectedMemo(memos[0]); // 새로 저장된 메모를 자동으로 선택하도록 로직 추가 가능
                    }}
                />
            )}
        </div>
    );
};

export default QuickMemoSermonComponent;