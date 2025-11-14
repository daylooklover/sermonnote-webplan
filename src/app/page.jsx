// app/page.js
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';

// AuthProvider와 useAuth는 Named Export가 일반적이므로 그대로 유지합니다.
import { AuthProvider, useAuth } from '../components/AuthContext.js'; 

// 모든 Import 경로에 명시적인 확장자 (.js)를 추가하여 빌드 경로 충돌 해결
import SermonAssistantComponent from '../components/SermonAssistantComponent.js'; 
import ExpositorySermonComponent from '../components/ExpositorySermonComponent.js';
import RealLifeSermonComponent from '../components/RealLifeSermonComponent.js';
import QuickMemoSermonComponent from '../components/QuickMemoSermonComponent.js';
import RebirthSermonFeature from '../components/RebirthSermonFeature.js';
import PremiumSubscriptionPage from '../components/PremiumSubscriptionPage.js'; 
// 🚨 [FIX]: LimitReachedModal 컴포넌트 Import 추가
import LimitReachedModal from '../components/LimitReachedModal.js'; 
import LoginModal from '../components/LoginModal.js';
// 🚨 FIX: ExpositorySermonComponent가 사용하는 모든 아이콘들 Import (에러 방지)
import { 
    LoadingSpinner, 
    GoBackIcon, 
    PlusCircleIcon, 
    BibleIcon, 
    RealLifeIcon, 
    RebirthIcon, 
    PremiumIcon,
    QuickMemoIcon 
} from '../components/IconComponents.js'; 

