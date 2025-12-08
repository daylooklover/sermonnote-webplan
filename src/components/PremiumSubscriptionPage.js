'use client';

import React, { useState, useCallback, useEffect } from 'react';

// ----------------------------------------------------
// 💡 정책 문서 내용 키 (하드코딩된 상수)
// ----------------------------------------------------
const REFUND_POLICY_KEY = 'refund_policy_content';
const PRIVACY_POLICY_KEY = 'privacy_policy_content';

// ----------------------------------------------------
// 💡 가격 및 할인율 상수
// ----------------------------------------------------
// 연간 할인율 (20% 할인)
const ANNUAL_DISCOUNT_RATE = 0.2; 

// Helper function to calculate annual price with discount
const calculateAnnualPrice = (monthlyPrice, discountRate) => {
    const annualBase = monthlyPrice * 12;
    // 반올림 대신 버림을 사용하여 깔끔한 가격을 만듭니다.
    const discountedPrice = Math.floor(annualBase * (1 - discountRate));
    return discountedPrice;
};


// ----------------------------------------------------
// 💡 Paddle Price ID 상수 정의 (결제 기능 삭제로 인해 더미화)
// ----------------------------------------------------
const DUMMY_PRICE_IDS = {
    standard_monthly: 'DUMMY_ID_STANDARD_M', 
    standard_annual: 'DUMMY_ID_STANDARD_A',    
    premium_monthly: 'DUMMY_ID_PREMIUM_M', 
    premium_annual: 'DUMMY_ID_PREMIUM_A'      
};


