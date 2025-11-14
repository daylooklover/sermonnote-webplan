'use client';

import React, { useState, useEffect, useCallback } from 'react';
// Firestore imports
import { collection, query, limit, getDocs, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

// ⭐️ FIX: 아이콘 경로를 현재 폴더('./')를 통한 상대 경로로 수정하여 참조 오류 해결
import { GoBackIcon, LoadingSpinner } from './IconComponents.js'; 

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
);

const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
);

const MAX_MEMO_LIMIT = 5;

// 메모 데이터 타입
const initialMemo = { id: '', text: '', createdAt: null };

const QuickMemoSermonComponent = ({ 
    onGoBack, 
    userId, 
    db, 
    t, 
    lang, 
    canGenerateSermon, 
    generateSermon, 
    onLimitReached,
    quickMemoUpdate 
}) => {
    const [memos, setMemos] = useState([]);
    const [sermonDraft, setSermonDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Firestore 컬렉션 참조 생성
    const getQuickMemoCollectionRef = useCallback(() => {
        if (!db || !userId) return null;
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        return collection(db, `artifacts/${appId}/users/${userId}/quick_memos`);
    }, [db, userId]);

    // 2. 녹음된 텍스트 목록 불러오기 (하루 5개 제한)
    useEffect(() => {
        const memosRef = getQuickMemoCollectionRef();
        if (!memosRef) return;
        
        setError('');
        
        // Firestore에서 실시간 업데이트 리스너 설정
        const q = query(memosRef, limit(MAX_MEMO_LIMIT));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMemos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Firestore Timestamp 객체를 Date 객체로 변환
                createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(),
            })).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // 최신순 정렬
            
            setMemos(fetchedMemos);
        }, (e) => {
            console.error("Firestore Memo Fetch Error:", e);
            setError(t('memo_save_error', e.message) || `Failed to load memos: ${e.message}`);
        });

        // 클린업 함수
        return () => unsubscribe();
    }, [userId, db, quickMemoUpdate, t, lang, getQuickMemoCollectionRef]);

    // 메모 삭제
    const handleDeleteMemo = async (memoId) => {
        if (!db || !userId) return;
        
        const memosRef = getQuickMemoCollectionRef();
        if (!memosRef) return;

        try {
            const docRef = doc(memosRef, memoId);
            await deleteDoc(docRef);
            // setMemos는 onSnapshot에 의해 자동으로 업데이트됨
        } catch (e) {
            console.error("Error deleting memo:", e);
            setError(t('memo_save_error', e.message) || `Failed to delete memo: ${e.message}`);
        }
    };
    
    // 3. 메모 클릭 시 AI 설교 생성 요청
    const handleGenerateSermon = useCallback(async (memoText) => {
        if (!canGenerateSermon) {
            onLimitReached('sermon');
            return;
        }

        setLoading(true);
        setError('');
        setSermonDraft('');

        // t 함수에 memoText 인수를 전달
        const prompt = t('prompt_quick_sermon', memoText) || `Generate a quick sermon based on this memo: "${memoText}"`;

        try {
            const result = await generateSermon(prompt, 'sermon');
            setSermonDraft(result);
            setError('');
        } catch (e) {
            setError(t('generationFailed') || 'Failed to generate sermon.');
        } finally {
            setLoading(false);
        }
    }, [canGenerateSermon, onLimitReached, generateSermon, lang, t]);


    // 메모 개수 표시
    const currentMemoCount = memos.length;
    const canRecord = currentMemoCount < MAX_MEMO_LIMIT;


    return (
        <div className="p-4 md:p-8 w-full max-w-4xl mx-auto min-h-screen">
            <div className="flex justify-between items-center border-b pb-3 mb-6">
                <button onClick={onGoBack} className="flex items-center text-gray-500 hover:text-red-600 transition">
                    <GoBackIcon className="w-5 h-5 mr-2" />
                    {t('goBack') || 'Go Back'}
                </button>
                <h2 className="text-2xl font-bold text-gray-800">{t('quickMemoSermon') || 'Quick Memo Sermon'}</h2>
                <div className="text-sm font-medium text-gray-600">
                    {t('sermonGenTimes', currentMemoCount) || `Memos recorded: ${currentMemoCount}/${MAX_MEMO_LIMIT}`}
                </div>
            </div>

            {error && (
                <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>
            )}
            
            {loading && (
                 <div className="flex items-center justify-center p-8 bg-white rounded-xl shadow-lg">
                    <LoadingSpinner message={t('aiIsThinking') || "AI is thinking..."} />
                 </div>
            )}

            {!loading && sermonDraft && (
                 <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-green-200">
                    <h3 className="text-xl font-bold mb-3 text-green-700">{t('aiAssistantDefaultResponse') || 'AI Sermon Draft'}</h3>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sermonDraft.replace(/\n/g, '<br/>') }} />
                 </div>
            )}


            <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
                <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
                    {t('memo_recorded_text') || 'Your Recorded Memos'}
                    {!canRecord && <span className="ml-2 text-sm text-red-500 font-normal">({t('limitReached') || 'Limit Reached'})</span>}
                </h3>
                
                {memos.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">{t('memo_no_memos') || 'No memos recorded yet. Use the yellow mic button to start!'}</p>
                ) : (
                    <ul className="space-y-3">
                        {memos.map(memo => (
                            <li key={memo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                                {/* 3. 구독자가 기록된 5개 중 하나를 클릭 -> AI가 설교 생성 */}
                                <button 
                                    onClick={() => handleGenerateSermon(memo.text)}
                                    disabled={loading}
                                    className="flex-1 text-left text-gray-800 truncate pr-4 disabled:opacity-50"
                                >
                                    {memo.text}
                                </button>
                                
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500 hidden sm:inline">
                                        {memo.createdAt.toLocaleTimeString()}
                                    </span>
                                    {/* 설교 생성 버튼 */}
                                    <button 
                                        onClick={() => handleGenerateSermon(memo.text)}
                                        disabled={loading}
                                        className="p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400 transition"
                                        title={t('auth_processing') || 'Generate Sermon'}
                                    >
                                        <SendIcon />
                                    </button>
                                    {/* 삭제 버튼 */}
                                    <button 
                                        onClick={() => handleDeleteMemo(memo.id)}
                                        disabled={loading}
                                        className="p-1 text-red-500 hover:text-red-700 disabled:text-gray-400 transition"
                                        title={t('delete') || 'Delete Memo'}
                                    >
                                        <DeleteIcon />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
        </div>
    );
};

export default QuickMemoSermonComponent;