// src/components/SermonTypeGrid.jsx (수정된 내용)
import React from 'react';
import { BookOpenIcon, LightbulbIcon, MessageSquareIcon, SparklesIcon } from 'lucide-react';
import { t } from '@/lib/translations'; // 번역 함수 임포트

const SermonTypeGrid = ({ setSelectedSermonType, openLoginModal, user, lang }) => { // lang prop을 받도록 수정
    const sermonTypes = [
        {
            key: 'sermon-assistant',
            title: t('sermonAssistant', lang), // lang prop 사용
            description: t('sermonAssistantDescription', lang), // lang prop 사용
            icon: <SparklesIcon className="w-8 h-8 text-blue-600 mb-2" />,
            onClick: () => {
                if (user) {
                    setSelectedSermonType('sermon-assistant');
                } else {
                    openLoginModal();
                }
            }
        },
        {
            key: 'expository-sermon',
            title: t('expositorySermon', lang), // lang prop 사용
            description: t('expositorySermonDescription', lang), // lang prop 사용
            icon: <BookOpenIcon className="w-8 h-8 text-green-600 mb-2" />,
            onClick: () => {
                if (user) {
                    setSelectedSermonType('expository-sermon');
                } else {
                    openLoginModal();
                }
            }
        },
        {
            key: 'real-life-sermon',
            title: t('realLifeSermon', lang), // lang prop 사용
            description: t('realLifeSermonDescription', lang), // lang prop 사용
            icon: <LightbulbIcon className="w-8 h-8 text-purple-600 mb-2" />,
            onClick: () => {
                if (user) {
                    setSelectedSermonType('real-life-sermon');
                } else {
                    openLoginModal();
                }
            }
        },
        {
            key: 'quick-memo-sermon',
            title: t('quickMemoSermon', lang), // lang prop 사용
            description: t('quickMemoSermonDescription', lang), // lang prop 사용
            icon: <MessageSquareIcon className="w-8 h-8 text-orange-600 mb-2" />,
            onClick: () => {
                if (user) {
                    setSelectedSermonType('quick-memo-sermon');
                } else {
                    openLoginModal();
                }
            }
        }
    ];

    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-8">
            {sermonTypes.map((type) => (
                <button
                    key={type.key}
                    onClick={type.onClick}
                    className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 transform border border-gray-200"
                >
                    {type.icon}
                    <h3 className="text-xl font-bold mt-2 mb-1 text-gray-800">{type.title}</h3>
                    <p className="text-gray-600 text-sm">{type.description}</p>
                </button>
            ))}
        </div>
    );
};

export default SermonTypeGrid;