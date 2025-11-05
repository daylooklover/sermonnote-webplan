// src/components/DraggableQuickMemoIcon.js

"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MicIcon } from './IconComponents';

const DraggableQuickMemoIcon = ({ onClick }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const dragStartRef = useRef({ x: 0, y: 0 });
    const iconRef = useRef(null);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        dragStartRef.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;
        setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // 마우스 이벤트 리스너 등록 및 해제
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        // 컴포넌트 언마운트 시 리스너 제거
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <button
            ref={iconRef}
            onClick={onClick}
            onMouseDown={handleMouseDown}
            style={{
                position: 'fixed',
                bottom: `2rem`,
                right: `2rem`,
                transform: `translate(${position.x}px, ${position.y}px)`,
                cursor: isDragging ? 'grabbing' : 'grab',
                transition: isDragging ? 'none' : 'transform 0.3s ease-in-out',
                zIndex: 50,
            }}
            className="p-4 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors"
        >
            <MicIcon className="w-6 h-6" />
        </button>
    );
};

export default DraggableQuickMemoIcon;