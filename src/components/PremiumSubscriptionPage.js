"use client";

import React, { useState, useCallback, useEffect } from 'react';

// Paddle.js 로드 확인 및 결제 함수 (전역 window 객체를 사용)
// 🚨 Paddle.js 스크립트가 HTML <head>에 로드되어 있어야 합니다.
const initiatePaddleCheckout = (priceId, planId, isAnnual, t, lang, setIsProcessing, setShowSuccessModal, setPaymentError) => {
    if (typeof window.Paddle === 'undefined') {
        setPaymentError(t('paymentError', lang, 'Paddle script not loaded.'));
        setIsProcessing(false);
        return;
    }

    // 결제창 열기
    window.Paddle.Checkout.open({
        items: [{
            priceId: priceId, 
            quantity: 1
        }],
        customer: {
            // 사용자 ID, 이메일 등 (필요 시 사용자 정보 추가)
            email: 'user_email@example.com', 
            // name: 'SermonNote User'
        },
        settings: {
            success: 'Thank you for your purchase!', // 성공 후 표시될 메시지
            // 결제 성공 및 실패 시 콜백 함수 설정
            successCallback: (data) => {
                console.log("Paddle Payment Success:", data);
                // 💡 [핵심] 결제 성공 후의 후처리 로직 (서버에 웹훅 데이터 전송 등)
                // 실제 서비스에서는 웹훅(Webhook)을 통해 서버에서 최종 확인해야 하지만, 여기서는 즉시 성공 처리합니다.
                
                // 1. 성공 모달 표시
                setShowSuccessModal(true); 
                // 2. 로딩 해제
                setIsProcessing(false);
            },
            closeCallback: (data) => {
                // 사용자가 결제창을 닫았을 때
                if (data.status === 'checkout.closed') {
                    setIsProcessing(false);
                    // setPaymentError(t('paymentError', lang, 'Checkout window closed.'));
                    console.log("Paddle Checkout closed by user.");
                }
            },
            errorCallback: (error) => {
                // 결제 과정 중 치명적인 오류 발생 시
                console.error("Paddle Payment Error:", error);
                setPaymentError(t('paymentError', lang, error.message || 'Payment processing failed.'));
                setIsProcessing(false);
            }
        }
    });
};


// API 호출 경로 (실제 결제를 처리할 백엔드 API 엔드포인트)
const PAYMENT_API_ENDPOINT = '/api/payment/subscribe'; 


// Helper function to calculate annual price with discount
const calculateAnnualPrice = (monthlyPrice, discountRate) => {
    const annualBase = monthlyPrice * 12;
    // Round down for cleaner pricing
    const discountedPrice = Math.floor(annualBase * (1 - discountRate));
    return discountedPrice;
};

// Check icon component
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-green-600 flex-shrink-0">
        <path d="M20 6 9 17l-5-5"/>
    </svg>
);

// Success icon component
const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

// Loading Spinner for processing state
const LoadingSpinner = ({ message }) => (
    <div className="flex items-center justify-center space-x-2 p-4">
        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm font-medium text-white">{message}</span>
    </div>
);

// ----------------------------------------------------
// 💡 정책 문서 뷰어 모달 컴포넌트 (렌더링 로직 개선)
// ----------------------------------------------------
const PolicyModal = ({ isOpen, onClose, title, content, t, lang }) => {
    if (!isOpen) return null;

    // 마크다운 내용을 HTML로 변환하는 간단한 파서
    const renderMarkdown = (markdown) => {
        // 🚨 [FIXED]: 마크다운 문자열이 유효하지 않을 경우를 대비해 초기화합니다.
        const cleanedMarkdown = (markdown || '').trim();

        if (!cleanedMarkdown) return <p>{t('policyContentMissing', lang) || '정책 내용을 불러올 수 없습니다.'}</p>;

        return cleanedMarkdown.split('\n').map((line, i) => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('# ')) {
                // 헤더 처리
                return <h4 key={i} className="text-xl font-bold mt-6 mb-2 text-gray-900 border-b pb-1">
                    {trimmedLine.replace('# ', '').trim()}
                </h4>;
            }
            if (trimmedLine === '---') {
                // 구분선 처리
                return <hr key={i} className="my-4 border-gray-200" />;
            }
            if (trimmedLine.startsWith('* ')) {
                // 목록 처리 (간단한 별표 목록)
                 return <li key={i} className="mb-1 text-sm text-gray-700 leading-relaxed list-disc ml-4">{trimmedLine.replace('* ', '').trim()}</li>;
            }
            if (trimmedLine.startsWith('**')) {
                // 볼드체 처리
                const html = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return <p key={i} className="mb-2 text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
            }
            if (trimmedLine === '') {
                // 빈 줄 처리
                return <div key={i} className="h-1"></div>;
            }
            // 일반 텍스트 처리
            return <p key={i} className="mb-2 text-sm text-gray-700 leading-relaxed">{trimmedLine}</p>;
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    {/* 🚨 [FIX]: title은 이미 번역되어 넘어왔다고 가정합니다. */}
                    <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition text-2xl font-semibold">
                        &times;
                    </button>
                </div>
                {/* Markdown 렌더링 영역 */}
                <div className="policy-content">
                    {/* 🚨 [FIX]: content(policyContent.contentKey)를 t() 함수로 번역하여 마크다운 텍스트를 가져옵니다. */}
                    {renderMarkdown(t(content, lang))} 
                </div>
                <button
                    onClick={onClose}
                    className="mt-6 w-full px-6 py-3 font-semibold rounded-xl shadow-lg bg-gray-200 hover:bg-gray-300 text-gray-800 transition duration-300"
                >
                    {t('closeButton', lang)}
                </button>
            </div>
        </div>
    );
};

// ----------------------------------------------------
// 💡 정책 문서 내용 (하드코딩된 상수 제거)
// ----------------------------------------------------
// 🚨 [수정]: 하드코딩된 상수를 제거하고 키만 남깁니다.
const REFUND_POLICY_KEY = 'refund_policy_content';
const PRIVACY_POLICY_KEY = 'privacy_policy_content';


