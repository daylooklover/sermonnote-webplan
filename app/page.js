"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
// 🚨 모든 컴포넌트들은 @/components/에서 가져옵니다.
import { AuthProvider, useAuth } from '@/components/AuthContext.js';
import SermonDraftModal from '@/components/SermonDraftModal.js';
import SermonAssistantComponent from '@/components/SermonAssistantComponent.js';
import ExpositorySermonComponent from '@/components/ExpositorySermonComponent.js';
import RealLifeSermonComponent from '@/components/RealLifeSermonComponent.js';
import QuickMemoSermonComponent from '@/components/QuickMemoSermonComponent.js';
import RebirthSermonFeature from '@/components/RebirthSermonFeature.js';
import PremiumSubscriptionPage from '@/components/PremiumSubscriptionPage.js'; 
import LimitReachedModal from '@/components/LimitReachedModal.js';
import LoginModal from '@/components/LoginModal.js';
import QuickMemoModal from '@/components/QuickMemoModal.js';
// 🚨 아이콘 컴포넌트도 @/components/에서 가져옵니다.
import { 
    LoadingSpinner, GoBackIcon, PlusCircleIcon, BibleIcon, RealLifeIcon, 
    RebirthIcon, PremiumIcon, QuickMemoIcon 
} from '@/components/IconComponents.js';
// 라이브러리 및 유틸리티
import { SUBSCRIPTION_LIMITS } from '@/lib/constants'; 

// API 호출 경로 및 상수
const API_ENDPOINT = '/api/sermon-generator'; 
const MAX_SERMON_COUNT = 5; 

// --------------------------------------------------
// ⭐️ 상수 및 번역 정의 ⭐️
// --------------------------------------------------
const HERO_BG_COLOR = '#0f1a30'; 
const BACKGROUND_IMAGE_URL = '/images/background.jpg'; 

const SERMON_LIMITS = SUBSCRIPTION_LIMITS; 

const languageOptions = [
    { code: 'ko', nameKey: 'lang_ko' },
    { code: 'en', nameKey: 'lang_en' },
    { code: 'zh', nameKey: 'lang_zh' },
    { code: 'ru', nameKey: 'lang_ru' },
    { code: 'vi', nameKey: 'lang_vi' },
];

