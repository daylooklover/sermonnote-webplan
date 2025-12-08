// @/components/DraggableQuickMemoIcon.js

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuickMemoIcon } from '@/components/IconComponents.js';

// ⚠️ 참고: window 객체에 직접 접근하므로 "use client"가 필수입니다.
const DraggableQuickMemoIcon = ({ onClick, initialX = 50, initialY = 50, ...props }) => {
    
    // ⭐️ [FIXED] 버튼의 초기 위치를 props로 전달받은 값으로 설정
    // 이 값은 서버에서도 동일하게 계산되므로 Hydration Error를 방지합니다.
    const [position, setPosition] = useState({ x: initialX, y: initialY }); 
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const elementRef = useRef(null);
    const clickTimer = useRef(null);
    const hasMoved = useRef(false);


    // ---------------------------------------------
    // ⭐️ [FIXED] Hydration Error 해결: 클라이언트 마운트 시에만 초기 위치 재설정
    // ---------------------------------------------
    useEffect(() => {
        // 서버 측에서는 실행되지 않고, 클라이언트 측에서 마운트된 후에만 실행됩니다.
        if (typeof window !== 'undefined') {
            const element = elementRef.current;
            if (!element) return;
            
            // 초기 위치를 화면 우측 하단 근처로 설정
            const defaultX = window.innerWidth - element.offsetWidth - 20; 
            const defaultY = window.innerHeight - element.offsetHeight - 150; // 코파일럿 버튼과 겹치지 않도록 조정

            setPosition({
                x: initialX !== 50 ? initialX : defaultX, // props가 50이면 계산된 기본값 사용
                y: initialY !== 50 ? initialY : defaultY
            });
        }
    }, []); 
    
    // ---------------------------------------------
    // 1. 마우스 누름 이벤트 (드래그 시작)
    // ---------------------------------------------
    const handleMouseDown = useCallback((e) => {
        if (e.button !== 0) return; 

        e.preventDefault();
        setIsDragging(true);
        hasMoved.current = false;
        
        // 클릭 후 200ms 동안 움직임이 없으면 순수 클릭으로 간주
        clickTimer.current = setTimeout(() => {
            if (!hasMoved.current) {
                // 클릭 로직은 마우스 업 시점에 처리
            }
        }, 200);


        const element = elementRef.current;
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        dragOffset.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }, []);

    // ---------------------------------------------
    // 2. 마우스 이동 이벤트 (드래그 중)
    // ---------------------------------------------
    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        
        // 움직임 임계값 설정
        if (Math.abs(e.movementX) > 5 || Math.abs(e.movementY) > 5) {
            hasMoved.current = true;
            if (clickTimer.current) {
                clearTimeout(clickTimer.current);
            }
        }

        const newX = e.clientX - dragOffset.current.x;
        const newY = e.clientY - dragOffset.current.y;

        // 경계 제한 (화면을 벗어나지 않도록)
        const element = elementRef.current;
        const maxX = window.innerWidth - (element ? element.offsetWidth : 50);
        const maxY = window.innerHeight - (element ? element.offsetHeight : 50);

        setPosition({
            x: Math.min(maxX, Math.max(0, newX)),
            y: Math.min(maxY, Math.max(0, newY))
        });
    }, [isDragging]);

    // ---------------------------------------------
    // 3. 마우스 놓음 이벤트 (드래그 종료 또는 클릭)
    // ---------------------------------------------
    const handleMouseUp = useCallback((e) => {
        if (isDragging) {
            setIsDragging(false);
            
            if (clickTimer.current) {
                clearTimeout(clickTimer.current);
                clickTimer.current = null;
            }

            // 드래그가 아니었다면 (거의 움직이지 않았다면) 클릭 이벤트 실행
            if (!hasMoved.current && onClick) {
                onClick(e);
            }
        }
        
    }, [isDragging, onClick]);

    // ---------------------------------------------
    // 전역 이벤트 리스너 설정 (클릭/드래그 상태 유지)
    // ---------------------------------------------
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        } else {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);


    // ---------------------------------------------
    // 렌더링
    // ---------------------------------------------
    return (
        <button
            ref={elementRef}
            onMouseDown={handleMouseDown}
            // 드래그 중일 때 커서 모양 변경
            style={{ 
                transform: `translate(${position.x}px, ${position.y}px)`,
                cursor: isDragging ? 'grabbing' : 'grab',
                // position: fixed 대신 absolute를 사용했으므로, 
                // top/left를 0으로 설정하고 transform으로만 위치를 제어합니다.
                position: 'fixed', // 뷰포트 기준으로 움직이게 하려면 fixed가 적절합니다.
                top: 0, 
                left: 0 
            }}
            // absolute 대신 fixed를 사용해야 뷰포트 기준 이동이 가능합니다.
            className={`p-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full shadow-2xl transition z-60 ${props.className}`} 
            
            // props로 전달된 title 등 다른 속성 적용
            {...props}
        >
            <QuickMemoIcon className="w-5 h-5" />
        </button>
    );
};

export default DraggableQuickMemoIcon;