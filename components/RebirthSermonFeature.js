"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
// import { doc, deleteDoc } from 'firebase/firestore'; // 주석 처리: 이 컴포넌트가 완전한 파일이 아님을 가정

// -------------------------------------------------------------------------
// DUMMY 컴포넌트 및 객체 정의 (실제 DB 연결 코드를 대체)
// -------------------------------------------------------------------------

// SermonDetailPage과 SermonCreatePage에 대한 더미 컴포넌트 (파일 구조 유지를 위함)
const SermonDetailPage = ({ onBack, onEdit, onDelete, sermon, user, lang, t }) => (
    <div className="p-8 max-w-4xl mx-auto bg-white rounded-xl shadow-lg min-h-[50vh]">
        <h2 className="text-3xl font-bold text-gray-800">{sermon.title}</h2>
        <p className="text-gray-600 mt-2">{t('sermonBody', lang)}: {sermon.body ? sermon.body.substring(0, 300) + '...' : '내용 없음'}</p>
        
        <div className="mt-6 space-x-2">
            <button onClick={onBack} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">{t('goBack', lang)}</button>
            <button onClick={() => onEdit(sermon)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">{t('editSermon', lang)}</button>
            <button onClick={() => onDelete(sermon.id)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">{t('deleteSermon', lang)}</button>
        </div>
    </div>
);

const SermonCreatePage = ({ onComplete, onCancel, sermonToEdit, isEditMode, user, lang, t }) => {
    // 임시 상태 및 DB 저장 로직 (더미)
    const [title, setTitle] = useState(sermonToEdit?.title || '');
    const [preacher, setPreacher] = useState(sermonToEdit?.preacher || (user ? user.uid.substring(0, 8) : ''));
    const [source, setSource] = useState(sermonToEdit?.source || '');
    const [body, setBody] = useState(sermonToEdit?.body || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!title.trim() || !preacher.trim() || !body.trim()) {
            alert(t('alertFillRequired', lang));
            return;
        }
        setIsSaving(true);
        console.log("Saving Sermon:", { title, preacher, source, body });

        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay

        setIsSaving(false);
        onComplete();
    };

    return (
        <div className="p-4 sm:p-8 max-w-4xl mx-auto bg-white rounded-xl shadow-lg min-h-[60vh]">
            <h2 className="text-3xl font-bold text-indigo-700 mb-6">{isEditMode ? t('editSermon', lang) : t('uploadSermon', lang)}</h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('sermonTitle', lang)}</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('sermonTitle', lang)} className="w-full p-3 border rounded-lg" disabled={isSaving} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('preacher', lang)}</label>
                        <input type="text" value={preacher} onChange={e => setPreacher(e.target.value)} placeholder={t('preacher', lang)} className="w-full p-3 border rounded-lg" disabled={isSaving} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('sourceLabel', lang)}</label>
                        <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder={t('sourcePlaceholder', lang)} className="w-full p-3 border rounded-lg" disabled={isSaving} />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('sermonBody', lang)}</label>
                    <textarea value={body} onChange={e => setBody(e.target.value)} rows="10" placeholder={t('sermonBodyPlaceholder', lang)} className="w-full p-3 border rounded-lg resize-y" disabled={isSaving}></textarea>
                </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-8">
                <button onClick={onCancel} className="px-6 py-3 bg-gray-300 text-gray-800 rounded-xl font-semibold hover:bg-gray-400 transition" disabled={isSaving}>
                    {t('cancel', lang)}
                </button>
                <button onClick={handleSave} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition" disabled={isSaving || !title.trim() || !preacher.trim() || !body.trim()}>
                    {isSaving ? `${t('saving', lang)}...` : (isEditMode ? t('saveChanges', lang) : t('saveSermon', lang))}
                </button>
            </div>
            {isSaving && <p className="text-center text-blue-600 mt-4">{t('saving', lang)}...</p>}
        </div>
    );
};