// --------------------------------------------------
// 상수 및 번역 헬퍼 (t) 정의 (다국어 키 채워넣음)
// --------------------------------------------------
const HERO_BG_COLOR = '#0f1a30'; 
const BACKGROUND_IMAGE_URL = '/images/background.jpg'; 

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
        // 공통 UI 요소
        lang_ko: '한국어', lang_en: '영어', lang_zh: '중국어', lang_ru: '러시아어', lang_vi: '베트남어',
        welcome: '환영합니다', logout: '로그아웃', login: '로그인', user: '사용자',
        loadingAuth: '인증 확인 중...',
        selectSermonType: '설교 유형을 선택해 주세요.',
        landingSubtitle: '신앙을 깊게 하고, 통찰력을 정리하세요.',
        start: '시작하기',
        chooseSermonType: '설교 유형 선택',
        chooseSermonTypeDescription: '가장 적합한 설교 유형을 선택하고 설교 준비를 시작하세요.',
        sermonAssistant: 'AI 설교 어시스턴트',
        expositorySermon: '강해 설교',
        realLifeSermon: '생활화 설교',
        quickMemoSermon: '빠른 메모 설교',
        rebirthSermon: '설교 리버쓰(Rebirth)',
        upgradeToPremium: '프리미엄으로 업그레이드',
        limitModalTitle: '무료 사용 횟수 초과',
        limitModalDescription: 'AI 설교 초안 생성 횟수가 모두 소진되었습니다. 무제한 사용을 위해 프리미엄으로 업그레이드하세요.',
        upgradeButton: '프리미엄 구독하기',
        closeButton: '닫기',
        goBack: '뒤로가기',
        clearChat: '대화 내용 지우기',
        sermonAssistantInitialTitle: "AI 설교 어시스턴트",
        sermonAssistantInitialDescription: "설교 초안 생성을 위해 질문을 시작해 보세요。",
        askAQuestionToBegin: "아래 입력창에 주제나 성경 구절을 입력하여 시작해 보세요。",
        startYourSermonConversation: "대화 시작",
        aiIsThinking: "AI가 답변을 생성 중입니다...",
        sermonAssistantInputPlaceholder: "설교 주제나 질문을 입력하세요...",
        loginToUseFeature: '해당 기능을 사용하려면 로그인이 필요합니다.',
        confirmClearChat: "모든 채팅 내용을 지우시겠습니까?",
        errorProcessingRequest: "요청 처리 중 오류가 발생했습니다",
        aiAssistantDefaultResponse: "답변이 도착했습니다。",
        loadingSermonTypes: "설교 유형을 불러오는 중입니다...",
        
        // 랜딩 페이지 제목/부제
        landing_title_main: "SermonNote가 목회자님께 드리는 혁신적 혜택", landing_summary_main: "바쁜 일상 속에서 깊이 있는 설교를 준비하는 것은 쉽지 않습니다. SermonNote는 최첨단 AI 기술을 활용하여 목회자님의 시간을 절약하고, 더욱 풍성한 말씀으로 성도들을 양육할 수 있도록 돕습니다. 맞춤형 설교 생성부터 전문 연구 관리까지, 모든 과정을 스마트하게 지원합니다.",
        landing_title_1: 'AI 기반으로 설교 속도를 5배 빠르게', landing_summary_1: 'AI가 분석, 초안 작성, 내용 구성을 도와 정해진 시간 내에 초안을 완성하고 시간을 절약해 줍니다.',
        landing_title_2: '개인 설교 스타일을 학습하는 AI', landing_summary_2: '사용자의 이전 설교 스타일, 어휘, 신학적 관점을 학습하여 목회자님의 색깔이 담긴 맞춤 초안을 완성합니다.',
        landing_title_3: '글로벌 선교를 위한 맞춤형 언어 지원', landing_summary_3: '영어, 한국어뿐만 아니라 중국어, 러시아어, 베트남어 등 주요 선교 지역 언어의 설교 생성 및 편집을 지원합니다.',
        landing_title_4: '목회 사역에 대한 현명한 투자', landing_summary_4: 'SermonNote는 단순한 지출이 아닌, 효율적인 사역을 위한 핵심 투자입니다.',
        landing_title_5: '영감을 유지하고 묵상 심화 촉진', landing_summary_5: '떠오르는 영감을 놓치지 않고, 설교 묵상 단계를 체계적으로 심화시킵니다.',
        landing_title_6: '체계적인 설교 자료 연구 관리', landing_summary_6: '생성된 모든 설교, 묵상, 메모, 참고 자료를 자동으로 분류 및 정리하여 검색과 재활용이 용이합니다.',
        
        // 구독 관련 키
        chooseYourPlan: '나에게 맞는 플랜을 선택하세요', planSubtitle: 'SermonNote는 모든 사용자에게 최적화된 패키지를 제공합니다.',
        monthly: '월별', annually: '연간', saveUpTo: '최대 {0}% 절약', bestValue: '최고 가치',
        planFreeMember: '무료 멤버십', freePlanDescription: 'SermonNote의 기본 기능을 무료로 체험해 보세요.',
        planStandardMember: '스탠다드 멤버십', standardPlanDescription: '설교 준비 효율을 높여주는 핵심 기능을 제공합니다.',
        planPremiumMember: '프리미엄 멤버십', premiumPlanDescription: '최고의 설교 경험을 위한 올인원 솔루션입니다.',
        sermonGenTimes: '설교 생성 {0}회/월', aiAnnotationTimes: 'AI 주석 {0}회/월',
        textEditor: '텍스트 에디터', advancedTextEditor: '고급 AI 텍스트 에디터',
        limitedSupport: '우선 기술 지원 (제한적)', unlimitedSermonGen: '무제한 설교 생성',
        unlimitedAnnotation: '무제한 AI 주석', unlimitedSupport: '우선 기술 지원 (무제한)',
        getStarted: '시작하기', subscribeNow: '지금 구독하기',
        sermonSelectionReturn: '설교 유형 선택 화면으로 돌아가기',
        year: '년', month: '개월', billedAnnualy: '연간 {0} $ 청구', saveVsMonthly: '월별 대비 {0}% 절약',
        subscriptionSuccessful: '구독 성공!', welcomePremiumTier: '프리미엄 멤버십에 오신 것을 환영합니다. SermonNote의 모든 기능을 무제한으로 누려보세요.',
        startWritingSermons: '설교 작성 시작',
        commentaryLimitError: 'AI 주석 생성 횟수를 초과했습니다.',
        sermonLimitError: 'AI 설교 생성 횟수를 초과했습니다.',
        generationFailed: 'AI 응답 생성에 실패했습니다.',
        enterScriptureReference: '성경 구절을 입력해 주세요.',
        
        // ⭐️ LoginModal.js에서 사용하는 키 추가
        auth_error_title: '인증 시스템 오류',
        auth_error_desc: '인증 시스템이 초기화되지 않았습니다. 잠시 후 다시 시도하거나 개발자에게 문의하세요.',
        auth_invalid_email: '유효하지 않은 이메일 주소 형식입니다.',
        auth_user_disabled: '사용이 정지된 계정입니다.',
        auth_wrong_credentials: '이메일 또는 비밀번호가 올바르지 않습니다.',
        auth_email_in_use: '이미 사용 중인 이메일입니다.',
        auth_weak_password: '비밀번호는 최소 6자 이상이어야 합니다.',
        auth_missing_email: '이메일을 입력해 주세요.',
        auth_generic_error: '인증 오류가 발생했습니다: {0}',
        auth_password_mismatch: '비밀번호와 비밀번호 확인이 일치하지 않습니다.',
        auth_register_success: '✅ 회원가입 성공! 이제 자동으로 로그인됩니다.',
        auth_login_success: '✅ 로그인 성공!',
        auth_reset_sent: '✅ 비밀번호 재설정 링크가 이메일로 전송되었습니다. 확인 후 비밀번호를 재설정해 주세요.',
        auth_unexpected_error: '예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        auth_reset_title: '비밀번호 재설정',
        auth_register_title: '회원가입',
        auth_registering: '가입 중...',
        auth_processing: '처리 중...',
        auth_send_reset: '재설정 메일 보내기',
        auth_register_button: '회원가입',
        auth_forgot_password: '비밀번호를 잊으셨나요?',
        auth_back_to_login: '로그인 화면으로 돌아가기',
        auth_continue_anon: '지금은 로그인하지 않고 앱 사용 계속하기',
        auth_placeholder_email: '이메일',
        auth_placeholder_password: '비밀번호 (6자 이상)',
        auth_placeholder_confirm_password: '비밀번호 확인',
        
    },

    // ----------------------------------------------------
    // 2. 영어 (English: en)
    // ----------------------------------------------------
    en: {
        // Common UI Elements
        lang_ko: 'Korean', lang_en: 'English', lang_zh: 'Chinese', lang_ru: 'Russian', lang_vi: 'Vietnamese',
        welcome: 'Welcome', logout: 'Logout', login: 'Login', user: 'User',
        loadingAuth: 'Verifying authentication...',
        selectSermonType: 'Please select a sermon type.',
        landingSubtitle: 'Deepen your faith and organize your insights.',
        start: 'Start',
        chooseSermonType: 'Choose Sermon Type',
        chooseSermonTypeDescription: 'Select the most suitable sermon type and begin your sermon preparation.',
        sermonAssistant: 'AI Sermon Assistant',
        expositorySermon: 'Expository Sermon',
        realLifeSermon: 'Real-Life Application Sermon',
        quickMemoSermon: 'Quick Memo Sermon',
        rebirthSermon: 'Sermon Rebirth',
        upgradeToPremium: 'Upgrade to Premium',
        limitModalTitle: 'Free Usage Limit Reached',
        limitModalDescription: 'You have reached the limit for AI Sermon Draft generations. Upgrade to Premium for unlimited access.',
        upgradeButton: 'Subscribe to Premium',
        closeButton: 'Close',
        goBack: 'Go Back',
        clearChat: 'Clear Chat',
        sermonAssistantInitialTitle: "AI Sermon Assistant",
        sermonAssistantInitialDescription: "Start asking questions to generate a sermon draft.",
        askAQuestionToBegin: "Begin by entering a topic or scripture in the input box below.",
        startYourSermonConversation: "Start Conversation",
        aiIsThinking: "AI is generating a response...",
        sermonAssistantInputPlaceholder: "Enter your sermon topic or question...",
        loginToUseFeature: 'Login is required to use this feature.',
        confirmClearChat: "Are you sure you want to clear all chat content?",
        errorProcessingRequest: "An error occurred while processing the request",
        aiAssistantDefaultResponse: "The response has arrived.",
        loadingSermonTypes: "Loading sermon types...",
        
        // Landing Page Titles/Subtitles
        landing_title_main: "The Innovative Advantage SermonNote Gives to Pastors", landing_summary_main: "Preparing an in-depth sermon amid a busy routine is not easy. SermonNote uses cutting-edge AI technology to help pastors save time and nurture their congregations with richer word. From personalized sermon generation to professional research management, every process is supported intelligently.",
        landing_title_1: '5x Faster Sermon Speed with AI', landing_summary_1: 'AI assists with analysis, drafting, and content organization, ensuring the draft is completed within a limited time and saving you time.',
        landing_title_2: 'AI that Learns Your Personal Sermon Style', landing_summary_2: 'Learns the user\'s past sermon style, vocabulary, and theological views to complete a customized draft with the pastor\'s unique color.',
        landing_title_3: 'Customized Language Support for Global Missions', landing_summary_3: 'Supports sermon generation and editing in major mission languages, including English, Korean, Chinese, Russian, and Vietnamese.',
        landing_title_4: 'A Wise Investment in Pastoral Ministry', landing_summary_4: 'SermonNote is not just an expense, but a core investment in effective ministry.',
        landing_title_5: 'Maintain Inspiration, Promote Deeper Meditation', landing_summary_5: 'Don\'t miss emerging inspirations, and systematically deepen the sermon meditation stage.',
        landing_title_6: 'Systematic Sermon Material Research Management', landing_summary_6: 'Automatically classifies and organizes all generated sermons, meditations, notes, and references, making them easy to search and reuse.',
        
        // 구독 관련 키
        chooseYourPlan: 'Choose Your Plan', planSubtitle: 'SermonNote offers optimized packages for all users.',
        monthly: 'Monthly', annually: 'Annually', saveUpTo: 'Save up to {0}%', bestValue: 'Best Value',
        planFreeMember: 'Free Membership', freePlanDescription: 'Experience the basic features of SermonNote for free.',
        planStandardMember: 'Standard Membership', standardPlanDescription: 'Provides core features that boost sermon preparation efficiency.',
        planPremiumMember: 'Premium Membership', premiumPlanDescription: 'An all-in-one solution for the ultimate sermon experience.',
        sermonGenTimes: 'Sermon Generation {0} times/month', aiAnnotationTimes: 'AI Annotation {0} times/month',
        textEditor: 'Text Editor', advancedTextEditor: 'Advanced AI Text Editor',
        limitedSupport: 'Priority Tech Support (Limited)', unlimitedSermonGen: 'Unlimited Sermon Generation',
        unlimitedAnnotation: 'Unlimited AI Annotation', unlimitedSupport: 'Priority Tech Support (Unlimited)',
        getStarted: 'Get Started', subscribeNow: 'Subscribe Now',
        sermonSelectionReturn: 'Return to Sermon Type Selection Screen',
        year: 'Year', month: 'Month', billedAnnualy: 'Billed {0} $ Annually', saveVsMonthly: 'Save {0}% vs Monthly',
        subscriptionSuccessful: 'Subscription Successful!', welcomePremiumTier: 'Welcome to Premium Membership. Enjoy all SermonNote features without limits.',
        startWritingSermons: 'Start Writing Sermons',
        commentaryLimitError: 'AI Commentary generation limit exceeded.',
        sermonLimitError: 'AI Sermon generation limit exceeded.',
        generationFailed: 'AI response generation failed.',
        enterScriptureReference: 'Please enter a scripture reference.',

        // ⭐️ LoginModal.js에서 사용하는 키 추가
        auth_error_title: 'Authentication System Error',
        auth_error_desc: 'The authentication system is not initialized. Please try again later or contact the developer.',
        auth_invalid_email: 'Invalid email address format.',
        auth_user_disabled: 'Account has been disabled.',
        auth_wrong_credentials: 'Email or password is incorrect.',
        auth_email_in_use: 'Email is already in use.',
        auth_weak_password: 'Password must be at least 6 characters.',
        auth_missing_email: 'Please enter an email.',
        auth_generic_error: 'Authentication error occurred: {0}',
        auth_password_mismatch: 'Password and confirmation do not match.',
        auth_register_success: '✅ Registration successful! You will be logged in automatically.',
        auth_login_success: '✅ Login successful!',
        auth_reset_sent: '✅ Password reset link sent to your email. Please check your email to proceed.',
        auth_unexpected_error: 'An unexpected error occurred. Please try again later.',
        auth_reset_title: 'Password Reset',
        auth_register_title: 'Register',
        auth_registering: 'Registering...',
        auth_processing: 'Processing...',
        auth_send_reset: 'Send Reset Email',
        auth_register_button: 'Register',
        auth_forgot_password: 'Forgot your password?',
        auth_back_to_login: 'Back to Login',
        auth_continue_anon: 'Continue using the app without logging in',
        auth_placeholder_email: 'Email',
        auth_placeholder_password: 'Password (6+ characters)',
        auth_placeholder_confirm_password: 'Confirm Password',
    },

    // ----------------------------------------------------
    // 3. 중국어 (Chinese: zh)
    // ----------------------------------------------------
    zh: {
        // 공통 UI 요소
        lang_ko: '韩语', lang_en: '英语', lang_zh: '中文', lang_ru: '俄语', lang_vi: '越南语',
        welcome: '欢迎', logout: '登出', login: '登录', user: '用户',
        loadingAuth: '正在验证...',
        selectSermonType: '请选择讲道类型。',
        landingSubtitle: '加深信仰，整理见解。',
        start: '开始',
        chooseSermonType: '选择讲道类型',
        chooseSermonTypeDescription: '选择最合适的讲道类型，开始准备您的讲道。',
        sermonAssistant: 'AI 讲道助手',
        expositorySermon: '释经讲道',
        realLifeSermon: '生活化讲道',
        quickMemoSermon: '快速备忘讲道',
        rebirthSermon: '讲道重生',
        upgradeToPremium: '升级至高级版',
        limitModalTitle: '免费使用次数已达上限',
        limitModalDescription: 'AI 讲道草稿生成次数已达上限。请升级至高级版以获取无限次使用权。',
        upgradeButton: '高级版订阅',
        closeButton: '关闭',
        goBack: '返回',
        clearChat: '清除聊天记录',
        sermonAssistantInitialTitle: "AI 讲道助手",
        sermonAssistantInitialDescription: "开始提问以生成讲道草稿。",
        askAQuestionToBegin: "在下面的输入框中输入主题或经文开始。",
        startYourSermonConversation: "开始对话",
        aiIsThinking: "AI 正在生成回复...",
        sermonAssistantInputPlaceholder: "请输入讲道主题或问题...",
        loginToUseFeature: '需要登录才能使用该功能。',
        confirmClearChat: "确定要清除所有聊天内容吗?",
        errorProcessingRequest: "处理请求时发生错误",
        aiAssistantDefaultResponse: "已收到回复。",
        loadingSermonTypes: "正在加载讲道类型...",
        
        // 랜딩 페이지 제목/부제
        landing_title_main: "SermonNote为牧师提供的创新优势", landing_summary_main: "在忙碌的日常生活中，准备深入的讲道并非易事。SermonNote利用尖端AI技术，帮助牧师节省时间，并以更丰富的话语牧养信徒。从个性化讲道生成到专业研究管理，全程提供智能支持。",
        landing_title_1: '基于AI，讲道速度快5倍', landing_summary_1: 'AI分析、草稿撰写、内容组织，确保在限定时间内完成草稿，节省时间。',
        landing_title_2: '学习您个人讲道风格的AI', landing_summary_2: '学习用户的过往讲道风格、词汇和神学观点，完成带有牧师个人特色的定制草稿。',
        landing_title_3: '为全球宣教定制的语言支持', landing_summary_3: '不仅支持英语、韩语，还支持中文、俄语、越南语等主要宣教地区语言的讲道生成和编辑。',
        landing_title_4: '对牧会事工的明智投资', landing_summary_4: 'SermonNote不只是支出，更是对高效事工的核心投资。',
        landing_title_5: '保持灵感，促进默想深化', landing_summary_5: '不错失涌现的灵感，系统化地深化讲道默想阶段。',
        landing_title_6: '系统化的讲道资料研究管理', landing_summary_6: '自动分类和整理所有生成的讲道、默想、笔记和参考资料，方便搜索和重复使用。',
        
        // 구독 관련 키
        chooseYourPlan: '选择您的计划', planSubtitle: 'SermonNote提供针对所有用户的优化套餐。',
        monthly: '每月', annually: '每年', saveUpTo: '最多节省 {0}%', bestValue: '最具价值',
        planFreeMember: '免费会员', freePlanDescription: '免费试用 SermonNote 的基本功能。',
        planStandardMember: '标准会员', standardPlanDescription: '提供提升讲道准备效率的核心功能。',
        planPremiumMember: '高级会员', premiumPlanDescription: '为顶级讲道体验提供一体化解决方案。',
        sermonGenTimes: '讲道生成 {0}次/月', aiAnnotationTimes: 'AI注释 {0}次/월',
        textEditor: '文本编辑器', advancedTextEditor: '高级 AI 文本编辑器',
        limitedSupport: '优先技术支持 (有限)', unlimitedSermonGen: '无限次讲도생성',
        unlimitedAnnotation: '无限次 AI 注释', unlimitedSupport: '优先技术支持 (无限)',
        getStarted: '开始使用', subscribeNow: '立即订阅',
        sermonSelectionReturn: '返回讲道类型选择画面',
        year: '年', month: '月', billedAnnualy: '每年 {0} $ 计费', saveVsMonthly: '相比每月节省 {0}%',
        subscriptionSuccessful: '订阅成功!', welcomePremiumTier: '欢迎加入高级会员。请无限量享用 SermonNote 的所有功能。',
        startWritingSermons: '开始撰写讲道',
        commentaryLimitError: 'AI 注释生成次数已超限。',
        sermonLimitError: 'AI 讲道生成次数已超限。',
        generationFailed: 'AI 回复生成失败。',
        enterScriptureReference: '请输入圣经经文。',

        // ⭐️ LoginModal.js에서 사용하는 키 추가
        auth_error_title: '身份验证系统错误',
        auth_error_desc: '身份验证系统未初始化。请稍后重试或联系开发人员。',
        auth_invalid_email: '电子邮件地址格式无效。',
        auth_user_disabled: '该账户已被禁用。',
        auth_wrong_credentials: '电子邮件或密码不正确。',
        auth_email_in_use: '该电子邮件已被使用。',
        auth_weak_password: '密码必须至少包含 6 个字符。',
        auth_missing_email: '请输入电子邮件。',
        auth_generic_error: '发生身份验证错误: {0}',
        auth_password_mismatch: '密码与确认密码不匹配。',
        auth_register_success: '✅ 注册成功! 您将自动登录。',
        auth_login_success: '✅ 登录成功!',
        auth_reset_sent: '✅ 密码重置链接已发送至您的电子邮件。请检查您的电子邮件以继续。',
        auth_unexpected_error: '发生意外错误。请稍后重试。',
        auth_reset_title: '密码重置',
        auth_register_title: '注册',
        auth_registering: '正在注册...',
        auth_processing: '正在处理...',
        auth_send_reset: '发送重置邮件',
        auth_register_button: '注册',
        auth_forgot_password: '忘记密码了吗?',
        auth_back_to_login: '返回登录界面',
        auth_continue_anon: '暂不登录，继续使用应用程序',
        auth_placeholder_email: '电子邮件',
        auth_placeholder_password: '密码 (至少 6 个字符)',
        auth_placeholder_confirm_password: '确认密码',
    },

    // ----------------------------------------------------
    // 4. 러시아어 (Russian: ru)
    // ----------------------------------------------------
    ru: {
        // 공통 UI 요소
        lang_ko: 'Корейский', lang_en: 'Английский', lang_zh: 'Китайский', lang_ru: 'Русский', lang_vi: 'Вьетнамский',
        welcome: 'Добро пожаловать', logout: 'Выйти', login: 'Войти', user: 'Пользователь',
        loadingAuth: 'Проверка аутентификации...',
        selectSermonType: 'Пожалуйста, выберите тип проповеди.',
        landingSubtitle: 'Углубляйте свою веру и систематизируйте свои озарения.',
        start: 'Начать',
        chooseSermonType: 'Выбор типа проповеди',
        chooseSermonTypeDescription: 'Выберите наиболее подходящий тип проповеди и начните подготовку.',
        sermonAssistant: 'AI-помощник для проповеди',
        expositorySermon: 'Экспозиционная проповедь',
        realLifeSermon: 'Проповедь с жизненным применением',
        quickMemoSermon: 'Быстрая заметка-проповедь',
        rebirthSermon: 'Возрождение проповеди (Rebirth)',
        upgradeToPremium: 'Перейти на Премиум',
        limitModalTitle: 'Превышен лимит бесплатного использования',
        limitModalDescription: 'Достигнут лимит на генерацию черновиков AI-проповедей. Обновитесь до Премиум для неограниченного доступа.',
        upgradeButton: 'Подписаться на Премиум',
        closeButton: 'Закрыть',
        goBack: 'Назад',
        clearChat: 'Очистить чат',
        sermonAssistantInitialTitle: "AI-помощник для проповеди",
        sermonAssistantInitialDescription: "Начните задавать вопросы, чтобы сгенерировать черновик проповеди.",
        askAQuestionToBegin: "Начните, введя тему или стих из Писания в поле ниже.",
        startYourSermonConversation: "Начать разговор",
        aiIsThinking: "AI генерирует ответ...",
        sermonAssistantInputPlaceholder: "Введите тему проповеди или вопрос...",
        loginToUseFeature: 'Для использования этой функции требуется вход в систему.',
        confirmClearChat: "Вы уверены, что хотите очистить весь контент чата?",
        errorProcessingRequest: "Произошла ошибка при обработке запроса",
        aiAssistantDefaultResponse: "Ответ получен.",
        loadingSermonTypes: "Загрузка типов проповедей...",

        // 랜딩 페이지 제목/부제
        landing_title_main: "Инновационные преимущества SermonNote для пасторов", landing_summary_main: "Подготовка глубокой проповеди в напряженном графике непроста. SermonNote использует передовые AI-технологии, чтобы помочь пасторам сэкономить время и напитать прихожан более богатым Словом. От персонализированной генерации проповедей до профессионального управления исследованиями, весь процесс поддерживается интеллектуально.",
        landing_title_1: 'Скорость проповеди в 5 раз выше благодаря AI', landing_summary_1: 'AI помогает с анализом, составлением черновика и организацией контента, обеспечивая завершение черновика в отведенное время и экономя ваше время.',
        landing_title_2: 'AI, который изучает ваш личный стиль проповеди', landing_summary_2: 'Изучает предыдущий стиль проповеди, лексику и богословские взгляды пользователя, чтобы создать индивидуальный черновик с уникальным почерком пастора.',
        landing_title_3: 'Индивидуальная языковая поддержка для глобальных миссий', landing_summary_3: 'Поддерживает генерацию и редактирование проповедей на основных миссионерских языках, включая английский, корейский, китайский, русский и вьетнамский.',
        landing_title_4: 'Разумная инвестиция в пасторское служение', landing_summary_4: 'SermonNote — это не просто расходы, а ключевая инвестиция в эффективное служение.',
        landing_title_5: 'Сохраняйте вдохновение, углубляйте размышления', landing_summary_5: 'Не упускайте появляющееся вдохновение и систематически углубляйте этап размышления над проповедью.',
        landing_title_6: 'Систематическое управление материалами для проповедей', landing_summary_6: 'Автоматически классифицирует и организует все сгенерированные проповеди, размышления, заметки и ссылки, упрощая поиск и повторное использование.',

        // 구독 관련 키
        chooseYourPlan: 'Выберите свой план', planSubtitle: 'SermonNote предлагает оптимизированные пакеты для всех пользователей.',
        monthly: 'Ежемесячно', annually: 'Ежегодно', saveUpTo: 'Сэкономьте до {0}%', bestValue: 'Лучшая цена',
        planFreeMember: 'Бесплатное членство', freePlanDescription: 'Попробуйте основные функции SermonNote бесплатно.',
        planStandardMember: 'Стандартное членство', standardPlanDescription: 'Предоставляет основные функции, повышающие эффективность подготовки проповеди.',
        planPremiumMember: 'Премиум членство', premiumPlanDescription: 'Универсальное решение для наилучшего опыта проповеди.',
        sermonGenTimes: 'Генерация проповедей {0} раз/мес', aiAnnotationTimes: 'AI-аннотации {0} раз/мес',
        textEditor: 'Текстовый редактор', advancedTextEditor: 'Продвинутый AI-текстовый редактор',
        limitedSupport: 'Приоритетная техподдержка (ограниченная)', unlimitedSermonGen: 'Неограниченная генерация проповедей',
        unlimitedAnnotation: 'Неограниченная AI-аннотация', unlimitedSupport: 'Приоритетная техподдержка (неограниченная)',
        getStarted: 'Начать', subscribeNow: 'Подписаться сейчас',
        sermonSelectionReturn: 'Вернуться к выбору типа проповеди',
        year: 'Год', month: 'Месяц', billedAnnualy: 'Счет {0} $ в год', saveVsMonthly: 'Сэкономьте {0}% по сравнению с ежемесячной оплатой',
        subscriptionSuccessful: 'Подписка прошла успешно!', welcomePremiumTier: 'Добро пожаловать в Премиум-членство. Наслаждайтесь всеми функциями SermonNote без ограничений.',
        startWritingSermons: 'Начать писать проповеди',
        commentaryLimitError: 'Превышен лимит генерации AI-аннотаций.',
        sermonLimitError: 'Превышен лимит генерации AI-проповедей.',
        generationFailed: 'Не удалось сгенерировать ответ AI.',
        enterScriptureReference: 'Пожалуйста, введите ссылку на Писание.',
        
        // ⭐️ LoginModal.js에서 사용하는 키 추가
        auth_error_title: 'Ошибка системы аутентификации',
        auth_error_desc: 'Система аутентификации не инициализирована. Пожалуйста, повторите попытку позже или свяжитесь с разработчиком.',
        auth_invalid_email: 'Неверный формат адреса электронной почты.',
        auth_user_disabled: 'Аккаунт был отключен.',
        auth_wrong_credentials: 'Неправильный адрес электронной почты или пароль.',
        auth_email_in_use: 'Эта электронная почта уже используется.',
        auth_weak_password: 'Пароль должен содержать не менее 6 символов.',
        auth_missing_email: 'Пожалуйста, введите адрес электронной почты.',
        auth_generic_error: 'Произошла ошибка аутентификации: {0}',
        auth_password_mismatch: 'Пароль и подтверждение не совпадают.',
        auth_register_success: '✅ Регистрация прошла успешно! Вы будете автоматически авторизованы.',
        auth_login_success: '✅ Вход выполнен успешно!',
        auth_reset_sent: '✅ Ссылка для сброса пароля отправлена на вашу электронную почту. Пожалуйста, проверьте свою почту.',
        auth_unexpected_error: 'Произошла непредвиденная ошибка. Пожалуйста, повторите попытку позже.',
        auth_reset_title: 'Сброс пароля',
        auth_register_title: 'Регистрация',
        auth_registering: 'Регистрация...',
        auth_processing: 'Обработка...',
        auth_send_reset: 'Отправить письмо для сброса',
        auth_register_button: 'Зарегистрироваться',
        auth_forgot_password: 'Забыли пароль?',
        auth_back_to_login: 'Вернуться ко входу',
        auth_continue_anon: 'Продолжить использование приложения без входа',
        auth_placeholder_email: 'Электронная почта',
        auth_placeholder_password: 'Пароль (6+ символов)',
        auth_placeholder_confirm_password: 'Подтвердите пароль',
    },

    // ----------------------------------------------------
    // 5. 베트남어 (Vietnamese: vi)
    // ----------------------------------------------------
    vi: {
        // 공통 UI 요소
        lang_ko: 'Tiếng Hàn', lang_en: 'Tiếng Anh', lang_zh: 'Tiếng Trung', lang_ru: 'Tiếng Nga', lang_vi: 'Tiếng Việt',
        welcome: 'Chào mừng', logout: 'Đăng xuất', login: 'Đăng nhập', user: 'Người dùng',
        loadingAuth: 'Đang xác minh xác thực...',
        selectSermonType: 'Vui lòng chọn loại bài giảng.',
        landingSubtitle: 'Làm sâu sắc đức tin và sắp xếp những hiểu biết của bạn.',
        start: 'Bắt đầu',
        chooseSermonType: 'Chọn loại bài giảng',
        chooseSermonTypeDescription: 'Chọn loại bài giảng phù hợp nhất và bắt đầu chuẩn bị bài giảng của bạn.',
        sermonAssistant: 'Trợ lý Bài giảng AI',
        expositorySermon: 'Bài giảng Giải Kinh',
        realLifeSermon: 'Bài giảng Ứng dụng Đời sống',
        quickMemoSermon: 'Bài giảng Ghi chú Nhanh',
        rebirthSermon: 'Tái sinh Bài giảng (Rebirth)',
        upgradeToPremium: 'Nâng cấp lên Premium',
        limitModalTitle: 'Đã đạt giới hạn sử dụng miễn phí',
        limitModalDescription: 'Đã hết lượt tạo bản nháp Bài giảng AI. Vui lòng nâng cấp lên Premium để sử dụng không giới hạn.',
        upgradeButton: 'Đăng ký Premium',
        closeButton: 'Đóng',
        goBack: 'Quay lại',
        clearChat: 'Xóa trò chuyện',
        sermonAssistantInitialTitle: "Trợ lý Bài giảng AI",
        sermonAssistantInitialDescription: "Bắt đầu đặt câu hỏi để tạo bản nháp bài giảng.",
        askAQuestionToBegin: "Bắt đầu bằng cách nhập chủ đề hoặc đoạn Kinh Thánh vào ô nhập liệu bên dưới.",
        startYourSermonConversation: "Bắt đầu cuộc trò chuyện",
        aiIsThinking: "AI đang tạo phản hồi...",
        sermonAssistantInputPlaceholder: "Nhập chủ đề hoặc câu hỏi bài giảng của bạn...",
        loginToUseFeature: 'Cần phải đăng nhập để sử dụng tính năng này.',
        confirmClearChat: "Bạn có chắc chắn muốn xóa tất cả nội dung trò chuyện không?",
        errorProcessingRequest: "Đã xảy ra lỗi trong quá trình xử lý yêu cầu",
        aiAssistantDefaultResponse: "Đã nhận được phản hồi.",
        loadingSermonTypes: "Đang tải các loại bài giảng...",

        // 랜딩 페이지 제목/부제
        landing_title_main: "Lợi ích Đổi mới mà SermonNote mang lại cho các Mục sư", landing_summary_main: "Việc chuẩn bị một bài giảng sâu sắc giữa lịch trình bận rộn không hề dễ dàng. SermonNote sử dụng công nghệ AI tiên tiến để giúp các mục sư tiết kiệm thời gian và nuôi dưỡng tín đồ bằng lời Chúa phong phú hơn. Từ việc tạo bài giảng cá nhân hóa đến quản lý nghiên cứu chuyên nghiệp, mọi quy trình đều được hỗ trợ thông minh.",
        landing_title_1: 'Tốc độ bài giảng nhanh gấp 5 lần với AI', landing_summary_1: 'AI hỗ trợ phân tích, soạn thảo nháp và tổ chức nội dung, đảm bảo hoàn thành bản nháp trong thời gian giới hạn và tiết kiệm thời gian cho bạn.',
        landing_title_2: 'AI học hỏi phong cách bài giảng cá nhân của bạn', landing_summary_2: 'Học hỏi phong cách bài giảng, từ vựng và quan điểm thần học trong các bài giảng trước đây của người dùng để hoàn thành bản nháp tùy chỉnh mang màu sắc riêng của mục sư.',
        landing_title_3: 'Hỗ trợ ngôn ngữ tùy chỉnh cho Sứ mệnh Toàn cầu', landing_summary_3: 'Hỗ trợ tạo và chỉnh sửa bài giảng bằng các ngôn ngữ truyền giáo chính, bao gồm tiếng Anh, tiếng Hàn, tiếng Trung, tiếng Nga và tiếng Việt.',
        landing_title_4: 'Một khoản đầu tư khôn ngoan vào Mục vụ', landing_summary_4: 'SermonNote không chỉ là một khoản chi tiêu, mà là một khoản đầu tư cốt lõ에 vào mục vụ hiệu quả.',
        landing_title_5: 'Duy trì cảm hứng, thúc진 sự suy ngẫm sâu sắc hơn', landing_summary_5: 'Không bỏ lỡ những cảm hứng bất chợ트 và làm sâu sắc hơn một cách có hệ thống giai đoạn suy ngẫm bài giảng.',
        landing_title_6: 'Quản lý nghiên cứu tài liệu bài giảng có hệ thống', landing_summary_6: 'Tự động phân loại và sắp xếp tất cả các bài giảng, suy ngẫm, ghi chú và tài liệu tham고 đã tạo, giúp dễ dàng tìm kiếm và tái sử dụng.',

        // 구독 관련 키
        chooseYourPlan: 'Chọn Gói của Bạn', planSubtitle: 'SermonNote cung cấp các gói tối ưu hóa cho tất cả người dùng.',
        monthly: 'Hàng tháng', annually: 'Hàng năm', saveUpTo: 'Tiết kiệm đến {0}%', bestValue: 'Giá trị tốt nhất',
        planFreeMember: 'Thành viên Miễn phí', freePlanDescription: 'Trải nghiệm miễn phí các tính năng cơ bản của SermonNote.',
        planStandardMember: 'Thành viên Tiêu chuẩn', standardPlanDescription: 'Cung cấp các tính năng cốt lõ에 giúp tăng hiệu quả chuẩn bị bài giảng.',
        planPremiumMember: 'Thành viên Premium', premiumPlanDescription: 'Giải pháp tất cả trong một cho trải nghiệm bài giảng tối ưu.',
        sermonGenTimes: 'Tạo bài giảng {0} lần/tháng', aiAnnotationTimes: 'Chú thích AI {0} lần/tháng',
        textEditor: 'Trình chỉnh sửa văn bản', advancedTextEditor: 'Trình chỉnh sửa văn bản AI nâng cao',
        limitedSupport: 'Hỗ trợ kỹ thuật ưu tiên (Giới hạn)', unlimitedSermonGen: 'Tạo bài giảng không giới hạn',
        unlimitedAnnotation: 'Chú thích AI không giới hạn', unlimitedSupport: 'Hỗ trợ kỹ thuật ưu tiên (Không giới hạn)',
        getStarted: 'Bắt đầu', subscribeNow: 'Đăng ký ngay',
        sermonSelectionReturn: 'Quay lại màn hình chọn loại bài giảng',
        year: 'Năm', month: 'Tháng', billedAnnualy: 'Thanh toán {0} $ hàng năm', saveVsMonthly: 'Tiết kiệm {0}% so với hàng tháng',
        subscriptionSuccessful: 'Đăng ký thành công!', welcomePremiumTier: 'Chào mừng bạn đến với Thành viên Premium. Tận hưởng tất cả các tính năng của SermonNote không giới hạn.',
        startWritingSermons: 'Bắt đầu viết bài giảng',
        commentaryLimitError: 'Đã vượt quá giới hạn tạo Chú thích AI.',
        sermonLimitError: 'Đã vượt quá giới hạn tạo Bài giảng AI.',
        generationFailed: 'Không thể tạo phản hồi AI.',
        enterScriptureReference: 'Vui lòng nhập đoạn Kinh Thánh.',

        // ⭐️ LoginModal.js에서 사용하는 키 추가
        auth_error_title: 'Lỗi hệ thống xác thực',
        auth_error_desc: 'Hệ thống xác thực chưa được khởi tạo. Vui lòng thử lại sau hoặc liên hệ nhà phát triển.',
        auth_invalid_email: 'Định dạng email không hợp lệ.',
        auth_user_disabled: 'Tài khoản đã bị vô hiệu hóa.',
        auth_wrong_credentials: 'Email hoặc mật khẩu không chính xác.',
        auth_email_in_use: 'Email đã được sử dụng.',
        auth_weak_password: 'Mật khẩu phải có ít nhất 6 ký tự.',
        auth_missing_email: 'Vui lòng nhập email.',
        auth_generic_error: 'Đã xảy ra lỗi xác thực: {0}',
        auth_password_mismatch: 'Mật khẩu và xác nhận mật khẩu không khớp.',
        auth_register_success: '✅ Đăng ký thành công! Bạn sẽ tự động đăng nhập.',
        auth_login_success: '✅ Đăng nhập thành công!',
        auth_reset_sent: '✅ Đã gửi liên kết đặt lại mật khẩu đến email của bạn. Vui lòng kiểm tra email để tiếp tục.',
        auth_unexpected_error: 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.',
        auth_reset_title: 'Đặt lại mật khẩu',
        auth_register_title: 'Đăng ký',
        auth_registering: 'Đang đăng ký...',
        auth_processing: 'Đang xử lý...',
        auth_send_reset: 'Gửi email đặt lại',
        auth_register_button: 'Đăng ký',
        auth_forgot_password: 'Quên mật khẩu?',
        auth_back_to_login: 'Quay lại màn hình đăng nhập',
        auth_continue_anon: 'Tiếp tục sử dụng ứng dụng mà không cần đăng nhập',
        auth_placeholder_email: 'Email',
        auth_placeholder_password: 'Mật khẩu (6+ ký tự)',
        auth_placeholder_confirm_password: 'Xác nhận mật khẩu',
    }
};