// ----------------------------------------------------
// 💡 다국어 (i18n) 번역 테이블 및 정책 내용 (업데이트됨)
// ----------------------------------------------------
const translations = {
    ko: {
        // [i18n] 한국어 번역 키 (나머지 키는 생략하고 정책 관련 키만 유지)
        lang_ko: '한국어', lang_en: '영어', lang_zh: '중국어', lang_ru: 'روسский', lang_vi: 'Tiếng Việt',
        viewRefundPolicy: '환불 정책 보기',
        viewPrivacyPolicy: '개인정보처리방침 보기',
        viewTermsOfService: '이용약관 보기',
        closeButton: '닫기',
        policyContentMissing: '정책 내용을 불러올 수 없습니다.',
        
        // 플랜 관련 더미 키 (컴파일 오류 방지용)
        chooseYourPlan: '플랜을 선택하세요',
        planSubtitle: '사용량에 맞는 최적의 플랜을 선택하고 SermonNote의 모든 기능을 활용하세요.',
        monthly: '월간',
        annually: '연간',
        saveUpTo: '최대 {0}% 할인',
        planFreeMember: '무료 (Free)',
        freePlanDescription: '간단한 테스트 및 개인 학습용 플랜입니다.',
        planStandardMember: '스탠다드 (Standard)',
        standardPlanDescription: '대부분의 목회자에게 적합한 표준 플랜입니다.',
        planPremiumMember: '프리미엄 (Premium)',
        premiumPlanDescription: 'AI 무제한 사용 및 모든 기능을 활용하는 최상위 플랜입니다.',
        sermonGenTimes_free: '설교 생성 5회/월',
        aiAnnotationTimes_free: 'AI 주석 10회/월',
        textEditor: '일반 텍스트 에디터',
        archiveAccessRestricted: '아카이브 접근 (최근 5개)',
        archiveShareLimited_free: '아카이브 공유 제한',
        getStarted: '지금 시작하기',
        sermonGenTimes_std: '설교 생성 20회/월',
        aiAnnotationTimes_std: 'AI 주석 50회/월',
        advancedTextEditor: '고급 텍스트 에디터',
        archiveAccessFull: '아카이브 접근 (무제한)',
        archiveShareLimited_std: '아카이브 공유 제한적',
        limitedSupport: '제한적 기술 지원',
        subscribeNow: '지금 구독하기',
        sermonGenTimes_prem: '설교 생성 50회/월',
        unlimitedAnnotation: 'AI 주석 무제한',
        archiveShareLimited_prem: '아카이브 공유 무제한',
        unlimitedSupport: '우선 기술 지원',
        year: '년',
        month: '월',
        saveVsMonthly: '월간 결제 대비 {0}% 절약',
        billedAnnualy: '매년 {0} USD 청구',
        paymentError: '결제 오류: {0}',
        processingPayment: '결제 처리 중...',
        
        // 🚨 [최종 확정 한국어 환불 정책]
        [REFUND_POLICY_KEY]: `
# SermonNote 구독 서비스 환불 정책 (개정안)
---
## 1. 환불 대상 및 기간
본 환불 정책은 SermonNote 유료 멤버십(스탠다드, 프리미엄) 구독에 적용됩니다.
* **7일 이내 환불 (청약 철회):** 결제일로부터 7일 이내이며, AI 설교 생성 또는 AI 주석 기능을 **5회 미만** 사용한 경우에 한해 **전액 환불**이 가능합니다.
* **부분 환불:** 결제일로부터 7일이 경과했거나, AI 기능을 5회 이상 사용한 경우, 다음과 같은 기준으로 남은 이용료를 일할 계산하여 환불합니다. 

## 2. 환불 금액 산정 기준
환불 금액은 다음과 같이 산정됩니다.

$$환불 금액 = 실제 결제 금액 - \\left( \\frac{실제 결제 금액}{총 구독 기간(일)} \\times 사용 기간(일) \\right) - PG사 수수료 (실제 발생 비용)$$

* **사용 기간 산정:** 결제일로부터 환불 요청 접수일까지를 사용 기간으로 간주합니다.
* **PG사 수수료:** 결제대행사(PG) 및 카드사에서 부과하는 **실제 발생한 수수료를 실비로 공제합니다.** (수수료율은 PG사 및 결제 수단 정책에 따라 변동될 수 있습니다. 일반적으로 결제 금액의 3%~5% 수준입니다.)
* **AI 사용 횟수 기준:** 만약 사용한 AI 횟수(설교 생성/주석)의 **가치가 일할 계산된 잔여 금액을 초과하는 경우**, 그 초과분에 해당하는 금액이 추가로 차감될 수 있습니다.
    * **가치 산정 기준:** 각 플랜의 월 구독료를 해당 플랜의 월별 AI 기능 제공 횟수(설교 생성/주석)로 나누어 **1회당 단가를 산정합니다.**

## 3. 환불 불가 사유
다음의 경우 환불이 제한되거나 불가능할 수 있습니다.
* 결제일로부터 30일이 초과된 경우.
* 구독 취소 없이 서비스를 계속 이용한 경우.
* 이용 약관을 위반하여 서비스 이용이 정지되거나 해지된 경우.
**환불 문의:** 환불을 원하시면 서비스 내 고객센터 또는 이메일(support@sermonnote.net)로 문의해 주시기 바랍니다.
        `,

        // 🚨 [표준화된 한국어 개인정보처리방침]
        [PRIVACY_POLICY_KEY]: `
# SermonNote 개인정보처리방침
---
## 1. 개인정보 수집 및 이용 목적
SermonNote는 다음의 목적을 위해 최소한의 개인정보를 수집 및 이용합니다.

| 구분 | 수집 항목 | 수집 및 이용 목적 | 근거 법령 |
| :--- | :--- | :--- | :--- |
| **필수** | 이메일 주소, Firebase UID | 서비스 이용을 위한 사용자 식별, 로그인 인증 및 회원 관리 | 개인정보 보호법 제15조 |
| **필수** | 서비스 이용 기록 (AI 사용 횟수, 설교 유형 선택, 최종 작성된 설교 초안) | 서비스 제공, 이용 제한 관리, AI 모델 성능 개선 및 맞춤형 서비스 제공 | 개인정보 보호법 제15조 |
| **필수** | 결제 정보 (PG사 결제 고유 번호, 결제 금액, 결제일) | 구독료 결제 및 환불 처리, 전자상거래법 및 기타 법령 준수 | 전자상거래법 제6조, 개인정보 보호법 제15조 |
| **선택** | 사용자 이름 (displayName), 프로필 사진 | 사용자 간 구별 및 개인화된 서비스 제공 | 정보 주체의 동의 |

## 2. 개인정보의 제3자 제공
SermonNote는 서비스 제공을 위해 다음과 같이 개인정보를 제3자에게 제공합니다.

| 제공받는 자 | 제공 목적 | 제공 항목 | 보유 및 이용 기간 |
| :--- | :--- | :--- | :--- |
| **AI 모델 제공사** (예: Google Gemini API) | 설교 초안 생성 및 AI 주석 제공 (AI 기능 실행에 필요한 텍스트에 한함) | 사용자가 입력한 텍스트 (주제, 구절, 메모 등) | 서비스 제공 계약 종료 시 또는 즉시 파기 |
| **결제대행사(PG)** | 구독료 결제 처리 및 정산 | PG사 결제 고유 번호, 결제 금액, 결제일 | 관련 법령에 따른 의무 보유 기간 |

## 3. 개인정보의 보유 및 이용 기간
이용자의 개인정보는 원칙적으로 **회원 탈퇴 시 또는 수집 및 이용 목적이 달성된 후** 지체 없이 파기합니다.
* 다만, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 해당 법령에서 정한 기간 동안 보존합니다. (예: 전자상거래법, 통신비밀보호법 등)

## 4. 개인정보 보호 책임자 및 담당 부서
SermonNote는 개인정보 처리에 관한 업무를 총괄하고, 개인정보 처리와 관련한 이용자의 불만 처리 및 피해 구제를 위하여 아래와 같이 개인정보 보호 책임자를 지정하고 있습니다.

* **개인정보보호 책임자:** SermonNote 운영팀
* **연락처 (이메일):** privacy@sermonnote.net
        `,
    },

    en: {
        // [i18n] 영어 번역 키 (한국어 정책 기반으로 상세화)
        lang_ko: 'Korean', lang_en: 'English', lang_zh: 'Chinese', lang_ru: 'Russian', lang_vi: 'Vietnamese',
        viewRefundPolicy: 'View Refund Policy',
        viewPrivacyPolicy: 'View Privacy Policy',
        viewTermsOfService: 'View Terms of Service',
        closeButton: 'Close',
        policyContentMissing: 'Could not load policy content.',

        [REFUND_POLICY_KEY]: `# SermonNote Subscription Service Refund Policy (Revised)\n---\n## 1. Eligibility and Period\n* **7-Day Full Refund (Withdrawal):** Available within 7 days of payment AND if AI Sermon Generation or Annotation features were used **fewer than 5 times**.\n* **Partial Refund:** If 7 days have passed, OR if AI features were used 5 or more times, the refund is calculated proportionally based on the unused subscription period.\n\n## 2. Refund Calculation Basis\nRefund amount is calculated as follows:\n$$Refund = Actual\\ Payment - (\\frac{Actual\\ Payment}{Total\\ Subscription\\ Days} \\times Used\\ Days) - PG\\ Fees$$\n* **PG Fees:** The actual transaction fees charged by the Payment Gateway (PG) are deducted. (Typically 3% to 5% of the payment amount, subject to PG policy.)\n* **AI Usage Deduction:** If the value of AI usage exceeds the proportional refund amount, the excess value will be deducted. (Value is calculated by dividing the monthly subscription fee by the total monthly AI feature quota.)\n\n## 3. Grounds for Non-Refund\nRefunds may be restricted or unavailable if:\n* More than 30 days have passed since the payment date.\n* The service was continuously used without subscription cancellation.\n* The contract was suspended or terminated due to violation of the Terms of Service.`,
        [PRIVACY_POLICY_KEY]: `# SermonNote Privacy Policy\n---\n## 1. Collection and Use of Personal Information\n| Category | Items Collected | Purpose of Use | Legal Basis |\n| :--- | :--- | :--- | :--- |\n| **Required** | Email, Firebase UID | User identification, login, account management | Privacy Act Art. 15 |\n| **Required** | Usage History (AI count, drafts) | Service provision, model improvement, personalized service | Privacy Act Art. 15 |\n| **Required** | Payment Info (PG ID, amount, date) | Payment processing, compliance with e-commerce laws | E-Commerce Act Art. 6 |\n| **Optional** | DisplayName, Profile Photo | User differentiation, personalization | Consent |\n\n## 2. Provision of Personal Information to Third Parties\n| Recipient | Purpose | Items Provided | Retention Period |\n| :--- | :--- | :--- | :--- |\n| **AI Provider** (e.g., Google Gemini) | AI generation/annotation (limited to input text) | User Input Text (topic, scripture, memo, etc.) | Upon termination of service contract or immediate deletion |\n| **Payment Gateway (PG)** | Payment and settlement processing | PG ID, Payment Amount, Date | Mandatory legal retention period |\n\n## 4. Chief Privacy Officer\n* **Officer:** SermonNote Operations Team\n* **Contact (Email):** privacy@sermonnote.net`,
    },

    // ----------------------------------------------------
    // 💡 [업데이트] 중국어 (zh) 정책 내용
    // ----------------------------------------------------
    zh: {
        lang_ko: '韩语', lang_en: '英语', lang_zh: '中文', lang_ru: '俄语', lang_vi: '越南语',
        viewRefundPolicy: '查看退款政策',
        viewPrivacyPolicy: '查看隐私政策',
        viewTermsOfService: '查看服务条款',
        closeButton: '关闭',
        policyContentMissing: '无法加载政策内容。',
        [REFUND_POLICY_KEY]: `# SermonNote 订阅服务退款政策 (修订版)\n---\n## 1. 退款资格和期限\n* **7日内全额退款 (撤回):** 仅在付款后7日内 **且** AI功能使用次数**少于5次**时适用。\n* **部分退款:** 若超过7日或AI功能使用次数达到5次以上，将按比例计算未使用期限的费用并退款。\n\n## 2. 退款金额计算依据\n退款金额计算公式如下：\n$$退款金额 = 实际支付金额 - (\\frac{实际支付金额}{总订阅天数} \\times 已使用天数) - 支付网关手续费$$\n* **支付网关手续费:** 扣除实际发生的支付网关(PG)交易费用。\n* **AI使用次数扣减:** 如果AI功能的使用价值超过按比例计算的剩余金额，将扣除超额部分。 (价值计算：月度费用除以该套餐的月度AI功能配额次数。)\n\n## 3. 不予退款的事由\n在以下情况下，退款可能会受到限制或无法进行：\n* 付款日期已超过30日。\n* 未取消订阅并持续使用服务。\n* 因违反服务条款而被暂停或终止合同。`,
        [PRIVACY_POLICY_KEY]: `# SermonNote 隐私政策\n---\n## 1. 个人信息收集与使用目的\n| 类别 | 收集项目 | 使用目的 | 法律依据 |\n| :--- | :--- | :--- | :--- |\n| **必需** | 电子邮件，Firebase UID | 用户识别，登录认证，账户管理 | 隐私保护法第15条 |\n| **必需** | 使用记录 (AI次数，草稿) | 提供服务，模型改进，个性化服务 | 隐私保护法第15条 |\n| **必需** | 支付信息 (PG ID，金额，日期) | 支付处理，遵守电商法 | 电子商务法第6条 |\n| **可选** | 用户名称，头像 | 用户区分，个性化服务 | 用户同意 |\n\n## 2. 向第三方提供个人信息\n| 接收方 | 提供目的 | 提供项目 | 保留期限 |\n| :--- | :--- | :--- | :--- |\n| **AI 模型提供商** (例如：Google Gemini) | AI 生成/注释 (仅限于输入文本) | 用户输入的文本 (主题，经文，备忘录等) | 服务合同终止或立即删除 |\n| **支付网关 (PG)** | 支付结算处理 | PG ID, 支付金额, 日期 | 法律规定的保留期限 |\n\n## 4. 个人信息保护负责人\n* **负责人:** SermonNote 运营团队\n* **联系方式 (邮箱):** privacy@sermonnote.net`,
    },

    // ----------------------------------------------------
    // 💡 [업데이트] 러시아어 (ru) 정책 내용
    // ----------------------------------------------------
    ru: {
        lang_ko: 'Корейский', lang_en: 'Английский', lang_zh: 'Китайский', lang_ru: 'Русский', lang_vi: 'Вьетнамский',
        viewRefundPolicy: 'Посмотреть политику возврата',
        viewPrivacyPolicy: 'Посмотреть политику конфиденциальности',
        viewTermsOfService: 'Посмотреть Условия обслуживания',
        closeButton: 'Закрыть',
        policyContentMissing: 'Не удалось загрузить содержимое политики.',
        [REFUND_POLICY_KEY]: `# Политика возврата подписки SermonNote (Редакция)\n---\n## 1. Условия и период возврата\n* **Полный возврат в течение 7 дней (Отзыв):** Доступно в течение 7 дней с момента оплаты **И** если функции AI были использованы **менее 5 раз**.\n* **Частичный возврат:** Если прошло 7 дней, ИЛИ функции AI были использованы 5 и более раз, возврат рассчитывается пропорционально за неиспользованный период.\n\n## 2. Основа расчета суммы возврата\nСумма возврата рассчитывается следующим образом:\n$$Возврат = Фактическая\\ оплата - (\\frac{Фактическая\\ оплата}{Общее\\ количество\\ дней\\ подписки} \\times Использованные\\ дни) - Комиссия\\ PG$$\n* **Комиссия PG:** Фактические комиссии за транзакцию, взимаемые платежным шлюзом (PG), вычитаются.\n* **Вычет за использование AI:** Если стоимость использования AI превышает пропорционально рассчитанный остаток, эта сумма может быть дополнительно вычтена. (Стоимость рассчитывается делением ежемесячной платы на ежемесячную квоту функций AI.)\n\n## 3. Основания для отказа в возврате\nВозврат средств может быть ограничен или невозможен, если:\n* С даты оплаты прошло более 30 дней.\n* Услуга постоянно использовалась без отмены подписки.\n* Договор был приостановлен или расторгнут из-за нарушения Условий обслуживания.`,
        [PRIVACY_POLICY_KEY]: `# Политика конфиденциальности SermonNote\n---\n## 1. Сбор и использование персональных данных\n| Категория | Собираемые элементы | Цель использования | Правовое основание |\n| :--- | :--- | :--- | :--- |\n| **Обязательно** | Email, Firebase UID | Идентификация, вход, управление аккаунтом | Закон о конфиденциальности ст. 15 |\n| **Обязательно** | История использования (AI, черновики) | Предоставление услуг, улучшение модели | Закон о конфиденциальности ст. 15 |\n| **Обязательно** | Платежная инф-ция (PG ID, сумма, дата) | Обработка платежей, соблюдение законов о торговле | Закон о торговле ст. 6 |\n| **Дополнительно** | Имя пользователя, фото профиля | Различение пользователей, персонализация | Согласие субъекта данных |\n\n## 2. Предоставление персональных данных третьим лицам\n| Получатель | Цель предоставления | Предоставляемые элементы | Срок хранения |\n| :--- | :--- | :--- | :--- |\n| **Поставщик AI** (напр.: Google Gemini) | Генерация AI/аннотации (ограничено вводом) | Введенный текст (тема, стих, заметка и т. д.) | По окончании договора или немедленное удаление |\n| **Платежный шлюз (PG)** | Обработка платежей и расчетов | PG ID, Сумма платежа, Дата | Обязательный срок хранения по закону |\n\n## 4. Ответственный за защиту персональных данных\n* **Ответственный:** Операционная группа SermonNote\n* **Контакт (Email):** privacy@sermonnote.net`,
    },

    // ----------------------------------------------------
    // 💡 [업데이트] 베트남어 (vi) 정책 내용
    // ----------------------------------------------------
    vi: {
        lang_ko: 'Tiếng Hàn', lang_en: 'Tiếng Anh', lang_zh: 'Tiếng Trung', lang_ru: 'Tiếng Nga', lang_vi: 'Tiếng Việt',
        viewRefundPolicy: 'Xem Chính sách Hoàn tiền',
        viewPrivacyPolicy: 'Xem Chính sách Bảo mật',
        viewTermsOfService: 'Xem Điều khoản Dịch vụ',
        closeButton: 'Đóng',
        policyContentMissing: 'Không thể tải nội dung chính sách.',
        [REFUND_POLICY_KEY]: `# Chính sách Hoàn tiền Dịch vụ Đăng ký SermonNote (Bản sửa đổi)\n---\n## 1. Điều kiện và Thời hạn Hoàn tiền\n* **Hoàn tiền đầy đủ 7 Ngày (Rút lại):** Có sẵn trong vòng 7 ngày kể từ ngày thanh toán **VÀ** nếu các tính năng AI được sử dụng **dưới 5 lần**.\n* **Hoàn tiền một phần:** Nếu đã qua 7 ngày, HOẶC các tính năng AI đã được sử dụng 5 lần trở lên, việc hoàn tiền sẽ được tính theo tỷ lệ dựa trên thời gian đăng ký chưa sử dụng.\n\n## 2. Cơ sở Tính toán Số tiền Hoàn lại\nSố tiền hoàn lại được tính như sau:\n$$Hoàn\\ lại = Thanh\\ toán\\ thực\\ tế - (\\frac{Thanh\\ toán\\ thực\\ tế}{Tổng\\ số\\ ngày\\ đăng\\ ký} \\times Số\\ ngày\\ đã\\ sử\\ dụng) - Phí\\ PG$$\n* **Phí PG:** Phí giao dịch thực tế do Cổng thanh toán (PG) tính sẽ được khấu trừ.\n* **Khấu trừ sử dụng AI:** Nếu giá trị sử dụng AI vượt quá số tiền hoàn lại theo tỷ lệ, giá trị vượt mức đó sẽ được khấu trừ thêm. (Giá trị được tính bằng cách chia phí đăng ký hàng tháng cho hạn ngạch tính năng AI hàng tháng.)\n\n## 3. Căn cứ Không Hoàn tiền\nViệc hoàn tiền có thể bị hạn chế hoặc không thể thực hiện nếu:\n* Đã quá 30 ngày kể từ ngày thanh toán.\n* Dịch vụ được sử dụng liên tục mà không hủy đăng ký.\n* Hợp đồng bị đình chỉ hoặc chấm dứt do vi phạm Điều khoản dịch vụ.`,
        [PRIVACY_POLICY_KEY]: `# Chính sách Bảo mật SermonNote\n---\n## 1. Thu thập và Sử dụng Thông tin Cá nhân\n| Danh mục | Mục đã thu thập | Mục đích Sử dụng | Cơ sở Pháp lý |\n| :--- | :--- | :--- | :--- |\n| **Bắt buộc** | Email, Firebase UID | Nhận dạng người dùng, đăng nhập, quản lý tài khoản | Luật Bảo mật Điều 15 |\n| **Bắt buộc** | Lịch sử Sử dụng (số lần AI, bản nháp) | Cung cấp dịch vụ, cải thiện mô hình, cá nhân hóa | Luật Bảo mật Điều 15 |\n| **Bắt buộc** | Thông tin Thanh toán (PG ID, số tiền, ngày) | Xử lý thanh toán, tuân thủ luật thương mại điện tử | Luật Thương mại điện tử Điều 6 |\n| **Tùy chọn** | Tên hiển thị, Ảnh hồ sơ | Phân biệt người dùng, cá nhân hóa | Sự đồng ý của chủ thể dữ liệu |\n\n## 2. Cung cấp Thông tin Cá nhân cho Bên thứ ba\n| Bên nhận | Mục đích cung cấp | Mục được cung cấp | Thời gian Lưu giữ |\n| :--- | :--- | :--- | :--- |\n| **Nhà cung cấp AI** (ví dụ: Google Gemini) | Tạo/chú thích AI (giới hạn ở văn bản đầu vào) | Văn bản đầu vào của người dùng (chủ đề, câu Kinh thánh, ghi nhớ, v.v.) | Khi chấm dứt hợp đồng dịch vụ hoặc xóa ngay lập tức |\n| **Cổng Thanh toán (PG)** | Xử lý thanh toán và quyết toán | PG ID, Số tiền Thanh toán, Ngày | Thời gian lưu giữ bắt buộc theo luật |\n\n## 4. Cán bộ Bảo vệ Quyền riêng tư\n* **Cán bộ:** Đội ngũ Vận hành SermonNote\n* **Liên hệ (Email):** privacy@sermonnote.net`,
    },
};