// ----------------------------------------------------
// 💡 다국어 (i18n) 번역 테이블 및 함수 (5개 국어 통합)
// ----------------------------------------------------
const translations = {
    // ----------------------------------------------------
    // 1. 한국어 (Korean: ko)
    // ----------------------------------------------------
    ko: {
        chooseYourPlan: '나에게 맞는 플랜을 선택하세요', planSubtitle: 'SermonNote는 모든 사용자에게 최적화된 패키지를 제공합니다.',
        monthly: '월별', annually: '연간', saveUpTo: '최대 {0}% 절약', bestValue: '최고 가치',
        planFreeMember: '무료 멤버십', freePlanDescription: 'SermonNote의 기본 기능을 무료로 체험해 보세요.',
        planStandardMember: '스탠다드 멤버십', standardPlanDescription: '설교 준비 효율을 높여주는 핵심 기능을 제공합니다.',
        planPremiumMember: '프리미엄 멤버십', premiumPlanDescription: '최고의 설교 경험을 위한 올인원 솔루션입니다.',
        "sermonGenTimes_free": "설교 생성 5회/월", "aiAnnotationTimes_free": "AI 주석 5회/월",
        "sermonGenTimes_std": "설교 생성 200회/월", "aiAnnotationTimes_std": "AI 주석 200회/월",
        "sermonGenTimes_prem": "설교 생성 400회/월", 
        "textEditor": "텍스트 에디터", "advancedTextEditor": "고급 AI 텍스트 에디터",
        "archiveAccessRestricted": "아카이브 열람 (제한적)", "archiveAccessFull": "아카이브 열람 (무제한)", 
        "archiveShareLimited_free": "아카이브 등록 1회/월", "archiveShareLimited_std": "아카이브 등록 5회/월", "archiveShareLimited_prem": "아카이브 등록 10회/월",
        "unlimitedAnnotation": "무제한 AI 주석", "limitedSupport": "우선 기술 지원 (제한적)", "unlimitedSupport": "우선 기술 지원 (무제한)",
        getStarted: '시작하기', subscribeNow: '지금 구독하기', sermonSelectionReturn: '설교 유형 선택 화면으로 돌아가기',
        year: '년', month: '개월', billedAnnualy: '연간 {0} $ 청구', saveVsMonthly: '월별 대비 {0}% 절약',
        subscriptionSuccessful: '구독 성공!', welcomePremiumTier: '프리미엄 멤버십에 오신 것을 환영합니다. SermonNote의 모든 기능을 무제한으로 누려보세요.',
        startWritingSermons: '설교 작성 시작', goBack: '뒤로가기', 
        processingPayment: '결제 처리 중...',
        paymentError: '결제 실패: {0}',
        viewRefundPolicy: '환불 정책 보기',
        viewPrivacyPolicy: '개인정보처리방침 보기',
        subscriptionSuccessMessage: '결제가 성공적으로 완료되었습니다. 지금 바로 SermonNote의 모든 기능을 사용해 보세요!',
        closeButton: '닫기', // PolicyModal에서 사용
        policyContentMissing: '정책 내용을 불러올 수 없습니다.', // 🚨 [NEW] 오류 키 추가

        // 🚨 [NEW] 환불 정책 내용 (마크다운)
        [REFUND_POLICY_KEY]: `
# SermonNote 구독 서비스 환불 정책
---
## 1. 환불 대상 및 기간
본 환불 정책은 SermonNote 유료 멤버십(스탠다드, 프리미엄) 구독에 적용됩니다.
* **7일 이내 환불 (청약 철회):** 결제일로부터 7일 이내이며, AI 설교 생성 또는 AI 주석 기능을 **5회 미만** 사용한 경우에 한해 전액 환불이 가능합니다.
* **부분 환불:** 결제일로부터 7일이 경과했거나, AI 기능을 5회 이상 사용한 경우, 남은 이용료를 일할 계산하여 환불합니다. 

## 2. 환불 금액 산정 기준
환불 금액은 다음과 같이 산정됩니다.
환불 금액 = 실제 결제 금액 - ( (실제 결제 금액 / 총 구독 기간(일)) x 사용 기간(일) ) - PG사 수수료
* **사용 기간 산정:** 결제일로부터 환불 요청 접수일까지를 사용 기간으로 간주합니다.
* **AI 사용 횟수 기준:** 만약 사용한 AI 횟수가 환불 금액을 초과하는 경우, 초과분에 해당하는 금액이 차감될 수 있습니다.

## 3. 환불 불가 사유
다음의 경우 환불이 제한되거나 불가능할 수 있습니다.
* 결제일로부터 30일이 초과된 경우.
* 구독 취소 없이 서비스를 계속 이용한 경우.
**환불 문의:** 이메일(support@sermonnote.net)로 문의해 주시기 바랍니다.
        `,
        // 🚨 [NEW] 개인정보처리방침 내용 (마크다운)
        [PRIVACY_POLICY_KEY]: `
# SermonNote 개인정보처리방침
---
## 1. 수집하는 개인정보의 항목 및 목적
SermonNote는 사용자의 개인정보를 소중하게 생각하며, 「개인정보 보호법」 및 관련 법규를 준수하고 있습니다.

| 구분 | 수집 항목 | 수집 및 이용 목적 | 
| :--- | :--- | :--- | 
| **로그인 정보** | 이메일 주소, Firebase UID | 서비스 이용을 위한 사용자 식별 및 인증 | 
| **서비스 이용 기록** | AI 사용 횟수, 설교 유형 선택, 최종 작성된 설교 초안 | 서비스 제공, 이용 제한 관리 및 AI 모델 개선 | 
| **결제 정보** | PG사 결제 고유 번호, 결제 금액, 결제일 | 구독료 결제 및 환불 처리, 전자상거래법 준수 | 

## 2. 개인정보의 제3자 제공
* **AI 설교 생성:** 설교 초안 생성을 위해 사용자가 입력한 텍스트(주제, 구절)는 AI 모델 제공사(예: Google Gemini API)에 전송됩니다.
* **결제 처리:** 구독 결제 처리를 위해 PG사(Payment Gateway)에 결제 정보가 제공됩니다.

**개인정보보호 책임자:** SermonNote 운영팀 (privacy@sermonnote.net)
        `,
    },
    // ----------------------------------------------------
    // 2. 영어 (English: en)
    // ----------------------------------------------------
    en: {
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
        "archiveShareLimited_free": "Archive Share (1 time/month)", "archiveShareLimited_std": "Archive Share (5 times/month)", "archiveShareLimited_prem": "Archive Share (10 times/month)",
        "unlimitedAnnotation": "Unlimited AI Annotations", "limitedSupport": "Priority Tech Support (Limited)", "unlimitedSupport": "Priority Tech Support (Unlimited)",
        getStarted: 'Get Started', subscribeNow: 'Subscribe Now', sermonSelectionReturn: 'Return to Sermon Type Selection',
        year: 'year', month: 'months', billedAnnualy: 'Billed annually at ${0}', saveVsMonthly: 'Save {0}% vs. Monthly',
        subscriptionSuccessful: 'Subscription Successful!', welcomePremiumTier: 'Welcome to Premium Membership. Enjoy unlimited access to all SermonNote features.',
        startWritingSermons: 'Start Writing Sermons', goBack: 'Go Back', 
        processingPayment: 'Processing payment...',
        paymentError: 'Payment failed: {0}',
        viewRefundPolicy: 'View Refund Policy',
        viewPrivacyPolicy: 'View Privacy Policy',
        subscriptionSuccessMessage: 'Payment successfully completed. Start using all SermonNote features now!',
        closeButton: 'Close',
        policyContentMissing: 'Could not load policy content.',

        // 🚨 [NEW] 환불 정책 내용 (마크다운)
        [REFUND_POLICY_KEY]: `
# SermonNote Subscription Service Refund Policy
---
## 1. Eligibility and Period
This refund policy applies to SermonNote paid memberships (Standard, Premium).
* **Refund within 7 Days (Withdrawal):** A full refund is possible only if requested within 7 days of payment and if the AI sermon generation or AI annotation features have been used **less than 5 times**.
* **Partial Refund:** If 7 days have passed since payment, or if AI features have been used 5 times or more, the remaining usage fee will be calculated on a pro-rata basis for refund.

## 2. Calculation of Refund Amount
The refund amount is calculated as follows:
Refund Amount = Actual Amount Paid - ( (Actual Amount Paid / Total Subscription Days) x Used Days ) - Payment Gateway Fees

* **Used Days:** The period from the payment date to the refund request date is considered as used days.
* **AI Usage Limit:** If the number of AI uses exceeds the refund amount, the excess amount may be deducted.

## 3. Reasons for No Refund
Refunds may be restricted or unavailable in the following cases:
* If more than 30 days have passed since the payment date.
* If the service has been used continuously without cancellation.
**Refund Inquiry:** Please contact us via email (support@sermonnote.net).
        `,
        // 🚨 [NEW] 개인정보처리방침 내용 (마크다운)
        [PRIVACY_POLICY_KEY]: `
# SermonNote Privacy Policy
---
## 1. Items and Purposes of Personal Information Collection
SermonNote values user personal information and complies with the Personal Information Protection Act and relevant laws.

| Category | Items Collected | Purpose of Collection and Use | 
| :--- | :--- | :--- | 
| **Login Information** | Email address, Firebase UID | User identification and authentication for service use | 
| **Service Usage Records** | Number of AI uses, sermon type selected, final drafted sermon | Service provision, usage restriction management, and AI model improvement | 
| **Payment Information** | PG Payment unique number, payment amount, payment date | Subscription fee payment, refund processing, compliance with e-commerce laws | 

## 2. Provision of Personal Information to Third Parties
* **AI Sermon Generation:** Text input by the user (topic, scripture) is transmitted to the AI model provider (e.g., Google Gemini API) for sermon generation.
* **Payment Processing:** Payment information is provided to the Payment Gateway (PG) for subscription processing.

**Data Protection Officer:** SermonNote Operations Team (privacy@sermonnote.net)
        `,
    },
    // ----------------------------------------------------
    // 3. 러시아어 (Russian: ru)
    // ----------------------------------------------------
    ru: {
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
        "archiveShareLimited_free": 'Регистрация в архиве 1 раз/месяц', "archiveShareLimited_std": 'Регистрация в архиве 5 раз/месяц', "archiveShareLimited_prem": 'Регистрация в архиве 10 раз/месяц',
        
        "unlimitedAnnotation": 'Неограниченные AI Аннотации', "limitedSupport": 'Приоритетная Техническая Поддержка (Ограниченная)', "unlimitedSupport": 'Приоритетная Техническая Поддержка (Неограниченная)',
        getStarted: 'Начать', subscribeNow: 'Подписаться Сейчас', sermonSelectionReturn: 'Вернуться к выбору типа проповеди',
        year: 'год', month: 'месяцев', billedAnnualy: 'Счет ежегодно ${0}', saveVsMonthly: 'Сэкономить {0}% по сравнению с месячной',
        subscriptionSuccessful: 'Подписка Успешна!', welcomePremiumTier: 'Добро пожаловать в Премиум Членство. Наслаждайтесь неограниченным доступом ко всем функциям SermonNote.',
        startWritingSermons: 'Начать Писать Проповеди', goBack: 'Назад',
        processingPayment: 'Обработка платежа...',
        paymentError: 'Ошибка платежа: {0}',
        viewRefundPolicy: 'Посмотреть Политику Возврата',
        viewPrivacyPolicy: 'Посмотреть Политику Конфиденциальности',
        subscriptionSuccessMessage: 'Оплата успешно завершена. Начните использовать все функции SermonNote прямо сейчас!',
        closeButton: 'Закрыть',
        policyContentMissing: 'Не удалось загрузить содержимое политики.',


        // 🚨 [NEW] 환불 정책 내용 (마크다운)
        [REFUND_POLICY_KEY]: `
# Политика возврата средств за услуги подписки SermonNote
---
## 1. Условия и срок возврата
Настоящая политика возврата применяется к платной подписке SermonNote (Стандарт, Премиум).
* **Возврат в течение 7 дней (Отзыв):** Полный возврат возможен только по запросу в течение 7 дней с даты оплаты и только в том случае, если функция генерации проповедей AI или аннотаций AI была использована **менее 5 раз**.
* **Частичный возврат:** Если с даты оплаты прошло более 7 дней, или если функции AI были использованы 5 и более раз, оставшаяся плата за использование будет рассчитана пропорционально дням и возвращена.

## 2. Критерии расчета суммы возврата
Сумма возврата рассчитывается следующим образом:
Сумма возврата = Фактически оплаченная сумма - ( (Фактически оплаченная сумма / Общая продолжительность подписки (дни)) x Использованные дни ) - Комиссия PG

* **Расчет использованных дней:** Период с даты оплаты до даты получения запроса на возврат считается использованными днями.
* **Лимит использования AI:** Если количество использований AI превышает сумму возврата, излишняя сумма может быть вычтена.

## 3. Причины отказа в возврате
Возврат средств может быть ограничен или невозможен в следующих случаях:
* Если прошло более 30 дней с даты оплаты.
* Если услуга использовалась непрерывно без отмены подписки.
**Запросы на возврат:** Пожалуйста, свяжитесь с нами по электронной почте (support@sermonnote.net).
        `,
        // 🚨 [NEW] 개인정보처리방침 내용 (ма크다운)
        [PRIVACY_POLICY_KEY]: `
# Политика конфиденциальности SermonNote
---
## 1. Собираемые элементы персональных данных и цели
SermonNote ценит личную информацию пользователей и соблюдает «Закон о защите личной информации» и соответствующие нормативные акты.

| Категория | Собираемые данные | Цель сбора и использования | 
| :--- | :--- | :--- | 
| **Информация для входа** | Адрес электронной почты, Firebase UID | Идентификация и аутентификация пользователя для использования сервиса | 
| **Записи об использовании сервиса** | Количество использований AI, выбранный тип проповеди, окончательный черновик проповеди | Предоставление услуг, управление ограничениями использования и улучшение модели AI | 
| **Платежная информация** | Уникальный номер платежа PG, сумма платежа, дата платежа | Оплата подписки, обработка возвратов, соблюдение закона об электронной коммерции | 

## 2. Предоставление персональной информации третьим лицам
* **Генерация проповеди AI:** Текст, введенный пользователем (тема, стих), передается поставщику модели AI (например, Google Gemini API) для генерации черновика проповеди.
* **Обработка платежей:** Платежная информация предоставляется Платежному шлюзу (PG) для обработки подписки.

**Сотрудник по защите данных:** Команда операций SermonNote (privacy@sermonnote.net)
        `,
    },
    // ----------------------------------------------------
    // 4. 중국어 (Chinese: zh)
    // ----------------------------------------------------
    zh: {
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
        "archiveShareLimited_free": "档案库注册 1 次/月", "archiveShareLimited_std": "档案库注册 5 次/月", "archiveShareLimited_prem": "档案库注册 10 次/月",
        
        "unlimitedAnnotation": "无限 AI 注释", "limitedSupport": "优先技术支持 (有限)", "unlimitedSupport": "优先技术支持 (无限)",
        getStarted: '开始使用', subscribeNow: '立即订阅', sermonSelectionReturn: '返回讲道类型选择画面',
        year: '年', month: '月', billedAnnualy: '每年收费 ${0}', saveVsMonthly: '相比每月节省 {0}%',
        subscriptionSuccessful: '订阅成功！', welcomePremiumTier: '欢迎加入高级会员。享受 SermonNote 的所有无限功能。',
        startWritingSermons: '开始撰写讲道', goBack: '返回',
        processingPayment: '正在处理付款...',
        paymentError: '付款失败: {0}',
        viewRefundPolicy: '查看退款政策',
        viewPrivacyPolicy: '查看隐私政策',
        subscriptionSuccessMessage: '付款成功完成。立即开始使用所有 SermonNote 功能！',
        closeButton: '关闭',
        policyContentMissing: '无法加载政策内容。',


        // 🚨 [NEW] 환불 정책 내용 (마크다운)
        [REFUND_POLICY_KEY]: `
# SermonNote 订阅服务退款政策
---
## 1. 退款对象及期限
本退款政策适用于 SermonNote 付费会员订阅（标准、高级）。
* **7天内退款 (撤销):** 仅限于付款之日起 7天内，且 AI 讲道生成或 AI 注释功能使用次数**少于 5 次**的情况下可全额退款。
* **部分退款:** 付款之日起超过 7天，或 AI 功能使用次数超过 5 次的情况下，剩余使用费将按天计算退款。

## 2. 退款金额计算标准
退款金额计算如下：
退款金额 = 实际支付金额 - ( (实际支付金额 / 总订阅天数) x 已使用天数 ) - PG 手续费

* **已使用天数计算:** 从付款之日起到收到退款申请之日为止视为已使用天数。
* **AI 使用次数标准:** 如果 AI 使用次数超过退款金额，超出部分金额可能会被扣除。

## 3. 不予退款的理由
在以下情况下，退款可能会受到限制或不予退款:
* 付款之日起超过 30天的情况。
* 未取消订阅而继续使用服务的情况。
**退款咨询:** 请通过电子邮件 (support@sermonnote.net) 联系我们。
        `,
        // 🚨 [NEW] 개인정보처리방침 내용 (마크다운)
        [PRIVACY_POLICY_KEY]: `
# SermonNote 隐私政策
---
## 1. 收集的个人信息项目及目的
SermonNote 珍视用户的个人信息，并遵守《个人信息保护法》及相关法规。

| 类别 | 收集项目 | 收集及使用目的 | 
| :--- | :--- | :--- | 
| **登录信息** | 电子邮件地址, Firebase UID | 用户识别及认证，用于服务使用 | 
| **服务使用记录** | AI 使用次数, 讲道类型选择, 最终完成的讲道草稿 | 提供服务、管理使用限制及改进 AI 模型 | 
| **付款信息** | PG 付款唯一编号, 付款金额, 付款日期 | 订阅费支付、退款处理、遵守电子商务法 | 

## 2. 向第三方提供个人信息
* **AI 讲道生成:** 用户输入的文本（主题、经文）将传输给 AI 模型提供商（例如 Google Gemini API）用于生成讲道草稿。
* **付款处理:** 付款信息将提供给支付网关（PG），用于订阅支付处理。

**个人信息保护负责人:** SermonNote 运营团队 (privacy@sermonnote.net)
        `,
    },
    // ----------------------------------------------------
    // 5. 베트남어 (Vietnamese: vi)
    // ----------------------------------------------------
    vi: {
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
        "archiveShareLimited_free": 'Đăng ký lưu trữ 1 lần/tháng', "archiveShareLimited_std": 'Đăng ký lưu trữ 5 lần/tháng', "archiveShareLimited_prem": 'Đăng ký lưu trữ 10 lần/tháng',
        
        "unlimitedAnnotation": 'Chú thích AI không giới hạn', "limitedSupport": 'Hỗ trợ kỹ thuật ưu tiên (Giới hạn)', "unlimitedSupport": 'Hỗ trợ kỹ thuật ưu tiên (Không giới hạn)',
        getStarted: 'Bắt đầu', subscribeNow: 'Đăng ký ngay', sermonSelectionReturn: 'Quay lại màn hình chọn loại bài giảng',
        year: 'năm', month: 'tháng', billedAnnualy: 'Thanh toán hàng năm ${0}', saveVsMonthly: 'Tiết kiệm {0}% so với hàng tháng',
        subscriptionSuccessful: 'Đăng ký thành công!', welcomePremiumTier: 'Chào mừng đến với Thành viên Premium. Tận hưởng không giới hạn tất cả các tính năng của SermonNote.',
        startWritingSermons: 'Bắt đầu Viết Bài Giảng', goBack: 'Quay lại',
        processingPayment: 'Đang xử lý thanh toán...',
        paymentError: 'Thanh toán thất bại: {0}',
        viewRefundPolicy: 'Xem Chính sách Hoàn tiền',
        viewPrivacyPolicy: 'Xem Chính sách Bảo mật',
        subscriptionSuccessMessage: 'Thanh toán hoàn tất thành công. Bắt đầu sử dụng tất cả các tính năng SermonNote ngay bây giờ!',
        closeButton: 'Đóng',

        // 🚨 [NEW] 환불 정책 내용 (마크다운)
        [REFUND_POLICY_KEY]: `
# Chính sách Hoàn tiền Dịch vụ Đăng ký SermonNote
---
## 1. Đối tượng và Thời hạn Hoàn tiền
Chính sách hoàn tiền này áp dụng cho các gói đăng ký thành viên trả phí của SermonNote (Standard, Premium).
* **Hoàn tiền trong vòng 7 ngày (Rút lại giao dịch):** Chỉ được hoàn tiền đầy đủ nếu yêu cầu trong vòng 7 ngày kể từ ngày thanh toán và tính năng tạo bài giảng AI hoặc chú thích AI đã được sử dụng **dưới 5 lần**.
* **Hoàn tiền một phần:** Nếu đã quá 7 ngày kể từ ngày thanh toán hoặc tính năng AI đã được sử dụng 5 lần trở lên, phí sử dụng còn lại sẽ được tính theo tỷ lệ ngày và hoàn lại.

## 2. Tiêu chí Tính toán Số tiền Hoàn lại
Số tiền hoàn lại được tính như sau:
Số tiền hoàn lại = Số tiền thực tế đã thanh toán - ( (Số tiền thực tế đã thanh toán / Tổng số ngày đăng ký) x Số ngày đã sử dụng ) - Phí cổng thanh toán (PG)

* **Tính toán Số ngày đã sử dụng:** Thời gian từ ngày thanh toán đến ngày nhận được yêu cầu hoàn tiền được coi là số ngày đã sử dụng.
* **Tiêu chí Sử dụng AI:** Nếu số lần sử dụng AI vượt quá số tiền được hoàn lại, số tiền vượt quá đó có thể được khấu trừ.

## 3. Lý do Không Hoàn tiền
Việc hoàn tiền có thể bị hạn chế hoặc không thể thực hiện trong các trường hợp sau:
* Nếu đã quá 30 ngày kể từ ngày thanh toán.
* Nếu dịch vụ tiếp tục được sử dụng mà không hủy đăng ký.
**Yêu cầu Hoàn tiền:** Vui lòng liên hệ với chúng tôi qua email (support@sermonnote.net).
        `,
        // 🚨 [NEW] 개인정보처리방침 내용 (마크다운)
        [PRIVACY_POLICY_KEY]: `
# Chính sách Bảo mật SermonNote
---
## 1. Các mục và Mục đích Thu thập Thông tin Cá nhân
SermonNote coi trọng thông tin cá nhân của người dùng và tuân thủ "Luật Bảo vệ Thông tin Cá nhân" và các quy định liên quan.

| Hạng mục | Thông tin Thu thập | Mục đích Thu thập và Sử dụng | 
| :--- | :--- | :--- | 
| **Thông tin Đăng nhập** | Địa chỉ email, Firebase UID | Nhận dạng và xác thực người dùng để sử dụng dịch vụ | 
| **Hồ sơ Sử dụng Dịch vụ** | Số lần sử dụng AI, loại bài giảng đã chọn, bản nháp bài giảng cuối cùng | Cung cấp dịch vụ, quản lý hạn chế sử dụng và cải tiến mô hình AI | 
| **Thông tin Thanh toán** | Số nhận dạng thanh toán PG duy nhất, số tiền thanh toán, ngày thanh toán | Thanh toán phí đăng ký, xử lý hoàn tiền, tuân thủ luật thương mại điện tử | 

## 2. Cung cấp Thông tin Cá nhân cho Bên thứ ba
* **Tạo Bài giảng AI:** Văn bản do người dùng nhập (chủ đề, câu Kinh Thánh) sẽ được chuyển đến nhà cung cấp mô hình AI (ví dụ: Google Gemini API) để tạo bản nháp bài giảng.
* **Xử lý Thanh toán:** Thông tin thanh toán được cung cấp cho Cổng thanh toán (PG) để xử lý đăng ký thanh toán.

**Cán bộ Bảo vệ Dữ liệu:** Đội ngũ Vận hành SermonNote (privacy@sermonnote.net)
        `,
    },
};


