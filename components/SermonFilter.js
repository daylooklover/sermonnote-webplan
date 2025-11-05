// components/SermonFilter.js (수정)
"use client";

import React, { useState } from 'react';

// 🚨 onSearchSubmit prop을 받도록 수정했습니다.
export default function SermonFilter({ onSearchSubmit, onSearchClear }) { 
    const [search, setSearch] = useState('');

    const handleSearch = () => {
        const term = search.trim();
        if (term) {
            onSearchSubmit(term); // 🚨 검색어를 부모에게 전달
        } else {
            // 검색어를 모두 지웠을 때 목록 초기화
            onSearchClear();
        }
    };
    
    const handleInputChange = (e) => {
        const term = e.target.value;
        setSearch(term);
        
        // 💡 Enter 키 입력 시 검색 실행 (선택 사항)
        if (term === '' && onSearchClear) {
            onSearchClear();
        }
    }

    return (
        <div className="mb-8 flex justify-center items-center space-x-2">
            <input
                type="text"
                placeholder="설교 제목 검색"
                value={search}
                onChange={handleInputChange} // 🚨 수정된 핸들러 사용
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                }}
                className="w-full max-w-md p-4 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                onClick={handleSearch} // 🚨 수정된 핸들러 사용
                className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition duration-300"
            >
                검색
            </button>
        </div>
    );
}