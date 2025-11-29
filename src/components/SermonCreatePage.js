import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase'; // Supabase 클라이언트 임포트

// SermonCreatePage 컴포넌트는 설교를 작성하고 Supabase에 저장하는 역할을 합니다.
// user prop을 받아 인증된 사용자 ID를 저장에 사용합니다.
const SermonCreatePage = ({ 
    user, // Supabase user 객체 (id, email 등)를 포함
    onComplete, 
    onCancel, 
    sermonToEdit, // 수정할 설교 데이터
    isEditMode, 
    lang, 
    t 
}) => {
    // ----------------------------------------------------
    // 1. 상태 변수 정의
    // ----------------------------------------------------
    // Firebase 버전의 필드를 Supabase 버전 필드에 맞게 조정합니다.
    const [sermonData, setSermonData] = useState({
        title: '',
        preacher: '',
        source: '',
        body: '', // 기존 'content' -> 'body'로 변경
        // date 필드는 Supabase에서 created_at/updated_at로 자동 처리하거나 필요 시 별도로 추가해야 하지만,
        // 기존 Firebase 구조를 반영하여 단순화합니다.
    });
    const [isLoading, setIsLoading] = useState(false);
    const [saveError, setSaveError] = useState(null);

    const SERMON_TABLE = 'sermon_notes'; // Supabase 테이블 이름

    // ----------------------------------------------------
    // 2. 초기 데이터 로드 (수정 모드일 경우)
    // ----------------------------------------------------
    useEffect(() => {
        if (isEditMode && sermonToEdit) {
            setSermonData({
                title: sermonToEdit.title || '',
                preacher: sermonToEdit.preacher || '',
                source: sermonToEdit.source || '',
                body: sermonToEdit.content || sermonToEdit.body || '', // content 또는 body 필드를 모두 지원하도록 함
            });
        } else {
            // 생성 모드 초기화
            setSermonData({
                title: '',
                preacher: '',
                source: '',
                body: '',
            });
        }
    }, [isEditMode, sermonToEdit]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setSermonData(prev => ({ ...prev, [name]: value }));
    }, []);


    // ----------------------------------------------------
    // 3. 설교 저장/수정 핸들러 - 🔥 Supabase로 교체
    // ----------------------------------------------------
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setSaveError(null);

        // 필수 필드 검증
        if (!sermonData.title || !sermonData.preacher || !sermonData.body) {
            alert(t('alertFillRequired', lang) || '제목, 설교자, 본문은 필수 입력 사항입니다.');
            return;
        }

        // user.id는 Supabase에서 user.uid 대신 사용됩니다.
        if (!user || !user.id) {
            alert(t('loginRequiredMessage', lang) || '로그인 정보가 유효하지 않습니다.');
            return;
        }

        setIsLoading(true);

        try {
            // Supabase에 저장할 데이터 객체 (스네이크 케이스 선호)
            const dataToSave = {
                title: sermonData.title,
                preacher: sermonData.preacher,
                source: sermonData.source,
                body: sermonData.body,
                user_id: user.id, // 소유자 ID
                // created_at, updated_at은 Supabase에서 자동으로 처리
            };

            let error;

            if (isEditMode && sermonToEdit && sermonToEdit.id) {
                // 수정 모드: UPDATE 쿼리 사용
                const { error: updateError } = await supabase
                    .from(SERMON_TABLE)
                    .update(dataToSave)
                    .eq('id', sermonToEdit.id)
                    .eq('user_id', user.id); // 보안 강화를 위해 user_id도 함께 체크
                
                error = updateError;

            } else {
                // 생성 모드: INSERT 쿼리 사용
                const { error: insertError } = await supabase
                    .from(SERMON_TABLE)
                    .insert([
                        { 
                            ...dataToSave,
                            like_count: 0, // 초기값 설정
                            reinterpretation_count: 0, // 초기값 설정
                            view_count: 0, // 초기값 설정
                        }
                    ]);
                
                error = insertError;
            }

            if (error) {
                throw error;
            }

            // 성공 처리
            alert(`설교가 성공적으로 ${isEditMode ? '수정' : '저장'}되었습니다.`);
            onComplete(); // 목록 화면으로 돌아가기

        } catch (error) {
            console.error("🔥 Supabase Save Error: ", error.message);
            setSaveError(error.message);
            alert(`${t('saveError', lang) || '설교 저장 중 오류가 발생했습니다.'}\n상세: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    }, [sermonData, isEditMode, sermonToEdit, user, onComplete, lang, t]);

    // ----------------------------------------------------
    // 4. 렌더링
    // ----------------------------------------------------
    
    // 이전 Firebase 코드에 있던 InputField를 다시 포함합니다.
    // 재사용 가능한 입력 필드 서브 컴포넌트
    const InputField = ({ label, value, onChange, type = 'text', required = false, placeholder = '', name }) => (
        <div className="flex flex-col">
            <label className="text-md font-semibold mb-1 text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name} // name 속성 추가
                value={value}
                onChange={onChange}
                required={required}
                placeholder={placeholder}
                className="p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
            />
        </div>
    );

    return (
        <div className="flex flex-col p-4 md:p-8 min-h-screen bg-gray-100 text-gray-800 w-full max-w-4xl mx-auto shadow-2xl rounded-2xl">
            
            {/* 제목과 사용자 ID(이메일) 표시 */}
            <div className="flex justify-between items-end mb-6 border-b pb-3">
                <h1 className="text-3xl font-extrabold text-indigo-700">
                    {isEditMode ? t('editSermon', lang) : t('uploadSermon', lang)}
                </h1>
                {user && user.email && (
                    <p className="text-sm font-medium text-gray-600 bg-gray-200 px-3 py-1 rounded-full whitespace-nowrap">
                        {user.email}
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
                
                {/* 메타데이터 입력 필드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField 
                        label={t('sermonTitle', lang) || '설교 제목'} 
                        name="title" // name 추가
                        value={sermonData.title} 
                        onChange={handleChange} 
                        required 
                    />
                    <InputField 
                        label={t('preacher', lang)} 
                        name="preacher" // name 추가
                        value={sermonData.preacher} 
                        onChange={handleChange} 
                        required 
                    />
                    {/* date 필드는 Supabase에서 created_at/updated_at로 대체되므로 제외함.
                        별도 'date' 필드가 필요한 경우 SermonCreatePage.js의 초기 구조에서 date를 다시 추가해야 합니다.
                    <InputField 
                        label={t('date', lang)} 
                        type="date" 
                        value={sermonData.date} 
                        onChange={handleChange} 
                    /> */}
                    <InputField 
                        label={t('sourceLabel', lang)} 
                        name="source" // name 추가
                        value={sermonData.source} 
                        onChange={handleChange} 
                        placeholder={t('sourcePlaceholder', lang) || '예: 설교노트, 강해집, 개인 묵상'}
                    />
                </div>

                {/* 설교 본문 입력 필드 */}
                <div className="flex flex-col flex-1">
                    <label htmlFor="body" className="text-lg font-semibold mb-2 text-gray-700">{t('sermonBody', lang)} <span className="text-red-500">*</span></label>
                    <textarea
                        id="body"
                        name="body" // name 추가 (handleChange와 일치하도록)
                        value={sermonData.body}
                        onChange={handleChange}
                        placeholder={t('sermonBodyPlaceholder', lang) || '여기에 설교 전체 본문을 입력하십시오.'}
                        required
                        className="w-full p-4 border border-gray-300 rounded-xl flex-1 resize-none focus:ring-indigo-500 focus:border-indigo-500 min-h-[30vh]"
                    />
                </div>
                
                {/* 저장 오류 메시지 */}
                {saveError && (
                    <div className="text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 mt-4">
                        {t('saveError', lang) || '저장 오류'}: {saveError}
                    </div>
                )}


                {/* 액션 버튼 */}
                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="px-6 py-2 bg-gray-300 rounded-xl hover:bg-gray-400 transition font-semibold"
                        disabled={isLoading}
                    >
                        {t('cancel', lang)}
                    </button>
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`px-6 py-2 rounded-xl text-white font-bold shadow-lg transition flex items-center justify-center ${
                            isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('saving', lang) || '저장 중...'}
                            </>
                        ) : (
                            isEditMode ? t('saveChanges', lang) || '변경 사항 저장' : t('saveSermon', lang) || '설교 저장'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SermonCreatePage;
