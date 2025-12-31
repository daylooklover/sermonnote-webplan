"use client";

import React, { useState } from 'react';
import { useAuth } from './AuthProvider'; 
import { db } from '../lib/firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
// 클라이언트에서 Gemini를 직접 사용하기 위한 라이브러리
import { GoogleGenerativeAI } from "@google/generative-ai";
import RegisterConfirmModal from '@/components/RegisterConfirmModal'; 

const LoadingSpinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SermonGenerator = ({ lang = 'ko', openLoginModal, onSetError, onGoBack, topicInput, t }) => { 
    const { user } = useAuth();
    const [loading, setLoading] = useState(false); 
    const [sermonDraft, setSermonDraft] = useState(''); 
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    // --- [Gemini 직접 호출 함수] ---
    const generateSermonWithGemini = async (prompt, type = 'sermon') => {
        setLoading(true);
        try {
            // .env.local 또는 배포 환경변수에 NEXT_PUBLIC_GEMINI_API_KEY가 있어야 합니다.
            const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            
            // 말씀노트 전용 모델: gemini-1.5-flash
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const langMap = {
                ko: { name: "Korean", bible: "개역개정" },
                en: { name: "English", bible: "NIV/KJV" },
                zh: { name: "Chinese", bible: "和合本 (CUV)" },
                ru: { name: "Russian", bible: "Сино다льный перевод" },
                vi: { name: "Vietnamese", bible: "Bản Truyền Thống" }
            };
            const target = langMap[lang] || langMap.ko;

            let systemInstruction = `당신은 세계적인 성경 전문가이자 설교가입니다. 모든 답변은 반드시 '${target.name}'으로 작성하십시오. `;
            
            if (type === 'sermon') {
                systemInstruction += `성도들에게 감동을 주는 설교 원고를 ${target.name}으로 정성껏 작성하십시오.`;
            }

            const result = await model.generateContent(`${systemInstruction}\n\nUser Request: ${prompt}`);
            const response = await result.response;
            const text = response.text();
            
            setSermonDraft(text);
        } catch (err) {
            console.error("Gemini Generation Error:", err);
            onSetError?.(err.message);
        } finally {
            setLoading(false);
        }
    };

    // --- [아카이브 최종 저장 함수] ---
    const handleFinalRegister = async (settings) => {
        if (!user) {
            openLoginModal();
            return;
        }

        if (!sermonDraft || sermonDraft.trim() === "") {
            alert(t('no_sermon_draft_error', lang) || "No sermon draft to register.");
            return;
        }

        setLoading(true);
        try {
            const appId = "default-app-id"; 
            const archiveRef = collection(db, `artifacts/${appId}/public/sermon_archive`);

            const dataToSave = {
                title: settings.title || (t('no_title', lang) || "Untitled"),
                scripture: settings.scripture || "",
                author: settings.author || user.displayName || (t('anonymous_author', lang) || "Anonymous"), 
                sermon_draft: sermonDraft, 
                user_id: user.uid,
                sharedAt: serverTimestamp(), 
                upvotes: 0, 
                likedBy: [], 
                rebirthCount: 0, 
                lang: lang 
            };

            await addDoc(archiveRef, dataToSave);
            alert(t('register_success_alert', lang) || "Successfully registered!");
            setIsRegisterModalOpen(false); 
        } catch (err) {
            console.error("Firebase Archive Error:", err);
            alert(`${t('save_failed_alert', lang) || "Save failed"}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 space-y-6">
            {/* 초안이 없을 때 생성 버튼 (예시) */}
            {!sermonDraft && (
                <div className="flex justify-center">
                    <button 
                        onClick={() => generateSermonWithGemini(topicInput)}
                        disabled={loading}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold"
                    >
                        {loading ? <LoadingSpinner /> : (t('generate_sermon_btn', lang) || "Generate Sermon")}
                    </button>
                </div>
            )}

            {sermonDraft && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">
                        {t('generated_sermon_draft_title', lang) || "Generated Sermon Draft"}
                    </h3>
                    
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-6">
                        {sermonDraft}
                    </div>

                    <div className="flex justify-center pt-4 no-print border-t border-gray-50">
                        <button 
                            onClick={() => setIsRegisterModalOpen(true)}
                            disabled={loading}
                            className="flex items-center space-x-2 px-10 py-4 bg-indigo-600 text-white rounded-full font-bold text-lg shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:bg-indigo-400"
                        >
                            {loading ? <LoadingSpinner /> : null}
                            <span>
                                {loading 
                                    ? (t('registering_status', lang) || "Registering...") 
                                    : (t('register_archive_btn', lang) || "Register to Archive")}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            <RegisterConfirmModal 
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                onConfirm={handleFinalRegister}
                initialTitle={topicInput} 
                lang={lang}
                userNickname={user?.displayName || (t('pastor_default_name', lang) || "Pastor")}
                t={t}
            />
        </div>
    );
};

export default SermonGenerator;