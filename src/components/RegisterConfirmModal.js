'use client';
import React, { useState } from 'react';
import { X, CheckCircle, User, Book, Type } from 'lucide-react';

const RegisterConfirmModal = ({ isOpen, onClose, onConfirm, initialTitle, lang, userNickname }) => {
    const [title, setTitle] = useState(initialTitle || "");
    const [scripture, setScripture] = useState("");
    const [authorType, setAuthorType] = useState("nickname");

    if (!isOpen) return null;

    const UI = {
        ko: { 
            header: "아카이브 등록 설정", tLabel: "설교 제목", sLabel: "성경 구절", 
            aLabel: "작성자 표시", nick: "닉네임", anon: "무명", submit: "등록하기" 
        },
        en: { 
            header: "Archive Settings", tLabel: "Sermon Title", sLabel: "Scripture", 
            aLabel: "Author", nick: "Nickname", anon: "Anonymous", submit: "Register" 
        }
    };
    const t = UI[lang] || UI.ko;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center border-b pb-4 dark:border-gray-700 text-gray-900 dark:text-white">
                    <h3 className="text-xl font-bold text-indigo-600 flex items-center">
                        <CheckCircle className="mr-2" />{t.header}
                    </h3>
                    <button onClick={onClose} className="hover:opacity-70"><X /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Type size={14}/>{t.tLabel}</label>
                        <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><Book size={14}/>{t.sLabel}</label>
                        <input value={scripture} onChange={(e)=>setScripture(e.target.value)} placeholder="John 3:16" className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><User size={14}/>{t.aLabel}</label>
                        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <button onClick={()=>setAuthorType("nickname")} className={`flex-1 py-2 rounded-lg text-sm font-bold ${authorType === "nickname" ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow' : 'text-gray-400'}`}>{t.nick}</button>
                            <button onClick={()=>setAuthorType("anonymous")} className={`flex-1 py-2 rounded-lg text-sm font-bold ${authorType === "anonymous" ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow' : 'text-gray-400'}`}>{t.anon}</button>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={() => onConfirm({ title, scripture, author: authorType === "anonymous" ? "Anonymous" : userNickname })}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg"
                >
                    {t.submit}
                </button>
            </div>
        </div>
    );
};
export default RegisterConfirmModal;