// ----------------------------------------------------
// 💡 헬퍼 함수: key를 등급별로 매핑합니다.
const getPlanFeatureKey = (baseKey, planName) => {
    // 언어에 상관없이 key를 찾을 수 있도록 원본 키를 사용합니다.
    const planKeyMap = {
        [translations['ko']['planFreeMember']]: 'free',
        [translations['en']['planFreeMember']]: 'free',
        [translations['ru']['planFreeMember']]: 'free',
        [translations['zh']['planFreeMember']]: 'free',
        [translations['vi']['planFreeMember']]: 'free',
        
        [translations['ko']['planStandardMember']]: 'std',
        [translations['en']['planStandardMember']]: 'std',
        [translations['ru']['planStandardMember']]: 'std',
        [translations['zh']['planStandardMember']]: 'std',
        [translations['vi']['planStandardMember']]: 'std',

        [translations['ko']['planPremiumMember']]: 'prem',
        [translations['en']['planPremiumMember']]: 'prem',
        [translations['ru']['planPremiumMember']]: 'prem',
        [translations['zh']['planPremiumMember']]: 'prem',
        [translations['vi']['planPremiumMember']]: 'prem',
    };
    
    const suffix = planKeyMap[planName] || '';
    return suffix ? `${baseKey}_${suffix}` : baseKey;
};