// ----------------------------------------------------
// 💡 i18n 번역 헬퍼 함수
// ----------------------------------------------------
const t = (key, lang = 'ko', fallback = key) => {
    let translated = translations[lang] ? translations[lang][key] : (translations['ko'] ? translations['ko'][key] : key);
    if (!translated) return fallback;
    return translated;
};

// ----------------------------------------------------
// 💡 헬퍼 컴포넌트들 (CheckIcon, SuccessIcon, LoadingSpinner)
// ----------------------------------------------------
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check text-blue-500 flex-shrink-0">
        <path d="M20 6 9 17l-5-5"/>
    </svg>
);

const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

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
// 💡 정책 문서 뷰어 모달 컴포넌트 (최종 수정 반영)
// ----------------------------------------------------
const PolicyModal = ({ isOpen, onClose, title, contentKey, t, lang }) => {
    if (!isOpen) return null;

    const renderMarkdown = (contentKey, lang) => {
        const markdown = t(contentKey, lang); 
        const cleanedMarkdown = (markdown || '').trim();

        if (!cleanedMarkdown || cleanedMarkdown === contentKey) { 
            return <p>{t('policyContentMissing', lang)}</p>; 
        }
        
        // 마크다운 내용 파싱
        return cleanedMarkdown.split('\n').map((line, i) => {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('# ')) {
                return <h4 key={i} className="text-2xl font-bold mt-6 mb-2 text-gray-900 border-b pb-1">
                    {trimmedLine.replace('# ', '').trim()}
                </h4>;
            }
            if (trimmedLine.startsWith('## ')) {
                return <h5 key={i} className="text-xl font-bold mt-4 mb-2 text-gray-800">
                    {trimmedLine.replace('## ', '').trim()}
                </h5>;
            }
            if (trimmedLine === '---') {
                return <hr key={i} className="my-4 border-gray-200" />;
            }
            if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                return <li key={i} className="mb-1 text-base text-gray-700 leading-relaxed list-disc ml-6">{trimmedLine.replace(/[\*\-]\s/, '').trim()}</li>;
            }
            
            // 💡 [수정] LaTeX 수식 블록 처리 ($$...$$)
            if (trimmedLine.startsWith('$$') && trimmedLine.endsWith('$$')) {
                // 수식 기호($$)를 제거하고 수식 텍스트만 추출
                const formulaText = trimmedLine.replace(/\$\$/g, '').trim(); 
                
                // 수식을 보기 쉽게 렌더링 (HTML 기반의 간단한 렌더링)
                const renderFormula = (text) => {
                    // 분수 표현을 위한 간단한 대체
                    const parts = text.split(/(\\frac\{.*?\})/g);
                    return parts.map((part, index) => {
                        if (part.startsWith('\\frac')) {
                            const match = part.match(/\\frac\{(.*?)\}\{(.*?)\}/);
                            if (match) {
                                return (
                                    <span key={index} className="inline-flex flex-col items-center mx-2 align-middle">
                                        <span>{match[1].trim()}</span>
                                        <span className="w-full h-px bg-gray-600 my-0.5"></span>
                                        <span>{match[2].trim()}</span>
                                    </span>
                                );
                            }
                        }
                        return <span key={index}>{part.replace(/\\left\(|\\right\)/g, '')}</span>;
                    });
                };

                return (
                    // 수식 블록에 스타일 적용
                    <div 
                        key={i} 
                        className="policy-formula text-base bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md my-4 overflow-x-auto text-gray-800 font-bold flex items-center justify-center"
                    >
                        {renderFormula(formulaText)}
                    </div>
                );
            }

            if (trimmedLine.startsWith('|')) {
                // 테이블 렌더링을 위해 간단히 <pre> 사용
                return <pre key={i} className="text-sm bg-gray-50 p-3 overflow-x-auto whitespace-pre-wrap rounded-md border border-gray-200">{trimmedLine}</pre>;
            }
            if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                // 인라인 볼드 처리
                const html = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                return <p key={i} className="mb-3 text-base text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
            }
            if (trimmedLine === '') {
                return <div key={i} className="h-2"></div>;
            }
            return <p key={i} className="mb-3 text-base text-gray-700 leading-relaxed">{trimmedLine}</p>;
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
            <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center border-b pb-3 mb-4 sticky top-0 bg-white z-10">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h3> 
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition text-3xl font-light p-1">
                        &times;
                    </button>
                </div>
                <div className="policy-content">
                    {renderMarkdown(contentKey, lang)} 
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
// 💡 PremiumSubscriptionPage 메인 컴포넌트
// ----------------------------------------------------
const PremiumSubscriptionPage = ({ user, lang = 'ko', onReturnToSelection, handlePaddleSubscribe }) => {
    // ----------------------------------------------------
    // State 관리
    // ----------------------------------------------------
    const [isAnnual, setIsAnnual] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
    const [policyContent, setPolicyContent] = useState({ title: '', contentKey: '' });

    // ----------------------------------------------------
    // PG 연동을 위한 더미 결제 함수 (Paddle 로직 대체)
    // ----------------------------------------------------
    const initiatePayment = useCallback((priceId, planId) => {
        setIsProcessing(true);
        setPaymentError(null);

        if (handlePaddleSubscribe && user && user.email) {
            handlePaddleSubscribe({
                planId: priceId, // Paddle은 Price ID를 product로 사용
                userEmail: user.email,
                userName: user.displayName || 'User',
                metadata: { selectedPlan: planId, billingCycle: isAnnual ? 'annual' : 'monthly' }
            });
        } else {
            console.warn("User not logged in or handlePaddleSubscribe not available. Running dummy payment.");
            
            setTimeout(() => {
                setIsProcessing(false);
                setShowSuccessModal(true); 
            }, 2000); 
        }

        if (!handlePaddleSubscribe) {
              setIsProcessing(false);
        }

    }, [lang, user, handlePaddleSubscribe, isAnnual]); 

    // ----------------------------------------------------
    // 정책 모달 핸들러 
    // ----------------------------------------------------
    const handlePolicyClick = useCallback((policyType) => {
        if (policyType === 'refund') {
            setPolicyContent({
                title: t('viewRefundPolicy', lang), 
                contentKey: REFUND_POLICY_KEY
            });
        } else if (policyType === 'privacy') {
            setPolicyContent({
                title: t('viewPrivacyPolicy', lang), 
                contentKey: PRIVACY_POLICY_KEY
            });
        }
        setIsPolicyModalOpen(true);
    }, [lang, t]);

    // ----------------------------------------------------
    // 💡 플랜 데이터 정의 
    // ----------------------------------------------------
    const plans = useCallback((isAnnual) => {
        const monthlyStandard = 30;
        const monthlyPremium = 60;
        
        return [
            {
                id: 'free',
                title: t('planFreeMember', lang),
                description: t('freePlanDescription', lang),
                priceMonthly: 0,
                priceAnnual: 0,
                priceIdMonthly: DUMMY_PRICE_IDS.standard_monthly, 
                priceIdAnnual: DUMMY_PRICE_IDS.standard_annual,  
                isPrimary: false,
                features: [
                    t('sermonGenTimes_free', lang),
                    t('aiAnnotationTimes_free', lang),
                    t('textEditor', lang),
                    t('archiveAccessRestricted', lang),
                    t('archiveShareLimited_free', lang),
                ],
                buttonText: t('getStarted', lang),
                buttonAction: () => {
                    console.log('Free plan selected. Redirecting to app...');
                    if (onReturnToSelection) onReturnToSelection();
                }
            },
            {
                id: 'standard',
                title: t('planStandardMember', lang),
                description: t('standardPlanDescription', lang),
                priceMonthly: monthlyStandard, // 30
                priceAnnual: calculateAnnualPrice(monthlyStandard, ANNUAL_DISCOUNT_RATE), 
                priceIdMonthly: DUMMY_PRICE_IDS.standard_monthly, 
                priceIdAnnual: DUMMY_PRICE_IDS.standard_annual,  
                isPrimary: false,
                features: [
                    t('sermonGenTimes_std', lang),
                    t('aiAnnotationTimes_std', lang),
                    t('advancedTextEditor', lang),
                    t('archiveAccessFull', lang),
                    t('archiveShareLimited_std', lang),
                    t('limitedSupport', lang),
                ],
                buttonText: t('subscribeNow', lang),
                buttonAction: () => {
                    const priceId = isAnnual ? DUMMY_PRICE_IDS.standard_annual : DUMMY_PRICE_IDS.standard_monthly;
                    initiatePayment(priceId, 'standard');
                }
            },
            {
                id: 'premium',
                title: t('planPremiumMember', lang),
                description: t('premiumPlanDescription', lang),
                priceMonthly: monthlyPremium, // 60
                priceAnnual: calculateAnnualPrice(monthlyPremium, ANNUAL_DISCOUNT_RATE), 
                priceIdMonthly: DUMMY_PRICE_IDS.premium_monthly, 
                priceIdAnnual: DUMMY_PRICE_IDS.premium_annual,  
                isPrimary: true, // 강조
                features: [
                    t('sermonGenTimes_prem', lang),
                    t('unlimitedAnnotation', lang), 
                    t('advancedTextEditor', lang),
                    t('archiveAccessFull', lang),
                    t('archiveShareLimited_prem', lang),
                    t('unlimitedSupport', lang),
                ],
                buttonText: t('subscribeNow', lang),
                buttonAction: () => {
                    const priceId = isAnnual ? DUMMY_PRICE_IDS.premium_annual : DUMMY_PRICE_IDS.premium_monthly;
                    initiatePayment(priceId, 'premium');
                }
            },
        ];
    }, [lang, initiatePayment]); 

    const currentPlans = plans(isAnnual);
    const maxDiscountRate = Math.round(ANNUAL_DISCOUNT_RATE * 100);


    if (isProcessing) {
        return (
            <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 w-full">
                <div className="bg-blue-600 p-6 rounded-lg shadow-2xl">
                    <LoadingSpinner message={t('processingPayment', lang)} />
                </div>
            </div>
        );
    }
    
    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        if (onReturnToSelection) onReturnToSelection();
    }


    return (
        // w-full 클래스를 삭제하여 최대 너비(max-w-7xl)를 넘어서지 않도록 중앙에 배치
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 w-full">
            
            {/* 정책 모달 */}
            <PolicyModal
                isOpen={isPolicyModalOpen}
                onClose={() => setIsPolicyModalOpen(false)}
                title={policyContent.title}
                contentKey={policyContent.contentKey}
                t={t}
                lang={lang}
            />
            
            {/* 성공 모달 (더미 결제용) */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
                        <SuccessIcon />
                        <h3 className="text-xl font-bold mb-2">구독 완료! (더미)</h3>
                        <p className="text-gray-600 mb-6">결제 모듈이 연동되면 실제 결제가 진행됩니다.</p>
                        <button
                            onClick={handleCloseSuccess}
                            className="w-full px-4 py-2 font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition duration-300"
                        >
                            앱으로 돌아가기
                        </button>
                    </div>
                </div>
            )}
            
            {/* 컨텐츠의 최대 너비를 설정하여 중앙에 깔끔하게 정렬 */}
            <div className="max-w-7xl w-full">
                <header className="text-center mb-16 max-w-4xl mx-auto">
                    <h2 className="text-5xl font-extrabold text-gray-900 tracking-tight">{t('chooseYourPlan', lang)}</h2>
                    <p className="text-xl text-gray-600 mt-4">
                        {t('planSubtitle', lang)}
                    </p>
                </header>
                
                {paymentError && (
                    <div className="w-full max-w-4xl mx-auto p-4 mb-10 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center font-medium shadow-sm">
                        🚨 {t('paymentError', lang).replace('{0}', paymentError)}
                    </div>
                )}
                
                {/* 가격 토글 버튼 */}
                <div className="flex justify-center mb-14">
                    <div className="relative p-1 bg-gray-200 rounded-full flex items-center shadow-lg">
                        <button
                            onClick={() => setIsAnnual(false)}
                            className={`px-6 py-2 text-base font-bold rounded-full transition-all duration-300 ${!isAnnual ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-300'}`}
                        >
                            {t('monthly', lang)}
                        </button>
                        <button
                            onClick={() => setIsAnnual(true)}
                            className={`px-6 py-2 text-base font-bold rounded-full transition-all duration-300 ${isAnnual ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-300'}`}
                        >
                            {t('annually', lang)}
                        </button>
                        {/* 할인 뱃지 */}
                        <span className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 -mr-8 bg-red-500 text-white text-xs font-bold py-1 px-3 rounded-full rotate-2 shadow-xl whitespace-nowrap">
                            {t('saveUpTo', lang).replace('{0}', maxDiscountRate)}
                        </span>
                    </div>
                </div>

                {/* 가격 플랜 카드 목록 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full items-stretch">
                    {currentPlans.map((plan, index) => {
                        
                        const isFree = plan.id === 'free';
                        
                        let priceText;
                        let periodDisplay = '';
                        let detailBillingText = '\u00a0'; 
                        
                        if (!isFree) {
                            if (isAnnual) {
                                // 월별 가격 대비 할인된 금액 계산 (참고용)
                                const monthlyEquivalent = Math.floor(plan.priceAnnual / 12);
                                
                                priceText = `$${plan.priceAnnual}`; 
                                periodDisplay = `/${t('year', lang)}`;
                                detailBillingText = `(${t('saveVsMonthly', lang).replace('{0}', Math.round(ANNUAL_DISCOUNT_RATE * 100))}. ${monthlyEquivalent}$/${t('month', lang)})`;
                            } else {
                                priceText = `$${plan.priceMonthly}`;
                                periodDisplay = `/${t('month', lang)}`;
                                detailBillingText = t('billedAnnualy', lang).replace('{0}', plan.priceMonthly * 12);
                            }
                        } else {
                            priceText = t('planFreeMember', lang); 
                            periodDisplay = '\u00a0'; // 공간 확보
                        }
                        
                        const isHighlighted = plan.isPrimary;
                        
                        const cardClasses = `
                            bg-white rounded-2xl shadow-xl p-8 flex flex-col transition-all duration-300
                            ${isHighlighted ? 'ring-4 ring-blue-500 transform scale-105 relative z-10' : 'hover:shadow-2xl'}
                            ${isFree ? 'opacity-70 grayscale-[20%] cursor-not-allowed' : ''}
                        `;
                        
                        const buttonClasses = `
                            mt-auto w-full px-6 py-3 font-bold rounded-xl transition duration-300 shadow-md
                            ${isHighlighted
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            }
                        `;

                        return (
                            <div key={plan.id} className={cardClasses}>
                                {isHighlighted && (
                                    <span className="absolute top-0 right-0 -mt-3 -mr-3 bg-red-500 text-white text-sm font-bold py-1 px-3 rounded-full shadow-lg">
                                        {t('mostPopular', lang)}
                                    </span>
                                )}
                                <h3 className="text-3xl font-extrabold text-gray-900 mb-2">{plan.title}</h3>
                                <p className="text-gray-600 mb-6 flex-grow">{plan.description}</p>
                                
                                <div className="mb-8">
                                    <div className="text-5xl font-extrabold text-gray-900">
                                        {priceText}
                                        <span className="text-xl font-medium text-gray-500 ml-1">{periodDisplay}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1 h-5">{!isFree && detailBillingText}</p>
                                </div>

                                <ul className="space-y-4 mb-10">
                                    {plan.features.map((feature, fIndex) => (
                                        <li key={fIndex} className="flex items-start text-gray-700">
                                            <CheckIcon />
                                            <span className="ml-3 text-base">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={plan.buttonAction}
                                    className={buttonClasses}
                                    disabled={isFree && !onReturnToSelection} // 무료 플랜은 클릭 방지
                                >
                                    {plan.buttonText}
                                </button>
                            </div>
                        );
                    })}
                </div>
                
                {/* 하단 정책 링크 */}
                <footer className="mt-16 text-center text-sm text-gray-500 max-w-4xl mx-auto">
                    <p className="mb-2">{t('paymentNote', lang)}</p>
                    <div className="space-x-4">
                        <button onClick={() => handlePolicyClick('refund')} className="underline hover:text-gray-700 transition">
                            {t('viewRefundPolicy', lang)}
                        </button>
                        <span>|</span>
                        <button onClick={() => handlePolicyClick('privacy')} className="underline hover:text-gray-700 transition">
                            {t('viewPrivacyPolicy', lang)}
                        </button>
                        <span>|</span>
                        <button className="underline hover:text-gray-700 transition">
                            {t('viewTermsOfService', lang)}
                        </button>
                    </div>
                </footer>
                
            </div>
        </div>
    );
};

export default PremiumSubscriptionPage;