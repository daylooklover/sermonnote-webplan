'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    collection, 
    onSnapshot, 
    doc, 
    deleteDoc, 
    updateDoc,
    increment,
    runTransaction,
} from 'firebase/firestore';
// 🚨 Gemini SDK 임포트
import { GoogleGenerativeAI } from "@google/generative-ai";

import SermonDetailModal from '@/components/SermonDetailModal.js';
import RebirthInputModal from '@/components/RebirthInputModal.js';

const DEVELOPER_ID = "FilpYriiL7UYhSGrpdJrGxD0er2";

// --- Icons (생략 없이 유지) ---
const HeartIcon = ({ filled, className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
);

const RefreshCcwIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.76 2.76L3 7" /><path d="M3 3v4h4" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.76-2.76L21 17" /><path d="M21 17v-4h-4" />
    </svg>
);

const LoadingSpinner = (props) => (
    <svg {...props} className={`animate-spin h-5 w-5 text-indigo-500 ${props.className || ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 004 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- ArchiveListItem ---
const ArchiveListItem = React.memo(({ sermon, userId, onDetail, onDelete, onLike, onRebirth, isDeleting }) => {
    const [isLiked, setIsLiked] = useState(sermon.likedBy?.includes(userId) || false);
    const [likesCount, setLikesCount] = useState(sermon.upvotes || 0);

    const canDelete = useMemo(() => sermon.user_id === userId || userId === DEVELOPER_ID, [sermon.user_id, userId]);
    const date = sermon.sharedAt?.toDate ? sermon.sharedAt.toDate().toLocaleDateString('ko-KR') : '날짜 미상';
    
    const displayContent = useMemo(() => {
        if (sermon.title && sermon.title.trim()) {
            const cleanTitle = sermon.title.replace(/^[\[\s\*\#\-\=]+/, '').trim();
            return cleanTitle.length > 80 ? cleanTitle.substring(0, 80) + '...' : cleanTitle;
        }
        const fallbackText = sermon.sermon_draft || sermon.content || "";
        const cleanFallback = fallbackText.replace(/[\[\]\*\#\-\=]/g, '').trim();
        return cleanFallback.substring(0, 80) + '...';
    }, [sermon]);

    const handleLikeClick = (e) => {
        e.stopPropagation();
        if (!userId) return; 
        onLike(sermon.id, !isLiked);
        setLikesCount(prev => prev + (!isLiked ? 1 : -1));
        setIsLiked(prev => !prev);
    };

    return (
        <div onClick={() => onDetail(sermon)} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 mb-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-indigo-100 cursor-pointer">
            <div className="flex-1 min-w-0 pr-4">
                <p className="text-lg font-semibold text-indigo-800 break-words line-clamp-2">{displayContent}</p>
                <div className="mt-1 text-sm text-gray-500 flex items-center space-x-3">
                    <span>{date} 등록</span> 
                </div>
                <div className="mt-2 flex items-center space-x-4 text-gray-700 text-sm">
                    <div className="flex items-center space-x-1">
                        <HeartIcon className="w-4 h-4 text-red-500" filled={isLiked && !!userId}/>
                        <span>{likesCount} Likes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <RefreshCcwIcon className="w-4 h-4 text-green-500"/>
                        <span>{sermon.rebirthCount || 0} Rebirths</span>
                    </div>
                </div>
            </div>
            <div className="mt-3 md:mt-0 flex items-center space-x-3">
                <button onClick={handleLikeClick} className={`p-2 rounded-full ${!!userId ? (isLiked ? 'bg-red-500 text-white' : 'bg-gray-100 text-red-500 hover:bg-red-100') : 'bg-gray-100 text-red-300 cursor-not-allowed'}`} disabled={!userId}>
                    <HeartIcon className="w-5 h-5" filled={isLiked && !!userId} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRebirth(sermon); }} className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-full shadow-md hover:bg-purple-700 transition">
                    <RefreshCcwIcon className="w-4 h-4 mr-2 inline"/> Start Rebirth
                </button>
                {canDelete && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(sermon.id); }} disabled={isDeleting} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200">
                        {isDeleting ? <LoadingSpinner className="w-5 h-5 text-red-600"/> : <TrashIcon className="w-5 h-5"/>}
                    </button>
                )}
            </div>
        </div>
    );
});

// --- Main Component ---
const RebirthSermonFeature = ({ 
    onGoBack, db, userId, setSermonDraft, setErrorMessage, t, lang, 
    userSubscription = 'free', openUpgradeModal,
    sermonCount = 0,
    sermonLimit = 5,
    refreshUserData
}) => { 
    const [sermons, setSermons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); 
    const [sort, setSort] = useState('latest');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSermon, setSelectedSermon] = useState(null); 
    const [isInputModalOpen, setIsInputModalOpen] = useState(false); 
    const [isDeleting, setIsDeleting] = useState(false); 
    const [isRebirthing, setIsRebirthing] = useState(false); 

    const appId = "default-app-id"; 

    const remainingSermons = useMemo(() => Math.max(0, sermonLimit - sermonCount), [sermonLimit, sermonCount]);

    useEffect(() => {
        if (!db || !userId) { setIsLoading(false); setSermons([]); return; }
        // 💡 저장된 데이터 구조에 따라 경로 수정
        const archiveRef = collection(db, `artifacts/${appId}/public/sermon_archive`);
        const unsubscribe = onSnapshot(archiveRef, (snapshot) => {
            setSermons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setIsLoading(false);
        }, (err) => { setIsLoading(false); setError(t('errorLoadingSermons', lang)); });
        return () => unsubscribe();
    }, [db, userId, appId, t, lang]);

    const filteredAndSortedSermons = useMemo(() => {
        let result = sermons.filter(s => (s.title?.toLowerCase().includes(searchTerm.toLowerCase()) || s.sermon_draft?.toLowerCase().includes(searchTerm.toLowerCase())));
        result.sort((a, b) => {
            if (sort === 'latest') return (b.sharedAt?.toDate?.() || 0) - (a.sharedAt?.toDate?.() || 0);
            if (sort === 'most-liked') return (b.upvotes || 0) - (a.upvotes || 0);
            return (b.rebirthCount || 0) - (a.rebirthCount || 0);
        });
        return result;
    }, [sermons, searchTerm, sort]);

    const handleDeleteSermon = useCallback(async (sId) => {
        if (!userId || !window.confirm(t('confirmDelete', lang))) return;
        setIsDeleting(true); 
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/sermon_archive`, sId));
            setMessage(t('deleteSuccess', lang));
        } catch (err) { setError(t('deleteFailed', lang)); }
        finally { setIsDeleting(false); setSelectedSermon(null); }
    }, [userId, appId, db, t, lang]);

    const handleLikeSermon = useCallback(async (sId, isLiking) => {
        if (!userId) { setError(t('loginRequiredForLike', lang)); return; }
        const sRef = doc(db, `artifacts/${appId}/public/sermon_archive`, sId);
        try {
            await runTransaction(db, async (transaction) => {
                const sDoc = await transaction.get(sRef);
                const likedBy = sDoc.data().likedBy || [];
                let upvotes = sDoc.data().upvotes || 0;
                if (isLiking && !likedBy.includes(userId)) { likedBy.push(userId); upvotes++; }
                else if (!isLiking) { const idx = likedBy.indexOf(userId); if (idx > -1) { likedBy.splice(idx, 1); upvotes--; } }
                transaction.update(sRef, { upvotes, likedBy });
            });
        } catch (e) { setError(t('likeFailed', lang)); }
    }, [userId, appId, db, t, lang]);

    // 🚨 [핵심 수정] Gemini 2.5 Flash 직접 호출 (404 에러 방지)
    const handleRebirthCall = useCallback(async (context) => {
        if (!selectedSermon || remainingSermons <= 0) { 
            setErrorMessage(t('sermonLimitError', lang)); 
            if (openUpgradeModal) openUpgradeModal(); 
            return; 
        }
        setIsRebirthing(true); 
        try {
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const targetLang = lang === 'ko' ? 'Korean' : 'English';
            const systemPrompt = `당신은 목회자를 돕는 전문 설교 가이드입니다. 기존 설교 내용을 바탕으로 사용자의 요청에 따라 새롭게 각색된 설교 초안을 ${targetLang}으로 작성하세요.`;

            const result = await model.generateContent(`${systemPrompt}\n\n기존 설교: ${selectedSermon.sermon_draft}\n추가 요청: ${context}`);
            const response = await result.response;
            const text = response.text();

            if (text) {
                setSermonDraft(text);
                await updateDoc(doc(db, `artifacts/${appId}/public/sermon_archive`, selectedSermon.id), { rebirthCount: increment(1) });
                if (refreshUserData) await refreshUserData(); 
                setIsInputModalOpen(false);
                onGoBack(); 
            }
        } catch (err) { 
            console.error("Rebirth Error:", err);
            setErrorMessage(`실패: ${err.message}`); 
        }
        finally { setIsRebirthing(false); }
    }, [selectedSermon, lang, db, appId, setSermonDraft, onGoBack, remainingSermons, refreshUserData, t, setErrorMessage, openUpgradeModal]);

    const handleDetailSermon = (s) => {
        if (userSubscription === 'free' && userId !== DEVELOPER_ID) { openUpgradeModal(); return; }
        setSelectedSermon(s);
    };

    if (isLoading && !error) return <div className="flex justify-center items-center h-screen bg-gray-50 text-indigo-600 animate-pulse font-bold">로딩 중...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onGoBack} className="flex items-center text-gray-600 hover:text-indigo-600 transition font-medium">
                    <ArrowLeft className="w-5 h-5 mr-1"/> {t('goBack', lang)}
                </button>
                <div className="text-sm font-bold text-red-600 bg-red-50 px-4 py-1.5 rounded-full border border-red-100 shadow-inner">
                    {t('sermonLimit', String(remainingSermons))}
                </div>
            </div>

            {(error || message) && <div className="p-4 mb-4 rounded-lg bg-red-100 border border-red-400 text-red-700 font-medium">🚨 {error || message}</div>}
            
            <div className="space-y-4">
                {filteredAndSortedSermons.length > 0 ? (
                    filteredAndSortedSermons.map(s => (
                        <ArchiveListItem key={s.id} sermon={s} userId={userId} onDetail={handleDetailSermon} onRebirth={(s) => {setSelectedSermon(s); setIsInputModalOpen(true);}} onDelete={handleDeleteSermon} onLike={handleLikeSermon} isDeleting={isDeleting} />
                    ))
                ) : (
                    <div className="text-center p-10 bg-white rounded-xl shadow-md text-gray-400 font-medium">등록된 설교가 없습니다.</div>
                )}
            </div>
            
            {selectedSermon && !isInputModalOpen && <SermonDetailModal isOpen={!!selectedSermon} onClose={() => setSelectedSermon(null)} sermon={selectedSermon} onStartRebirth={(s) => setIsInputModalOpen(true)} onDelete={handleDeleteSermon} onLike={handleLikeSermon} userId={userId} />}
            {isInputModalOpen && selectedSermon && <RebirthInputModal isOpen={isInputModalOpen} onClose={() => {setIsInputModalOpen(false); setSelectedSermon(null);}} onConfirm={handleRebirthCall} sermon={selectedSermon} lang={lang} t={t} isProcessing={isRebirthing} />}
        </div>
    );
};

const ArrowLeft = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
);

export default RebirthSermonFeature;