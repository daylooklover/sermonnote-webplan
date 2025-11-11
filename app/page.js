"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react'; // useMemo 포함

// AuthProvider와 useAuth는 Named Export가 일반적이므로 그대로 유지합니다.
// 경로가 app/page.js에서 components/AuthContext로 이동하기 위해 '../components'가 필요합니다.
import { AuthProvider, useAuth } from '../components/AuthContext'; 

// 🚨🚨🚨 FIX: 모든 Import 경로에 명시적인 확장자 (.js)를 추가하여 빌드 경로 충돌 해결 🚨🚨🚨
import SermonAssistantComponent from '../components/SermonAssistantComponent.js'; 
import ExpositorySermonComponent from '../components/ExpositorySermonComponent.js';
import RealLifeSermonComponent from '../components/RealLifeSermonComponent.js';
import QuickMemoSermonComponent from '../components/QuickMemoSermonComponent.js';
import RebirthSermonFeature from '../components/RebirthSermonFeature.js';
import PremiumSubscriptionPage from '../components/PremiumSubscriptionPage.js'; // 🚨 이 경로가 오류를 일으킵니다.


// --------------------------------------------------
// 상수 및 번역 헬퍼 (t) 정의 (Full Code)
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
    ko: {
        lang_ko: '한국어', lang_en: '영어', lang_zh: '중국어', lang_ru: '러시아어', lang_vi: '베트남어',
        welcome: '환영합니다', logout: '로그아웃', login: '로그인', user: '사용자',
        loadingAuth: '인증 확인 중...',
        selectSermonType: '설교 유형을 선택해 주세요.',
        landingSubtitle: '신앙을 깊게 하고, 통찰력을 정리하세요.',
        start: '시작하기',
        chooseSermonType: '설교 유형 선택',
        chooseSermonTypeDescription: '가장 적합한 설교 유형을 선택하여 말씀 준비를 시작하세요.',
        sermonAssistant: '설교 AI 어시스턴트',
        expositorySermon: '강해 설교',
        realLifeSermon: '삶과 연결된 설교',
        quickMemoSermon: '빠른 메모 설교',
        rebirthSermon: '설교의 재탄생',
        upgradeToPremium: '프리미엄으로 업그레이드',
        limitModalTitle: '무료 사용 한도 도달',
        limitModalDescription: 'AI 설교 초안 생성 횟수 제한에 도달했습니다. 무제한 사용을 위해 프리미엄으로 업그레이드하세요。',
        upgradeButton: '프리미엄 구독',
        closeButton: '닫기',
        goBack: '뒤로',
        clearChat: '대화 초기화',
        sermonAssistantInitialTitle: "AI 설교 도우미",
        sermonAssistantInitialDescription: "질문을 시작하여 설교 초안을 생성하세요。",
        askAQuestionToBegin: "아래 입력창에 주제나 성경 구절을 넣어 시작하세요。",
        startYourSermonConversation: "대화 시작하기",
        aiIsThinking: "AI가 응답을 생성 중입니다...",
        sermonAssistantInputPlaceholder: "설교 주제나 질문을 입력하세요...",
        loginToUseFeature: '로그인이 필요합니다.',
        confirmClearChat: "대화 내용을 모두 초기화하시겠습니까?",
        errorProcessingRequest: "요청 처리 중 오류 발생",
        aiAssistantDefaultResponse: "답변을 받았습니다。",
        loadingSermonTypes: "설교 유형을 불러오는 중...",
        
        landing_title_main: "SermonNote가 목회자님께 드리는 혁신적인 혜택", landing_summary_main: "바쁜 일상 속에서 깊이 있는 설교를 준비하는 것은 쉽지 않습니다. SermonNote는 최첨단 AI 기술을 활용하여 목회자님의 시간을 절약하고, 더욱 풍성한 말씀으로 성도들을 양육할 수 있도록 돕습니다. 개인 맞춤형 설교 생성부터 전문 연구 관리까지, 모든 과정을 스마트하게 지원합니다。",
        landing_title_1: 'AI 기반, 5배 빠른 설교 완성', landing_summary_1: 'AI 분석, 초안 작성, 내용 구성까지 시가 초과된 단계까지 초안 작성을 보장하며 시간을 절약합니다.',
        landing_title_2: '나만의 설교 스타일 학습 AI', landing_summary_2: '사용자의 과거 설교 스타일, 어휘, 신학적 관점을 학습하여 목사님만의 개성이 담긴 맞교 초안을 완성합니다.',
        landing_title_3: '글로벌 선교를 위한 맞춤형 언어 지원', landing_summary_3: '영어, 한국어는 물론, 중국어, 러시아어, 베트남어 등 주요 선교 지역 언어로 설교를 생성 및 편집할 수 있습니다.',
        landing_title_4: '목회 사역을 위한 현명한 투자', landing_summary_4: 'SermonNote는 단순한 지출이 아닌, 효과적인 사역을 위한 핵심 투자입니다.',
        landing_title_5: '영감 보존, 묵상 심화 촉진', landing_summary_5: '떠오르는 영감을 놓치지 않고 메모하며, 설교 묵상 단계를 체계적으로 심화합니다.',
        landing_title_6: '체계적인 설교 자료 연구 관리', landing_summary_6: '생성된 모든 설교, 묵상, 노트, 참고 자료를 자동으로 분류하고 정리하여 쉽게 검색하고 재사용합니다.',
        
        // 구독 관련 키 추가
        chooseYourPlan: '요금제 선택', planSubtitle: 'SermonNote는 모든 사용자에게 최적화된 다양한 요금제를 제공합니다.',
        monthly: '월간', annually: '연간', saveUpTo: '최대 {0}% 할인', bestValue: '최고 가치',
        planFreeMember: '무료 멤버', freePlanDescription: 'SermonNote의 기본 기능을 무료로 사용해보세요.',
        planStandardMember: '스탠다드 멤버', standardPlanDescription: '설교 준비 효율성을 높이는 핵심 기능을 제공합니다.',
        planPremiumMember: '프리미엄 멤버', premiumPlanDescription: '최고의 설교 경험을 위한 올인원 솔루션입니다.',
        sermonGenTimes: '설교 생성 {0}회/월', aiAnnotationTimes: 'AI 주석 {0}회/월',
        textEditor: '텍스트 에디터', advancedTextEditor: '고급 AI 텍스트 에디터',
        limitedSupport: '우선 기술 지원 (제한적)', unlimitedSermonGen: '무제한 설교 생성',
        unlimitedAnnotation: '무제한 AI 주석', unlimitedSupport: '우선 기술 지원 (무제한)',
        getStarted: '시작하기', subscribeNow: '지금 구독하기',
        sermonSelectionReturn: '설교 유형 선택 화면으로 돌아가기',
        year: '년', month: '월', billedAnnualy: '연간 {0} $ 청구', saveVsMonthly: '월간 대비 {0}% 절약',
        subscriptionSuccessful: '구독 완료!', welcomePremiumTier: '프리미엄 멤버십에 오신 것을 환영합니다. SermonNote의 모든 기능을 무제한으로 즐기세요.',
        startWritingSermons: '설교 작성 시작',
    },
    en: {
        lang_ko: 'Korean', lang_en: 'English', lang_zh: 'Chinese', lang_ru: 'Russian', lang_vi: 'Vietnamese',
        welcome: 'Welcome', logout: 'Logout', login: 'Login', user: 'User',
        loadingAuth: 'Checking Authentication...',
        selectSermonType: 'Please select sermon type.',
        landingSubtitle: 'Deepen your faith and organize your insights.',
        start: 'Get Started',
        chooseSermonType: 'Choose Sermon Type',
        chooseSermonTypeDescription: 'Select the most suitable sermon type to begin preparing the word.',
        sermonAssistant: 'AI Sermon Assistant',
        expositorySermon: 'Expository Sermon',
        realLifeSermon: 'Real-Life Sermon',
        quickMemoSermon: 'Quick Memo Sermon',
        rebirthSermon: 'Sermon Rebirth',
        upgradeToPremium: 'Upgrade to Premium',
        limitModalTitle: 'Free Usage Limit Reached',
        limitModalDescription: 'You have reached the free limit for AI sermon draft generation. Upgrade to Premium for unlimited use.',
        upgradeButton: 'Subscribe to Premium',
        closeButton: 'Close',
        goBack: 'Back',
        clearChat: 'Clear Chat',
        sermonAssistantInitialTitle: "AI Sermon Assistant",
        sermonAssistantInitialDescription: "Start asking questions to generate your sermon draft.",
        askAQuestionToBegin: "Enter your topic or scripture below to begin.",
        startYourSermonConversation: "Start Conversation",
        aiIsThinking: "AI is thinking...",
        sermonAssistantInputPlaceholder: "Enter your sermon topic or question...",
        loginToUseFeature: 'Login is required.',
        confirmClearChat: "Are you sure you want to clear all messages?",
        errorProcessingRequest: "Error processing request",
        aiAssistantDefaultResponse: "Received response。",
        loadingSermonTypes: "Loading sermon types...",
        
        landing_title_main: "Innovative Benefits SermonNote Offers Pastors", landing_summary_main: "It's challenging to prepare deep sermons amidst a busy schedule. SermonNote uses cutting-edge AI to save time and nurture your congregation with richer messages. From personalized sermon creation to expert research management, smart support is provided.",
        landing_title_1: 'AI Powered, 5x Faster Sermon Prep', landing_summary_1: 'AI analysis, drafting, and structure guarantee a complete draft faster, saving you valuable time.',
        landing_title_2: 'Personalized Preaching Style AI', landing_summary_2: 'The AI learns your past sermons, vocabulary, and theological view to complete drafts with your unique personality.',
        landing_title_3: 'Custom Language Support for Global Mission', landing_summary_3: 'Generate and edit sermons in major mission languages including English, Korean, Chinese, Russian, and Vietnamese.',
        landing_title_4: 'A Wise Investment for Your Ministry', landing_summary_4: 'SermonNote is not just an expense, but a key investment for effective ministry.',
        landing_title_5: 'Preserve Inspiration, Deepen Meditation', landing_summary_5: 'Never lose fleeting inspiration; systematically deepen your sermon meditation stages by recording notes.',
        landing_title_6: 'Systematic Sermon Resource Management', landing_summary_6: 'Automatically categorize and organize all generated sermons, notes, and references for easy search and reuse.',
        
        // 구독 관련 키 추가
        chooseYourPlan: 'Choose Your Plan', planSubtitle: 'SermonNote offers a variety of plans optimized for every user.',
        monthly: 'Monthly', annually: 'Annually', saveUpTo: 'SAVE UP TO {0}%', bestValue: 'BEST VALUE',
        planFreeMember: 'Free Member', freePlanDescription: 'Try SermonNote\'s basic features for free.',
        planStandardMember: 'Standard Member', standardPlanDescription: 'Provides core features to enhance sermon preparation efficiency.',
        planPremiumMember: 'Premium Member', premiumPlanDescription: 'The all-in-one solution for the ultimate sermon experience.',
        sermonGenTimes: 'Sermon Generation {0} times/month', aiAnnotationTimes: 'AI Annotation {0} times/month',
        textEditor: 'Text Editor', advancedTextEditor: 'Advanced AI Text Editor',
        limitedSupport: 'Priority Tech Support (limited)', unlimitedSermonGen: 'Unlimited Sermon Generation',
        unlimitedAnnotation: 'Unlimited AI Annotation', unlimitedSupport: 'Priority Tech Support (unlimited)',
        getStarted: 'Get Started', subscribeNow: 'Subscribe Now',
        sermonSelectionReturn: 'Return to Sermon Selection',
        year: 'year', month: 'month', billedAnnualy: 'Billed {0} $/year', saveVsMonthly: 'Save {0}% (vs. monthly)',
        subscriptionSuccessful: 'Subscription Successful!', welcomePremiumTier: 'Welcome to the Premium tier. Enjoy unlimited access to all SermonNote features.',
        startWritingSermons: 'Start Writing Sermons',
    },
    // ... (zh, ru, vi 섹션 유지)
    zh: { // 🚨 중국어 번역 시작
        lang_ko: '韩语', lang_en: '英语', lang_zh: '中文', lang_ru: '俄语', lang_vi: '越南语',
        welcome: '欢迎', logout: '登出', login: '登录', user: '用户',
        loadingAuth: '验证中...',
        selectSermonType: '请选择讲道类型。',
        landingSubtitle: '深化您的信仰，整理您的见解。',
        start: '开始',
        chooseSermonType: '选择讲道类型',
        chooseSermonTypeDescription: '请选择最合适的讲道类型来开始准备。',
        sermonAssistant: 'AI 讲道助手',
        expositorySermon: '释经讲道',
        realLifeSermon: '与生活连接的讲道',
        quickMemoSermon: '快速笔记讲道',
        rebirthSermon: '讲道的重生',
        upgradeToPremium: '升级到高级版',
        limitModalTitle: '已达到免费使用限制',
        limitModalDescription: '您已达到免费 AI 讲道草稿生成次数限制。请升级到高级版以无限使用。',
        upgradeButton: '订阅高级版',
        closeButton: '关闭',
        goBack: '返回',
        clearChat: '清除聊天记录',
        sermonAssistantInitialTitle: "AI 讲道助手",
        sermonAssistantInitialDescription: "开始提问以生成您的讲道草稿。",
        askAQuestionToBegin: "在下面输入主题或经文开始。",
        startYourSermonConversation: "开始对话",
        aiIsThinking: "AI 正在思考...",
        sermonAssistantInputPlaceholder: "请输入您的讲道主题或问题...",
        loginToUseFeature: '需要登录。',
        confirmClearChat: "您确定要清除所有消息吗？",
        errorProcessingRequest: "处理请求时发生错误",
        aiAssistantDefaultResponse: "收到回复。",
        loadingSermonTypes: "正在加载讲道类型...",
        
        // 🚨 FIX: 랜딩 페이지 기능 목록 다국어 키 추가
        landing_title_main: "SermonNote 为牧师提供的创新优势", landing_summary_main: "在繁忙的日程中准备深入的讲道并不容易。SermonNote 使用尖端 AI 技术为您节省时间，并以更丰富的道言滋养您的会众。从个性化讲道创建到专业研究管理，提供全面的智能支持。",
        landing_title_1: 'AI 驱动，备课速度提升 5 倍', landing_summary_1: 'AI 分析、草稿撰写、内容组织，保证更快完成草稿，节省宝贵时间。',
        landing_title_2: '个性化讲道风格学习 AI', landing_summary_2: 'AI 学习您的历史讲道风格、词汇和神学观点，完成带有您个人特色的讲道草稿。',
        landing_title_3: '支持全球宣教的定制语言', landing_summary_3: '支持英语、韩语、中文、俄语、越南语等主要宣教区语言生成和编辑讲道。',
        landing_title_4: '对您事工的明智投资', landing_summary_4: 'SermonNote 不仅仅是一笔支出，更是对有效事工的关键投资。',
        landing_title_5: '保留灵感，促进默想深化', landing_summary_5: '不错过转瞬即逝的灵感，系统性地深化讲道默想阶段。',
        landing_title_6: '系统化的讲道资源研究管理', landing_summary_6: '自动分类和组织所有生成的讲道、笔记和参考资料，方便搜索和重复使用。',
        
        // 구독 관련 키 추가
        chooseYourPlan: '选择您的方案', planSubtitle: 'SermonNote 提供各种为每位用户优化的方案。',
        monthly: '每月', annually: '每年', saveUpTo: '最多节省 {0}%', bestValue: '最佳价值',
        planFreeMember: '免费会员', freePlanDescription: '免费试用 SermonNote 的基本功能。',
        planStandardMember: '标准会员', standardPlanDescription: '提供核心功能以提高讲道准备效率。',
        planPremiumMember: '高级会员', premiumPlanDescription: '终极讲道体验的一体化解决方案。',
        sermonGenTimes: '讲道生成 {0} 次/月', aiAnnotationTimes: 'AI 注释 {0} 次/月',
        textEditor: '文本编辑器', advancedTextEditor: '高级 AI 文本编辑器',
        limitedSupport: '优先技术支持（有限）', unlimitedSermonGen: '无限讲道生成',
        unlimitedAnnotation: '无限 AI 注释', unlimitedSupport: '优先技术支持（无限）',
        getStarted: '开始使用', subscribeNow: '立即订阅',
        sermonSelectionReturn: '返回讲道类型选择',
        year: '年', month: '月', billedAnnualy: '每年账单 {0} $', saveVsMonthly: '节省 {0}% (对比每月)',
        subscriptionSuccessful: '订阅成功！', welcomePremiumTier: '欢迎使用高级版。享受 SermonNote 所有功能的无限访问权限。',
        startWritingSermons: '开始撰写讲道',
    },
    ru: { // 🚨 러시아어 번역 추가
        lang_ko: 'Корейский', lang_en: 'Английский', lang_zh: 'Китайский', lang_ru: 'Русский', lang_vi: 'Вьетнамский',
        welcome: 'Добро пожаловать', logout: 'Выйти', login: 'Войти', user: 'Пользователь',
        loadingAuth: 'Проверка аутентификации...',
        selectSermonType: 'Пожалуйста, выберите тип проповеди.',
        landingSubtitle: 'Углубляйте свою веру и систематизируйте свои идеи.',
        start: 'Начать',
        chooseSermonType: 'Выбрать тип проповеди',
        chooseSermonTypeDescription: 'Выберите наиболее подходящий тип проповеди, чтобы начать подготовку слова.',
        sermonAssistant: 'AI Помощник по проповедям',
        expositorySermon: 'Толковая проповедь',
        realLifeSermon: 'Проповедь для реальной жизни',
        quickMemoSermon: 'Проповедь из быстрых заметок',
        rebirthSermon: 'Возрождение проповеди',
        upgradeToPremium: 'Обновить до Премиум',
        limitModalTitle: 'Достигнут лимит бесплатного использования',
        limitModalDescription: 'Вы достигли лимита бесплатных черновиков проповедей AI. Обновитесь до Премиум для неограниченного использования.',
        upgradeButton: 'Подписаться на Премиум',
        closeButton: 'Закрыть',
        goBack: 'Назад',
        clearChat: 'Очистить чат',
        sermonAssistantInitialTitle: "AI Помощник по проповедям",
        sermonAssistantInitialDescription: "Начните задавать вопросы, чтобы сгенерировать черновик проповеди.",
        askAQuestionToBegin: "Введите тему или отрывок из Писания ниже, чтобы начать.",
        startYourSermonConversation: "Начать разговор",
        aiIsThinking: "AI думает...",
        sermonAssistantInputPlaceholder: "Введите тему или вопрос для проповеди...",
        loginToUseFeature: 'Требуется вход.',
        confirmClearChat: "Вы уверены, что хотите удалить все сообщения?",
        errorProcessingRequest: "Ошибка обработки запроса",
        aiAssistantDefaultResponse: "Получен ответ.",
        loadingSermonTypes: "Загрузка типов проповедей...",
        
        // 🚨 FIX: 랜딩 페이지 기능 목록 다국어 키 추가
        landing_title_main: "Инновационные преимущества SermonNote для пасторов", landing_summary_main: "Подготовка глубоких проповедей в плотном графике сложна. SermonNote использует передовой ИИ, чтобы сэкономить ваше время и обогатить ваше служение. Полная поддержка от персонализированного создания до управления ресурсами.",
        landing_title_1: 'На основе ИИ, подготовка проповеди в 5 раз быстрее', landing_summary_1: 'Анализ ИИ, черновики и структура гарантируют завершение проповеди быстрее, экономя ваше время.',
        landing_title_2: 'ИИ для обучения вашему стилю проповеди', landing_summary_2: 'ИИ изучает ваши прошлые проповеди, лексику и богословские взгляды для создания черновиков с вашей уникальной индивидуальностью.',
        landing_title_3: 'Поддержка языков для глобальной миссии', landing_summary_3: 'Создавайте и редактируйте проповеди на основных миссионерских языках, включая английский, корейский, китайский, русский и вьетнамский.',
        landing_title_4: 'Мудрая инвестиция в ваше служение', landing_summary_4: 'SermonNote - это не просто расходы, а ключевая инвестиция в эффективное служение.',
        landing_title_5: 'Сохраняйте вдохновение, углубляйте медитацию', landing_summary_5: 'Никогда не теряйте мимолетное вдохновение; систематически углубляйте этапы медитации для проповеди, записывая заметки.',
        landing_title_6: 'Систематическое управление ресурсами для проповеди', landing_summary_6: 'Автоматически классифицируйте и систематизируйте все сгенерированные проповеди, заметки и ссылки для удобного поиска и повторного использования.',
        
        // 구독 관련 키 추가
        chooseYourPlan: 'Выберите свой план', planSubtitle: 'SermonNote предлагает множество планов, оптимизированных для каждого пользователя.',
        monthly: 'Ежемесячно', annually: 'Ежегодно', saveUpTo: 'Сэкономьте до {0}%', bestValue: 'ЛУЧШАЯ ЦЕННОСТЬ',
        planFreeMember: 'Бесплатный участник', freePlanDescription: 'Попробуйте базовые функции SermonNote бесплатно.',
        planStandardMember: 'Стандартный участник', standardPlanDescription: 'Предоставляет основные функции для повышения эффективности подготовки проповедей.',
        planPremiumMember: 'Премиум участник', premiumPlanDescription: 'Комплексное решение для максимального опыта проповедей.',
        sermonGenTimes: 'Генерация проповеди {0} раз/месяц', aiAnnotationTimes: 'AI Аннотация {0} раз/месяц',
        textEditor: 'Текстовый редактор', advancedTextEditor: 'Расширенный AI Текстовый редактор',
        limitedSupport: 'Приоритетная техническая поддержка (ограниченная)', unlimitedSermonGen: 'Неограниченная генерация проповедей',
        unlimitedAnnotation: 'Неограниченная AI Аннотация', unlimitedSupport: 'Приоритетная техническая поддержка (неограниченная)',
        getStarted: 'Начать', subscribeNow: 'Подписаться сейчас',
        sermonSelectionReturn: 'Вернуться к выбору проповеди',
        year: 'год', month: 'месяц', billedAnnualy: 'Выставление счета {0} $ / год', saveVsMonthly: 'Сэкономьте {0}% (по сравнению с ежемесячной)',
        subscriptionSuccessful: 'Подписка успешна!', welcomePremiumTier: 'Добро пожаловать на Премиум-уровень. Наслаждайтесь неограниченным доступом ко всем функциям SermonNote.',
        startWritingSermons: 'Начать писать проповеди',
    },
    vi: { // 🚨 베트남어 번역 추가
        lang_ko: 'Tiếng Hàn', lang_en: 'Tiếng Anh', lang_zh: 'Tiếng Trung', lang_ru: 'Tiếng Nga', lang_vi: 'Tiếng Việt',
        welcome: 'Chào mừng', logout: 'Đăng xuất', login: 'Đăng nhập', user: 'Người dùng',
        loadingAuth: 'Đang kiểm tra xác thực...',
        selectSermonType: 'Vui lòng chọn loại bài giảng.',
        landingSubtitle: 'Làm sâu sắc đức tin của bạn và sắp xếp những hiểu biết của bạn.',
        start: 'Bắt đầu',
        chooseSermonType: 'Chọn loại bài giảng',
        chooseSermonTypeDescription: 'Chọn loại bài giảng phù hợp nhất để bắt đầu chuẩn bị lời Chúa.',
        sermonAssistant: 'Trợ lý Bài giảng AI',
        expositorySermon: 'Bài giảng Giải thích',
        realLifeSermon: 'Bài giảng Thực tế',
        quickMemoSermon: 'Bài giảng Ghi chú Nhanh',
        rebirthSermon: 'Tái sinh Bài giảng',
        upgradeToPremium: 'Nâng cấp lên Premium',
        limitModalTitle: 'Đã đạt giới hạn sử dụng miễn phí',
        limitModalDescription: 'Bạn đã đạt giới hạn tạo bản nháp bài giảng AI miễn phí. Nâng cấp lên Premium để sử dụng không giới hạn.',
        upgradeButton: 'Đăng ký Premium',
        closeButton: 'Đóng',
        goBack: 'Quay lại',
        clearChat: 'Xóa trò chuyện',
        sermonAssistantInitialTitle: "Trợ lý Bài giảng AI",
        sermonAssistantInitialDescription: "Bắt đầu đặt câu hỏi để tạo bản nháp bài giảng của bạn.",
        askAQuestionToBegin: "Nhập chủ đề hoặc đoạn Kinh thánh của bạn bên dưới để bắt đầu.",
        startYourSermonConversation: "Bắt đầu cuộc trò chuyện",
        aiIsThinking: "AI đang suy nghĩ...",
        sermonAssistantInputPlaceholder: "Nhập chủ đề hoặc câu hỏi bài giảng của bạn...",
        loginToUseFeature: 'Yêu cầu đăng nhập.',
        confirmClearChat: "Bạn có chắc chắn muốn xóa tất cả tin nhắn không?",
        errorProcessingRequest: "Lỗi xử lý yêu cầu",
        aiAssistantDefaultResponse: "Đã nhận được phản hồi.",
        loadingSermonTypes: "Đang tải các loại bài giảng...",
        
        // 🚨 FIX: 랜딩 페이지 기능 목록 다국어 키 추가
        landing_title_main: "Lợi ích Đổi mới SermonNote Mang Lại Cho Mục Sư", landing_summary_main: "Việc chuẩn bị các bài giảng sâu sắc trong lịch trình bận rộn không hề dễ dàng. SermonNote sử dụng AI tiên tiến để tiết kiệm thời gian của bạn và nuôi dưỡng hội chúng bằng những thông điệp phong phú hơn. Hỗ trợ thông minh toàn diện từ tạo bài giảng cá nhân đến quản lý nghiên cứu chuyên nghiệp.",
        landing_title_1: 'Dựa trên AI, Chuẩn bị Bài giảng Nhanh hơn 5 lần', landing_summary_1: 'Phân tích AI, soạn thảo và cấu trúc đảm bảo bản nháp hoàn chỉnh nhanh hơn, tiết kiệm thời gian quý báu của bạn.',
        landing_title_2: 'AI Học hỏi Phong cách Giảng dạy Cá nhân hóa', landing_summary_2: 'AI học các bài giảng, từ vựng và quan điểm thần học trước đây của bạn để hoàn thành bản nháp với cá tính riêng của bạn.',
        landing_title_3: 'Hỗ trợ Ngôn ngữ Tùy chỉnh cho Sứ mệnh Toàn cầu', landing_summary_3: 'Tạo và chỉnh sửa bài giảng bằng các ngôn ngữ sứ mệnh chính bao gồm tiếng Anh, tiếng Hàn, tiếng Trung, tiếng Nga và tiếng Việt.',
        landing_title_4: 'Khoản đầu tư Thông minh cho Chức vụ của Bạn', landing_summary_4: 'SermonNote không chỉ là một khoản chi, mà là một khoản đầu tư quan trọng cho chức vụ hiệu quả.',
        landing_title_5: 'Giữ lại Cảm hứng, Đào sâu Thiền định', landing_summary_5: 'Không bao giờ bỏ lỡ cảm hứng thoáng qua; hệ thống hóa các giai đoạn thiền định bài giảng bằng cách ghi lại ghi chú.',
        landing_title_6: 'Quản lý Tài nguyên Bài giảng có Hệ thống', landing_summary_6: 'Tự động phân loại và sắp xếp tất cả các bài giảng, ghi chú và tài liệu tham khảo đã tạo để dễ dàng tìm kiếm và tái sử dụng.',
        
        // 구독 관련 키 추가
        chooseYourPlan: 'Chọn Gói của Bạn', planSubtitle: 'SermonNote cung cấp nhiều gói khác nhau được tối ưu hóa cho mọi người dùng.',
        monthly: 'Hàng tháng', annually: 'Hàng năm', saveUpTo: 'TIẾT KIỆM TỚI {0}%', bestValue: 'GIÁ TRỊ TỐT NHẤT',
        planFreeMember: 'Thành viên Miễn phí', freePlanDescription: 'Dùng thử miễn phí các tính năng cơ bản của SermonNote.',
        planStandardMember: 'Thành viên Tiêu chuẩn', standardPlanDescription: 'Cung cấp các tính năng cốt lõi để nâng cao hiệu quả chuẩn bị bài giảng.',
        planPremiumMember: 'Thành viên Cao cấp', premiumPlanDescription: 'Giải pháp toàn diện cho trải nghiệm bài giảng tối ưu.',
        sermonGenTimes: 'Tạo bài giảng {0} lần/tháng', aiAnnotationTimes: 'Chú thích AI {0} lần/tháng',
        textEditor: 'Trình chỉnh sửa văn bản', advancedTextEditor: 'Trình chỉnh sửa văn bản AI nâng cao',
        limitedSupport: 'Hỗ trợ kỹ thuật ưu tiên (có giới hạn)', unlimitedSermonGen: 'Tạo bài giảng không giới hạn',
        unlimitedAnnotation: 'Chú thích AI không giới hạn', unlimitedSupport: 'Hỗ trợ kỹ thuật ưu tiên (không giới hạn)',
        getStarted: 'Bắt đầu', subscribeNow: 'Đăng ký ngay',
        sermonSelectionReturn: 'Quay lại lựa chọn bài giảng',
        year: 'năm', month: 'tháng', billedAnnualy: 'Thanh toán {0} $ / năm', saveVsMonthly: 'Tiết kiệm {0}% (so với hàng tháng)',
        subscriptionSuccessful: 'Đăng ký thành công!', welcomePremiumTier: 'Chào mừng đến với cấp độ Cao cấp. Tận hưởng quyền truy cập không giới hạn vào tất cả các tính năng của SermonNote.',
        startWritingSermons: 'Bắt đầu Viết Bài giảng',
    },
};
const t = (key, lang = 'ko') => translations[lang]?.[key] || translations['ko'][key] || key;