// t 함수는 그대로 유지
const t = (key, lang = 'ko', ...args) => {
    let text = translations[lang]?.[key] || translations['ko'][key] || key;
    // 인수가 있을 경우 치환
    args.forEach((arg, index) => {
        text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), arg);
    });
    return text;
};

// 🚨 FIX: SUBSCRIPTION_LIMITS 임시 정의 (NaN 및 제한 횟수 계산 오류 방지)
const SUBSCRIPTION_LIMITS = {
    free: { commentary: 5, sermon: 1 },
    premium: { commentary: 9999, sermon: 9999 },
};

// --------------------------------------------------
// RenderLandingPage (Syntax Fix 적용)
// --------------------------------------------------
const RenderLandingPage = ({ onGetStarted, lang }) => {
    const featureItems = useMemo(() => [
        { icon: '⚡', title: t('landing_title_1', lang), summary: t('landing_summary_1', lang) },
        { icon: '🧠', title: t('landing_title_2', lang), summary: t('landing_summary_2', lang) },
        { icon: '🌍', title: t('landing_title_3', lang), summary: t('landing_summary_3', lang) },
        { icon: '💰', title: t('landing_title_4', lang), summary: t('landing_summary_4', lang) },
        { icon: '✍️', title: t('landing_title_5', lang), summary: t('landing_summary_5', lang) },
        { icon: '🗂️', title: t('landing_title_6', lang), summary: t('landing_summary_6', lang) },
    ], [lang]);

    const HeroSection = () => (
        <div 
            className="relative w-full min-h-screen flex flex-col items-center justify-center text-white overflow-hidden" 
            style={{ 
                backgroundColor: HERO_BG_COLOR, 
                backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url('${BACKGROUND_IMAGE_URL}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <div className="absolute inset-0 bg-black opacity-30"></div> 
            <div className="relative text-center max-w-4xl p-8 z-10 pt-[64px]">
                <h1 style={{ fontSize: '7rem', lineHeight: '1.1', fontWeight: 800 }} className="mb-4 drop-shadow-lg">SermonNote</h1>
                <p className="text-xl md:text-2xl font-light mb-8 drop-shadow-md">{t('landingSubtitle', lang)}</p>
                <button onClick={onGetStarted} type="button" className="px-10 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:bg-red-700 transition transform hover:scale-105">{t('start', lang)}</button>
            </div>
        </div>
    );
    
    const FeaturesSection = () => (
        <div className="w-full bg-white py-16 px-8">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-800 mb-12 border-b-2 border-red-500 pb-2">{t('landing_title_main', lang)}</h2>
                <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">{t('landing_summary_main', lang)}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {featureItems.map((item, index) => (
                        <div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 transition hover:shadow-2xl flex flex-col h-full">
                            <div className="4xl mb-4 text-red-500">{item.icon}</div>
                            <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
                            <p className="text-gray-600 text-sm flex-1">{item.summary}</p>
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
};


// --------------------------------------------------
// 설교 유형 선택 컴포넌트 (SermonSelection) (유지)
// --------------------------------------------------
const SermonSelection = ({ 
    user, 
    setSelectedSermonType, 
    openLoginModal, 
    onGoToLanding, 
    lang, 
    loading
}) => {
    // 🚨 FIX: 아이콘 컴포넌트를 SermonSelection에서 직접 사용하도록 수정
    const sermonTypes = useMemo(() => [
        { type: 'ai-assistant-sermon', title: t('sermonAssistant', lang), description: t('aiAssistantDesc', lang) || 'AI 어시스턴트가 주제, 성경 구절에 맞춰 완벽한 설교를 초안합니다.', icon: <PlusCircleIcon className="w-10 h-10 text-blue-500" /> },
        { type: 'expository-sermon', title: t('expositorySermon', lang), description: t('expositoryDesc', lang) || '성경 본문을 깊이 있게 분석하고 구조화하여 강해 설교를 작성합니다.', icon: <BibleIcon className="w-10 h-10 text-green-500" /> },
        { type: 'real-life-sermon', title: t('realLifeSermon', lang), description: t('realLifeDesc', lang) || '현대 사회 이슈나 삶의 고민에 연결된 실생활 적용 설교를 만듭니다.', icon: <RealLifeIcon className="w-10 h-10 text-red-500" /> },
        { type: 'quick-memo-sermon', title: t('quickMemoSermon', lang), description: t('quickMemoDesc', lang) || '짧은 영감, 묵상 노트에서 확장된 설교를 빠르고 쉽게 만듭니다.', icon: <QuickMemoIcon className="w-10 h-10 text-yellow-500" /> },
        { type: 'rebirth-sermon', title: t('rebirthSermon', lang), description: t('rebirthDesc', lang) || '과거 설교 자료를 업로드하여 AI로 재구성하고 최신 스타일로 바꿉니다.', icon: <RebirthIcon className="w-10 h-10 text-purple-500" /> },
        { type: 'premium-upgrade', title: t('upgradeToPremium', lang), description: t('upgradeDesc', lang) || '프리미엄 구독을 통해 모든 기능을 무제한으로 사용하세요.', icon: <PremiumIcon className="w-10 h-10 text-yellow-600" /> }
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
                            // 로그인하지 않았고, 프리미엄 업그레이드가 아닌 경우 로그인 모달 표시
                            if (!isAuthenticated && !loading && sermon.type !== 'premium-upgrade') { 
                                openLoginModal(); 
                            } 
                            // 로그인했거나, 프리미엄 업그레이드인 경우 해당 컴포넌트로 이동
                            else if (isAuthenticated || sermon.type === 'premium-upgrade') {
                                setSelectedSermonType(sermon.type); 
                            }
                        };
                        
                        return (
                            <button
                                key={sermon.type}
                                onClick={handleClick}
                                className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-200 text-left"
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
                    {'<< 초기 화면으로 돌아가기'}
                </button>
            </div>
        </div>
    );
};


// --------------------------------------------------
// API 호출 헬퍼 (HomeContent의 generateSermon 구현용)
// --------------------------------------------------
const callAPI = async (promptText, options = {}) => {
    const { type, lang, generationConfig = {} } = options;
    
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, lang, type, generationConfig }),
    });
        
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse server error response.' }));
        throw new Error(errorData.message || 'Server responded with an error.');
    }
        
    const data = await response.json();
    return data.text;
};