// 💡 다국어 헬퍼 함수
const t = (key, lang = 'ko', ...args) => {
    // tParent 함수를 window 객체에서 가져오거나 자체 translations 사용
    if (typeof window !== 'undefined' && window.tParent) {
        return window.tParent(key, lang, ...args);
    }
    
    // 자체 translations 사용
    let text = translations[lang]?.[key] || translations['en']?.[key] || key;
    args.forEach((arg, index) => {
        text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), arg);
    });
    return text;
};

// Plan data definition
const plans = (handlePayment, t, lang) => {
    // (월별 가격 계산을 위해 필요한 상수)
    const monthlyStandard = 30;
    const monthlyPremium = 60;
    const annualDiscountStandard = 0.1667; 
    const annualDiscountPremium = 0.20; 
    
    // 🚨 [PADDLE]: 데모용 Price ID (실제 서비스에서는 백엔드에서 Price ID를 관리해야 합니다.)
    const PADDLE_PRICE_IDS = {
        standard_monthly: 'pri_01h9h4yfgk0y58h4k00000000', // 예시 ID
        standard_annual: 'pri_01h9h4yfgk0y58h4k00000001',   // 예시 ID
        premium_monthly: 'pri_01h9h4yfgk0y58h4k00000002',  // 예시 ID
        premium_annual: 'pri_01h9h4yfgk0y58h4k00000003'    // 예시 ID
    };

    const freePlanName = t('planFreeMember', lang);
    const standardPlanName = t('planStandardMember', lang);
    const premiumPlanName = t('planPremiumMember', lang);

    // 💡 기능 목록을 구성하는 헬퍼 함수
    const getFeatures = (planName) => {
        const features = [];
        
        // --- 1. 횟수 기반 기능 ---
        features.push(t(getPlanFeatureKey('sermonGenTimes', planName), lang));
        
        // AI 주석 횟수 (프리미엄은 무제한 강조)
        if (getPlanFeatureKey('aiAnnotationTimes', planName) === 'aiAnnotationTimes_prem') {
            features.push(t('unlimitedAnnotation', lang));
        } else {
            features.push(t(getPlanFeatureKey('aiAnnotationTimes', planName), lang));
        }
        
        // --- 2. 코어 기능 ---
        // NOTE: planName을 직접 비교하는 것이 안전합니다.
        if (planName === freePlanName) {
            features.push(t('textEditor', lang));
        } else {
            features.push(t('advancedTextEditor', lang));
        }

        // --- 3. 아카이브 ---
        if (planName === freePlanName) {
            features.push(t('archiveAccessRestricted', lang));
        } else {
            features.push(t('archiveAccessFull', lang));
        }
        
        features.push(t(getPlanFeatureKey('archiveShareLimited', planName), lang));

        // --- 4. 기술 지원 ---
        if (planName === freePlanName) {
            // 무료는 기술 지원 항목을 넣지 않습니다.
        } else if (planName === standardPlanName) {
            features.push(t('limitedSupport', lang));
        } else if (planName === premiumPlanName) {
            features.push(t('unlimitedSupport', lang));
        }

        return features;
    };


    return [ 
        {
            id: 'free',
            name: freePlanName, 
            monthlyPrice: 'Free',
            annualPrice: 'Free',
            paddlePriceIdMonthly: null,
            paddlePriceIdAnnual: null,
            description: t('freePlanDescription', lang),
            features: getFeatures(freePlanName),
            buttonText: t('getStarted', lang),
            buttonAction: () => console.log('Free member: Get Started clicked.'),
            isPrimary: false,
            monthlyPriceValue: 0,
            annualDiscountRate: 0,
        },
        {
            id: 'standard',
            name: standardPlanName,
            monthlyPrice: `${monthlyStandard} $/month`,
            annualPrice: `${calculateAnnualPrice(monthlyStandard, annualDiscountStandard)} $/year`, 
            paddlePriceIdMonthly: PADDLE_PRICE_IDS.standard_monthly, // 🚨 Paddle ID 추가
            paddlePriceIdAnnual: PADDLE_PRICE_IDS.standard_annual,   // 🚨 Paddle ID 추가
            monthlyPriceValue: monthlyStandard, 
            annualDiscountRate: Math.round(annualDiscountStandard * 100),
            description: t('standardPlanDescription', lang),
            features: getFeatures(standardPlanName),
            buttonText: t('subscribeNow', lang),
            buttonAction: (isAnnual) => handlePayment('standard', isAnnual),
            isPrimary: false,
        },
        {
            id: 'premium',
            name: premiumPlanName,
            monthlyPrice: `${monthlyPremium} $/month`,
            annualPrice: `${calculateAnnualPrice(monthlyPremium, annualDiscountPremium)} $/year`, 
            paddlePriceIdMonthly: PADDLE_PRICE_IDS.premium_monthly, // 🚨 Paddle ID 추가
            paddlePriceIdAnnual: PADDLE_PRICE_IDS.premium_annual,   // 🚨 Paddle ID 추가
            monthlyPriceValue: monthlyPremium, 
            annualDiscountRate: Math.round(annualDiscountPremium * 100),
            description: t('premiumPlanDescription', lang),
            features: getFeatures(premiumPlanName),
            buttonText: t('subscribeNow', lang),
            buttonAction: (isAnnual) => handlePayment('premium', isAnnual),
            isPrimary: true, // Emphasize this plan
        },
    ];
};