// --------------------------------------------------
// 헬퍼 및 UI 컴포넌트 인라인 정의 (유지)
// --------------------------------------------------
const LoadingSpinner = ({ message = '로딩 중...' }) => (
    <div className="flex flex-col items-center justify-center p-4">
        <svg className="animate-spin h-8 w-8 text-red-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm font-medium text-gray-700">{message}</p>
    </div>
);
const LoginModal = ({ onClose, onLoginSuccess }) => {
    const { auth } = useAuth(); 

    // 이메일/비밀번호 인증을 위해 필요한 함수를 임시로 정의 (실제로는 Firebase SDK의 함수를 사용합니다)
    const signInWithEmailAndPassword = (auth, email, password) => { console.log("Simulated Login", email); return Promise.resolve({ user: { uid: 'sim-user', email: email } }); };
    const createUserWithEmailAndPassword = (auth, email, password) => { console.log("Simulated Register", email); return Promise.resolve({ user: { uid: 'sim-user', email: email } }); };
    const sendPasswordResetEmail = (auth, email) => { console.log("Simulated Reset", email); return Promise.resolve(); };

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); 
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);
    
    const [authMode, setAuthMode] = useState('login'); 

    const resetFields = useCallback(() => {
        setError('');
        setMessage('');
        setPassword('');
        setConfirmPassword('');
    }, []);

    const getFirebaseErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/invalid-email': return '유효하지 않은 이메일 주소 형식입니다.';
            case 'auth/user-disabled': return '사용이 정지된 계정입니다.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential': return '이메일 또는 비밀번호가 올바르지 않습니다.';
            case 'auth/email-already-in-use': return '이미 사용 중인 이메일입니다.';
            case 'auth/weak-password': return '비밀번호는 최소 6자 이상이어야 합니다.';
            case 'auth/missing-email': return '이메일을 입력해 주세요.';
            default: return `인증 오류가 발생했습니다: ${errorCode.replace('auth/', '')}`;
        }
    };
    
    const CloseIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
            <path d="M18 6L6 18" /><path d="M6 6L18 18" />
        </svg>
    );

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            if (authMode === 'register') {
                if (password !== confirmPassword) {
                    setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
                    setIsLoading(false);
                    return;
                }
                
                await createUserWithEmailAndPassword(auth, email, password);
                
                setMessage('✅ 회원가입 성공! 이제 자동으로 로그인됩니다.');
                onLoginSuccess();
                setTimeout(onClose, 800); 

            } else if (authMode === 'login') {
                const loginResult = await signInWithEmailAndPassword(auth, email, password);
                
                setMessage('✅ 로그인 성공! 페이지를 새로고침합니다...');
                
                onLoginSuccess(); 
                
                // 🚨 최종 FIX: 페이지 새로고침을 강제하여 인증 상태를 복구 🚨
                setTimeout(() => {
                    window.location.reload(); 
                }, 800); 

            } else if (authMode === 'reset') {
                await sendPasswordResetEmail(auth, email);

                setMessage('✅ 비밀번호 재설정 링크가 이메일로 전송되었습니다. 확인 후 비밀번호를 재설정해 주세요.');
                setAuthMode('login'); 
                resetFields();
            }

        } catch (e) {
            if (e.code) {
                setError(getFirebaseErrorMessage(e.code));
            } else {
                console.error('Unexpected Auth Error:', e);
                setError('예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose(); 
        }
    };
    
    const tabLabels = [
        { key: 'login', label: '로그인' },
        { key: 'register', label: '회원가입' },
    ];
    
    const getHeaderTitle = () => {
        if (authMode === 'reset') return '비밀번호 재설정';
        return authMode === 'register' ? '회원가입' : '로그인';
    };
    
    const getButtonText = () => {
        if (isLoading) return authMode === 'register' ? '가입 중...' : '처리 중...';
        if (authMode === 'reset') return '재설정 메일 보내기';
        return authMode === 'register' ? '회원가입' : '로그인';
    };

    if (!auth) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-75">
                <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full text-center">
                    <LoadingSpinner message="인증 시스템 준비 중..." />
                </div>
            </div>
        ); 
    }
    
    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-[100] p-4 font-inter"
            onClick={handleBackdropClick}
        >
            <div 
                className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 transform transition-all duration-300 scale-100 opacity-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-extrabold text-gray-900">{getHeaderTitle()}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-500 hover:text-red-600 transition p-1 rounded-full hover:bg-red-50"
                        aria-label="모달 닫기"
                    >
                        <CloseIcon />
                    </button>
                </div>
                
                {/* 탭 네비게이션 (재설정 모드가 아닐 때만 표시) */}
                {authMode !== 'reset' && (
                    <div className="flex mb-6 border-b border-gray-200">
                        {tabLabels.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => {setAuthMode(tab.key); resetFields();}}
                                className={`flex-1 py-3 text-base font-semibold transition-colors ${
                                    authMode === tab.key
                                        ? 'border-b-4 border-red-600 text-red-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                                disabled={isLoading}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
                
                {/* 알림 메시지 */}
                {(error || message) && (
                    <div className={`p-4 mb-4 rounded-xl text-sm font-medium ${error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        {error || message}
                    </div>
                )}

                <form onSubmit={handleAuthAction} className="space-y-4">
                    
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="이메일"
                        className="w-full p-4 rounded-xl bg-gray-50 text-gray-800 dark:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-red-100 focus:border-red-500 transition duration-150"
                        required
                        disabled={isLoading}
                    />
                    
                    {/* 비밀번호 입력 (재설정 모드가 아닐 때만 표시) */}
                    {(authMode === 'login' || authMode === 'register') && (
                        <>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호 (6자 이상)"
                                className="w-full p-4 rounded-xl bg-gray-50 text-gray-800 dark:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-red-100 focus:border-red-500 transition duration-150"
                                required
                                disabled={isLoading}
                            />
                            {/* 회원가입 시 비밀번호 확인 */}
                            {authMode === 'register' && (
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="비밀번호 확인"
                                    className="w-full p-4 rounded-xl bg-gray-50 text-gray-800 dark:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-4 focus:ring-red-100 focus:border-red-500 transition duration-150"
                                    required
                                    disabled={isLoading}
                                />
                            )}
                        </>
                    )}

                    {/* 비밀번호 찾기 링크 (로그인 탭에만 표시) */}
                    {authMode === 'login' && (
                        <div className="text-right">
                            <button 
                                type="button" 
                                onClick={() => {setAuthMode('reset'); resetFields();}}
                                className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors p-1"
                                disabled={isLoading}
                            >
                                비밀번호를 잊으셨나요?
                            </button>
                        </div>
                    )}
                    
                    <button
                        type="submit"
                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 disabled:shadow-none text-lg"
                        disabled={isLoading}
                    >
                        {getButtonText()}
                    </button>
                    
                    {/* 재설정 모드에서 돌아가기 버튼 */}
                    {authMode === 'reset' && (
                        <div className="mt-4 text-center text-sm text-gray-500 pt-2">
                            <button
                                onClick={() => {setAuthMode('login'); resetFields();}}
                                className="text-red-600 hover:text-red-800 font-medium transition-colors"
                                type="button"
                                disabled={isLoading}
                            >
                                ← 로그인 화면으로 돌아가기
                            </button>
                        </div>
                    )}
                    
                    {/* 익명 사용 계속 링크 (로그인 없이 앱 사용 계속) */}
                    {authMode !== 'reset' && (
                        <p className="text-center text-sm mt-4 pt-2">
                            <button
                                type="button" 
                                onClick={onClose} // 모달 닫기 = 로그인 안 된 상태로 앱 사용 계속
                                className="text-gray-500 hover:text-gray-700 font-medium transition-colors"
                                disabled={isLoading}
                            >
                                지금은 로그인하지 않고 앱 사용 계속하기
                            </button>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};
const LimitReachedModal = ({ onClose, lang, onGoToUpgrade }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-75">
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-sm w-full text-center">
            <h3 className="text-2xl font-bold mb-4 text-red-600">🚨 {t('limitModalTitle', lang)}</h3>
            <p className="mb-6 text-gray-600">
                {t('limitModalDescription', lang)}
            </p>
            <button 
                onClick={onGoToUpgrade}
                className="w-full px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition mb-3"
            >
                {t('upgradeButton', lang)}
            </button>
            <button 
                onClick={onClose}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition"
            >
                {t('closeButton', lang)}
            </button>
        </div>
        </div>
);

// 아이콘 컴포넌트 인라인 정의 (Full Code 생략, 필요한 부분만 유지)
const PlusCircleIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const BibleIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25V4.5m-8.69 4.31l1.77 1.77M18 10.5h4.5m-5.69 5.69l1.77 1.77M12 21.75V19.5m-8.69-4.31l1.77-1.77M18 13.5h4.5" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>);
const RealLifeIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75v.008m-7.5 0v.008m7.5 0h-7.5m7.5 0h-7.5m7.5 0v11.25m-7.5-11.25v11.25m7.5 0h-7.5m7.5 0h-7.5m0 0v1.5m7.5-1.5v1.5m0 0h-7.5m7.5 0h-7.5m0 0H6.5a2.25 2.25 0 00-2.25 2.25v.5m17.5-3.5a2.25 2.25 0 00-2.25-2.25H6.5a2.25 2.25 0 00-2.25 2.25v.5m17.5-3.5v.5m-15.75 3.5a2.25 2.25 0 00-2.25 2.25v.5m-1.5-2.75v.5" /></svg>);
const QuickMemoIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);
const RebirthIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.648v-4.992h-.001M19.648 2.985H14.656m-4.63 1.965-2.864 2.864m2.864 2.864L14.656 19.648M19.648 14.656v4.992h-.001M2.985 9.348H7.977" /></svg>);
const PremiumIcon = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.109a.562.562 0 00.475.345l5.518.442a.563.563 0 01.322.99l-4.267 3.896a.562.562 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.6l-4.725-2.885a.562.562 0 00-.586 0L6.974 19.53a.562.562 0 01-.84-.6l1.285-5.386a.562.562 0 00-.182-.557L3.99 10.38a.562.562 0 01.322-.99l5.518-.442a.562.562 0 00.475-.345l2.125-5.11z" /></svg>);

// --------------------------------------------------
// ⭐️ RenderLandingPage 정의 (다국어 적용)
// --------------------------------------------------
const RenderLandingPage = ({ onGetStarted, lang, t }) => {
    
    // 🚨 FIX: featureItems를 t 함수를 사용해 동적으로 생성 (useMemo import 후 사용)
    const featureItems = useMemo(() => [
        { icon: '⚡', title: t('landing_title_1', lang), summary: t('landing_summary_1', lang) },
        { icon: '🧠', title: t('landing_title_2', lang), summary: t('landing_summary_2', lang) },
        { icon: '🌍', title: t('landing_title_3', lang), summary: t('landing_summary_3', lang) },
        { icon: '💰', title: t('landing_title_4', lang), summary: t('landing_summary_4', lang) },
        { icon: '✍️', title: t('landing_title_5', lang), summary: t('landing_summary_5', lang) },
        { icon: '🗂️', title: t('landing_title_6', lang), summary: t('landing_summary_6', lang) },
    ], [lang, t]);


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
                {/* 🚨 FIX: 하드코딩된 제목을 다국어 처리 */}
                <h2 className="text-3xl md:text-4xl text-center font-bold text-gray-800 mb-12 border-b-2 border-red-500 pb-2">{t('landing_title_main', lang) || "SermonNote가 목회자님께 드리는 혁신적인 혜택"}</h2>
                <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">{t('landing_summary_main', lang) || "바쁜 일상 속에서 깊이 있는 설교를 준비하는 것은 쉽지 않습니다. SermonNote는 최첨단 AI 기술을 활용하여 목회자님의 시간을 절약하고, 더욱 풍성한 말씀으로 성도들을 양육할 수 있도록 돕습니다. 개인 맞춤형 설교 생성부터 전문 연구 관리까지, 모든 과정을 스마트하게 지원합니다."}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                    {/* 🚨 FIX: useMemo로 동적 생성된 featureItems 사용 */}
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
    t,
    loading
}) => {
    const [sermonTypes, setSermonTypes] = useState(null); 
    const isAuthenticated = user && user.uid; 

    useEffect(() => {
        const types = [
            { type: 'ai-assistant-sermon', title: t('sermonAssistant', lang), description: t('aiAssistantDesc', lang) || 'AI 어시스턴트가 주제, 성경 구절에 맞춰 완벽한 설교를 초안합니다.', icon: <PlusCircleIcon className="w-10 h-10 text-blue-500" /> },
            { type: 'expository-sermon', title: t('expositorySermon', lang), description: t('expositoryDesc', lang) || '성경 본문을 깊이 있게 분석하고 구조화하여 강해 설교를 작성합니다.', icon: <BibleIcon className="w-10 h-10 text-green-500" /> },
            { type: 'real-life-sermon', title: t('realLifeSermon', lang), description: t('realLifeDesc', lang) || '현대 사회 이슈나 삶의 고민에 연결된 실생활 적용 설교를 만듭니다.', icon: <RealLifeIcon className="w-10 h-10 text-red-500" /> },
            { type: 'quick-memo-sermon', title: t('quickMemoSermon', lang), description: t('quickMemoDesc', lang) || '짧은 영감, 묵상 노트에서 확장된 설교를 빠르고 쉽게 만듭니다.', icon: <QuickMemoIcon className="w-10 h-10 text-yellow-500" /> },
            { type: 'rebirth-sermon', title: t('rebirthSermon', lang), description: t('rebirthDesc', lang) || '과거 설교 자료를 업로드하여 AI로 재구성하고 최신 스타일로 바꿉니다.', icon: <RebirthIcon className="w-10 h-10 text-purple-500" /> },
            { type: 'premium-upgrade', title: t('upgradeToPremium', lang), description: t('upgradeDesc', lang) || '프리미엄 구독을 통해 모든 기능을 무제한으로 사용하세요.', icon: <PremiumIcon className="w-10 h-10 text-yellow-600" /> }
        ];
        setSermonTypes(types);
    }, [lang, user, t]); 

    if (!sermonTypes) {
        return <div className="text-center p-8"><LoadingSpinner message={t('loadingSermonTypes', lang)} /></div>;
    }
    
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
                            // 🚨 FIX: loading 중일 때는 팝업을 띄우지 않고 대기합니다.
                            // 인증이 안됐고, 로딩 중이 아니며, 프리미엄이 아닐 때만 팝업 실행
                            if (!isAuthenticated && !loading && sermon.type !== 'premium-upgrade') { 
                                openLoginModal(); 
                            } 
                            // 인증이 되었거나 (로딩이 끝난 후), 프리미엄 업그레이드 버튼일 경우에만 선택을 진행합니다.
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
// 메인 컴포넌트: HomeContent (유지)
// --------------------------------------------------

function HomeContent() {
    // ⭐️ loading 상태를 AuthContext에서 가져옵니다.
    const { user, loading, auth, db, authError, handleLogout: contextLogout } = useAuth(); 

    const [sermonCount, setSermonCount] = useState(0); 
    const [userSubscription, setUserSubscription] = useState('free'); 
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('landing'); 
    const [selectedSermonType, setSelectedSermonType] = useState('sermon-selection'); 
    const [lang, setLang] = useState('ko');
    const isFirebaseError = authError ? authError.includes("Firebase") : false; 
    
    // 🚨 이전의 모달 강제 초기화 useEffect는 제거된 상태입니다.

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = useCallback(() => { setIsLoginModalOpen(false); setViewMode('sermon'); }, []); 
    const handleLimitReached = useCallback(() => {
        if (userSubscription === 'free') {
            setIsLimitModalOpen(true);
        }
    }, [userSubscription]);
    const closeLimitModal = useCallback(() => {
        setIsLimitModalOpen(false);
    }, []);
    const handleGoToUpgradePage = useCallback(() => {
        setIsLimitModalOpen(false);
        setSelectedSermonType('premium-upgrade'); 
        setViewMode('sermon');
    }, []);
    
    const handleLogout = useCallback(async () => { 
        if (contextLogout) { 
            await contextLogout(); 
            setViewMode('landing'); 
            setSelectedSermonType('sermon-selection'); 
            setSermonCount(0); 
            setUserSubscription('free'); 
        } 
    }, [contextLogout]);

    const handleLogoClick = useCallback(() => { setViewMode('landing'); setSelectedSermonType('sermon-selection'); }, []); 
    const handleLoginSuccess = useCallback(() => { 
        // 🚨 새로고침을 강제했으므로 이 로직은 사실상 실행되지 않습니다.
        console.log("Login Success Handled by HomeContent.");
    }, []);
    
    const handleGetStarted = useCallback(() => {
        if (user && !isFirebaseError) { 
            setViewMode('sermon');
            setSelectedSermonType('sermon-selection');
        } else {
            openLoginModal(); 
        }
    }, [user, openLoginModal, isFirebaseError]); 
    
    const renderSermonComponent = () => {
        const onGoToSelection = () => setSelectedSermonType('sermon-selection');
        
        const commonProps = {
            user: user,
            onGoBack: onGoToSelection, 
            lang: lang,
            t: t, 
            sermonCount: sermonCount,
            setSermonCount: setSermonCount, 
            userSubscription: userSubscription, 
            onLimitReached: handleLimitReached, 
            openLoginModal: openLoginModal,
            loading: loading, // 🚨 loading prop 전달
        };

        switch (selectedSermonType) {
            case 'sermon-selection':
                return (
                    <SermonSelection 
                        user={user}
                        setSelectedSermonType={setSelectedSermonType}
                        openLoginModal={openLoginModal}
                        lang={lang}
                        t={t} 
                        loading={loading} // 🚨 loading prop 전달
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
    };


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
                        <button onClick={openLoginModal} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
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
                        t={t}
                    />
                ) : (
                    <div className="w-full">
                        {renderSermonComponent()}
                    </div>
                )}
            </main>

            {/* 하단 모달 및 버튼 */}
            {isLoginModalOpen && <LoginModal onClose={closeLoginModal} onLoginSuccess={handleLoginSuccess} />}
            {/* 제한 도달 모달 렌더링 */}
            {isLimitModalOpen && (
                <LimitReachedModal 
                    onClose={closeLimitModal} 
                    lang={lang} 
                    onGoToUpgrade={handleGoToUpgradePage}
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