// --------------------------------------------------
// 메인 컴포넌트: HomeContent (수정)
// --------------------------------------------------

function HomeContent() {
    // ⭐️ loading 상태를 AuthContext에서 가져옵니다.
    const { user, loading, authError, handleLogout: contextLogout, authInstance } = useAuth();
    
    // 🚨 FIX: isFirebaseError를 먼저 정의해야 모든 곳에서 사용 가능
    const isFirebaseError = authError ? authError.includes("Firebase") : false; 
    
    // 🚨 FIX 1: ExpositorySermonComponent가 사용하는 모든 상태 정의
    const [errorMessage, setErrorMessage] = useState(''); 
    const [sermonCount, setSermonCount] = useState(0); 
    const [commentaryCount, setCommentaryCount] = useState(0); 
    const [sermonDraft, setSermonDraft] = useState(''); 
    
    const [userSubscription, setUserSubscription] = useState('free'); // ⚠️ 임시로 'free'로 설정
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    
    // 흰 화면 문제로 인해 viewMode를 'landing'으로 유지하도록 로직 보강
    const [viewMode, setViewMode] = useState('landing'); 
    
    const [selectedSermonType, setSelectedSermonType] = useState('sermon-selection'); 
    const [lang, setLang] = useState('ko');
    
    
    // 🚨 FIX: 흰 화면/무한 루프 방지 로직 (loading과 viewMode 의존)
    useEffect(() => {
        // 로딩이 완료되었는데, user도 없고 에러도 없으며 viewMode가 'landing'이 아닐 경우 강제 'landing'으로 전환 (흰 화면 방지)
        if (!loading && viewMode !== 'landing' && !user && !isFirebaseError) {
             setViewMode('landing');
        }
    }, [loading, isFirebaseError, user, viewMode]);


    // 🚨 FIX 2: ExpositorySermonComponent가 사용하는 generateSermon prop 구현
    const generateSermon = useCallback(async (prompt, type) => {
        try {
            // callAPI를 통해 lang 정보를 서버로 보냅니다.
            const result = await callAPI(prompt, { lang, type });
            
            // 사용 횟수 업데이트
            if (type === 'commentary') {
                setCommentaryCount(prev => prev + 1);
            } else if (type === 'sermon') {
                setSermonCount(prev => prev + 1);
            }
            return result;
        } catch (error) {
            setErrorMessage(t('generationFailed', lang));
            console.error("Generate Sermon Error:", error);
            return null;
        }
    }, [lang, setErrorMessage, setCommentaryCount, setSermonCount]);
    
    // AuthContext의 handleLogout을 사용하기 위해 useCallback 유지
    const handleLogout = useCallback(async () => { 
        if (contextLogout) { 
            await contextLogout(); 
            setViewMode('landing'); // 로그아웃 후 랜딩 페이지로 이동
            setSelectedSermonType('sermon-selection'); 
            setSermonCount(0); 
            setCommentaryCount(0);
            setUserSubscription('free'); 
        } 
    }, [contextLogout]);

    // 모달 관련 함수들 (유지)
    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = useCallback(() => { setIsLoginModalOpen(false); }, []); 
    const closeLimitModal = useCallback(() => { setIsLimitModalOpen(false); }, []);
    
    // LimitModal에서 프리미엄 페이지로 이동하는 핸들러
    const handleGoToUpgradePage = useCallback(() => {
        setIsLimitModalOpen(false);
        setSelectedSermonType('premium-upgrade'); 
        setViewMode('sermon');
    }, []);
    
    const handleLimitReached = useCallback((type) => {
        if (userSubscription === 'free') {
            setIsLimitModalOpen(true);
        }
    }, [userSubscription]);

    const handleLogoClick = useCallback(() => { setViewMode('landing'); setSelectedSermonType('sermon-selection'); }, []); 
    
    const handleLoginSuccess = useCallback(() => { 
        // 로그인 성공 시, 모달을 닫고 서비스 화면으로 전환
        setIsLoginModalOpen(false);
        // user가 AuthProvider에서 업데이트되면 viewMode가 'sermon'으로 전환되도록 설정
        if (user) {
            setViewMode('sermon');
            setSelectedSermonType('sermon-selection');
        }
        console.log("Login Success Handled by HomeContent.");
    }, [user]); 
    
    const handleGetStarted = useCallback(() => {
        if (user && !isFirebaseError) { 
            setViewMode('sermon');
            setSelectedSermonType('sermon-selection');
        } else {
            openLoginModal(); 
        }
    }, [user, isFirebaseError]); 
    
    // 🚨 FIX 3: canGenerateCommentary 계산 로직 추가 (NaN 오류 방지 및 버튼 활성화)
    const isUnlimited = userSubscription === 'premium';
    const limit = SUBSCRIPTION_LIMITS[userSubscription]?.commentary || 0; 
    const canGenerateCommentary = isUnlimited || (commentaryCount < limit);

    const isUnlimitedSermon = userSubscription === 'premium';
    const sermonLimit = SUBSCRIPTION_LIMITS[userSubscription]?.sermon || 0;
    const canGenerateSermon = isUnlimitedSermon || (sermonCount < sermonLimit);
    
    // 🚨 FIX: renderSermonComponent 함수를 HomeContent 내부로 이동시키고 t prop을 추가
    const renderSermonComponent = useCallback(() => {
        const onGoToSelection = () => setSelectedSermonType('sermon-selection');
        
        const commonProps = {
            user: user,
            userId: user?.uid,
            setErrorMessage: setErrorMessage, 
            setSermonDraft: setSermonDraft, 
            commentaryCount: commentaryCount, 
            canGenerateCommentary: canGenerateCommentary, 
            canGenerateSermon: canGenerateSermon,
            generateSermon: generateSermon,
            onGoBack: onGoToSelection, 
            
            // ⭐️ 핵심 수정: t 함수를 prop으로 전달
            t: (key, ...args) => t(key, lang, ...args), 
            
            lang: lang,
            sermonCount: sermonCount,
            setSermonCount: setSermonCount,
            userSubscription: userSubscription, 
            onLimitReached: handleLimitReached, 
            openLoginModal: openLoginModal,
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
                        <p className="text-xl mb-4">🚨 오류: 알 수 없는 설교 유형입니다.</p>
                        <button onClick={onGoToSelection} className="mt-4 px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">
                            선택 화면으로 돌아가기
                        </button>
                    </div>
                );
        }
    }, [
        user, 
        lang, 
        selectedSermonType, 
        setErrorMessage, 
        setSermonDraft, 
        commentaryCount, 
        canGenerateCommentary, 
        canGenerateSermon, 
        generateSermon,
        sermonCount,
        setSermonCount,
        userSubscription, 
        handleLimitReached, 
        openLoginModal,
        loading
    ]);


    // 메인 로딩 처리 (인증 확인 중)
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-gray-700 bg-gray-50">
                <LoadingSpinner message={t('loadingAuth', lang)} />
                {authError && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                        🚨 {authError}
                    </div>
                )}
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-gray-100 text-gray-800 font-sans min-h-screen">
            
            {/* 상단 헤더 */}
            <header className="flex justify-between items-center w-full px-8 py-4 bg-white shadow-md sticky top-0 z-50"> 
                <span
                    onClick={handleLogoClick}
                    className="text-2xl font-bold text-gray-800 cursor-pointer"
                >
                    SermonNote
                </span>
                <div className="flex items-center space-x-4">
                    {/* AI 사용 횟수 표시 (임시) */}
                    <span className="text-sm font-medium text-gray-600">
                        AI 사용: {sermonCount}회
                    </span>
                    {/* 로그인/로그아웃 버튼 */}
                    {user && !isFirebaseError ? ( 
                        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">{t('logout', lang)}</button>
                    ) : ( 
                        <button 
                            onClick={openLoginModal} 
                            // ⭐️ FIX: Firebase 에러가 있을 때만 비활성화 유지
                            disabled={isFirebaseError} 
                            className={`px-4 py-2 text-white rounded-lg transition ${
                                isFirebaseError ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {t('login', lang)}
                        </button>
                    )}
                    {/* 언어 선택 */}
                    <select value={lang} onChange={(e) => setLang(e.target.value)} className="p-2 border rounded-lg bg-white text-gray-800">
                        {languageOptions.map(option => (<option key={option.code} value={option.code}>{t(option.nameKey, lang)}</option>))}
                    </select>
                </div>
            </header>

            {/* 메인 콘텐츠 영역 (랜딩 페이지 또는 서비스) */}
            <main className="flex-1 flex flex-col items-center w-full">
                {isFirebaseError && (
                    <div className="w-full p-4 bg-red-100 text-red-700 border-b border-red-400 text-center font-medium">
                        🚨 Firebase 연동에 문제가 있습니다: {authError}
                    </div>
                )}
                
                {viewMode === 'landing' || isFirebaseError ? (
                    <RenderLandingPage 
                        onGetStarted={handleGetStarted} 
                        lang={lang} 
                    />
                ) : (
                    <div className="w-full">
                        {renderSermonComponent()}
                    </div>
                )}
            </main>

            {/* 하단 모달 및 버튼 */}
            {/* ⭐️ 최종 FIX: authInstance 여부에 관계없이 LoginModal을 띄우도록 조건 변경 */}
            {isLoginModalOpen && (
                <LoginModal 
                    onClose={closeLoginModal} 
                    onLoginSuccess={handleLoginSuccess} 
                    Instance={authInstance} // authInstance가 undefined인 채로 전달됨. LoginModal.js 내부에서 처리됨.
                    t={(key, ...args) => t(key, lang, ...args)} // t 함수 전달
                    lang={lang} // lang 전달
                />
            )}

            {isLimitModalOpen && (
                <LimitReachedModal
                    isOpen={isLimitModalOpen}
                    onClose={closeLimitModal}
                    onUpgrade={handleGoToUpgradePage}
                    title={t('limitModalTitle', lang)}
                    description={t('limitModalDescription', lang)}
                    upgradeButtonText={t('upgradeButton', lang)}
                    closeButtonText={t('closeButton', lang)}
                />
            )}
            
            <button /* 퀵메모 버튼 */
                onClick={() => setSelectedSermonType('quick-memo-sermon')}
                className="fixed bottom-8 right-8 p-5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-2xl transition z-40 transform hover:scale-110"
            >
                <QuickMemoIcon className="w-6 h-6" />
            </button>
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