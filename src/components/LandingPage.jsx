// src/components/LandingPage.jsx
'use client';

import React from 'react';
import { UserIcon } from '@/components/IconComponents'; // UserIcon을 import 해야 합니다.
import { t } from '@/lib/translations'; // 번역 함수도 import 해야 합니다.

const LandingPage = ({ onGetStarted, user, onLogout, openLoginModal, lang, setLang }) => {
    return (
        <>
            <div className="landing-hero-section">
                <div className="absolute top-0 right-0 p-6 flex items-center space-x-4">
                    <button
                        onClick={openLoginModal}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transition duration-300"
                    >
                        <UserIcon className="w-5 h-5" />
                        <span>Sign Up / Login</span>
                    </button>
                    <select
                        onChange={(e) => setLang(e.target.value)}
                        value={lang}
                        className="bg-gray-100 text-gray-800 rounded-lg p-2 border border-gray-300"
                    >
                        <option value="ko">한국어</option>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                        <option value="ru">Русский</option>
                        <option value="vi">Tiếng Việt</option>
                        <option value="fil">Filipino</option>
                    </select>
                </div>
                <h1 className="main-logo text-gray-50">SermonNote</h1>
                <p className="main-slogan text-gray-200">Deepen Your Faith, Organize Your Insights.</p>
                <button
                    onClick={onGetStarted || openLoginModal} // onGetStarted가 없으면 로그인 모달
                    className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition duration-300 text-2xl mt-4"
                >
                    {t('getStarted', lang)}
                </button>
            </div>

            <section className="py-16 bg-white text-center">
                <h2 className="text-3xl font-bold mb-8">{t('featuresTitle', lang)}</h2>
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
                    <div className="p-6 rounded-lg shadow-md bg-gray-50">
                        <h3 className="text-xl font-semibold mb-2">{t('feature1Title', lang)}</h3>
                        <p className="text-gray-700">{t('feature1Description', lang)}</p>
                    </div>
                    <div className="p-6 rounded-lg shadow-md bg-gray-50">
                        <h3 className="text-xl font-semibold mb-2">{t('feature2Title', lang)}</h3>
                        <p className="text-gray-700">{t('feature2Description', lang)}</p>
                    </div>
                    <div className="p-6 rounded-lg shadow-md bg-gray-50">
                        <h3 className="text-xl font-semibold mb-2">{t('feature3Title', lang)}</h3>
                        <p className="text-gray-700">{t('feature3Description', lang)}</p>
                    </div>
                </div>
            </section>

            <section className="py-16 bg-gray-50 text-center">
                <h2 className="text-3xl font-bold mb-8">{t('whySermonNoteTitle', lang)}</h2>
                <p className="text-lg text-gray-700 max-w-3xl mx-auto px-4">
                    {t('whySermonNoteDescription', lang)}
                </p>
            </section>

            <footer className="py-8 bg-gray-800 text-white text-center">
                <p className="mb-4">{t('privacyPolicy', lang)} | {t('termsOfService', lang)}</p>
                <p>&copy; {new Date().getFullYear()} SermonNote. All rights reserved.</p>
            </footer>
        </>
    );
};

export default LandingPage;