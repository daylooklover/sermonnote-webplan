// src/components/ClientOnlyWrapper.js
"use client";
import { useState, useEffect } from 'react';

// 클라이언트 측에서만 렌더링되도록 강제하는 래퍼
const ClientOnlyWrapper = ({ children }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // 컴포넌트가 클라이언트에 마운트된 후에만 true로 설정
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    // 마운트되기 전에는 null 또는 간단한 로딩 스피너를 반환하여
    // 서버 측 렌더링 충돌을 방지함
    return null; 
  }

  return children;
};

export default ClientOnlyWrapper;