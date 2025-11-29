import React, { useState, useCallback, useEffect, useMemo } from 'react';
// 🚨 [FIX]: Firestore import는 유지
import { collection, addDoc, serverTimestamp, doc, runTransaction, Timestamp, getDoc } from 'firebase/firestore'; 

// 🚨 구독 등급별 월별 공유 등록 제한 횟수 정의
const SHARE_LIMITS = {
    'free': 1,
    'standard': 5,
    'premium': 10,
};

// 아이콘 컴포넌트 정의 (로컬 정의 유지)
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 6L6 18" /><path d="M6 6L18 18" /></svg>
);
const PrintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8" rx="2"></rect></svg>
);
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
);


// LoadingSpinner 컴포넌트 정의 유지
const LoadingSpinner = (props) => (
    <svg {...props} className={`animate-spin h-5 w-5 text-indigo-500 ${props.className || ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 004 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);


/**
 * AI 설교 초안을 표시하고 편집 및 제어 기능을 제공하는 모달
 */
const SermonDraftModal = ({ onClose, onArchiveSuccess, sermonDraft: initialDraftText, memoText, t, lang, isGenerating, db, userId, setErrorMessage, userSubscription = 'free' }) => {
    
    // ... (상태 및 useEffect 로직 유지)
    const [sermonDraft, setSermonDraft] = useState(initialDraftText || "");
    const [isMaximized, setIsMaximized] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false); 
    const [monthlyShareCount, setMonthlyShareCount] = useState(0); 

    useEffect(() => {
        setSermonDraft(initialDraftText || ""); 
    }, [initialDraftText]);
    
    const safeSetErrorMessage = useCallback((msg) => {
        if (typeof setErrorMessage === 'function') {
            setErrorMessage(msg);
        }
    }, [setErrorMessage]);

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // 🚨 [NEW] 월별 공유 횟수 로드 로직 (유지)
    const loadMonthlyShareCount = useCallback(async () => {
        if (!db || !userId) return;

        try {
            const counterRef = doc(db, `artifacts/${appId}/users/${userId}/usage_limits`, 'sermon_share_counter');
            const counterDoc = await getDoc(counterRef);
            
            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
            
            if (counterDoc.exists()) {
                const data = counterDoc.data();
                if (data.month === currentMonth) {
                    setMonthlyShareCount(data.count);
                } else {
                    setMonthlyShareCount(0);
                }
            } else {
                setMonthlyShareCount(0);
            }
        } catch (error) {
            console.error("Error loading share counter:", error);
            setMonthlyShareCount(0); 
        }
    }, [db, userId, appId]);

    useEffect(() => {
        loadMonthlyShareCount();
    }, [loadMonthlyShareCount]);


    // 🚨 [복원 및 유지] 아카이브 등록 (공유) 기능 구현 - 카운터 로직 포함
    const handleRegisterArchive = useCallback(async () => {
        if (!db || !userId) {
            safeSetErrorMessage(t('loginToUseFeature', lang) || "로그인이 필요합니다. 설교를 등록할 수 없습니다.");
            return;
        }

        if (!sermonDraft || sermonDraft.trim() === '') {
            safeSetErrorMessage(t('noSermonDraft', lang) || "설교 초안 내용이 비어있습니다. 등록할 수 없습니다.");
            return;
        }

        setIsArchiving(true);
        safeSetErrorMessage('');

        const currentLimit = SHARE_LIMITS[userSubscription] || SHARE_LIMITS.free;

        if (monthlyShareCount >= currentLimit) {
            setIsArchiving(false);
            safeSetErrorMessage(
                t('shareLimitReached', lang)?.replace('{0}', currentLimit).replace('{1}', userSubscription) 
                || `월간 공유 등록 제한 횟수(${currentLimit}회)를 초과했습니다. 다음 달에 다시 시도하거나 플랜을 업그레이드하세요.`
            );
            return;
        }


        try {
            const archiveRef = collection(db, `artifacts/${appId}/public/data/sermon_archive`);
            const counterRef = doc(db, `artifacts/${appId}/users/${userId}/usage_limits`, 'sermon_share_counter');

            await runTransaction(db, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                const now = new Date();
                const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
                
                let currentCount = 0;
                
                if (counterDoc.exists()) {
                    const data = counterDoc.data();
                    if (data.month === currentMonth) {
                        currentCount = data.count;
                    } 
                }

                if (currentCount >= currentLimit) {
                    throw new Error("Share limit exceeded during transaction.");
                }

                const newSermonRef = doc(archiveRef); 
                const titleMatch = sermonDraft.match(/[\s\S]*?\n/);
                const title = (titleMatch ? titleMatch[0] : sermonDraft.substring(0, 50)).trim() || (t('sermonDraftTitle', lang) || 'AI 설교 초안');
                const memoToStore = memoText || ''; 

                transaction.set(newSermonRef, {
                    title: title,
                    content: sermonDraft,
                    originalMemo: memoToStore, 
                    authorId: userId,
                    sharedAt: serverTimestamp(), 
                    upvotes: 0,
                    rebirthCount: 0,
                    lang: lang,
                    status: 'shared',
                });

                transaction.set(counterRef, {
                    count: currentCount + 1,
                    month: currentMonth,
                    lastUpdated: Timestamp.fromDate(now),
                });
                
                setMonthlyShareCount(currentCount + 1);
            });

            safeSetErrorMessage(t('archiveSuccess', lang) || `✅ 설교 "${title}"이(가) 공유 아카이브에 성공적으로 등록되었습니다. (남은 횟수: ${currentLimit - (monthlyShareCount + 1)}회)`);
            
            // 모달 닫는 로직 제거 (설교 화면 유지)
            // if (onArchiveSuccess) { onArchiveSuccess(); } 

        } catch (error) {
            console.error("Error registering sermon to archive:", error);
            const errorMessage = error.message.includes("Share limit exceeded") 
                ? (t('shareLimitReached', lang)?.replace('{0}', currentLimit).replace('{1}', userSubscription) || '월간 공유 등록 제한 횟수 초과.')
                : (t('archiveFailed', lang)?.replace('{0}', error.message) || `설교 아카이브 등록 중 오류가 발생했습니다: ${error.message}`);
                
            safeSetErrorMessage(errorMessage);
        } finally {
            setIsArchiving(false);
        }
    }, [sermonDraft, memoText, userId, db, lang, safeSetErrorMessage, userSubscription, monthlyShareCount, appId]); 


    // 🚨 [FIXED] 인쇄 기능 구현
    const handlePrint = useCallback(() => {
        if (!sermonDraft || sermonDraft.trim() === '') return;
        
        const content = sermonDraft;
        const windowContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${t('sermonDraftTitle', lang) || '설교 초안'}</title>
                <style>
                    body { font-family: 'Noto Sans KR', sans-serif; padding: 20px; line-height: 1.6; white-space: pre-wrap; color: #333; }
                    h1 { font-size: 1.8rem; margin-top: 10px; border-bottom: 2px solid #ccc; padding-bottom: 5px; }
                    h2 { font-size: 1.4rem; margin-top: 15px; }
                    p { margin-bottom: 10px; }
                    @page { size: A4; margin: 20mm; }
                </style>
            </head>
            <body>
                <h1>${t('sermonDraftTitle', lang) || '설교 초안'}</h1>
                <p><strong>${t('memo_base_text', lang) || '기반 메모:'}</strong> ${memoText || '없음'}</p>
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <div style="white-space: pre-wrap; font-size: 1rem;">${content.replace(/(\n\s*)+\n/g, '\n\n').replace(/\n/g, '<br>')}</div>
                <script>window.print();</script>
            </body>
            </html>
        `;
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(windowContent);
            printWindow.document.close();
        }
    }, [sermonDraft, lang, memoText, t]);


    // 🚨 [FIXED] 다운로드 기능 구현
    const handleDownload = useCallback(() => {
        if (!sermonDraft || sermonDraft.trim() === '') return;
        
        const fileName = (t('sermonDraftTitle', lang) || 'SermonDraft') + `_${new Date().toISOString().slice(0, 10)}.txt`;
        
        const content = (t('memo_base_text', lang) || '기반 메모:') + ` ${memoText || '없음'}\n\n` + sermonDraft;
        
        const element = document.createElement("a");
        const file = new Blob([content], {type: 'text/plain;charset=utf-8'});
        element.href = URL.createObjectURL(file);
        element.download = fileName;
        document.body.appendChild(element);
        element.click(); 
        document.body.removeChild(element);
    }, [sermonDraft, lang, memoText, t]);


    // 🚨 [FIXED] 동적 CSS 클래스 설정
    const modalClasses = useMemo(() => isMaximized
        ? "fixed inset-0 w-full h-full rounded-none transition-all duration-300" 
        : isMinimized
        ? "fixed bottom-0 right-4 w-96 h-16 rounded-t-xl overflow-hidden transition-all duration-300" 
        : "max-w-4xl w-full h-[90vh] rounded-xl transition-all duration-300", 
    [isMaximized, isMinimized]);
    
    // 🚨 최소화 상태일 때 배경 클릭 방지
    const handleBackdropClick = (e) => {
        if (e.target.id === 'modal-backdrop' && !isMinimized) {
            // onClose(); 
        }
    };

    // 월간 공유 제한 횟수 계산
    const currentLimit = SHARE_LIMITS[userSubscription] || SHARE_LIMITS.free;
    const isShareLimitReached = monthlyShareCount >= currentLimit;
    const remainingShares = currentLimit - monthlyShareCount;
    
    const renderLoading = () => (
        <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <LoadingSpinner className="w-10 h-10 mb-4 text-indigo-500" />
            <p className="text-lg font-medium">{t('generatingSermon', lang) || 'AI가 설교 초안을 작성 중입니다...'}</p>
            <p className="text-sm mt-2">{t('generating_memo', lang) || '내용을 기반으로 구조를 생성하고 있습니다.'}</p>
        </div>
    );
    
    const contentToDisplay = isGenerating ? renderLoading() : (
        <div className="flex-1 min-h-0"> 
            <textarea
                className="w-full h-full p-8 text-left rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-serif text-lg leading-relaxed" 
                placeholder={t('sermonDraftPlaceholder', lang) || "여기에 AI가 생성한 설교 초안이 표시됩니다."}
                value={sermonDraft}
                onChange={(e) => setSermonDraft(e.target.value)}
                disabled={isGenerating}
            />
        </div>
    );


    return (
        <div 
            id="modal-backdrop"
            className={`fixed inset-0 ${isMinimized ? 'bg-opacity-0 pointer-events-none' : 'bg-black bg-opacity-70'} flex items-center justify-center z-50 p-4 transition-opacity duration-300`}
            onClick={handleBackdropClick}
            aria-modal="true" 
            role="dialog"
        >
            <div className={`bg-white dark:bg-gray-800 shadow-2xl transform transition-all duration-300 ${modalClasses} flex flex-col ${isMinimized ? 'pointer-events-auto' : ''}`}
                 onClick={(e) => e.stopPropagation()}>
                
                {/* 🚨 헤더 및 컨트롤 버튼 */}
                <div 
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center cursor-pointer ${isMinimized ? 'h-full' : ''}`}
                    onClick={() => isMinimized && setIsMinimized(false)} // 최소화 시 클릭하면 복구
                >
                    {isMinimized ? (
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[60%]">{t('sermonDraftTitle', lang) || '설교 초안'} ({memoText || 'AI 생성 설교'})</h3>
                    ) : (
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('sermonDraftTitle', lang) || '설교 초안'}</h3>
                    )}
                    
                    <div className={`flex space-x-2 text-gray-500 dark:text-gray-400 ${isMinimized ? 'ml-auto' : ''}`}>
                        {/* 최소화 버튼 */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsMinimized(prev => !prev); setIsMaximized(false); }}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            title={t(isMinimized ? 'restore' : 'minimize', lang) || (isMinimized ? '복구' : '최소화')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path></svg>
                        </button>
                        {/* 확대/복구 버튼 */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsMaximized(prev => !prev); setIsMinimized(false); }}
                            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            title={t(isMaximized ? 'restore' : 'maximize', lang) || (isMaximized ? '복구' : '최대화')}
                        >
                            {isMaximized ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 9l6-6m0 0v4m0-4h4M3 15v4m0 0h4M3 19l6-6m12-2v4m0 0h-4m4 0l-6-6M15 3h4m0 0v4m0-4l-5 5"></path></svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-5v4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 0h-4m4 0l-5-5"></path></svg>
                            )}
                        </button>

                        {/* 닫기 버튼 */}
                        <button onClick={onClose} className="p-1 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-700 transition" title={t('closeButton', lang) || '닫기'}>
                            <CloseIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 🚨 메모 기반 텍스트와 본문 영역 배치 */}
                {!isMinimized && (
                    <div className="flex-1 min-h-0 flex flex-col px-4 pt-2 pb-4 space-y-4"> 
                        {/* 🚨 memoText가 유효한 내용일 때만 노란색 박스를 표시 */}
                        {(memoText && memoText.trim() !== '' && memoText.toLowerCase() !== '없음') && (
                            <p className="text-sm bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg border border-yellow-200 dark:border-yellow-700 p-3 font-medium">
                                {t('memo_base_text', lang) || '기반 메모: '}
                                <span className="font-semibold">{memoText}</span>
                            </p>
                        )}
                        {contentToDisplay}
                    </div>
                )}
                
                {/* 푸터 버튼 (최소화 상태일 때 숨김) */}
                {!isMinimized && (
                    // 🚨 [FIXED] justify-between을 사용하여 버튼을 좌우로 분리
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between space-x-3 shrink-0">
                        
                        {/* 🚨 [좌측] 아카이브 등록 버튼 (복원) */}
                        <button
                            onClick={handleRegisterArchive}
                            // 🚨 [제한 조건 추가] 설교 내용, 로딩, 로그인, 그리고 공유 횟수 제한 초과 확인
                            disabled={!sermonDraft || sermonDraft.trim() === '' || isArchiving || isGenerating || !userId || isShareLimitReached}
                            className={`px-6 py-3 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:opacity-50 flex items-center space-x-2 ${isArchiving ? 'bg-gray-500' : isShareLimitReached ? 'bg-red-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {isArchiving ? (
                                <LoadingSpinner className="w-5 h-5 mr-2 text-white" />
                            ) : isShareLimitReached ? (
                                <span>{t('limitReached', lang) || '공유 제한 초과'}</span>
                            ) : (
                                <ShareIcon />
                            )}
                            
                            {/* 🚨 [FIXED] 남은 횟수 표시 */}
                            <span>
                                {t('registerArchive', lang) || '공유 아카이브에 등록'} 
                                {remainingShares > 0 && ` (${remainingShares}회 남음)`}
                            </span>
                        </button>
                        
                        
                        {/* 🚨 [우측] 인쇄 및 다운로드 버튼 */}
                        <div className='flex space-x-3'>
                            {/* 🚨 인쇄 버튼 */}
                            <button
                                onClick={handlePrint}
                                className="px-6 py-3 bg-gray-400 hover:bg-gray-500 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 disabled:opacity-70 flex items-center space-x-2"
                                disabled={!sermonDraft || sermonDraft.trim() === '' || isGenerating}
                            >
                                <PrintIcon />
                                <span>{t('print', lang) || "인쇄"}</span>
                            </button>
                            
                            {/* 다운로드 버튼 */}
                            <button
                                onClick={handleDownload}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 disabled:opacity-70 flex items-center space-x-2"
                                disabled={!sermonDraft || sermonDraft.trim() === '' || isGenerating}
                            >
                                <DownloadIcon />
                                <span>{t('downloadDraft', lang) || "다운로드"}</span>
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default SermonDraftModal;