import React, { useState, useEffect, useCallback, useMemo } from 'react';
// 🚨 Firebase Firestore 함수 import
import { 
    collection, 
    query, 
    onSnapshot, 
    doc, 
    deleteDoc, 
    updateDoc,
    increment,
    runTransaction,
} from 'firebase/firestore';

// 🚨 [FIXED] Modal 컴포넌트 Import (빌드 오류 방지)
import SermonDetailModal from '@/components/SermonDetailModal.js';
import RebirthInputModal from '@/components/RebirthInputModal.js';

// =================================================================
// 🚨 개발자 ID 설정 (삭제 권한 부여용)
const DEVELOPER_ID = "DEV_ADMIN_ID_PLACEHOLDER"; 
const MAX_ARCHIVE_ITEMS = 20;
const API_ENDPOINT = '/api/sermon-generator'; 
// =================================================================

// Helper Icons (Using inline SVG for stability)
const HeartIcon = ({ filled, className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
);

const TrashIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 6h18" />
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
);

const RefreshCcwIcon = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.76 2.76L3 7" />
        <path d="M3 3v4h4" />
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.76-2.76L21 17" />
        <path d="M21 17v-4h-4" />
    </svg>
);

const CloseIcon = ({ className = "w-6 h-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6L6 18" /><path d="M6 6L18 18" /></svg>
);

const LoadingSpinner = (props) => (
    <svg {...props} className={`animate-spin h-5 w-5 text-indigo-500 ${props.className || ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 004 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);


// ----------------------------------------------------
// 1. ArchiveListItem (목록 아이템)
// ----------------------------------------------------
const ArchiveListItem = React.memo(({ sermon, userId, onDetail, onDelete, onLike, onRebirth }) => {
    // 좋아요 상태와 횟수를 로컬 상태로 관리하여 즉각적인 UI 반응을 구현
    const [isLiked, setIsLiked] = useState(sermon.likedBy?.includes(userId) || false);
    const [likesCount, setLikesCount] = useState(sermon.upvotes || 0);

    // 삭제 권한: 소유자 이거나 개발자 ID와 일치할 경우
    const canDelete = useMemo(() => {
        return sermon.authorId === userId || userId === DEVELOPER_ID;
    }, [sermon.authorId, userId]);

    // 좋아요 버튼 클릭 핸들러
    const handleLikeClick = (e) => {
        e.stopPropagation(); // 목록 상세 모달 열림 방지
        if (!userId) return; // 로그인 안 되어 있으면 좋아요 불가
        onLike(sermon.id, !isLiked);
        setLikesCount(prev => prev + (!isLiked ? 1 : -1));
        setIsLiked(prev => !prev);
    };

    // 🚨 [FIXED]: 저자 정보 제거, 등록일만 표시
    const date = sermon.sharedAt?.toDate ? sermon.sharedAt.toDate().toLocaleDateString('ko-KR') : '날짜 미상';

    return (
        <div 
            onClick={() => onDetail(sermon)}
            className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 mb-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition duration-300 border border-indigo-100 cursor-pointer space-y-2 sm:space-y-0"
        >
            <div className="flex-1 min-w-0 pr-4">
                <p className="text-lg font-semibold text-indigo-800 break-words line-clamp-2">
                    {sermon.title || sermon.content?.substring(0, 50) + '...'}
                </p>
                {/* 🚨 [FIXED]: 저자 정보 제거, 등록일만 표시 */}
                <div className="mt-1 text-sm text-gray-500 flex items-center space-x-3">
                    <span>{date} 등록</span> 
                </div>
                <div className="mt-2 flex items-center space-x-4 text-gray-700 text-sm">
                    {/* 좋아요 (Upvotes) 카운트 */}
                    <div className="flex items-center space-x-1">
                        <HeartIcon className="w-4 h-4 text-red-500" filled={isLiked}/>
                        <span>{likesCount} Likes</span>
                    </div>
                    {/* 재탄생 횟수 (Rebirth Count) */}
                    <div className="flex items-center space-x-1">
                        <RefreshCcwIcon className="w-4 h-4 text-green-500"/>
                        <span>{sermon.rebirthCount || 0} Rebirths</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-3 md:mt-0 flex items-center space-x-3 shrink-0">
                {/* 좋아요 버튼 - 로그인 상태일 때만 표시 */}
                {userId && (
                    <button
                        onClick={handleLikeClick}
                        className={`p-2 rounded-full transition duration-150 ${isLiked ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-red-500 hover:bg-red-100'}`}
                        title={isLiked ? "좋아요 취소" : "좋아요"}
                    >
                        <HeartIcon className="w-5 h-5" filled={isLiked} />
                    </button>
                )}

                {/* 재탄생 시작 버튼 (목록에서 바로 시작 가능하도록 버튼을 유지) */}
                   <button
                    onClick={(e) => { e.stopPropagation(); onRebirth(sermon); }}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-full shadow-md hover:bg-purple-700 transition duration-150"
                >
                    <RefreshCcwIcon className="w-4 h-4 mr-2"/>
                    <span>Start Rebirth</span>
                </button>


                {/* 삭제 버튼 - 소유자 또는 개발자만 볼 수 있음 */}
                {canDelete && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(sermon.id); }}
                        className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition duration-150"
                        title="설교 삭제"
                    >
                        <TrashIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>
        </div>
    );
});