const translations = {
    // ----------------------------------------------------
    // 1. 한국어 (Korean: ko) 
    // ----------------------------------------------------
    ko: {
        lang_ko: '한국어', lang_en: '영어', lang_zh: '중국어', lang_ru: '러시아어', lang_vi: '베트남어',
        welcome: '환영합니다', logout: '로그아웃', login: '로그인', user: '사용자',
        loadingAuth: '인증 확인 중...', selectSermonType: '설교 유형을 선택해 주세요.',
        landingSubtitle: '신앙을 깊게 하고, 통찰력을 정리하세요.', start: '시작하기',
        chooseSermonType: '설교 유형 선택', chooseSermonTypeDescription: '가장 적합한 설교 유형을 선택하고 설교 준비를 시작하세요.',
        sermonAssistant: 'AI 설교 어시스턴트', expositorySermon: '강해 설교', realLifeSermon: '생활화 설교', 
        quickMemoSermon: '빠른 메모 설교', rebirthSermon: '설교 재탄생(Rebirth)', upgradeToPremium: '프리미엄으로 업그레이드',
        limitModalTitle: '무료 사용 횟수 초과', limitModalDescription: 'AI 설교 초안 생성 횟수가 모두 소진되었습니다. 무제한 사용을 위해 프리미엄으로 업그레이드하세요.',
        upgradeButton: '프리미엄 구독하기', closeButton: '닫기', goBack: '뒤로가기', clearChat: '대화 내용 지우기',
        sermonAssistantInitialTitle: "AI 설교 어시스턴트", sermonAssistantInitialDescription: "설교 초안 생성을 위해 질문을 시작해 보세요。",
        askAQuestionToBegin: "아래 입력창에 주제나 성경 구절을 입력하여 시작해 보세요。", startYourSermonConversation: "대화 시작",
        aiIsThinking: "AI가 답변을 생성 중입니다...", sermonAssistantInputPlaceholder: "설교 주제나 질문을 입력하세요...",
        loginToUseFeature: '해당 기능을 사용하려면 로그인이 필요합니다.', confirmClearChat: "모든 채팅 내용을 지우시겠습니까?",
        errorProcessingRequest: "요청 처리 중 오류가 발생했습니다", aiAssistantDefaultResponse: "답변이 도착했습니다。",
        loadingSermonTypes: "설교 유형을 불러오는 중입니다...",
        unknownSermonTypeError: "🚨 오류: 알 수 없는 설교 유형입니다。", 
        returnToSelection: "선택 화면으로 돌아가기", 
        
        // **********************************************
        // 🔑 RealLifeSermon & QuickMemo 키
        // **********************************************
        realLifeSermonTitle: '실생활 적용 설교',
        quickMemoModalTitle: '퀵메모 녹음',
        memo_converted_success: '음성 변환 완료',
        memo_recorded_text: '녹음된 메모',
        stt_record_button: 'STT로 녹음하기',
        memo_save_button: '메모 저장',
        memo_length_unit: '/50자',
        enterRealLifeTopic: '실생활 주제 입력',
        realLifeSermonDescription: '삶의 고민과 문제의 핵심을 입력하세요.',
        topicPlaceholder: '주제를 입력하세요 (예: 직장 생활의 스트레스)',
        recommendScripture: '말씀 구절 추천 받기',
        
        // **********************************************
        // 🔑 추가 요청된 키 (퀵메모 목록, 설교 초안 등)
        // **********************************************
        sermonDraftTitle: '설교 초안',
        selectedMemoTitle: '선택된 메모',
        quickMemoListTitle: '퀵 메모 목록',
        limitReached: '한계 도달',
        registerArchive: '아카이브 등록',
        print: '인쇄',
        downloadDraft: '초안 다운로드',
        
        // ExpositorySermonComponent.js에서 사용되는 키
        expositorySermonTitle: '강해 설교',
        sermonLimit: '설교 횟수: {0}회', // {0} = sermonCount
        scriptureTitle: '말씀 (Scripture)',
        expositoryDescription: '말씀 정보를 입력하세요.',
        scripturePlaceholder: '성경 구절 입력 (예: 요 3:16)',
        gettingScripture: '말씀 가져오는 중...',
        getScripture: '말씀 가져오기',
        aiCommentaryTitle: 'AI 해설',
        generating: '생성 중...',
        getCommentary: '해설 생성',
        commentaryLimit: '해설 {0}회 남음', // {0} = remainingCommentary
        premiumUnlimited: '프리미엄 (무제한)',
        crossReferencesTitle: '교차 참조',
        generateSermonFromCommentary: '해설로 설교 생성',
        generatingSermon: '설교 초안 생성 중...',
        generationFailed: '생성에 실패했습니다.',
        enterScriptureReference: '성경 구절을 입력해 주세요。',
        sermonLimitError: '설교 횟수를 초과했습니다.',
        commentaryLimitError: '해설 횟수를 초과했습니다。',
        apiReturnedEmptyResponse: 'API가 빈 응답을 반환했습니다.',
        addedToDraft: '초안에 추가되었습니다.',
        aiUsage: 'AI 사용:', 
        
        // 랜딩 페이지 제목/부제 (생략)
        landing_title_main: "SermonNote가 목회자님께 드리는 혁신적 혜택", landing_summary_main: "바쁜 일상 속에서 깊이 있는 설교를 준비하는 것은 쉽지 않습니다. SermonNote는 최첨단 AI 기술을 활용하여 목회자님의 시간을 절약하고, 더욱 풍성한 말씀으로 성도들을 양육할 수 있도록 돕습니다. 맞춤형 설교 생성부터 전문 연구 관리까지, 모든 과정을 스마트하게 지원합니다。",
        landing_title_1: 'AI 기반으로 설교 속도를 5배 빠르게', landing_summary_1: 'AI가 분석, 초안 작성, 내용 구성을 도와 정해진 시간 내에 초안을 완성하고 시간을 절약해 줍니다.',
        landing_title_2: '개인 설교 스타일을 학습하는 AI', landing_summary_2: '사용자의 이전 설교 스타일, 어휘, 신학적 관점을 학습하여 목회자님의 색깔이 담긴 맞춤 초안을 완성합니다.',
        landing_title_3: '글로벌 선교를 위한 맞춤형 언어 지원', landing_summary_3: '영어, 한국어뿐만 아니라 중국어, 러시아어, 베트남어 등 주요 선교 지역 언어의 설교 생성 및 편집을 지원합니다.',
        landing_title_4: '목회 사역에 대한 현명한 투자', landing_summary_4: 'SermonNote는 단순한 지출이 아닌, 효율적인 사역을 위한 핵심 투자입니다.',
        landing_title_5: '영감을 유지하고 묵상 심화 촉진', landing_summary_5: '떠오르는 영감을 놓치지 않고, 설교 묵상 단계를 체계적으로 심화시킵니다.',
        landing_title_6: '체계적인 설교 자료 연구 관리', landing_summary_6: '생성된 모든 설교, 묵상, 메모, 참고 자료를 자동으로 분류 및 정리하여 검색과 재활용이 용이합니다.',

        // 구독 관련 키 (생략)
        chooseYourPlan: '나에게 맞는 플랜을 선택하세요', planSubtitle: 'SermonNote는 모든 사용자에게 최적화된 패키지를 제공합니다。',
        monthly: '월별', annually: '연간', saveUpTo: '최대 {0}% 절약', bestValue: '최고 가치',
        planFreeMember: '무료 멤버십', freePlanDescription: 'SermonNote의 기본 기능을 무료로 체험해 보세요。',
        planStandardMember: '스탠다드 멤버십', standardPlanDescription: '설교 준비 효율을 높여주는 핵심 기능을 제공합니다。',
        planPremiumMember: '프리미엄 멤버십', premiumPlanDescription: '최고의 설교 경험을 위한 올인원 솔루션입니다。',
        "sermonGenTimes_free": "설교 생성 5회/월", "aiAnnotationTimes_free": "AI 주석 5회/월",
        "sermonGenTimes_std": "설교 생성 200회/월", "aiAnnotationTimes_std": "AI 주석 200회/월",
        "sermonGenTimes_prem": "설교 생성 400회/월", 
        "textEditor": "텍스트 에디터", "advancedTextEditor": "고급 AI 텍스트 에디터",
        "archiveAccessRestricted": "아카이브 열람 (제한적)", "archiveAccessFull": "아카이브 열람 (무제한)",
        "archiveShareLimited_free": "아카이브 등록 1회/월", "archiveShareLimited_std": "아카이브 등록 5회/월",
        "archiveShareLimited_prem": "아카이브 등록 10회/월",
        "unlimitedAnnotation": "무제한 AI 주석", 
        "limitedSupport": "우선 기술 지원 (제한적)", "unlimitedSupport": "우선 기술 지원 (무제한)",
        getStarted: '시작하기', subscribeNow: '지금 구독하기', sermonSelectionReturn: '시작 화면으로 돌아가기',
        year: '년', month: '개월', billedAnnualy: '연간 {0} $ 청구', saveVsMonthly: '월별 대비 {0}% 절약',
        subscriptionSuccessful: '구독 성공!', welcomePremiumTier: '프리미엄 멤버십에 오신 것을 환영합니다. SermonNote의 모든 기능을 무제한으로 누려보세요。',
        startWritingSermons: '설교 작성 시작',
        upgradeRequired: '유료 멤버십 업그레이드가 필요합니다。',
        archiveAccessRestriction: '공유 아카이브 목록은 유료 멤버십 전용 기능입니다。',
        upgradeBenefit: '유료 멤버십으로 업그레이드하시면 수많은 설교 아카이브를 자유롭게 열람하고 재탄생시킬 수 있습니다。',
        upgradeNow: '지금 업그레이드하기',
        archiveAccess: '아카이브 접근',
        aiAssistantDesc: 'AI 어시스턴트가 주제나 성경 구절을 바탕으로 설교 초안 작성을 도와줍니다。',
        expositoryDesc: '성경 본문을 깊이 있게 분석하고 구조화하여 강력한 강해 설교를 완성합니다。',
        realLifeDesc: '현대 사회 이슈와 삶의 고민에 연결된 실생활 적용 중심의 설교를 만듭니다。',
        quickMemoDesc: '떠오르는 짧은 영감이나 묵상 노트를 풍성한 설교로 빠르고 쉽게 확장합니다。',
        rebirthDesc: '기존의 설교 자료를 업로드하면, AI가 최신 스타일로 재구성하고 보완해 줍니다。',
        upgradeDesc: '프리미엄 구독을 통해 모든 AI 기능과 무제한 설교 생성을 경험해 보세요。',
    },
    // ----------------------------------------------------
    // 2. 영어 (English: en)
    // ----------------------------------------------------
    en: {
        lang_ko: 'Korean', lang_en: 'English', lang_zh: 'Chinese', lang_ru: 'Russian', lang_vi: 'Vietnamese',
        welcome: 'Welcome', logout: 'Logout', login: 'Login', user: 'User',
        loadingAuth: 'Verifying authentication...', selectSermonType: 'Please select a sermon type.',
        landingSubtitle: 'Deepen your faith and organize your insights.', start: 'Start',
        chooseSermonType: 'Choose Sermon Type', chooseSermonTypeDescription: 'Select the most suitable sermon type to start preparing your message.',
        sermonAssistant: 'AI Sermon Assistant', expositorySermon: 'Expository Sermon', realLifeSermon: 'Real-Life Sermon', 
        quickMemoSermon: 'Quick Memo Sermon', rebirthSermon: 'Sermon Rebirth', upgradeToPremium: 'Upgrade to Premium',
        limitModalTitle: 'Free Usage Limit Exceeded', limitModalDescription: 'You have used all your free AI sermon draft generations. Upgrade to Premium for unlimited use.',
        upgradeButton: 'Subscribe to Premium', closeButton: 'Close', goBack: 'Go Back', clearChat: 'Clear Chat',
        sermonAssistantInitialTitle: "AI Sermon Assistant", sermonAssistantInitialDescription: "Start a conversation to generate sermon drafts.",
        askAQuestionToBegin: "Start by entering a topic or scripture reference in the input box below.", startYourSermonConversation: "Start Conversation",
        aiIsThinking: "AI is generating a response...", sermonAssistantInputPlaceholder: "Enter your sermon topic or question...",
        loginToUseFeature: 'Login is required to use this feature.', confirmClearChat: "Are you sure you want to clear all chat content?",
        errorProcessingRequest: "An error occurred while processing the request", aiAssistantDefaultResponse: "A response has arrived.",
        loadingSermonTypes: "Loading sermon types...",
        unknownSermonTypeError: "🚨 Error: Unknown sermon type.",
        returnToSelection: "Return to selection screen",

        // **********************************************
        // 🔑 RealLifeSermon & QuickMemo 키
        // **********************************************
        realLifeSermonTitle: 'Real-Life Sermon',
        quickMemoModalTitle: 'Quick Memo Recording',
        memo_converted_success: 'Voice conversion complete',
        memo_recorded_text: 'Recorded Memo',
        stt_record_button: 'Record with STT',
        memo_save_button: 'Save Memo',
        memo_length_unit: '/50 characters',
        enterRealLifeTopic: 'Enter Real-Life Topic',
        realLifeSermonDescription: "Enter the core of life's struggles and issues.",
        topicPlaceholder: 'Enter topic (e.g., workplace stress)',
        recommendScripture: 'Recommend Scripture',

        // **********************************************
        // 🔑 추가 요청된 키 (퀵메모 목록, 설교 초안 등)
        // **********************************************
        sermonDraftTitle: 'Sermon Draft',
        selectedMemoTitle: 'Selected Memo',
        quickMemoListTitle: 'Quick Memo List',
        limitReached: 'Limit Reached',
        registerArchive: 'Register Archive',
        print: 'Print',
        downloadDraft: 'Download Draft',

        // ExpositorySermonComponent.js에서 사용되는 키
        expositorySermonTitle: 'Expository Sermon',
        sermonLimit: 'Sermon Limit: {0}',
        scriptureTitle: 'Scripture',
        expositoryDescription: 'Enter scripture information.',
        scripturePlaceholder: 'Enter scripture (e.g., John 3:16)',
        gettingScripture: 'Getting Scripture...',
        getScripture: 'Get Scripture',
        aiCommentaryTitle: 'AI Commentary',
        generating: 'Generating...',
        getCommentary: 'Get Commentary',
        commentaryLimit: '{0} Commentary left',
        premiumUnlimited: 'Premium (Unlimited)',
        crossReferencesTitle: 'Cross-References',
        generateSermonFromCommentary: 'Generate Sermon from Commentary',
        generatingSermon: 'Generating Sermon Draft...',
        generationFailed: 'Generation failed.',
        enterScriptureReference: 'Please enter a scripture reference.',
        sermonLimitError: 'Sermon limit reached.',
        commentaryLimitError: 'Commentary limit reached.',
        apiReturnedEmptyResponse: 'API returned an empty response.',
        addedToDraft: 'added to draft.',
        aiUsage: 'AI Usage:',

        // 랜딩 페이지 제목/부제 (생략)
        landing_title_main: "SermonNote's Innovative Benefits for Pastors", landing_summary_main: "It's challenging to prepare a deep sermon amidst a busy schedule. SermonNote uses cutting-edge AI technology to save you time and help you nurture your congregation with a richer Word. From personalized sermon generation to professional research management, we smartly support every step of the process.",
        landing_title_1: '5x Faster Sermon Preparation with AI', landing_summary_1: 'AI assists with analysis, drafting, and content structure, helping you complete the draft within a set time and saving you hours.',
        landing_title_2: 'AI that Learns Your Personal Sermon Style', landing_summary_2: 'It learns your previous sermon style, vocabulary, and theological perspective to create personalized drafts reflecting your unique voice.',
        landing_title_3: 'Customized Language Support for Global Missions', landing_summary_3: 'Supports sermon generation and editing not just in English and Korean, but also in key mission languages like Chinese, Russian, and Vietnamese.',
        landing_title_4: 'A Wise Investment in Your Ministry', landing_summary_4: 'SermonNote is not just an expense, but a core investment for an efficient ministry.',
        landing_title_5: 'Maintain Inspiration and Deepen Meditation', landing_summary_5: 'Never lose a fleeting inspiration and systematically deepen your sermon meditation process.',
        landing_title_6: 'Systematic Sermon Material Research Management', landing_summary_6: 'Automatically categorize and organize all generated sermons, reflections, memos, and references for easy search and reuse.',

        // 구독 관련 키 (생략)
        chooseYourPlan: 'Choose the plan that’s right for you', planSubtitle: 'SermonNote offers optimized packages for every user.',
        monthly: 'Monthly', annually: 'Annually', saveUpTo: 'Save up to {0}%', bestValue: 'Best Value',
        planFreeMember: 'Free Membership', freePlanDescription: 'Experience the basic features of SermonNote for free.',
        planStandardMember: 'Standard Membership', standardPlanDescription: 'Provides essential features to boost sermon preparation efficiency.',
        planPremiumMember: 'Premium Membership', premiumPlanDescription: 'An all-in-one solution for the best sermon experience.',
        "sermonGenTimes_free": "5 Sermons/month", "aiAnnotationTimes_free": "5 AI Annotations/month",
        "sermonGenTimes_std": "200 Sermons/month", "aiAnnotationTimes_std": "200 AI Annotations/month",
        "sermonGenTimes_prem": "400 Sermons/month", 
        "textEditor": "Text Editor", "advancedTextEditor": "Advanced AI Text Editor",
        "archiveAccessRestricted": "Archive Access (Restricted)", "archiveAccessFull": "Archive Access (Full)",
        "archiveShareLimited_free": "Archive Share (1 time/month)", "archiveShareLimited_std": "Archive Share (5 times/month)",
        "archiveShareLimited_prem": "Archive Share (10 times/month)",
        "unlimitedAnnotation": "Unlimited AI Annotations", 
        "limitedSupport": "Priority Tech Support (Limited)", "unlimitedSupport": "Priority Tech Support (Unlimited)",
        getStarted: 'Get Started', subscribeNow: 'Subscribe Now', sermonSelectionReturn: 'Return to Sermon Type Selection',
        year: 'year', month: 'months', billedAnnualy: 'Billed annually at ${0}', saveVsMonthly: 'Save {0}% vs. Monthly',
        subscriptionSuccessful: 'Subscription Successful!', welcomePremiumTier: 'Welcome to Premium Membership. Enjoy unlimited access to all SermonNote features.',
        startWritingSermons: 'Start Writing Sermons',
        upgradeRequired: 'Premium Membership Upgrade Required.',
        archiveAccessRestriction: 'The shared archive list is a Premium Membership exclusive feature.',
        upgradeBenefit: 'Upgrade to view and rebirth countless sermon archives.',
        upgradeNow: 'Upgrade Now',
        archiveAccess: 'Archive Access',
        aiAssistantDesc: 'The AI assistant helps draft sermons based on a topic or scripture reference.',
        expositoryDesc: 'Analyze and structure biblical texts in depth to complete a powerful expository sermon.',
        realLifeDesc: 'Create practical, application-focused sermons connected to modern social issues and life struggles.',
        quickMemoDesc: 'Quickly and easily expand a brief inspiration or reflection note into a rich sermon.',
        rebirthDesc: 'Upload existing sermon materials, and the AI will restructure and complement them in a modern style.',
        upgradeDesc: 'Experience all AI features and unlimited sermon generation with a Premium subscription.',
    },
    // ----------------------------------------------------
    // 3. 중국어 (Chinese: zh)
    // ----------------------------------------------------
    zh: {
        lang_ko: '韩语', lang_en: '英语', lang_zh: '中文', lang_ru: '俄语', lang_vi: '越南语',
        welcome: '欢迎', logout: '登出', login: '登录', user: '用户',
        loadingAuth: '正在验证身份...', selectSermonType: '请选择讲道类型。',
        landingSubtitle: '深化您的信仰，整理您的见解。', start: '开始',
        chooseSermonType: '选择讲道类型', chooseSermonTypeDescription: '选择最适合的讲道类型开始准备您的信息。',
        sermonAssistant: 'AI 讲道助理', expositorySermon: '释经讲道', realLifeSermon: '生活化讲道', 
        quickMemoSermon: '快速备忘讲道', rebirthSermon: '讲道重生(Rebirth)', upgradeToPremium: '升级到高级会员',
        limitModalTitle: '免费使用次数已用尽', limitModalDescription: '您的 AI 讲道草稿生成次数已用尽。请升级到高级会员以获得无限使用权。',
        upgradeButton: '订阅高级会员', closeButton: '关闭', goBack: '返回', clearChat: '清除聊天内容',
        sermonAssistantInitialTitle: "AI 讲道助理", sermonAssistantInitialDescription: "开始对话以生成讲道草稿。",
        askAQuestionToBegin: "请在下面的输入框中输入主题或经文开始。", startYourSermonConversation: "开始对话",
        aiIsThinking: "AI 正在生成回复...", sermonAssistantInputPlaceholder: "输入您的讲道主题或问题...",
        loginToUseFeature: '使用此功能需要登录。', confirmClearChat: "确定要清除所有聊天内容吗？",
        errorProcessingRequest: "处理请求时发生错误", aiAssistantDefaultResponse: "回复已送达。",
        loadingSermonTypes: "正在加载讲道类型...",
        unknownSermonTypeError: "🚨 错误: 未知讲道类型。",
        returnToSelection: "返回选择画面",

        // **********************************************
        // 🔑 RealLifeSermon & QuickMemo 키
        // **********************************************
        realLifeSermonTitle: '生活化讲道',
        quickMemoModalTitle: '快速备忘录录音',
        memo_converted_success: '语音转换完成',
        memo_recorded_text: '已录制备忘录',
        stt_record_button: '使用 STT 录音',
        memo_save_button: '保存备忘录',
        memo_length_unit: '/50字',
        enterRealLifeTopic: '输入生活主题',
        realLifeSermonDescription: '输入生活中挣扎和问题的核心。',
        topicPlaceholder: '输入主题 (例: 职场压力)',
        recommendScripture: '推荐经文',

        // **********************************************
        // 🔑 추가 요청된 키 (퀵메모 목록, 설교 초안 등)
        // **********************************************
        sermonDraftTitle: '讲道草稿',
        selectedMemoTitle: '已选备忘录',
        quickMemoListTitle: '快速备忘录列表',
        limitReached: '达到上限',
        registerArchive: '注册档案',
        print: '打印',
        downloadDraft: '下载草稿',

        // ExpositorySermonComponent.js에서 사용되는 키
        expositorySermonTitle: '释经讲道',
        sermonLimit: '讲道次数: {0}次',
        scriptureTitle: '经文',
        expositoryDescription: '输入经文信息。',
        scripturePlaceholder: '输入经文 (例: 约 3:16)',
        gettingScripture: '获取经文中...',
        getScripture: '获取经文',
        aiCommentaryTitle: 'AI 注释',
        generating: '正在生成...',
        getCommentary: '生成注释',
        commentaryLimit: '剩余 {0} 次注释',
        premiumUnlimited: '至尊 (无限)',
        crossReferencesTitle: '交叉引用',
        generateSermonFromCommentary: '通过注释生成讲道',
        generatingSermon: '正在生成讲道初稿...',
        generationFailed: '生成失败。',
        enterScriptureReference: '请输入经文引用。',
        sermonLimitError: '讲道次数已达上限。',
        commentaryLimitError: '注释次数已达上限。',
        apiReturnedEmptyResponse: 'API 返回空响应。',
        addedToDraft: '已添加到草稿。',
        aiUsage: 'AI 使用:',

        // 랜딩 페이지 제목/부제 (생략)
        landing_title_main: "SermonNote 为牧者提供的创新益处", landing_summary_main: "在忙碌的日常生活中准备一篇深刻的讲道并非易事。SermonNote 利用尖端 AI 技术为您节省时间，并帮助您以更丰富的神的话语牧养信徒。从定制讲道生成到专业研究管理，智能支持所有过程。",
        landing_title_1: 'AI 赋能，讲道速度提升 5 倍', landing_summary_1: 'AI 协助分析、起草和内容构建，帮助您在规定时间内完成草稿并节省时间。',
        landing_title_2: '学习个人讲道风格的 AI', landing_summary_2: '学习用户先前的讲道风格、词汇和神学观点，完成带有牧者色彩的定制草稿。',
        landing_title_3: '为全球宣教定制的语言支持', landing_summary_3: '不仅支持英语、韩语，还支持中文、俄语、越南语等主要宣教区语言的讲道生成和编辑。',
        landing_title_4: '对牧养事工的明智投资', landing_summary_4: 'SermonNote 不仅仅是一笔支出，更是高效事工的核心投资。',
        landing_title_5: '保持灵感，促进默想深化', landing_summary_5: '不错失涌现的灵感，系统性地深化讲道默想阶段。',
        landing_title_6: '系统化讲道资料研究管理', landing_summary_6: '自动分类和整理所有生成的讲道、默想、备忘录和参考资料，便于搜索和重复使用。',

        // 구독 관련 키 (생략)
        chooseYourPlan: '选择适合您的计划', planSubtitle: 'SermonNote 为所有用户提供优化的套餐。',
        monthly: '每月', annually: '每年', saveUpTo: '最多节省 {0}%', bestValue: '最高价值',
        planFreeMember: '免费会员', freePlanDescription: '免费体验 SermonNote 的基本功能。',
        planStandardMember: '标准会员', standardPlanDescription: '提供提高讲道准备效率的核心功能。',
        planPremiumMember: '高级会员', premiumPlanDescription: '为获得最佳讲道体验的一站式解决方案。',
        "sermonGenTimes_free": "每月讲道生成 5 次", "aiAnnotationTimes_free": "每月 AI 注释 5 次",
        "sermonGenTimes_std": "每月讲道生成 200 次", "aiAnnotationTimes_std": "每月 AI 注释 200 次",
        "sermonGenTimes_prem": "每月讲道生成 400 次", 
        "textEditor": "文本编辑器", "advancedTextEditor": "高级 AI 文本编辑器",
        "archiveAccessRestricted": "档案库访问 (受限)", "archiveAccessFull": "档案库访问 (完整)",
        "archiveShareLimited_free": "档案库注册 1 次/月", "archiveShareLimited_std": "档案库注册 5 次/月",
        "archiveShareLimited_prem": "档案库注册 10 次/月",
        "unlimitedAnnotation": "无限 AI 注释", 
        "limitedSupport": "优先技术支持 (有限)", "unlimitedSupport": "优先技术支持 (无限)",
        getStarted: '开始使用', subscribeNow: '立即订阅', sermonSelectionReturn: '返回讲道类型选择画面',
        year: '年', month: '月', billedAnnualy: '每年收费 ${0}', saveVsMonthly: '相比每月节省 {0}%',
        subscriptionSuccessful: '订阅成功！', welcomePremiumTier: '欢迎加入高级会员。享受 SermonNote 的所有无限功能。',
        startWritingSermons: '开始撰写讲道',
        goBack: '返回',
        upgradeRequired: '需要升级到高级会员。',
        archiveAccessRestriction: '共享档案库列表是高级会员专属功能。',
        upgradeBenefit: '升级到高级会员，您可以自由查阅和重构无数讲道档案。',
        upgradeNow: '立即升级',
        archiveAccess: '档案库访问',
        aiAssistantDesc: 'AI 助理根据主题或经文帮助起草讲道稿。',
        expositoryDesc: '深入分析和结构化圣经文本，完成有力的释经讲道。',
        realLifeDesc: '创建与现代社会问题和生活烦恼相关的，以实际应用为中心的讲道。',
        quickMemoDesc: '快速轻松地将涌现的简短灵感或默想笔记扩展为丰富的讲道。',
        rebirthDesc: '查阅共享讲道档案并重构为新的讲道。',
        upgradeDesc: '查看高级会员订阅权益和计划。',
    },
    // ----------------------------------------------------
    // 4. 러시아어 (Russian: ru)
    // ----------------------------------------------------
    ru: {
        lang_ko: 'корейский', lang_en: 'английский', lang_zh: 'китайский', lang_ru: 'русский', lang_vi: 'вьетнамский',
        welcome: 'Добро пожаловать', logout: 'Выйти', login: 'Войти', user: 'Пользователь',
        loadingAuth: 'Проверка аутентификации...', selectSermonType: 'Пожалуйста, выберите тип проповеди.',
        landingSubtitle: 'Углубляйте свою веру и систематизируйте свои озарения.', start: 'Начать',
        chooseSermonType: 'Выберите тип проповеди', chooseSermonTypeDescription: 'Выберите наиболее подходящий тип проповеди, чтобы начать подготовку своего сообщения.',
        sermonAssistant: 'AI Ассистент Проповеди', expositorySermon: 'Экспозиционная Проповедь', realLifeSermon: 'Жизненная Проповедь', 
        quickMemoSermon: 'Проповедь по Быстрой Заметке', rebirthSermon: 'Перерождение проповеди', upgradeToPremium: 'Перейти на Премиум',
        limitModalTitle: 'Превышен лимит бесплатного использования', limitModalDescription: 'Вы исчерпали все бесплатные генерации черновых проповедей AI. Обновитесь до Премиум для неограниченного использования.',
        upgradeButton: 'Подписаться на Премиум', closeButton: 'Закрыть', goBack: 'Назад', clearChat: 'Очистить чат',
        sermonAssistantInitialTitle: "AI Ассистент Проповеди", sermonAssistantInitialDescription: "Начните разговор для генерации черновых проповедей.",
        askAQuestionToBegin: "Начните, введя тему или стих из Писания в поле ввода ниже.", startYourSermonConversation: "Начать разговор",
        aiIsThinking: "AI генерирует ответ...", sermonAssistantInputPlaceholder: "Введите тему проповеди или вопрос...",
        loginToUseFeature: 'Для использования этой функции требуется вход в систему.', confirmClearChat: "Вы уверены, что хотите очистить весь контент чата?",
        errorProcessingRequest: "Произошла ошибка при обработке запроса", aiAssistantDefaultResponse: "Ответ получен.",
        loadingSermonTypes: "Загрузка типов проповедей...",
        unknownSermonTypeError: "🚨 Ошибка: Неизвестный тип проповеди.",
        returnToSelection: "Вернуться к выбору",

        // **********************************************
        // 🔑 RealLifeSermon & QuickMemo 키
        // **********************************************
        realLifeSermonTitle: 'Жизненная Проповедь',
        quickMemoModalTitle: 'Запись быстрой заметки',
        memo_converted_success: 'Голосовое преобразование завершено',
        memo_recorded_text: 'Записанная заметка',
        stt_record_button: 'Запись с STT',
        memo_save_button: 'Сохранить заметку',
        memo_length_unit: '/50 символов',
        enterRealLifeTopic: 'Введите жизненную тему',
        realLifeSermonDescription: 'Введите суть жизненных проблем.',
        topicPlaceholder: 'Введите тему (напр., стресс на работе)',
        recommendScripture: 'Рекомендовать Писание',

        // **********************************************
        // 🔑 추가 요청된 키 (퀵메모 목록, 설교 초안 등)
        // **********************************************
        sermonDraftTitle: 'Черновик Проповеди',
        selectedMemoTitle: 'Выбранная Заметка',
        quickMemoListTitle: 'Список Быстрых Заметок',
        limitReached: 'Лимит Достигнут',
        registerArchive: 'Зарегистрировать Архив',
        print: 'Печать',
        downloadDraft: 'Скачать Черновик',

        // ExpositorySermonComponent.js에서 사용되는 키
        expositorySermonTitle: 'Экспозиционная Проповедь',
        sermonLimit: 'Лимит проповедей: {0}',
        scriptureTitle: 'Писание',
        expositoryDescription: 'Введите информацию о Писании.',
        scripturePlaceholder: 'Введите стих (напр. Ин 3:16)',
        gettingScripture: 'Получение Писания...',
        getScripture: 'Получить Писание',
        aiCommentaryTitle: 'AI Комментарий',
        generating: 'Генерация...',
        getCommentary: 'Получить Комментарий',
        commentaryLimit: 'Осталось {0} комментариев',
        premiumUnlimited: 'Премиум (Безлимит)',
        crossReferencesTitle: 'Перекрестные ссылки',
        generateSermonFromCommentary: 'Создать проповедь из комментария',
        generatingSermon: 'Генерация черновика проповеди...',
        generationFailed: 'Ошибка генерации.',
        enterScriptureReference: 'Введите ссылку на Писание.',
        sermonLimitError: 'Лимит проповедей исчерпан.',
        commentaryLimitError: 'Лимит комментариев исчерпан.',
        apiReturnedEmptyResponse: 'API вернул пустой ответ.',
        addedToDraft: 'Добавлено в черновик.',
        aiUsage: 'Использование AI:',

        // 랜딩 페이지 제목/부제 (생략)
        landing_title_main: "Инновационные преимущества SermonNote для пасторов", landing_summary_main: "Сложно подготовить глубокую проповедь в плотном графике. SermonNote использует передовые технологии AI, чтобы сэкономить ваше время и помочь вам питать прихожан более богатым Словом. От персонализированной генерации проповедей до профессионального управления исследованиями, мы разумно поддерживаем каждый шаг процесса.",
        landing_title_1: 'В 5 раз быстрее подготовка проповеди с AI', landing_summary_1: 'AI помогает с анализом, черновиком и структурой контента, помогая завершить черновик в установленное время и сэкономить часы.',
        landing_title_2: 'AI, изучающий ваш личный стиль проповеди', landing_summary_2: 'Он изучает ваш предыдущий стиль проповеди, словарный запас и богословскую перспективу для создания персонализированных черновиков, отражающих ваш уникальный голос.',
        landing_title_3: 'Индивидуальная языковая поддержка для глобальных миссий', landing_summary_3: 'Поддерживает генерацию и редактирование проповедей не только на английском и корейском, но и на ключевых миссионерских языках, таких как китайский, русский и вьетнамский.',
        landing_title_4: 'Мудрая инвестиция в ваше служение', landing_summary_4: 'SermonNote — это не просто расходы, а основная инвестиция для эффективного служения.',
        landing_title_5: 'Сохраняйте вдохновение и углубляйте медитацию', landing_summary_5: 'Никогда не упускайте мимолетное вдохновение и систематически углубляйте процесс медитации над проповедью.',
        landing_title_6: 'Систематическое управление исследованиями материалов для проповеди', landing_summary_6: 'Автоматически классифицирует и организует все сгенерированные проповеди, размышления, заметки и ссылки для легкого поиска и повторного использования.',

        // 구독 관련 키 (생략)
        chooseYourPlan: 'Выберите план, который подходит вам', planSubtitle: 'SermonNote предлагает оптимизированные пакеты для каждого пользователя.',
        monthly: 'Ежемесячно', annually: 'Ежегодно', saveUpTo: 'Сэкономьте до {0}%', bestValue: 'Лучшая Ценность',
        planFreeMember: 'Бесплатное Членство', freePlanDescription: 'Попробуйте основные функции SermonNote бесплатно.',
        planStandardMember: 'Стандартное Членство', standardPlanDescription: 'Предоставляет основные функции для повышения эффективности подготовки проповедей.',
        planPremiumMember: 'Премиум Членство', premiumPlanDescription: 'Универсальное решение для лучшего опыта проповеди.',
        "sermonGenTimes_free": "5 Проповедей/месяц", "aiAnnotationTimes_free": "5 AI Аннотаций/месяц",
        "sermonGenTimes_std": "200 Проповедей/месяц", "aiAnnotationTimes_std": "200 AI Аннотаций/месяц",
        "sermonGenTimes_prem": "400 Проповедей/месяц", 
        "textEditor": "Текстовый Редактор", "advancedTextEditor": "Продвинутый AI Текстовый Редактор",
        "archiveAccessRestricted": 'Доступ к архиву (Ограниченный)', "archiveAccessFull": 'Доступ к архиву (Полный)',
        "archiveShareLimited_free": "Регистрация в архиве 1 раз/месяц", "archiveShareLimited_std": "Регистрация в архиве 5 раз/месяц", "archiveShareLimited_prem": "Регистрация в архиве 10 раз/месяц",
        "unlimitedAnnotation": 'Неограниченные AI Аннотации', 
        "limitedSupport": 'Приоритетная Техническая Поддержка (Ограниченная)', "unlimitedSupport": 'Приоритетная Техническая Поддержка (Неограниченная)',
        getStarted: 'Начать', subscribeNow: 'Подписаться Сейчас', sermonSelectionReturn: 'Вернуться к выбору типа проповеди',
        year: 'год', month: 'месяцев', billedAnnualy: 'Счет ежегодно ${0}', saveVsMonthly: 'Сэкономить {0}% по сравнению с месячной',
        subscriptionSuccessful: 'Подписка Успешна!', welcomePremiumTier: 'Добро пожаловать в Премиум Членство. Наслаждайтесь неограниченным доступом ко всем функциям SermonNote.',
        startWritingSermons: 'Начать Писать Проповеди',
        upgradeRequired: 'Требуется обновление до Премиум Членства.',
        archiveAccessRestriction: 'Общий архивный список — это эксклюзивная функция Премиум Членства.',
        upgradeBenefit: 'Обновитесь, чтобы свободно просматривать и перерабатывать бесчисленные архивы проповедей.',
        upgradeNow: 'Обновить Сейчас',
        archiveAccess: 'Доступ к Архиву',
        aiAssistantDesc: 'AI ассистент помогает составить черновик проповеди на основе темы или стиха из Писания.',
        expositoryDesc: 'Глубоко анализируйте и структурируйте библейские тексты для завершения мощной экспозиционной проповеди.',
        realLifeDesc: 'Связывайте проблемы современной жизни с библейскими истинами, чтобы донести практические послания.',
        quickMemoDesc: 'Быстро и легко расширяйте краткое вдохновение или заметку для размышления в богатую проповедь.',
        rebirthDesc: 'Просмотр общих архивов проповедей и их перестройка в новые проповеди.',
        upgradeDesc: 'Проверить преимущества и планы подписки Premium Membership.',
    },
    // ----------------------------------------------------
    // 5. 베트남어 (Vietnamese: vi)
    // ----------------------------------------------------
    vi: {
        lang_ko: 'Hàn Quốc', lang_en: 'Tiếng Anh', lang_zh: 'Tiếng Trung', lang_ru: 'Tiếng Nga', lang_vi: 'Tiếng Việt',
        welcome: 'Chào mừng', logout: 'Đăng xuất', login: 'Đăng nhập', user: 'Người dùng',
        loadingAuth: 'Đang xác minh xác thực...', selectSermonType: 'Vui lòng chọn loại bài giảng.',
        landingSubtitle: 'Làm sâu sắc đức tin và sắp xếp những hiểu biết của bạn.', start: 'Bắt đầu',
        chooseSermonType: 'Chọn loại bài giảng', chooseSermonTypeDescription: 'Chọn loại bài giảng phù hợp nhất để bắt đầu chuẩn bị thông điệp của bạn.',
        sermonAssistant: 'Trợ lý Bài Giảng AI', expositorySermon: 'Bài Giảng Giải Nghĩa', realLifeSermon: 'Bài Giảng Đời Sống Thực', 
        quickMemoSermon: 'Bài Giảng Ghi Chú Nhanh', rebirthSermon: 'Bài Giảng Tái Sinh', upgradeToPremium: 'Nâng cấp lên Premium',
        limitModalTitle: 'Vượt quá giới hạn sử dụng miễn phí', limitModalDescription: 'Bạn đã sử dụng hết số lần tạo bản nháp bài giảng AI miễn phí. Nâng cấp lên Premium để sử dụng không giới hạn.',
        upgradeButton: 'Đăng ký Premium', closeButton: 'Đóng', goBack: 'Quay lại', clearChat: 'Xóa nội dung trò chuyện',
        sermonAssistantInitialTitle: "Trợ lý Bài Giảng AI", sermonAssistantInitialDescription: "Bắt đầu cuộc trò chuyện để tạo bản nháp bài giảng.",
        askAQuestionToBegin: "Bắt đầu bằng cách nhập chủ đề hoặc câu Kinh Thánh vào ô nhập bên dưới.", startYourSermonConversation: "Bắt đầu cuộc trò chuyện",
        aiIsThinking: "AI đang tạo phản hồi...", sermonAssistantInputPlaceholder: "Nhập chủ đề bài giảng hoặc câu hỏi của bạn...",
        loginToUseFeature: 'Cần đăng nhập để sử dụng tính năng này.', confirmClearChat: "Bạn có chắc chắn muốn xóa tất cả nội dung trò chuyện không?",
        errorProcessingRequest: "Đã xảy ra lỗi trong quá trình xử lý yêu cầu", aiAssistantDefaultResponse: "Phản hồi đã đến.",
        loadingSermonTypes: "Đang tải các loại bài giảng...",
        unknownSermonTypeError: "🚨 Lỗi: Loại bài giảng không xác định.",
        returnToSelection: "Quay lại màn hình chọn",

        // **********************************************
        // 🔑 RealLifeSermon & QuickMemo 키
        // **********************************************
        realLifeSermonTitle: 'Bài Giảng Đời Sống Thực',
        quickMemoModalTitle: 'Ghi Chú Nhanh',
        memo_converted_success: 'Chuyển đổi giọng nói hoàn tất',
        memo_recorded_text: 'Ghi chú đã ghi',
        stt_record_button: 'Ghi âm bằng STT',
        memo_save_button: 'Lưu ghi chú',
        memo_length_unit: '/50 ký tự',
        enterRealLifeTopic: 'Nhập chủ đề đời sống',
        realLifeSermonDescription: 'Nhập vấn đề cốt lõi của đời sống.',
        topicPlaceholder: 'Nhập chủ đề (VD: áp lực công việc)',
        recommendScripture: 'Đề xuất Kinh thánh',
        
        // **********************************************
        // 🔑 추가 요청된 키 (퀵메모 목록, 설교 초안 등)
        // **********************************************
        sermonDraftTitle: 'Bản Nháp Bài Giảng',
        selectedMemoTitle: 'Ghi Chú Đã Chọn',
        quickMemoListTitle: 'Danh Sách Ghi Chú Nhanh',
        limitReached: 'Đã Đạt Giới Hạn',
        registerArchive: 'Đăng Ký Lưu Trữ',
        print: 'In',
        downloadDraft: 'Tải Bản Nháp',

        // ExpositorySermonComponent.js에서 사용되는 키
        expositorySermonTitle: 'Bài giảng Giải Nghĩa',
        sermonLimit: 'Giới hạn bài giảng: {0}',
        scriptureTitle: 'Kinh thánh',
        expositoryDescription: 'Nhập thông tin kinh thánh.',
        scripturePlaceholder: 'Nhập đoạn Kinh thánh (VD: Giăng 3:16)',
        gettingScripture: 'Đang lấy Kinh thánh...',
        getScripture: 'Lấy Kinh thánh',
        aiCommentaryTitle: 'Chú giải AI',
        generating: 'Đang tạo...',
        getCommentary: 'Tạo chú giải',
        commentaryLimit: 'Còn {0} lần chú giải',
        premiumUnlimited: 'Cao cấp (Không giới hạn)',
        crossReferencesTitle: 'Tham chiếu chéo',
        generateSermonFromCommentary: 'Tạo bài giảng từ chú giải',
        generatingSermon: 'Đang tạo bản nháp bài giảng...',
        generationFailed: 'Tạo thất bại.',
        enterScriptureReference: 'Vui lòng nhập đoạn Kinh thánh.',
        sermonLimitError: 'Đã đạt giới hạn bài giảng.',
        commentaryLimitError: 'Đã đạt giới hạn chú giải.',
        apiReturnedEmptyResponse: 'API trả về phản hồi trống.',
        addedToDraft: 'Đã thêm vào bản nháp.',
        aiUsage: 'Sử dụng AI:',

        // 랜딩 페이지 제목/부제 (생략)
        landing_title_main: "Những Lợi Ích Đột Phá mà SermonNote Mang Đến cho Mục sư", landing_summary_main: "Việc chuẩn bị một bài giảng sâu sắc giữa lịch trình bận rộn không hề dễ dàng. SermonNote sử dụng công nghệ AI tiên tiến để tiết kiệm thời gian của quý mục sư và giúp nuôi dưỡng tín đồ bằng Lời Chúa phong phú hơn. Từ việc tạo bài giảng tùy chỉnh đến quản lý nghiên cứu chuyên nghiệp, chúng tôi hỗ trợ mọi quy trình một cách thông minh.",
        landing_title_1: 'Chuẩn bị bài giảng nhanh hơn 5 lần với AI', landing_summary_1: 'AI hỗ trợ phân tích, soạn thảo và xây dựng nội dung, giúp bạn hoàn thành bản nháp trong thời gian quy định và tiết kiệm thời gian.',
        landing_title_2: 'AI học hỏi phong cách bài giảng cá nhân', landing_summary_2: 'Học hỏi phong cách bài giảng, từ vựng và quan điểm thần học trước đây của người dùng để hoàn thành bản nháp tùy chỉnh mang màu sắc riêng của mục sư.',
        landing_title_3: 'Hỗ trợ ngôn ngữ tùy chỉnh cho công tác truyền giáo toàn cầu', landing_summary_3: 'Hỗ trợ tạo và chỉnh sửa bài giảng không chỉ bằng tiếng Anh, tiếng Hàn mà còn bằng các ngôn ngữ khu vực truyền giáo chính như tiếng Trung, tiếng Nga, tiếng Việt.',
        landing_title_4: 'Một khoản đầu tư thông minh vào chức vụ', landing_summary_4: 'SermonNote không chỉ là một khoản chi tiêu mà là một khoản đầu tư cốt lõ이 for a chức vụ hiệu quả.',
        landing_title_5: 'Duy trì cảm hứng và thúc đẩy thiền định sâu sắc', landing_summary_5: 'Không bỏ lỡ những cảm hứng chợt đến và hệ thống hóa quá trình thiền định bài giảng sâu sắc hơn.',
        landing_title_6: 'Quản lý nghiên cứu tài liệu bài giảng có hệ thống', landing_summary_6: 'Tự động phân loại và sắp xếp tất cả bài giảng, suy ngẫm, ghi chú và tài liệu tham khảo đã tạo, giúp dễ dàng tìm kiếm và tái sử dụng.',

        // 구독 관련 키 (생략)
        chooseYourPlan: 'Chọn gói phù hợp với bạn', planSubtitle: 'SermonNote cung cấp các gói tối ưu cho mọi người dùng.',
        monthly: 'Hàng tháng', annually: 'Hàng năm', saveUpTo: 'Tiết kiệm đến {0}%', bestValue: 'Giá trị Tốt nhất',
        planFreeMember: 'Thành viên Miễn phí', freePlanDescription: 'Trải nghiệm các tính năng cơ bản của SermonNote miễn phí.',
        planStandardMember: 'Thành viên Tiêu chuẩn', standardPlanDescription: 'Cung cấp các tính năng cốt lõi giúp tăng hiệu quả chuẩn bị bài giảng.',
        planPremiumMember: 'Thành viên Premium', premiumPlanDescription: 'Giải pháp tất cả trong một cho trải nghiệm bài giảng tốt nhất.',
        "sermonGenTimes_free": "Tạo bài giảng 5 lần/tháng", "aiAnnotationTimes_free": "Chú thích AI 5 lần/tháng",
        "sermonGenTimes_std": "Tạo bài giảng 200 lần/tháng", "aiAnnotationTimes_std": "Chú thích AI 200 lần/tháng",
        "sermonGenTimes_prem": "Tạo bài giảng 400 lần/tháng", 
        "textEditor": "Trình chỉnh sửa văn bản", "advancedTextEditor": "Trình chỉnh sửa văn bản AI nâng cao",
        "archiveAccessRestricted": 'Truy cập Kho lưu trữ (Giới hạn)', "archiveAccessFull": 'Truy cập Kho lưu trữ (Toàn bộ)',
        "archiveShareLimited_free": "Đăng ký lưu trữ 1 lần/tháng", "archiveShareLimited_std": "Đăng ký lưu trữ 5 lần/tháng", "archiveShareLimited_prem": "Đăng ký lưu trữ 10 lần/tháng",
        "unlimitedAnnotation": 'Chú thích AI không giới hạn', 
        "limitedSupport": 'Hỗ trợ kỹ thuật ưu tiên (Giới hạn)', "unlimitedSupport": 'Hỗ trợ kỹ thuật ưu tiên (Không giới hạn)',
        getStarted: 'Bắt đầu', subscribeNow: 'Đăng ký ngay', sermonSelectionReturn: 'Quay lại màn hình chọn loại bài giảng',
        year: 'năm', month: 'tháng', billedAnnualy: 'Thanh toán hàng năm ${0}', saveVsMonthly: 'Tiết kiệm {0}% so với hàng tháng',
        subscriptionSuccessful: 'Đăng ký thành công!', welcomePremiumTier: 'Chào mừng đến với Thành viên Premium. Tận hưởng không giới hạn tất cả các tính năng của SermonNote.',
        startWritingSermons: 'Bắt đầu Viết Bài Giảng',
        upgradeRequired: 'Cần nâng cấp lên Thành viên Premium.',
        archiveAccessRestriction: 'Danh sách kho lưu trữ được chia sẻ là tính năng độc quyền của Thành viên Premium.',
        upgradeBenefit: 'Nâng cấp để xem và tái tạo vô số kho lưu trữ bài giảng một cách tự do.',
        upgradeNow: 'Nâng cấp ngay',
        archiveAccess: 'Truy cập Kho lưu trữ',
        aiAssistantDesc: 'Trợ lý AI giúp soạn thảo bản nháp bài giảng dựa trên chủ đề hoặc câu Kinh Thánh.',
        expositoryDesc: 'Phân tích sâu sắc và cấu trúc hóa văn bản Kinh Thánh để hoàn thành một bài giảng giải nghĩa mạnh mẽ.',
        realLifeDesc: 'Tạo các bài giảng tập trung vào ứng dụng thực tế, kết nối với các vấn đề xã hội hiện đại và những khó khăn trong cuộc sống.',
        quickMemoDesc: 'Nhanh chóng và dễ dàng mở rộng một cảm hứng ngắn hoặc ghi chú suy ngẫm thành một bài giảng phong phú.',
        rebirthDesc: 'Xem kho lưu trữ bài giảng được chia sẻ và tái tạo chúng thành bài giảng mới.',
        upgradeDesc: 'Kiểm tra các lợi ích và gói đăng ký Premium Membership。',
    }
};