// Supabase 더미 객체 (실제 DB 연결 코드를 대체)
const supabase = { 
    from: () => ({ 
        select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
        delete: () => ({ eq: () => ({ eq: () => ({ error: null }) }) }),
    })
};


// 뷰 상태 상수 정의
const VIEW_STATES = {
    LIST: 'LIST',
    SERMON_CREATE: 'SERMON_CREATE',
    SERMON_EDIT: 'SERMON_EDIT',
    SERMON_DETAIL: 'SERMON_DETAIL',
};


// ----------------------------------------------------
// SermonListItem 컴포넌트
// ----------------------------------------------------
const SermonListItem = ({ sermon, onSelect, onEdit, lang, t }) => { 
    const formatDate = (timestamp) => {
        if (!timestamp) return t('dateUncertain', lang) || '날짜 미정'; // 다국어 적용
        const date = new Date(timestamp); 
        if (isNaN(date)) {
            const fallbackDate = new Date(Number(timestamp) * 1000);
            return isNaN(fallbackDate) ? t('dateError', lang) || '날짜 오류' : fallbackDate.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US');
        }
        return date.toLocaleDateString(lang === 'ko' ? 'ko-KR' : 'en-US');
    };

    return (
        <div 
            className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer"
            onClick={() => onSelect(sermon)}
        >
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-800 truncate">{sermon.title}</h3>
                <p className="text-sm text-gray-600 truncate mt-1">
                    {t('preacher', lang)}: {sermon.preacher} · {formatDate(sermon.created_at || sermon.createdAt)}
                </p>
            </div>
            <div className="flex space-x-2 ml-4">
                <button 
                    onClick={(e) => { 
                        e.stopPropagation();
                        onEdit(sermon); 
                    }}
                    className="p-2 text-sm text-indigo-600 hover:text-indigo-800 rounded-md bg-indigo-50 hover:bg-indigo-100 transition"
                >
                    {t('editSermon', lang)} 
                </button>
            </div>
        </div>
    );
};


