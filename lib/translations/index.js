/**
 * 다국어 지원 모듈 (translations.js)
 * 앱 전반(랜딩 페이지, 설교 선택, 공통 메시지)에서 사용되는 모든 번역 키를 정의합니다.
 */

export const translations = {
    ko: {
        // --- 1. 랜딩 페이지 키 (LandingPage.js) ---
        appName: 'SermonNote',
        tagline: '신앙을 깊게 하고, 통찰력을 정리하세요.',
        getStarted: '시작하기',
        login: '로그인',
        logout: '로그아웃',
        welcome: '환영합니다',
        user: '사용자',
        lang_ko: '한국어',
        lang_en: 'English',
        lang_zh: '中文',
        lang_ru: 'Русский',
        lang_vi: 'Tiếng Việt',
        whySermonNoteTitle: 'SermonNote가 목회자님께 드리는 혁신적인 혜택',
        whySermonNoteDescription: '바쁜 일상 속에서 깊이 있는 설교를 준비하는 것은 쉽지 않습니다. SermonNote는 최첨단 AI 기술을 활용하여 목회자님의 시간을 절약하고, 더욱 풍성한 말씀으로 성도들을 양육할 수 있도록 돕습니다. 개인 맞춤형 설교 생성부터 전문 연구 관리까지, 모든 과정을 스마트하게 지원합니다.',
        feature1Title: 'AI 기반, 5배 빠른 설교 완성',
        feature1Description: '성경 분석, 주제 선정, 내용 구성까지 AI가 가장 까다로운 초기 단계를 대신하여 설교 준비 시간을 획기적으로 단축하고 목회에 집중하도록 돕습니다.',
        feature2Title: '나만의 설교 스타일 학습 AI',
        feature2Description: '단순히 텍스트를 생성하지 않습니다. 사용자의 과거 설교 스타일, 어휘, 신학적 관점을 학습하여 목사님만의 개성이 담긴 개인 맞춤형 초안을 완성합니다.',
        feature3Title: '글로벌 선교를 위한 맞춤형 언어 지원',
        feature3Description: '영어, 한국어는 물론, 중국어, 러시아어, 베트남어 등 주요 선교 지역 언어로 설교를 생성하고 편집할 수 있습니다.',
        feature4Title: '목회 사역을 위한 현명한 투자',
        feature4Description: 'SermonNote는 단순한 지출이 아닌, 시간과 에너지를 재분배하여 영적 돌봄, 심방, 사역 연구 등 핵심 목회에 집중하도록 돕는 필수적인 투자입니다.',
        feature5Title: '영감 보존, 묵상 심화 촉진',
        feature5Description: '떠오르는 영감을 놓치지 않고 메모하면, AI가 연관 성경 구절과 신학적 배경을 분석해 묵상의 깊이를 더할 수 있도록 즉각적인 통찰을 제공합니다.',
        feature6Title: '체계적인 설교 자료 연구 관리',
        feature6Description: '생성된 모든 설교, 묵상 노트, 참고 자료를 클라우드에 안전하게 보관합니다. 주제, 날짜별 태그와 강력한 검색으로 완벽한 연구 아카이빙을 지원합니다.',
        
        // --- 2. 설교 유형 선택 키 (SermonSelection.js) ---
        chooseSermonType: '설교 유형 선택',
        chooseSermonTypeDescription: '가장 적합한 설교 유형을 선택하여 말씀 준비를 시작하세요.',
        sermonAssistant: '설교 AI 어시스턴트',
        sermonAssistantDescription: '질의응답을 통해 설교 아이디어를 얻고 초안을 생성합니다.',
        expositorySermon: '강해 설교',
        expositorySermonDescription: '성경 본문을 깊이 파고들어 말씀의 의미를 해석합니다.',
        realLifeSermon: '삶과 연결된 설교',
        realLifeSermonDescription: '현대 생활의 이슈와 성경적 진리를 연결하여 실용적인 메시지를 전달합니다.',
        quickMemoSermon: '빠른 메모 설교',
        quickMemoSermonDescription: '영감받은 메모를 바탕으로 설교 초안을 손쉽게 작성합니다.',
        rebirthSermon: '설교의 재탄생',
        rebirthSermonDescription: '과거와 유명한 설교 내용을 바탕으로 새로운 재해석을 생성합니다.',
        upgradeToPremium: '프리미엄으로 업그레이드',
        premiumSubscriptionDescription: '프리미엄 구독을 통해 무제한 설교 생성을 경험하세요.',

        // --- 3. 공통 메시지 및 오류 키 ---
        selectSermonType: '설교 유형을 선택해 주세요.',
        loadingAuth: '인증 확인 중... (Firebase 초기화 중)',
        loadingSermonSelect: '설교 유형 로드 중...',
        accessError: '접근 오류',
        relogin: '다시 로그인',
        limitReached: '이용 제한 도달',
        limitMsg: '이용 횟수가 제한되었습니다. 구독 정보를 확인해 주세요.',
        confirm: '확인',
        generatingSermon: 'AI가 설교 초안을 작성 중입니다...',
        saveSuccess: '설교 내용이 저장되었습니다.',
        saveFailed: '설교 저장에 실패했습니다: {0}',
        saveFailedAuth: '저장에 실패했습니다: 로그인 상태를 확인해주세요.',
        initialCommentaryPlaceholder: 'AI 주석/연구 데이터가 여기에 표시됩니다.',
        unknownSermonType: '오류: 알 수 없는 설교 유형입니다.',

        // --- ExpositorySermonComponent에서 사용하는 키 ---
        expositorySermonTitle: '강해 설교 보조 도구',
        expositoryDescription: '구절 해설, 교차 참조 구절 및 주석을 바탕으로 설교 초안을 작성합니다.',
        scripturePlaceholder: '성경 구절 입력 (예: 요한복음 3:16)',
        scriptureTitle: '성경 본문',
        crossReferencesTitle: '교차 참조 구절',
        aiCommentaryTitle: 'AI 주석 및 해설',
        getScripture: '본문 가져오기',
        getCommentary: '주석 가져오기',
        generateSermonFromCommentary: '설교 초안 작성',
        enterScriptureReference: '성경 구절을 입력해 주세요.',
        commentaryLimitError: '주석 생성 횟수 제한에 도달했습니다.',
        sermonLimitError: '설교 초안 생성 횟수 제한에 도달했습니다.',
        noCommentaryToGenerateSermon: '주석이 먼저 생성되어야 설교를 작성할 수 있습니다.',
        commentaryLimit: '남은 주석 생성 횟수: {0}회',
        generationFailed: '콘텐츠 생성 중 오류가 발생했습니다.',
        gettingScripture: '본문을 불러오는 중...',
        generating: '생성 중...',
        loginRequiredTitle: '로그인이 필요합니다.',
        loginRequiredMessage: '서비스를 사용하려면 로그인이 필요합니다.',
    },
    en: {
        appName: 'SermonNote',
        tagline: 'Deepen Your Faith, Organize Your Insights.',
        getStarted: 'Get Started',
        login: 'Login',
        logout: 'Logout',
        welcome: 'Welcome',
        user: 'User',
        lang_ko: 'Korean',
        lang_en: 'English',
        lang_zh: 'Chinese',
        lang_ru: 'Russian',
        lang_vi: 'Vietnamese',
        whySermonNoteTitle: 'Innovative Benefits SermonNote Offers Pastors',
        whySermonNoteDescription: 'SermonNote uses cutting-edge AI technology to help pastors save time and nurture their congregations with richer messages. We smartly support every step of the process.',
        feature1Title: 'AI-Powered, 5x Faster Sermon Completion',
        feature1Description: 'AI handles the most challenging initial steps—biblical analysis, topic selection, and content structuring.',
        feature2Title: 'Personalized Sermon Style Learning AI',
        feature2Description: 'The AI learns your past sermon styles, vocabulary, and theological views to create personalized drafts.',
        feature3Title: 'Multi-language Support for Global Mission',
        feature3Description: 'Generate and edit sermons in English, Korean, Chinese, Russian, and Vietnamese.',
        feature4Title: 'A Wise Investment for Ministry',
        feature4Description: 'SermonNote redirects your time and energy towards core ministry.',
        feature5Title: 'Preserve Inspiration, Deepen Meditation',
        feature5Description: 'Jot down sudden inspirations instantly. AI offers immediate insights to deepen your reflection.',
        feature6Title: 'Systematic Sermon Material Research Management',
        feature6Description: 'All generated materials are securely stored in the cloud for comprehensive archiving.',

        chooseSermonType: 'Choose Sermon Type',
        chooseSermonTypeDescription: 'Select the most suitable sermon type to start preparing your message.',
        sermonAssistant: 'Sermon AI Assistant',
        sermonAssistantDescription: 'Get sermon ideas and create drafts through Q&A.',
        expositorySermon: 'Expository Sermon',
        expositorySermonDescription: 'Interpret the meaning of the word by deeply exploring the text of the Bible.',
        realLifeSermon: 'Life-Connected Sermon',
        realLifeSermonDescription: 'Connect contemporary issues with biblical truth for practical messages.',
        quickMemoSermon: 'Quick Memo Sermon',
        quickMemoSermonDescription: 'Easily draft sermons based on inspired notes.',
        rebirthSermon: 'Sermon Rebirth',
        rebirthSermonDescription: 'Create new interpretations based on past famous sermons.',
        upgradeToPremium: 'Upgrade to Premium',
        premiumSubscriptionDescription: 'Experience unlimited sermon generation with premium subscription.',

        selectSermonType: 'Please select a sermon type.',
        loadingAuth: 'Checking authentication status... (Initializing Firebase)',
        loadingSermonSelect: 'Loading sermon types...',
        accessError: 'Access Error',
        relogin: 'Re-login',
        limitReached: 'Usage Limit Reached',
        limitMsg: 'Your usage limit has been reached. Please check your subscription.',
        confirm: 'Confirm',
        generatingSermon: 'AI is drafting your sermon...',
        saveSuccess: 'Sermon content saved successfully.',
        saveFailed: 'Failed to save sermon: {0}',
        saveFailedAuth: 'Failed to save: Please check your login status.',
        initialCommentaryPlaceholder: 'AI commentary/research data will appear here.',
        unknownSermonType: 'Error: Unknown sermon type.',

        // --- ExpositorySermonComponent에서 사용하는 키 ---
        expositorySermonTitle: 'Expository Sermon Assistant',
        expositoryDescription: 'Generate sermon outlines based on verse commentary and cross-references.',
        scripturePlaceholder: 'Enter Scripture Reference (e.g., John 3:16)',
        scriptureTitle: 'Scripture Text',
        crossReferencesTitle: 'Cross References',
        aiCommentaryTitle: 'AI Commentary & Interpretation',
        getScripture: 'Fetch Text',
        getCommentary: 'Get Commentary',
        generateSermonFromCommentary: 'Generate Sermon Draft',
        enterScriptureReference: 'Please enter a scripture reference.',
        commentaryLimitError: 'Commentary generation limit reached.',
        sermonLimitError: 'Sermon draft generation limit reached.',
        noCommentaryToGenerateSermon: 'Commentary must be generated before drafting a sermon.',
        commentaryLimit: 'Remaining Commentary Generations: {0}',
        generationFailed: 'Content generation failed.',
        gettingScripture: 'Fetching text...',
        generating: 'Generating...',
        loginRequiredTitle: 'Login Required',
        loginRequiredMessage: 'You must be logged in to use this service.',
    },
    // ru, zh, vi 등의 다른 언어 번역은 필요시 추가할 수 있습니다.
};

/**
 * 번역 키를 찾아 반환합니다. 키가 없으면 키 자체를 반환합니다.
 * @param {string} key - 번역 키
 * @param {string} lang - 요청된 언어 코드 (ko, en)
 * @param {...any} args - {0}, {1} 등을 대체할 인자
 * @returns {string} - 번역된 텍스트 또는 키
 */
export const t = (key, lang = 'ko', ...args) => {
    // 1. 요청된 언어에서 찾기, 없으면 한국어에서 찾기, 그래도 없으면 키 자체 반환
    let text = translations[lang]?.[key] || translations.ko[key] || key;

    // 2. 플레이스홀더 대체 ({0}, {1}...)
    if (args.length > 0) {
        args.forEach((arg, index) => {
            // 정규식을 사용하여 {0}, {1} 등을 대체
            text = text.replace(new RegExp('\\{' + index + '\\}', 'g'), arg);
        });
    }

    return text;
};
