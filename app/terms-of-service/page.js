'use client'; // 🚨 [필수 수정] 클라이언트 컴포넌트 지시문 추가!

import React, { Suspense } from 'react'; 
// URL 쿼리 파라미터를 읽기 위해 next/navigation에서 useSearchParams 임포트
import { useSearchParams } from 'next/navigation';

// ----------------------------------------------------
// 💡 다국어 (i18n) 번역 테이블 및 함수 (변경 없음)
// ----------------------------------------------------
const termsTranslations = { 
    // ... (약관 내용 전체) ...
    ko: { /* ... */ },
    en: { /* ... */ },
    zh: { /* ... */ },
    ru: { /* ... */ },
    vi: { /* ... */ },
};

const t = (key, lang = 'ko', fallback = key) => {
    let translated = termsTranslations[lang] ? termsTranslations[lang][key] : (termsTranslations['ko'] ? termsTranslations['ko'][key] : key);
    if (!translated) return fallback;
    return translated;
};

// ----------------------------------------------------
// 💡 TermsOfServiceContent 컴포넌트 (useSearchParams를 사용하는 실제 콘텐츠 컴포넌트)
// ----------------------------------------------------
const TermsOfServiceContent = () => {
    // useSearchParams는 이제 'use client'가 선언된 파일에서 실행됩니다.
    const searchParams = useSearchParams();
    
    const urlLang = searchParams.get('lang');
    const lang = (urlLang && termsTranslations[urlLang]) ? urlLang : 'ko';

    const terms = termsTranslations[lang] || termsTranslations['ko'];

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-end mb-6">
                <label htmlFor="lang-selector" className="sr-only">Select Language:</label>
                <select
                    id="lang-selector"
                    onChange={(e) => {
                        window.location.search = `?lang=${e.target.value}`;
                    }}
                    value={lang}
                    className="p-2 border border-gray-300 rounded-md shadow-sm text-sm"
                >
                    <option value="ko">한국어 (Korean)</option>
                    <option value="en">English (English)</option>
                    <option value="zh">中文 (Chinese)</option>
                    <option value="ru">Русский (Russian)</option>
                    <option value="vi">Tiếng Việt (Vietnamese)</option>
                </select>
            </div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center border-b-4 border-blue-600 pb-2">{terms.title}</h1>
            
            <div className="bg-white p-8 rounded-xl shadow-2xl border border-gray-200">
                <p className="text-sm leading-relaxed mb-6 text-gray-600">{terms.intro}</p>

                {/* 제1장. 총칙 */}
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4 border-l-4 border-blue-600 pl-3">{terms.ch1}</h2>
                {/* ... (이하 약관 내용은 생략하고, 고객님 코드와 동일하게 유지합니다.) ... */}
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">{terms.art1_title}</h3>
                <p className="text-base mb-2 text-gray-700">{terms.art1_p}</p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">{terms.art2_title}</h3>
                <p className="text-base mb-2 text-gray-700">{terms.art2_p}</p>
                <ul className="text-base list-disc list-inside space-y-2 pl-4 text-gray-700">
                    <li><span dangerouslySetInnerHTML={{ __html: terms.art2_li1 }} /></li>
                    <li><span dangerouslySetInnerHTML={{ __html: terms.art2_li2 }} /></li>
                    <li><span dangerouslySetInnerHTML={{ __html: terms.art2_li3 }} /></li>
                    <li><span dangerouslySetInnerHTML={{ __html: terms.art2_li4 }} /></li>
                    <li><span dangerouslySetInnerHTML={{ __html: terms.art2_li5 }} /></li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">{terms.art3_title}</h3>
                <p className="text-base mb-2 text-gray-700">{terms.art3_p1}</p>

                {/* 제2장. 서비스 이용 및 콘텐츠 책임 */}
                <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 border-l-4 border-blue-600 pl-3">{terms.ch2}</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">{terms.art4_title}</h3>
                <p className="text-base mb-2 text-gray-700">{terms.art4_p}</p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">{terms.art5_title}</h3>
                <p className="text-base mb-2 text-gray-700">{terms.art5_p}</p>
                <ul className="text-base list-disc list-inside space-y-2 pl-4 text-gray-700">
                    <li>{terms.art5_li1}</li>
                    <li><span dangerouslySetInnerHTML={{ __html: terms.art5_li2 }} /></li>
                    <li><span dangerouslySetInnerHTML={{ __html: terms.art5_li3 }} /></li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">{terms.art6_title}</h3>
                <p className="text-base mb-2 text-gray-700"><span dangerouslySetInnerHTML={{ __html: terms.art6_p1 }} /></p>
                <p className="text-base mb-2 text-gray-700"><span dangerouslySetInnerHTML={{ __html: terms.art6_p2 }} /></p>
                
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">{terms.art7_title}</h3>
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4 rounded">
                    <p className="font-bold text-yellow-800">{terms.art7_warning}</p>
                </div>
                <p className="text-base mb-2 text-gray-700"><span dangerouslySetInnerHTML={{ __html: terms.art7_p1 }} /></p>
                <p className="text-base mb-2 text-gray-700"><span dangerouslySetInnerHTML={{ __html: terms.art7_p2 }} /></p>
                <p className="text-base mb-2 text-gray-700"><span dangerouslySetInnerHTML={{ __html: terms.art7_p3 }} /></p>

                {/* 제3장. 유료 서비스 (멤버십) */}
                <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 border-l-4 border-blue-600 pl-3">{terms.ch3}</h2>
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">{terms.art8_title}</h3>
                <p className="text-base mb-2 text-gray-700">{terms.art8_p1}</p>
                <p className="text-base mb-2 text-gray-700">{terms.art8_p2}</p>

                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">{terms.art9_title}</h3>
                <p className="text-base mb-2 text-gray-700"><span dangerouslySetInnerHTML={{ __html: terms.art9_p }} /></p>

                {/* 제4장. 면책 및 기타 */}
                <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4 border-l-4 border-blue-600 pl-3">{terms.ch4}</h2>
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">{terms.art10_title}</h3>
                <p className="text-base mb-2 text-gray-700">{terms.art10_p1}</p>
                <p className="text-base mb-2 text-gray-700">{terms.art10_p2}</p>
                <p className="text-base mb-2 text-gray-700">{terms.art10_p3}</p>
                        
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">{terms.art11_title}</h3>
                <p className="text-base mb-2 text-gray-700"><span dangerouslySetInnerHTML={{ __html: terms.art11_p }} /></p>

            </div>
            <p className="text-center text-sm text-gray-500 mt-8">{terms.lastUpdated}</p>
        </div>
    );
};


// ----------------------------------------------------
// 💡 Page 컴포넌트 (Suspense 경계 추가)
// ----------------------------------------------------
export default function TermsOfServicePage() {
    return (
        <div className="bg-gray-50 text-gray-800 min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans">
            {/* useSearchParams를 사용하는 컴포넌트를 Suspense로 감쌉니다. */}
            <Suspense fallback={<div className="text-center text-lg text-gray-600 mt-20">이용약관을 로드하는 중입니다...</div>}>
                <TermsOfServiceContent />
            </Suspense>
        </div>
    );
}