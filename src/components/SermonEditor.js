"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
// 🚨 수정: 필요한 아이콘만 명시적으로 가져옵니다. (ToggleResearchIcon 제거)
import { GoBackIcon, PrintIcon, SaveIcon, ZoomInIcon, ZoomOutIcon } from './IconComponents'; 


// 💡 인라인 SVG 컴포넌트 정의 (ResearchIcon)
const ResearchIcon = (props) => (
    <svg 
        className={props.className} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* 돋보기와 연구/토글 패널을 나타내는 아이콘 경로 */}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
    </svg>
);

// 💡 인라인 SVG 컴포넌트 정의 (FullscreenIcon)
const FullscreenIcon = ({ className, isFullscreen }) => (
    <svg 
        className={className} 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* isFullscreen 상태에 따라 아이콘 변경 (확대/축소) */}
        {isFullscreen ? (
            // 축소 아이콘 (Exit Fullscreen)
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9V5m0 0V1m0 4h4m0 0h4m-4 0v4m0 0v4m0 4v4m0 0h-4m0 0h-4m4 0v-4m0 0v-4m0-4V5m0 0V1"></path>
        ) : (
            // 확대 아이콘 (Enter Fullscreen)
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4v4m0 0H8m8 0h4m0 0V4m0 4V4m0 0h-4m-4 8h8m-8 0v4m0-4V8m8 4v4m0-4V8m-4 0h-8m4 4v4m0-4V8"></path>
        )}
    </svg>
);


/**
 * 최종 설교 편집기 컴포넌트
 * 이 컴포넌트는 설교 초안을 표시하고, 편집, 저장, 주석 보기 등의 기능을 제공합니다.
 * @param {object} props
 * @param {string} props.initialContent - 설교 초안 텍스트
 * @param {string} props.initialCommentary - AI 주석 텍스트
 * @param {string} props.scriptureRef - 성경 구절 (Home.js에서 ""로 전달되나, 파싱을 위해 남겨둠)
 * @param {string} props.sermonTitle - 설교 제목 (Home.js에서 ""로 전달되나, 파싱을 위해 남겨둠)
 * @param {function} props.onClose - 편집기 닫기 핸들러
 * @param {function} props.onSave - 설교 저장 핸들러
 * @param {function} props.t - 다국어 번역 함수
 * @param {string} props.lang - 현재 선택된 언어 코드
 */
