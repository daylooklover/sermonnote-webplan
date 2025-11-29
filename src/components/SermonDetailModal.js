import React, { useState, useEffect, useCallback, useMemo } from 'react';
// 🚨 [FIX]: RebirthIcon을 RefreshCcwIcon으로 별칭 지정하여 Import 오류 해결
import { 
    CloseIcon, 
    HeartIcon, 
    RebirthIcon as RefreshCcwIcon, // 💡 IconComponents.js의 RebirthIcon을 RefreshCcwIcon으로 사용
    TrashIcon 
} from '@/components/IconComponents.js'; 

const DEVELOPER_ID = "DEV_ADMIN_ID_PLACEHOLDER"; 

const SermonDetailModal = ({ isOpen, onClose, sermon, onStartRebirth, onDelete, onLike, userId }) => {
    
    // 좋아요 초기 상태 설정
    const initialIsLiked = sermon?.likedBy?.includes(userId) || false;
    const initialLikesCount = sermon?.upvotes || 0;

    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likesCount, setLikesCount] = useState(initialLikesCount);

    // sermon prop이 변경될 때마다 좋아요 상태를 재동기화합니다.
    useEffect(() => {
        if (sermon) {
            setIsLiked(sermon.likedBy?.includes(userId) || false);
            setLikesCount(sermon.upvotes || 0);
        }
    }, [sermon, userId]);


    // 🚨 [FIX]: isOpen이 false일 때 null을 반환하여 런타임 오류 방지
    if (!isOpen || !sermon) return null;

    const date = sermon.sharedAt?.toDate ? sermon.sharedAt.toDate().toLocaleDateString('ko-KR') : '날짜 미상';

    // 삭제 권한 로직
    const canDelete = useMemo(() => {
        return sermon.authorId === userId || userId === DEVELOPER_ID;
    }, [sermon.authorId, userId]);


    const handleRebirthClick = () => {
        onClose(); 
        onStartRebirth(sermon); // 재탄생 프로세스를 시작합니다.
    };
    
    const handleLikeClick = () => {
        if (!userId) return; 
        onLike(sermon.id, !isLiked);
        // UI를 즉시 업데이트
        setLikesCount(prev => prev + (!isLiked ? 1 : -1));
        setIsLiked(prev => !prev);
    };

    
    return (
        // 🚨 [FIX] 모달 닫기 로직: 배경 클릭 시 모달 닫기 및 이벤트 전파 방지
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={onClose} 
        >
            <div 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()} // 👈 모달 내부 클릭은 전파 방지
            >
                
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate pr-4">
                        {sermon.title || "설교 전문"}
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition" title="닫기">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-6 overflow-y-auto whitespace-pre-wrap text-base leading-relaxed font-serif text-gray-800 dark:text-gray-200">
                    <p className="text-sm text-gray-500 mb-4 border-b pb-2">
                        등록일: {date} | 기반 메모: {sermon.originalMemo || '없음'}
                    </p>
                    {sermon.content}
                </div>
                
                {/* Footer Controls */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center shrink-0">
                    <div className='flex items-center space-x-4'>
                        {/* 좋아요 카운트 및 버튼 */}
                        {userId && (
                            <button
                                onClick={handleLikeClick}
                                className={`flex items-center px-3 py-2 rounded-full transition duration-150 ${isLiked ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-red-500 hover:bg-red-100'}`}
                            >
                                <HeartIcon className="w-5 h-5 mr-1" filled={isLiked} /> 
                                <span className="font-semibold">{likesCount} Likes</span>
                            </button>
                        )}
                        {/* 삭제 버튼 - 소유자 또는 개발자만 볼 수 있음 */}
                        {canDelete && ( 
                            <button
                                onClick={() => onDelete(sermon.id)}
                                className="flex items-center px-3 py-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition text-sm font-medium"
                                title="설교 삭제"
                            >
                                <TrashIcon className="w-4 h-4 mr-1"/>
                                <span>삭제</span>
                            </button>
                        )}
                    </div>

                    {/* 재탄생 시작 버튼 */}
                    <button
                        onClick={handleRebirthClick}
                        className="flex items-center px-5 py-2 bg-purple-600 text-white text-md font-bold rounded-full shadow-lg hover:bg-purple-700 transition transform hover:scale-105"
                    >
                        <RefreshCcwIcon className="w-5 h-5 mr-2" />
                        <span>설교 재탄생 시작</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SermonDetailModal;