"use client";

import React, { useState, useEffect, useCallback } from 'react';

// db prop은 제거되었으며, user 객체는 Supabase user 객체를 기대합니다.
export default function SermonList({ 
    user, // Supabase user 객체 (id, email 등)
    developerUID, 
    onSermonClick, 
    onEdit, 
    onDelete, 
    sermons, 
    isLoading, 
    error, 
    searchTerm, 
    t,
    lang 
}) { 
    
    // ----------------------------------------------------
    // 1. 데이터 필터링 로직 (클라이언트 측 필터링)
    // ----------------------------------------------------
    const filteredSermons = searchTerm
        ? sermons.filter(sermon => 
            sermon.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sermon.preacher?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : sermons;
    
    // ----------------------------------------------------
    // 2. 핸들러 함수들
    // ----------------------------------------------------
    
    // 삭제 핸들러 (부모의 onDelete 함수 호출)
    const handleDeleteClick = (e, sermonId, authorId) => {
        e.stopPropagation(); 
        if (onDelete) {
            onDelete(sermonId, authorId);
        }
    };
    
    // 수정 핸들러
    const handleEditClick = (e, sermon) => {
        e.stopPropagation(); 
        if (onEdit) {
            onEdit(sermon); 
        }
    };

    // ----------------------------------------------------
    // 3. UI 렌더링
    // ----------------------------------------------------
    if (isLoading) {
        return <div className="text-center text-white">{t('loadingSermons', lang) || "설교 목록을 불러오는 중..."}</div>;
    }

    if (error) {
        return <div className="text-center text-red-500">{t('errorLoadingSermons', lang) || `오류: ${error}`}</div>;
    }
    
    if (filteredSermons.length === 0) {
        const message = searchTerm 
            ? t('noSearchResults', lang) || `"${searchTerm}"에 대한 검색 결과가 없습니다.`
            : t('noSavedSermons', lang) || "등록된 설교가 없습니다.";
            
        return <div className="text-center text-gray-400">{message}</div>;
    }

    return (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
            {filteredSermons.map((sermon) => {
                // Supabase는 user_id를 사용하고 Firebase는 userId를 사용했을 수 있으므로 둘 다 확인합니다.
                const authorId = sermon.user_id || sermon.userId; 
                
                // Firebase의 user.uid 대신 Supabase의 user.id를 사용하도록 수정
                const isAuthor = user && user.id === authorId;
                const isDeveloper = user && user.id === developerUID;
                const canEditOrDelete = isAuthor || isDeveloper;

                return (
                    <li 
                        key={sermon.id} 
                        className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:bg-gray-700 transition relative"
                    >
                        {/* 설교 클릭 영역 */}
                        <div 
                            className="cursor-pointer pr-12" 
                            onClick={() => onSermonClick(sermon)} 
                        >
                            <h4 className="text-xl font-bold">{sermon.title}</h4>
                            <p className="text-gray-400">{t('preacher', lang) || '설교자'}: {sermon.preacher}</p>
                            {/* 작성자 ID 출력 시 user_id를 우선 사용합니다. */}
                            <p className="text-sm text-gray-500 mt-2">{t('authorId', lang) || '작성자 ID'}: {sermon.user_id || sermon.userId || 'N/A'}</p>
                        </div>
                        
                        {/* 수정 및 삭제 버튼 컨테이너 */}
                        {canEditOrDelete && (
                            <div className="absolute top-2 right-2 flex space-x-1">
                                
                                {/* 수정 버튼 */}
                                <button
                                    onClick={(e) => handleEditClick(e, sermon)}
                                    disabled={isLoading}
                                    className="p-2 text-indigo-400 hover:text-indigo-500 transition disabled:opacity-50"
                                    title={t('editSermon', lang) || "수정 (작성자/개발자 권한)"}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                    </svg>
                                </button>

                                {/* 삭제 버튼 */}
                                <button
                                    onClick={(e) => handleDeleteClick(e, sermon.id, authorId)}
                                    disabled={isLoading}
                                    className="p-2 text-red-400 hover:text-red-500 transition disabled:opacity-50"
                                    title={t('deleteSermon', lang) || "삭제 (작성자/개발자 권한)"}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                    </svg>
                                </button>
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