const SermonEditor = ({
    initialContent,
    initialCommentary,
    scriptureRef,
    sermonTitle,
    onClose,
    onSave,
    t,
    lang,
}) => {
    // 설교 본문은 편집 가능
    const [content, setContent] = useState(initialContent);
    // 주석 패널 토글 상태
    const [isResearchPanelVisible, setIsResearchPanelVisible] = useState(true);
    // 텍스트 확대/축소 상태
    const [fontSize, setFontSize] = useState(16);
    // 🚨 새 상태: 전체 화면 모드 상태
    const [isFullscreen, setIsFullscreen] = useState(false); 

    const MAX_FONT = 24;
    const MIN_FONT = 12;
    
    // 💡 구독자가 입력한 주제와 성경 구절을 content에서 추출 (스크린샷에 맞게 유지)
    const { displayedTopic, displayedScripture } = useMemo(() => {
        const lines = initialContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        // 1. 첫 번째 줄을 주제/제목으로 사용 (볼드체/마크다운 제거)
        const topic = lines.length > 0 ? lines[0].replace(/\*\*/g, '') : t('untitledSermon', lang) || '제목 없음';
        
        // 2. 두 번째 줄에서 성경 구절만 추출
        let scripture = scriptureRef || '';
        if (lines.length > 1) {
            // 'scriptureReference: 잠언 3:5-6' 또는 'Based on 1 John 3:15' 등을 파싱하여 구절만 남김
            const potentialRef = lines[1].replace(/\*\*/g, '').trim();
            // 구절 형식(ex: 'Matthew 5:14-16')을 찾거나 두 번째 줄 전체를 구절로 사용 (가장 안전한 방법)
            scripture = potentialRef; 
        }

        return {
            // 🚨 Sermon Title (하나님을 인정하는 지혜) 대신, 실제 내용에서 파싱한 주제를 사용
            displayedTopic: topic,
            displayedScripture: scripture,
        };
    }, [initialContent, scriptureRef, lang, t]);

    // ----------------------------------------------------------------------
    // Handlers
    // ----------------------------------------------------------------------

    const handleToggleResearchPanel = () => {
        setIsResearchPanelVisible(prev => !prev);
    };

    const handleZoomIn = () => {
        setFontSize(prev => Math.min(prev + 2, MAX_FONT));
    };

    const handleZoomOut = () => {
        setFontSize(prev => Math.max(prev - 2, MIN_FONT));
    };

    const handlePrint = () => {
        window.print();
    };

    // 🚨 새 핸들러: 전체 화면 토글
    const handleToggleFullscreen = () => {
        setIsFullscreen(prev => !prev);
        // 전체 화면 모드 진입 시 주석 패널을 숨깁니다.
        if (!isFullscreen) {
            setIsResearchPanelVisible(false);
        }
    };


    const handleSave = () => {
        // 실제 저장 로직을 상위 컴포넌트(Home.js)로 전달
        onSave({
            title: displayedTopic, // 추출된 주제를 제목으로 사용
            scripture: displayedScripture, // 추출된 구절을 사용
            content: content,
            commentary: initialCommentary,
            language: lang,
        });
    };

    // ----------------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------------
    
    // 🚨 전체 화면 모드일 때 메인 컨테이너에 적용할 클래스
    const mainContainerClasses = isFullscreen 
        ? "fixed inset-0 z-50 p-4 md:p-8 space-x-0 bg-gray-100" // 화면 전체 덮기
        : "flex w-full h-full p-4 md:p-8 space-x-4"; // 기본 레이아웃

    return (
        <div className={mainContainerClasses}> {/* 🚨 클래스 적용 */}
            {/* 1. 메인 편집 영역 (finalDraft) */}
            <div className={`flex-grow transition-all duration-300 ${isResearchPanelVisible && !isFullscreen ? 'w-2/3' : 'w-full'} ${isFullscreen ? 'h-full' : 'h-[calc(100vh-100px)]'}`}>
                <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col h-full">
                    
                    {/* 상단 제목/구절 영역 (스크린샷의 '하나님을 인정하는 지혜' 영역) */}
                    <div className="p-4 border-b bg-white">
                        <div className="flex items-center space-x-2">
                             {/* 🚨 닫기 버튼은 툴바가 아닌 이 영역에 배치하여 스크린샷과 유사하게 만듭니다. */}
                            <button 
                                onClick={onClose} 
                                className="flex items-center text-gray-600 hover:text-red-500 transition-colors"
                            >
                                <GoBackIcon className="w-5 h-5" />
                            </button>
                            {/* 🚨 수정: 제목 대신 주제가 크게 표시되고, 구절은 그 아래 작게 표시 */}
                            <div className="flex flex-col">
                                <h1 className="text-xl font-bold text-gray-800 break-words line-clamp-1" title={displayedTopic}>
                                    {displayedTopic}
                                </h1>
                                <p className="text-sm text-gray-500 italic mt-0.5">
                                    {t('scriptureReference', lang) || 'Scripture Reference'}: {displayedScripture}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 설교 본문 편집기 툴바 */}
                    <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                        
                        {/* 왼쪽: 본문 제목 */}
                        <h2 className="text-lg font-semibold text-gray-700">
                             {t('finalDraftTitle', lang) || 'Final Draft'} {/* 🚨 다국어 적용 */}
                        </h2>
                        
                        {/* 오른쪽: 저장, 프린트, 줌, 패널 토글, 전체 화면 */}
                        <div className="flex space-x-2 items-center">
                            
                            {/* 🚨 전체 화면 토글 버튼 */}
                            <button 
                                onClick={handleToggleFullscreen} 
                                className={`p-2 rounded-lg transition flex items-center ${isFullscreen ? 'bg-red-500 text-white hover:bg-red-600' : 'text-gray-600 hover:bg-gray-200'}`}
                                title={t(isFullscreen ? 'exitFullscreen' : 'enterFullscreen', lang) || (isFullscreen ? '전체 화면 종료' : '전체 화면')}
                            >
                                <FullscreenIcon className="w-5 h-5" isFullscreen={isFullscreen} />
                            </button>


                            {/* 패널 토글 버튼을 툴바에 배치 */}
                            <button 
                                onClick={handleToggleResearchPanel} 
                                // 전체 화면 모드일 때는 비활성화된 것처럼 보입니다.
                                disabled={isFullscreen}
                                className={`p-2 rounded-lg transition flex items-center ${isResearchPanelVisible && !isFullscreen ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                                title={t(isResearchPanelVisible ? 'hideResearch' : 'showResearch', lang) || (isResearchPanelVisible ? '숨기기' : '보이기')}
                            >
                                {/* 🚨 수정: ResearchIcon으로 대체 */}
                                <ResearchIcon className="w-5 h-5 mr-1" />
                                {t('toggleResearchButton', lang) || 'Toggle Research'} {/* 🚨 다국어 적용 */}
                            </button>
                            
                            <button 
                                onClick={handleSave} 
                                className="p-2 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition flex items-center"
                            >
                                <SaveIcon className="w-5 h-5 mr-1" />
                                {t('saveSermon', lang) || '저장하기'} {/* 🚨 다국어 적용 */}
                            </button>
                            <button 
                                onClick={handlePrint} 
                                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                            >
                                <PrintIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={handleZoomIn} 
                                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                            >
                                <ZoomInIcon className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={handleZoomOut} 
                                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg"
                            >
                                <ZoomOutIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* 설교 본문 (편집 가능) */}
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-grow w-full p-6 resize-none focus:outline-none bg-white text-gray-900 leading-relaxed"
                        style={{ fontSize: `${fontSize}px` }}
                        placeholder={t('sermonEditorPlaceholder', lang) || "여기에 설교 초안이 표시됩니다. 자유롭게 편집하세요."}
                    />
                </div>
            </div>

            {/* 2. 주석/연구 패널 */}
            <div 
                // 🚨 전체 화면 모드일 때는 숨깁니다.
                className={`bg-white rounded-xl shadow-2xl p-4 flex flex-col transition-all duration-300 ${isResearchPanelVisible && !isFullscreen ? 'w-1/3 block' : 'w-0 hidden'}`}
                style={{ minWidth: isResearchPanelVisible && !isFullscreen ? '300px' : '0px' }}
            >
                <div className="flex justify-between items-center border-b pb-3 mb-3">
                    <h3 className="text-lg font-bold text-indigo-700">
                        {t('researchPanelTitle', lang) || 'Research Panel Title'} {/* 🚨 다국어 적용 */}
                    </h3>
                    <button 
                        onClick={handleToggleResearchPanel} 
                        className="p-1 text-gray-600 hover:bg-gray-200 rounded-full"
                        title={t('hidePanel', lang) || '패널 숨기기'}
                    >
                        {/* 🚨 수정: ResearchIcon으로 대체 */}
                        <ResearchIcon className="w-5 h-5" />
                    </button>
                </div>
                
                {/* 핵심 주석 섹션 */}
                <div className="space-y-4 overflow-y-auto flex-grow">
                    
                    {/* 1. Core Commentary */}
                    <div className="research-section">
                        <h4 className="font-semibold text-gray-700 mb-2">
                            {t('coreCommentary', lang) || 'Core Commentary'} {/* 🚨 다국어 적용 */}
                        </h4>
                        <div className="p-3 text-sm bg-gray-50 border rounded-lg whitespace-pre-wrap text-gray-600">
                            {initialCommentary}
                        </div>
                    </div>
                    
                    {/* 2. Custom Request (스크린샷의 customRequest 필드) */}
                    <div className="research-section">
                        <h4 className="font-semibold text-gray-700 mb-2">
                            {t('customRequestTitle', lang) || 'Custom Request'} {/* 🚨 다국어 적용 */}
                        </h4>
                        {/* 실제 기능을 구현하지 않았으므로 입력 필드만 표시 */}
                        <input
                             type="text"
                             placeholder={t('requestPlaceholder', lang) || 'Enter research query...'}
                             className="w-full p-2 border rounded-lg text-sm"
                        />
                        <button className="w-full mt-2 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition">
                            {t('requestExample', lang) || 'Request Example'} {/* 🚨 다국어 적용 */}
                        </button>
                    </div>

                    {/* 3. AI Status (스크린샷의 aiStatus 필드) */}
                    <div className="research-section">
                        <h4 className="font-semibold text-gray-700 mb-2">
                             {t('aiStatusTitle', lang) || 'AI Status'} {/* 🚨 다국어 적용 */}
                        </h4>
                        <div className="p-3 text-sm bg-gray-50 border rounded-lg text-gray-600">
                            {t('generationSuccess', lang) || 'generationSuccess'}
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. 패널 토글 버튼 (패널이 숨겨져 있을 때만 표시) */}
            {!isResearchPanelVisible && !isFullscreen && ( // 🚨 전체 화면 모드일 때는 보이지 않음
                <button 
                    onClick={handleToggleResearchPanel} 
                    className="fixed right-4 top-1/2 transform -translate-y-1/2 p-3 bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-600 transition z-40"
                    title={t('showPanel', lang) || '연구 패널 보이기'}
                >
                    {/* 🚨 수정: ResearchIcon으로 대체 */}
                    <ResearchIcon className="w-6 h-6 rotate-180" />
                </button>
            )}
        </div>
    );
};

export default SermonEditor;