// 💡 다국어 헬퍼 함수
const t = (key, lang = 'ko', ...args) => {
    let text = translations[lang]?.[key] || translations['en']?.[key] || key;
    args.forEach((arg, index) => {
        text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), arg);
    });
    return text;
};


// --------------------------------------------------
// RenderLandingPage (유지)
// --------------------------------------------------
const RenderLandingPage = React.memo(({ onGetStarted, lang }) => {
    
    const featureItems = useMemo(() => [
        { icon: '⚡', title: t('landing_title_1', lang), summary: t('landing_summary_1', lang) },
        { icon: '🧠', title: t('landing_title_2', lang), summary: t('landing_summary_2', lang) },
        { icon: '🌍', title: t('landing_title_3', lang), summary: t('landing_summary_3', lang) },
        { icon: '💰', title: t('landing_title_4', lang), summary: t('landing_summary_4', lang) },
        { icon: '✍️', title: t('landing_title_5', lang), summary: t('landing_summary_5', lang) },
        { icon: '🗂️', title: t('landing_title_6', lang) || '체계적인 설교 자료 연구 관리', summary: t('landing_summary_6', lang) },
    ], [lang]);

    const HeroSection = () => (
        <div 
            className="relative w-full flex flex-col items-center justify-center text-white overflow-hidden" 
            style={{ 
                minHeight: 'calc(100vh - 64px)', 
                backgroundColor: HERO_BG_COLOR, 
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(${BACKGROUND_IMAGE_URL})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed', // Parallax 효과 유지
            }}
        >
            <div className="absolute inset-0 bg-black opacity-30"></div> 
            
            {/* 💡 [수정 부분]: move-background와 twinkle 두 애니메이션 동시 적용 */}
            <div 
                className="absolute inset-0 z-0 opacity-10" 
                style={{
                    // 작은 흰색 점들을 배경으로 사용
                    backgroundImage: 'radial-gradient(#ffffff20 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    // 🚨 [FIXED] 두 애니메이션을 공백으로 구분하여 적용합니다.
                    animation: 'move-background 20s linear infinite, twinkle 2.5s infinite alternate', 
                }}
            ></div>
            
            <div className="relative text-center max-w-4xl p-8 z-10"> 
                <h1 style={{ fontSize: '7rem', lineHeight: '1.1', fontWeight: 800 }} className="mb-4 drop-shadow-lg">SermonNote</h1>
                <p className="text-xl md:text-2xl font-light mb-8 drop-shadow-md">{t('landingSubtitle', lang)}</p>
                <button onClick={onGetStarted} type="button" className="px-10 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-red-700 transition transform hover:scale-105">{t('start', lang)}</button>
            </div>
        </div>
    );
    
    const FeaturesSection = () => (
        <div className="w-full bg-white py-16 px-8 dark:bg-gray-900">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-800 dark:text-gray-100 mb-12 border-b-4 border-red-500 pb-2">{t('landing_title_main', lang)}</h2>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">{t('landing_summary_main', lang)}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {featureItems.map((item, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition hover:shadow-2xl flex flex-col h-full">
                            <div className="text-4xl mb-4 text-red-500">{item.icon}</div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">{item.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm flex-1">{item.summary}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full min-h-full flex flex-col items-center">
            <HeroSection />
            <FeaturesSection />
        </div>
    );
});


// --------------------------------------------------
// SermonSelection (유지)
// --------------------------------------------------
const SermonSelection = React.memo(({ user, setSelectedSermonType, openLoginModal, onGoToLanding, lang, loading }) => {
    
    const sermonTypes = useMemo(() => [
        { type: 'ai-assistant-sermon', title: t('sermonAssistant', lang), description: t('aiAssistantDesc', lang), icon: <PlusCircleIcon className="w-10 h-10 text-blue-500" /> },
        { type: 'expository-sermon', title: t('expositorySermon', lang), description: t('expositoryDesc', lang), icon: <BibleIcon className="w-10 h-10 text-green-500" /> },
        { type: 'real-life-sermon', title: t('realLifeSermon', lang), description: t('realLifeDesc', lang), icon: <RealLifeIcon className="w-10 h-10 text-red-500" /> },
        { type: 'quick-memo-sermon', title: t('quickMemoSermon', lang), description: t('quickMemoDesc', lang), icon: <QuickMemoIcon className="w-10 h-10 text-yellow-500" /> },
        { type: 'rebirth-sermon', title: t('rebirthSermon', lang), description: t('rebirthDesc', lang), icon: <RebirthIcon className="w-10 h-10 text-purple-500" /> },
        { type: 'premium-upgrade', title: t('upgradeToPremium', lang), description: t('upgradeDesc', lang), icon: <PremiumIcon className="w-10 h-10 text-yellow-600" /> }
    ], [lang]); 

    const isAuthenticated = user && user.uid; 
    
    return (
        <div className="w-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans min-h-screen pt-16">
            <main className="text-center space-y-8 p-8 max-w-7xl mx-auto">
                <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-100">
                    {t('chooseSermonType', lang)}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    {t('chooseSermonTypeDescription', lang)}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {sermonTypes.map(sermon => {
                        const handleClick = () => {
                            if (!isAuthenticated && !loading && sermon.type !== 'premium-upgrade') { 
                                openLoginModal(); 
                            } 
                            else if (isAuthenticated || sermon.type === 'premium-upgrade') {
                                setSelectedSermonType(sermon.type); 
                            }
                        };
                        
                        return (
                            <button
                                key={sermon.type}
                                onClick={handleClick}
                                className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700 text-left"
                            >
                                <div className="mb-4">{sermon.icon}</div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">{sermon.title}</h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{sermon.description}</p>
                            </button>
                        );
                    })}
                </div>
            </main>
            <div className="text-center pb-8">
                <button 
                    onClick={onGoToLanding} 
                    className="mt-6 text-sm text-gray-500 hover:text-gray-800 transition"
                >
                    {t('sermonSelectionReturn', lang)}
                </button>
            </div>
        </div>
    );
});


// --------------------------------------------------
// 메인 컴포넌트: HomeContent
// --------------------------------------------------

function HomeContent() {
    // ⭐️ useAuth Hooks 호출
    const { user, loading, authError, handleLogout: contextLogout, authInstance, dbInstance } = useAuth(); // dbInstance 추가
    
    const isFirebaseError = authError ? authError.includes("Firebase") : false; 
    
    // 🚨 FIX 4: 모든 상태 정의
    const [errorMessage, setErrorMessage] = useState(''); 
    const [sermonCount, setSermonCount] = useState(0); 
    const [commentaryCount, setCommentaryCount] = useState(0); 
    const [sermonDraft, setSermonDraft] = useState(null); 
    
    const [userSubscription, setUserSubscription] = useState('free'); // ⚠️ 임시로 'free'로 설정
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isDraftModalOpen, setIsDraftModalOpen] = useState(false); 
    
    // 🚨 [추가] 퀵메모 모달 상태
    const [isQuickMemoModalOpen, setIsQuickMemoModalOpen] = useState(false); 

    const [viewMode, setViewMode] = useState('landing'); 
    const [selectedSermonType, setSelectedSermonType] = useState('sermon-selection'); 
    const [lang, setLang] = useState('ko');
    
    // 🚨 FIX 5: sermonDraft에 값이 들어오면 모달을 엽니다.
    useEffect(() => {
        if (sermonDraft && sermonDraft.length > 0) { 
            setIsDraftModalOpen(true);
        }
    }, [sermonDraft]);

    // 🚨 FIX 6: 일반적인 모달 닫기 함수 (설교문까지 초기화)
    const closeDraftModalAndClear = useCallback(() => {
        setIsDraftModalOpen(false);
        setSermonDraft(null); 
    }, []);

    // 🚨 [NEW]: 아카이브 등록 성공 시 모달만 닫는 함수 (설교문 유지)
    const closeDraftModal = useCallback(() => {
        setIsDraftModalOpen(false);
        // setSermonDraft(null); 🛑 아카이브 등록 시 설교문 보존을 위해 제거
    }, []);

        
    // --------------------------------------------------
    // 핸들러 함수 (useCallback으로 안정화)
    // --------------------------------------------------
    const handleLogout = useCallback(async () => { 
        if (contextLogout) { 
            await contextLogout(); 
            setViewMode('landing'); 
            setSelectedSermonType('sermon-selection'); // 로그아웃 시 선택 화면으로 초기화
            setSermonCount(0); 
            setCommentaryCount(0);
            setUserSubscription('free'); 
        } 
    }, [contextLogout]);

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = useCallback(() => { setIsLoginModalOpen(false); }, []); 
    const closeLimitModal = useCallback(() => { setIsLimitModalOpen(false); }, []);
    
    // 💡 [NEW] 프리미엄 업그레이드 모달/페이지를 여는 함수 (Home.js의 역할)
    const openUpgradeModal = useCallback(() => {
        setIsLimitModalOpen(false); // Limit Modal에서 호출될 경우 닫기
        setSelectedSermonType('premium-upgrade'); // PremiumSubscriptionPage로 라우팅
        setViewMode('sermon');
    }, []);

    // 💡 [추가]: onLimitReached prop에 필요한 함수를 정의합니다.
    const handleLimitReached = useCallback(() => {
        setIsLimitModalOpen(true);
        console.log("[Limit] 사용 횟수 제한에 도달하여 LimitReachedModal을 엽니다.");
    }, []);
    
    // 🚨 [추가] 퀵메모 모달 닫기
    const closeQuickMemoModal = useCallback(() => setIsQuickMemoModalOpen(false), []); 

    // 🚨 [추가] 퀵메모 저장 완료 후 실행될 함수 (핵심 로직)
    const handleQuickMemoSaved = useCallback(() => {
        closeQuickMemoModal(); // 모달 닫기
        // 저장 후, 퀵메모 연계 설교 화면으로 전환
        setViewMode('sermon');
        setSelectedSermonType('quick-memo-sermon'); // 👈 목표 화면으로 전환
    }, [closeQuickMemoModal]);
    
    // 🚨 [수정] 노란색 FAB 아이콘 클릭 핸들러
    const handleQuickMemoClick = useCallback(() => {
        if (user && user.uid) {
            setIsQuickMemoModalOpen(true); // 👈 로그인 시 모달 열기
        } else {
            openLoginModal(); // 👈 비로그인 시 로그인 모달 열기
        }
    }, [user, openLoginModal]);
    
    const handleLogoClick = useCallback(() => { setViewMode('landing'); setSelectedSermonType('sermon-selection'); }, []); 
    
    const handleLoginSuccess = useCallback(() => { 
        setIsLoginModalOpen(false);
        if (user) {
            setViewMode('sermon');
            setSelectedSermonType('sermon-selection'); // 로그인 성공 시 선택 화면으로 이동
        }
    }, [user]); 
    
    const handleGetStarted = useCallback(() => {
        if (user && !isFirebaseError) { 
            setViewMode('sermon');
            setSelectedSermonType('sermon-selection'); // 시작하기 버튼 클릭 시 선택 화면으로 이동
        } else {
            openLoginModal(); 
        }
    }, [user, isFirebaseError]); 
    
    // --------------------------------------------------
    // AI 호출 중앙 집중화 함수 (generateSermon -> handleAPICall로 변경 및 수정)
    // --------------------------------------------------
    const handleAPICall = useCallback(async (prompt, endpoint, usageType) => {
        
        console.log(`[API Call] Attempting to call endpoint: ${endpoint} for type: ${usageType}`);
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: prompt, lang, type: usageType }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse server error response.' }));
                setErrorMessage(errorData.error || errorData.message || t('errorProcessingRequest', lang) + `: HTTP ${response.status}`);
                return null;
            }
            
            const data = await response.json();

            const responseText = data.response; 

            // 사용 횟수 업데이트
            if (usageType === 'commentary') {
                setCommentaryCount(prev => prev + 1);
            } else if (usageType === 'sermon') {
                setSermonCount(prev => prev + 1);
            }
            return responseText; // 응답 텍스트 반환
        } catch (error) {
            setErrorMessage(t('errorProcessingRequest', lang) + `: ` + error.message);
            return null;
        }
    }, [lang, setErrorMessage, setCommentaryCount, setSermonCount, t]); 
    
    // --------------------------------------------------
    // 구독 및 제한 상태 계산
    // --------------------------------------------------
    const SUBSCRIPTION_LIMITS_LOCAL = useMemo(() => ({
        free: { commentary: 5, sermon: 50 }, 
        standard: { commentary: 200, sermon: 200 }, 
        premium: { commentary: 9999, sermon: 9999 }
    }), []);
    
    const isUnlimited = userSubscription === 'premium';
    const limit = SUBSCRIPTION_LIMITS_LOCAL[userSubscription]?.commentary; 
    const canGenerateCommentary = isUnlimited || (commentaryCount < limit);

    const isUnlimitedSermon = userSubscription === 'premium';
    const sermonLimit = SUBSCRIPTION_LIMITS_LOCAL[userSubscription]?.sermon;
    const canGenerateSermon = isUnlimitedSermon || (sermonCount < sermonLimit);
    
    // --------------------------------------------------
    // 서비스 컴포넌트 렌더링
    // --------------------------------------------------
    const renderSermonComponent = useCallback(() => {
        const onGoToSelection = () => setSelectedSermonType('sermon-selection');
        
        const commonProps = {
            user: user,
            userId: user?.uid,
            db: dbInstance, 
            errorMessage: errorMessage, 
            setErrorMessage: setErrorMessage, 
            setSermonDraft: setSermonDraft, 
            commentaryCount: commentaryCount, 
            canGenerateCommentary: canGenerateCommentary, 
            canGenerateSermon: canGenerateSermon, 
            handleAPICall: handleAPICall, 
            onGoBack: onGoToSelection, 
            
            t: (key, ...args) => t(key, lang, ...args), 
            
            lang: lang,
            sermonCount: sermonCount,
            setSermonCount: setSermonCount,
            userSubscription: userSubscription, 
            onLimitReached: handleLimitReached, 
            openLoginModal: openLoginModal,
            openUpgradeModal: openUpgradeModal, 
            loading: loading, 
        };

        switch (selectedSermonType) {
            case 'sermon-selection':
                return (
                    <SermonSelection 
                        user={user}
                        setSelectedSermonType={setSelectedSermonType}
                        openLoginModal={openLoginModal}
                        lang={lang}
                        loading={loading}
                        onGoToLanding={() => setViewMode('landing')}
                    />
                );
            case 'ai-assistant-sermon':
                return <SermonAssistantComponent {...commonProps} />;
            case 'expository-sermon':
                return <ExpositorySermonComponent {...commonProps} />;
            case 'real-life-sermon':
                return <RealLifeSermonComponent {...commonProps} />; 
            case 'quick-memo-sermon':
                return <QuickMemoSermonComponent {...commonProps} />;
            case 'rebirth-sermon':
                return <RebirthSermonFeature {...commonProps} />;
            case 'premium-upgrade':
                return <PremiumSubscriptionPage {...commonProps} />;
            default:
                return (
                    <div className="p-16 text-center text-red-500 w-full min-h-screen">
                        <p className="text-xl mb-4">{t('unknownSermonTypeError', lang)}</p>
                        <button onClick={onGoToSelection} className="mt-4 px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">
                            {t('returnToSelection', lang)}
                        </button>
                    </div>
                );
        }
    }, [
        user, dbInstance, lang, selectedSermonType, errorMessage, setErrorMessage, setSermonDraft, commentaryCount, 
        canGenerateCommentary, canGenerateSermon, handleAPICall, sermonCount, setSermonCount, 
        userSubscription, handleLimitReached, openLoginModal, loading, openUpgradeModal, t
    ]); 


    // 메인 로딩 처리
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-700 bg-gray-50 dark:bg-slate-900">
                <LoadingSpinner message={t('loadingAuth', lang)} />
                {authError && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
                        🚨 Firebase {t('errorProcessingRequest', lang)}: {authError}
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans min-h-screen">
            
            {/* 상단 헤더 */}
            <header className="flex justify-between items-center w-full px-8 py-4 bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50"> 
                <span
                    onClick={handleLogoClick}
                    className="text-2xl font-bold text-gray-800 dark:text-gray-100 cursor-pointer"
                >
                    SermonNote
                </span>
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {t('aiUsage', lang)} {sermonCount}/{sermonLimit}회
                    </span>
                    {user && !isFirebaseError ? ( 
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">{t('logout', lang)}</button> 
                    ) : ( 
                        <button 
                            onClick={openLoginModal} 
                            disabled={isFirebaseError} 
                            className={`px-4 py-2 text-white rounded-lg transition ${
                                isFirebaseError ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {t('login', lang)} 
                        </button>
                    )}
                    <select value={lang} onChange={(e) => setLang(e.target.value)} className="p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600">
                        {languageOptions.map(option => (<option key={option.code} value={option.code}>{t(option.nameKey, lang)}</option>))}
                    </select>
                </div>
            </header>

            {/* 메인 콘텐츠 영역 */}
            <main className="flex-1 flex flex-col items-center w-full">
                {isFirebaseError && (
                    <div className="w-full p-4 bg-red-100 text-red-700 border-b border-red-400 text-center font-medium dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
                        🚨 Firebase {t('errorProcessingRequest', lang)}: {authError}
                    </div>
                )}
                {viewMode === 'landing' || isFirebaseError ? (
                    <RenderLandingPage onGetStarted={handleGetStarted} lang={lang} />
                ) : (
                    <div className="w-full min-h-screen"> 
                        {renderSermonComponent()}
                    </div>
                )}
            </main>

            {/* 설교 초안 모달 조건부 렌더링 */}
            {isDraftModalOpen && sermonDraft && (
                <SermonDraftModal 
                    isOpen={isDraftModalOpen}
                    onClose={closeDraftModalAndClear}
                    onArchiveSuccess={closeDraftModal}
                    sermonDraft={sermonDraft} 
                    setSermonDraft={setSermonDraft} 
                    lang={lang} 
                    t={(key, ...args) => t(key, lang, ...args)}
                    db={dbInstance}
                    userId={user?.uid}
                    setErrorMessage={setErrorMessage}
                />
            )}
            
            {/* 다른 모달들 */}
            {isLoginModalOpen && <LoginModal onClose={closeLoginModal} onLoginSuccess={handleLoginSuccess} Instance={authInstance} t={(key, ...args) => t(key, lang, ...args)} lang={lang} />}
            {isLimitModalOpen && <LimitReachedModal 
                isOpen={isLimitModalOpen} 
                onClose={closeLimitModal} 
                onUpgrade={openUpgradeModal}
                title={t('limitModalTitle', lang)} 
                description={t('limitModalDescription', lang)} 
                upgradeButtonText={t('upgradeButton', lang)} 
                closeButtonText={t('closeButton', lang)} 
            />}
            
            {/* 퀵메모 버튼 */}
            <button 
                onClick={handleQuickMemoClick}
                className="fixed bottom-8 right-8 p-5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-2xl transition z-60 transform hover:scale-110" 
            >
                <QuickMemoIcon className="w-6 h-6" />
            </button>

            {/* 퀵메모 녹음 모달 조건부 렌더링 */}
            {isQuickMemoModalOpen && (
                <QuickMemoModal 
                    onClose={closeQuickMemoModal}
                    userId={user?.uid}
                    db={dbInstance}
                    t={(key, ...args) => t(key, lang, ...args)}
                    lang={lang}
                    onMemoSaved={handleQuickMemoSaved}
                />
            )}
        </div>
    );
}

// --------------------------------------------------
// export default: HomeContent를 AuthProvider로 감싸서 export
// --------------------------------------------------
export default function Home() {
    return (
        <AuthProvider>
            <HomeContent />
        </AuthProvider>
    );
}