// ----------------------------------------------------
// 💡 메인 컴포넌트
// ----------------------------------------------------

const PremiumSubscriptionPage = ({ onGoBack, t: tParent, lang }) => { 
    const [isAnnual, setIsAnnual] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    
    // 🚨 [NEW]: 정책 모달 상태 추가
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    // 🚨 [수정]: content는 이제 키(key)를 저장합니다.
    const [policyContent, setPolicyContent] = useState({ title: '', contentKey: '' }); 

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    // tParent 함수를 window 객체에 임시 저장하여 하위 함수에서 접근 가능하도록 함
    if (typeof window !== 'undefined' && tParent) {
        window.tParent = tParent;
    }
    
    // 💡 [NEW] Paddle.js 로드 확인
    useEffect(() => {
        if (typeof window !== 'undefined' && typeof window.Paddle === 'undefined') {
            console.warn("Paddle.js script is not loaded. Please ensure it is included in your HTML head.");
            // 실제 환경에서는 스크립트를 동적으로 로드해야 하지만, 여기서는 경고만 표시합니다.
        }
    }, []);


    // ----------------------------------------------------
    // 💡 정책 링크 클릭 핸들러
    // ----------------------------------------------------
    const handlePolicyClick = useCallback((policyType) => {
        if (policyType === 'refund') {
            setPolicyContent({
                title: t('viewRefundPolicy', lang), // 이미 번역된 제목
                contentKey: REFUND_POLICY_KEY // 키 저장
            });
        } else if (policyType === 'privacy') {
            setPolicyContent({
                title: t('viewPrivacyPolicy', lang), // 이미 번역된 제목
                contentKey: PRIVACY_POLICY_KEY // 키 저장
            });
        }
        setIsPolicyModalOpen(true);
    }, [lang]);
    // ----------------------------------------------------


    // ----------------------------------------------------
    // 💡 결제 처리 핸들러 (PADDLE 연동)
    // ----------------------------------------------------
    const handlePayment = useCallback(async (planId, isAnnual) => {
        setPaymentError(null);
        setIsProcessing(true);
        
        try {
            const currentPlansData = plans(handlePayment, t, lang);
            const selectedPlan = currentPlansData.find(p => p.id === planId);
            
            if (!selectedPlan) throw new Error('Invalid plan selection.');

            const paddlePriceId = isAnnual 
                ? selectedPlan.paddlePriceIdAnnual 
                : selectedPlan.paddlePriceIdMonthly;
            
            if (!paddlePriceId) throw new Error('Missing Paddle Price ID for the selected plan.');

            // 1. 서버에 Price ID 전송 (옵션: 서버에서 Price ID 유효성 검사 및 웹훅 준비)
            // (여기서는 서버 호출을 생략하고 바로 Paddle Checkout을 호출합니다.)
            
            // 2. Paddle Checkout 호출
            initiatePaddleCheckout(
                paddlePriceId, 
                planId, 
                isAnnual, 
                t, 
                lang, 
                setIsProcessing, 
                setShowSuccessModal, 
                setPaymentError
            );
            
            // NOTE: initiatePaddleCheckout이 결제창을 띄우므로, 이후의 로직은 콜백(successCallback)에서 처리됩니다.
            // setIsProcessing(false)는 콜백에서 처리됩니다.

        } catch (error) {
            console.error('[Payment Error]', error);
            setIsProcessing(false);
            setPaymentError(t('paymentError', lang, error.message || '알 수 없는 오류'));
        }
    }, [lang]);
    
    // 모달을 닫고 메인 화면으로 이동
    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        onGoBack(); 
    }

    // plans 함수를 컴포넌트 내부에서 호출하여 최신 props(lang, handlePayment)를 반영합니다.
    const currentPlans = plans(handlePayment, t, lang); 

    // 연간 할인율 동적 계산
    const maxDiscountRate = Math.max(...currentPlans.map(p => p.annualDiscountRate || 0));

    // 🚨 isProcessing 중에는 전체 UI 비활성화
    if (isProcessing) {
        return (
            <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-blue-600 p-6 rounded-lg shadow-2xl">
                    <LoadingSpinner message={t('processingPayment', lang)} />
                </div>
            </div>
        );
    }


    return (
        // 전체 배경을 밝게 (bg-gray-50), 텍스트 색상을 어둡게 (text-gray-900)
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-gray-900">{t('chooseYourPlan', lang)}</h2>
                <p className="text-lg text-gray-600 mt-2 max-w-3xl mx-auto">
                    {t('planSubtitle', lang)}
                </p>
            </div>
            
            {/* 🚨 [NEW] 결제 오류 메시지 표시 */}
            {paymentError && (
                <div className="w-full max-w-6xl p-4 mb-8 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-medium">
                    🚨 {paymentError.startsWith('결제 실패:') || paymentError.startsWith('Payment failed:') || paymentError.startsWith('Ошибка платежа:') || paymentError.startsWith('付款失败:') || paymentError.startsWith('Thanh toán thất bại:')
                        ? paymentError
                        : t(paymentError, lang)}
                </div>
            )}
            
            {/* 가격 토글 버튼 */}
            <div className="flex items-center space-x-3 mb-10 bg-gray-200 p-2 rounded-full shadow-lg">
                <span className={`text-sm font-semibold transition-colors ${!isAnnual ? 'text-blue-600' : 'text-gray-600'}`}>{t('monthly', lang)}</span>
                <button
                    onClick={() => setIsAnnual(!isAnnual)}
                    className={`
                        relative w-14 h-8 flex items-center rounded-full transition-colors duration-300
                        ${isAnnual ? 'bg-blue-600' : 'bg-gray-400'}
                    `}
                >
                    <span
                        className={`
                            absolute w-6 h-6 bg-white rounded-full shadow transition-transform duration-300
                            ${isAnnual ? 'translate-x-7' : 'translate-x-1'}
                        `}
                    />
                </button>
                <span className={`text-sm font-semibold transition-colors ${isAnnual ? 'text-blue-600' : 'text-gray-600'}`}>
                    {t('annually', lang)}
                    {/* 최대 할인율 동적 표시 */}
                    <span className="text-xs text-yellow-600 font-bold ml-1 hidden sm:inline">({t('saveUpTo', lang, maxDiscountRate)})</span>
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                {currentPlans.map((plan, index) => {
                    
                    const isFree = plan.id === 'free';
                    
                    // 🚨 [FIXED] 가격 텍스트 및 단위 계산 로직 단순화 및 안정화
                    let priceText = plan.monthlyPrice;
                    let periodDisplay = '';
                    let detailBillingText = '\u00a0'; // Default to non-breaking space for layout stability
                    
                    if (!isFree) {
                        if (isAnnual) {
                            // 연간 결제 시 (가격 + /년)
                            priceText = plan.annualPrice.split(' ')[0]; // 예: '600'
                            periodDisplay = `/${t('year', lang)}`;
                            detailBillingText = t('saveVsMonthly', lang, plan.annualDiscountRate);
                        } else {
                            // 월별 결제 시 (가격 + /개월)
                            priceText = plan.monthlyPrice.split(' ')[0]; // 예: '60'
                            periodDisplay = `/${t('month', lang)}`;
                            detailBillingText = t('billedAnnualy', lang, plan.monthlyPriceValue * 12);
                        }
                    } else {
                        // Free Plan (Price is 'Free', no period, no detailed billing)
                        priceText = t('planFreeMember', lang); 
                        // Free 플랜의 경우 priceText에 멤버십 이름이 들어가므로 periodDisplay는 사용하지 않음.
                    }
                    
                    // Free 플랜의 경우 priceText에 '무료 멤버십' 텍스트를 사용하기 위해 폰트 크기 조정
                    const priceFontSize = isFree ? 'text-3xl font-normal' : 'text-5xl'; // 🚨 [FIX] Free 플랜 폰트 크기 및 굵기 수정


                    return (
                        <div 
                            key={index}
                            className={`
                                bg-white p-8 rounded-2xl shadow-xl border 
                                ${plan.isPrimary ? 'border-blue-500 ring-4 ring-blue-500/50' : 'border-gray-200'} 
                                flex flex-col transform transition-all duration-300 hover:scale-[1.03]
                            `}
                        >
                            <div className="relative">
                                {/* 플랜 이름: Free 플랜의 경우 priceText에 멤버십 이름이 들어가므로 name은 비워둡니다. */}
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{!isFree ? plan.name : '\u00a0'}</h3> 
                                {plan.isPrimary && (
                                    <span className="absolute top-0 right-0 px-3 py-1 bg-yellow-500 text-gray-900 text-xs font-bold rounded-full transform translate-x-4 -translate-y-4 shadow-md">
                                        {t('bestValue', lang)}
                                    </span>
                                )}
                            </div>
                            
                            {/* 가격 표시 */}
                            {/* 🚨 [FIXED] Free 플랜일 경우 priceText에 '무료 멤버십' 텍스트를 통째로 사용 */}
                            <p className={`${priceFontSize} font-extrabold text-blue-600 mb-1 flex items-baseline`}>
                                <span>{priceText}</span>
                                {/* Free가 아닐 경우에만 $ 기호와 기간 표시 */}
                                {!isFree && <span className="text-xl font-medium ml-1 text-gray-500">$</span>}
                                {!isFree && <span className="text-xl font-medium ml-1 text-gray-500">{periodDisplay}</span>}
                            </p>
                            
                            {/* 상세 청구 내용 */}
                            <p className="text-sm text-gray-500 mb-6 h-5">
                                {detailBillingText}
                            </p>
                            
                            <p className="text-gray-500 text-center mb-6">{plan.description}</p>

                            <div className="flex-grow">
                                {/* 기능 목록 */}
                                <ul className="text-left space-y-3 mb-8 text-gray-700">
                                    {plan.features.map((feature, i) => {
                                        const isHighlighted = plan.isPrimary && i === 0;
                                        
                                        return (
                                            <li key={i} className="flex items-start space-x-3">
                                                <CheckIcon />
                                                <span 
                                                    className={`leading-relaxed ${isHighlighted ? 'text-blue-600 font-bold' : ''}`}
                                                >
                                                    {feature}
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                            
                            {/* 구독 버튼 */}
                            <button
                                onClick={() => plan.buttonAction(isAnnual)} 
                                disabled={isFree || isProcessing} 
                                className={`
                                    w-full px-6 py-3 font-semibold rounded-xl shadow-lg transition duration-300
                                    ${isFree ? 'bg-gray-400 cursor-not-allowed text-gray-800' : (plan.isPrimary ? 'bg-blue-600 hover:bg-blue-700 text-white transform hover:translate-y-[-2px]' : 'bg-gray-700 hover:bg-gray-800 text-white')}
                                `}
                            >
                                {plan.buttonText}
                            </button>
                        </div>
                    );
                })}
            </div>
            
            {/* 🚨 [정책 링크] 핸들러 연결 및 UI 개선 */}
            <div className="mt-12 flex space-x-6 justify-center text-sm">
                <a 
                    href="#" 
                    className="text-gray-500 hover:text-blue-600 transition hover:underline"
                    onClick={(e) => { e.preventDefault(); handlePolicyClick('refund'); }}
                >
                    {/* 🚨 [FIX]: viewRefundPolicy 다국어 키 적용 */}
                    {t('viewRefundPolicy', lang)}
                </a>
                <a 
                    href="#" 
                    className="text-gray-500 hover:text-blue-600 transition hover:underline"
                    onClick={(e) => { e.preventDefault(); handlePolicyClick('privacy'); }}
                >
                    {/* 🚨 [FIX]: viewPrivacyPolicy 다국어 키 적용 */}
                    {t('viewPrivacyPolicy', lang)}
                </a>
            </div>


            <button
                onClick={onGoBack}
                className="mt-12 text-gray-600 hover:text-gray-900 transition duration-300 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-500"
            >
                {t('goBack', lang)} ({t('sermonSelectionReturn', lang)})
            </button>

            {/* 구독 성공 모달 */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-xl shadow-2xl text-center max-w-sm w-full border border-green-600">
                        <SuccessIcon />
                        <h3 className="text-3xl font-bold text-gray-900 mb-2">{t('subscriptionSuccessful', lang)}</h3>
                        <p className="text-gray-600 mb-6">
                            {t('subscriptionSuccessMessage', lang)}
                        </p>
                        <button
                            onClick={handleCloseSuccess}
                            className="w-full px-6 py-3 font-semibold rounded-xl shadow-lg bg-green-600 hover:bg-green-700 text-white transition duration-300"
                        >
                            {t('startWritingSermons', lang)}
                        </button>
                    </div>
                </div>
            )}
            
            {/* 🚨 [NEW] 정책 문서 뷰어 모달 렌더링 */}
            <PolicyModal 
                isOpen={isPolicyModalOpen}
                onClose={() => setIsPolicyModalOpen(false)}
                title={policyContent.title}
                content={policyContent.contentKey} // 🚨 [수정]: contentKey를 전달
                t={t}
                lang={lang}
            />
        </div>
    );
};

export default PremiumSubscriptionPage;