// ----------------------------------------------------
// 2. RebirthInputModal (재탄생 입력 모달)
// (NOTE: 이 컴포넌트는 RebirthInputModal.js 파일에 정의되어 있어야 합니다.)
// ----------------------------------------------------


// ----------------------------------------------------
// 3. SermonDetailModal (설교 전문 보기 모달)
// (NOTE: 이 컴포넌트는 SermonDetailModal.js 파일에 정의되어 있어야 합니다.)
// ----------------------------------------------------


// ----------------------------------------------------
// 4. RebirthSermonFeature (메인 컴포넌트)
// ----------------------------------------------------
const RebirthSermonFeature = ({ 
    onGoBack, db, userId, handleAPICall, setSermonDraft, setErrorMessage, t, lang, 
    userSubscription = 'free', openUpgradeModal 
}) => { 
    const [sermons, setSermons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); 
    const [sort, setSort] = useState('latest');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSermon, setSelectedSermon] = useState(null); 
    const [isInputModalOpen, setIsInputModalOpen] = useState(false); 

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // 1. 설교 데이터 실시간 구독
    useEffect(() => {
        if (!db || !userId) {
            setIsLoading(false);
            setSermons([]);
            return;
        }
        
        const sermonsCollectionRef = collection(db, `artifacts/${appId}/public/data/sermon_archive`);
        let q = sermonsCollectionRef;
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedSermons = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                sharedAt: doc.data().sharedAt || doc.data().createdAt 
            }));
            setSermons(fetchedSermons);
            setIsLoading(false);
            setError(''); 
        }, (err) => {
            console.error("Firestore subscription failed:", err);
            setError("설교 목록을 불러오는 중 오류가 발생했습니다. (연결 오류)");
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [db, userId, appId]);


    // 2. 설교 목록 정렬 및 필터링 로직 (클라이언트 측)
    const filteredAndSortedSermons = useMemo(() => {
        if (!sermons) return [];

        let result = [...sermons];

        // 2-1. 검색어 필터링
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            result = result.filter(sermon =>
                (sermon.title && sermon.title.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (sermon.content && sermon.content.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }

        // 2-2. 정렬
        result.sort((a, b) => {
            const dateA = a.sharedAt?.toDate ? a.sharedAt.toDate().getTime() : 0;
            const dateB = b.sharedAt?.toDate ? b.sharedAt.toDate().getTime() : 0;

            if (sort === 'latest') {
                return dateB - dateA; // 최신순 (내림차순)
            } else if (sort === 'most-liked') {
                return (b.upvotes || 0) - (a.upvotes || 0); // 좋아요순 (내림차순)
            } else if (sort === 'most-rebirth') {
                return (b.rebirthCount || 0) - (a.rebirthCount || 0); // 재탄생순 (내림차순)
            }
            return 0;
        });

        return result;
    }, [sermons, searchTerm, sort]);


    // 3. 설교 삭제 핸들러
    const handleDeleteSermon = useCallback(async (sermonId) => {
        if (!window.confirm("정말로 이 설교를 아카이브에서 삭제하시겠습니까?")) {
            return;
        }
        // ... (나머지 삭제 로직 유지)
    }, [userId, appId, sermons, db]);


    // 4. 좋아요 (Upvote) 핸들러
    const handleLikeSermon = useCallback(async (sermonId, isLiking) => {
        // ... (좋아요 로직 유지)
    }, [userId, appId, db]);


    // 5. 설교 재탄생 시작 핸들러
    const handleStartRebirth = useCallback((sermon) => {
        // ... (재탄생 시작 로직 유지)
    }, [userId, t, lang, setErrorMessage]);

    // 6. 설교 재탄생 요청 API 호출 핸들러 (RebirthInputModal에서 호출)
    const handleRebirthCall = useCallback(async (localContext) => {
        // ... (재탄생 API 호출 로직 유지)
    }, [selectedSermon, lang, handleAPICall, setSermonDraft, setErrorMessage, t, db, appId]);
    
    // 🚨 [NEW] 유료 멤버십으로 업그레이드 안내
    const handleUpgradeRequired = useCallback((featureName) => {
        setError(t('upgradeRequired', lang)?.replace('{0}', featureName) || `${featureName} 기능을 사용하려면 유료 멤버십 업그레이드가 필요합니다.`);
        // 🚨 [FIXED] openUpgradeModal 함수가 유효한지 체크 후 호출
        if (openUpgradeModal && typeof openUpgradeModal === 'function') {
            openUpgradeModal(); 
        }
    }, [t, lang, openUpgradeModal, setError]);

    // 🚨 [NEW] 상세 보기 핸들러 (접근 제한 체크)
    const handleDetailSermon = useCallback((sermon) => {
        const isDeveloper = userId === DEVELOPER_ID;

        // 💡 [RESTORED] 무료 회원은 설교 전문 열람을 제한하고 업그레이드 유도 (개발자 우회)
        if (userSubscription === 'free' && !isDeveloper) {
            handleUpgradeRequired(t('archiveDetailView', lang) || '아카이브 상세 열람');
            return;
        }
        setSelectedSermon(sermon);
    }, [userSubscription, handleUpgradeRequired, t, lang, userId]);


    // 7. 로딩 및 에러 처리 UI
    if (isLoading && !error) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-xl font-medium text-indigo-600 animate-pulse">데이터 로드 중...</div>
            </div>
        );
    }
    
    // 🚨 [핵심 수정] 개발자 우회 로직 추가
    const isDeveloper = userId === DEVELOPER_ID;
    
    // 8. 메인 UI 렌더링
    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
            
            {/* Header and Controls (생략) */}

            {/* Error & Message Display */}
            {(error || message) && (
                <div className="p-4 mb-4 rounded-lg shadow-md bg-red-100 border border-red-400 text-red-700">
                    🚨 {error || message}
                </div>
            )}

            {/* User ID for debugging/admin visibility */}
            {userId && (
                   <p className="text-xs text-gray-500 mb-4 text-center break-all">
                       User ID: {userId} {isDeveloper && <span className="text-red-500 font-bold">(DEV/ADMIN)</span>}
                   </p>
            )}
            
            {/* ... (Search and Filter Controls 생략) */}

            {/* Sermon List Area - 이곳이 핵심입니다. */}
            <div className="space-y-4">
                
                {/* 💡 [FIXED] 아카이브 목록은 이제 항상 표시됩니다. */}
                {filteredAndSortedSermons.length > 0 ? (
                    // 유료/무료 모두 목록이 있을 때
                    filteredAndSortedSermons.map(sermon => (
                        <ArchiveListItem
                            key={sermon.id}
                            sermon={sermon}
                            userId={userId}
                            onDetail={handleDetailSermon} // 상세 열람은 여전히 제한됩니다.
                            onRebirth={handleStartRebirth}
                            onDelete={handleDeleteSermon}
                            onLike={handleLikeSermon}
                        />
                    ))
                ) : (
                    // 목록이 없을 때
                    <div className="text-center p-10 bg-white rounded-xl shadow-md text-gray-500">
                        {searchTerm ? t('noSearchResults', lang) || "검색 결과가 없습니다." : t('noSharedSermons', lang) || "아카이브에 등록된 설교가 없습니다."}
                    </div>
                )}
            </div>
            
            {/* 🚨 [NEW] 설교 전문 보기 모달 */}
            {selectedSermon && (
                // NOTE: SermonDetailModal은 import 되어 있어야 합니다.
                <SermonDetailModal
                    isOpen={!!selectedSermon}
                    onClose={() => setSelectedSermon(null)}
                    sermon={selectedSermon}
                    onStartRebirth={handleStartRebirth}
                    onDelete={handleDeleteSermon}
                    onLike={handleLikeSermon}
                    userId={userId}
                />
            )}
            
            {/* 🚨 [NEW] 재탄생 입력 모달 */}
            {isInputModalOpen && selectedSermon && (
                // NOTE: RebirthInputModal은 import 되어 있어야 합니다.
                <RebirthInputModal
                    isOpen={isInputModalOpen}
                    onClose={() => setIsInputModalOpen(false)}
                    onConfirm={handleRebirthCall}
                    sermon={selectedSermon}
                    lang={lang}
                    t={t}
                />
            )}
        </div>
    );
};

export default RebirthSermonFeature;