// ----------------------------------------------------
// RebirthSermonFeature 메인 컴포넌트
// ----------------------------------------------------
const RebirthSermonFeature = ({ user, lang = 'ko', t, onGoBack }) => { // 🚨 FIX 1: onGoBack prop 받기
    // ----------------------------------------------------
    // 1. 상태 변수 정의
    // ----------------------------------------------------
    const [currentView, setCurrentView] = useState(VIEW_STATES.LIST);
    // 🚨 임시 더미 데이터로 초기화 (테스트용)
    const [sermons, setSermons] = useState([
        { id: 1, title: '믿음으로 말미암아 의롭다 함을 얻었나니', preacher: '사도 바울', created_at: Date.now(), like_count: 5, reinterpretation_count: 2, body: 'Sample content 1: 로마서 5:1절 말씀을 기반으로 한 강해 설교입니다.' },
        { id: 2, title: '그리스도 안에서 새롭게', preacher: 'J. Smith', created_at: Date.now() - 86400000, like_count: 10, reinterpretation_count: 5, body: 'Sample content 2: 고린도후서 5:17절을 중심으로 한 설교입니다.' }
    ]);
    const [sermonToEdit, setSermonToEdit] = useState(null);
    const [selectedSermon, setSelectedSermon] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // 더미 데이터 사용 시 false로 시작
    const [fetchError, setFetchError] = useState(null); 
    const [searchTerm, setSearchTerm] = useState('');
    const [sortType, setSortType] = useState('latest');

    const SERMON_TABLE = 'sermon_notes'; 
    const isUserLoggedIn = !!user;

    // ----------------------------------------------------
    // 2. 데이터 페칭 함수 (설교 목록 로딩) - 🔥 Supabase 로직 임시 주석 처리
    // ----------------------------------------------------
    const fetchSermons = useCallback(async () => {
        setFetchError(null); 

        if (!user) {
            console.log("User 객체 부재. 설교 패치 건너뜀.");
            setIsLoading(false);
            // setSermons([]); // 임시 데이터를 위해 주석 처리
            return;
        }

        setIsLoading(true); 
        // 실제 Supabase 로직은 제거하고 더미 데이터 로딩 시간만 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsLoading(false);

    }, [user]); // t를 의존성 배열에서 제거: fetchSermons는 데이터를 가져오는 역할에 집중

    // ----------------------------------------------------
    // 3. Effect Hooks (데이터 로드)
    // ----------------------------------------------------
    useEffect(() => {
        // fetchSermons(); // 초기 로딩을 방지하기 위해 주석 처리 (더미 데이터 사용 시)
    }, []); // fetchSermons를 의존성 배열에서 제거: 더미 데이터 사용

    // ----------------------------------------------------
    // 4. 필터링 및 정렬 로직 (클라이언트 측 정렬 유지)
    // ----------------------------------------------------
    const filteredSermons = useMemo(() => { 
        // 1. 검색어 필터링
        let tempSermons = sermons.filter(sermon =>
            (sermon.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
             sermon.preacher?.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // 2. 정렬 (클라이언트 측 정렬 로직 유지)
        if (sortType === 'likes') {
            tempSermons.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        } else if (sortType === 'reinterpretationCount') {
            tempSermons.sort((a, b) => (b.reinterpretation_count || 0) - (a.reinterpretation_count || 0));
        } else { // 'latest' (최신순) 정렬
            tempSermons.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); 
        }

        return tempSermons;
    }, [sermons, searchTerm, sortType]);


    // ----------------------------------------------------
    // 5. 핸들러 함수
    // ----------------------------------------------------

    const handleGoToCreate = useCallback(() => { 
        if (!isUserLoggedIn) {
            alert(t('loginRequiredMessage', lang)); 
            return;
        }
        setSermonToEdit(null);
        setCurrentView(VIEW_STATES.SERMON_CREATE); 
    }, [isUserLoggedIn, lang, t]); 

    const handleGoToDetail = useCallback((sermon) => {
        setSelectedSermon(sermon);
        setCurrentView(VIEW_STATES.SERMON_DETAIL);
    }, []);

    const handleGoBack = useCallback(() => {
        setCurrentView(VIEW_STATES.LIST);
        setSermonToEdit(null);
        setSelectedSermon(null);
    }, []);

    const handleSermonComplete = useCallback(() => {
        setCurrentView(VIEW_STATES.LIST);
        fetchSermons(); 
    }, [fetchSermons]);

    const handleGoToEdit = useCallback((sermon) => {
        setSermonToEdit(sermon);
        setCurrentView(VIEW_STATES.SERMON_EDIT);
    }, []);

    // 설교 삭제 핸들러 - 🔥 Supabase 로직 임시 주석 처리
    const handleDeleteSermon = useCallback(async (sermonId) => {
        if (!user || !window.confirm(t('deleteConfirm', lang))) return;
        
        try {
            // 🚨🚨🚨 Supabase 삭제 로직을 임시로 주석 처리합니다.
            
            alert(t('sermonDeletionSuccess', lang) || "설교가 성공적으로 삭제되었습니다."); // 다국어 적용
            setSermons(prev => prev.filter(s => s.id !== sermonId)); // 로컬 더미 삭제
            // fetchSermons(); // 삭제 후 목록 새로고침 (더미 데이터 사용 시 주석 처리)
        } catch (error) {
            console.error("🔥 Error deleting sermon: ", error.message);
            alert(`${t('sermonDeletionError', lang) || "설교 삭제 중 오류가 발생했습니다."}\n에러: ${error.message}`); // 다국어 적용
        }
    }, [user, lang, t]); 


    // ----------------------------------------------------
    // 6. 뷰 렌더링
    // ----------------------------------------------------
    
    if (currentView === VIEW_STATES.SERMON_CREATE || currentView === VIEW_STATES.SERMON_EDIT) {
        const isEditMode = currentView === VIEW_STATES.SERMON_EDIT;
        return (
            <SermonCreatePage 
                user={user}
                onComplete={handleSermonComplete}
                onCancel={handleGoBack}
                sermonToEdit={sermonToEdit}
                isEditMode={isEditMode}
                lang={lang}
                t={t} // 🚨 FIX 4: t prop 전달
            />
        );
    }
    
    if (currentView === VIEW_STATES.SERMON_DETAIL) {
        return (
            <SermonDetailPage
                sermon={selectedSermon}
                onBack={handleGoBack}
                onEdit={handleGoToEdit}
                onDelete={handleDeleteSermon}
                user={user}
                lang={lang}
                t={t} // 🚨 FIX 4: t prop 전달
            />
        );
    }

    // 🚨 LIST 뷰 렌더링
    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto bg-white shadow-2xl rounded-xl min-h-[70vh]">
            
            {/* 🚨 FIX: 뒤로가기 버튼 (상단) 🚨 */}
            <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={onGoBack} 
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-semibold flex items-center space-x-1"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    <span>{t('goBack', lang)}</span>
                </button>
                
                <h1 className="text-3xl font-extrabold text-indigo-700">
                    {t('rebirthSermonTitle', lang)}
                </h1>

                <button 
                    onClick={handleGoToCreate} 
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold shadow-lg flex items-center space-x-1"
                    disabled={!isUserLoggedIn}
                >
                    + {t('uploadSermon', lang)}
                </button>
            </div>

            {/* 검색 및 정렬 영역 */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
                <input
                    type="text"
                    placeholder={t('searchPlaceholder', lang)}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                />
                <select
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value)}
                    className="p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 md:w-40"
                >
                    <option value="latest">{t('latest', lang)}</option>
                    <option value="likes">{t('likes', lang)}</option>
                    <option value="reinterpretationCount">{t('reinterpretationCount', lang)}</option>
                </select>
            </div>

            {/* 설교 목록 영역 */}
            <div className="mt-8 min-h-[40vh]">
                {isLoading && (
                    <p className="text-center text-lg text-indigo-600 mt-10">
                        {t('sermonListLoading', lang)}
                    </p>
                )}
                
                {!isUserLoggedIn && !isLoading && (
                    <div className="text-center bg-yellow-50 p-6 rounded-lg mt-10 border border-yellow-200">
                        <h3 className="text-xl font-bold text-yellow-800">{t('loginRequiredTitle', lang)}</h3>
                        <p className="text-gray-600 mt-2">{t('loginRequiredMessage', lang)}</p>
                    </div>
                )}
                
                {/* ⚠️ 데이터 패치 오류 메시지 표시 */}
                {fetchError && !isLoading && isUserLoggedIn && (
                    <div className="text-center bg-red-50 p-6 rounded-lg mt-10 border border-red-200">
                        <h3 className="text-xl font-bold text-red-800">데이터 로딩 실패!</h3>
                        <p className="text-red-600 mt-2">{t('sermonFetchError', lang)}</p>
                        <p className="text-sm text-red-500 mt-1">에러: {fetchError}</p>
                    </div>
                )}
                
                {filteredSermons.length === 0 && !isLoading && isUserLoggedIn && !fetchError && (
                    <div className="flex flex-col items-center mt-12">
                        <p className="text-xl text-gray-500">{t('noSavedSermons', lang)}</p>
                        <p className="text-sm text-gray-400 mt-2">(우측 상단의 '+ 명설교 아카이브에 기록하기' 버튼을 이용해주세요.)</p>
                    </div>
                )}

                {filteredSermons.length > 0 && !isLoading && isUserLoggedIn && !fetchError && (
                    <div className="space-y-4">
                        {filteredSermons.map(sermon => (
                            <SermonListItem 
                                key={sermon.id} 
                                sermon={sermon} 
                                onSelect={handleGoToDetail} 
                                onEdit={handleGoToEdit} 
                                lang={lang} 
                                t={t} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RebirthSermonFeature;