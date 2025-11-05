'use client';

import React, { useState } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail,
} from 'firebase/auth'; 

// 🚨 FirebaseError는 직접 import하지 않고, 오류 객체에서 처리합니다.

const CloseIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="h-6 w-6"
    >
        <path d="M18 6L6 18" />
        <path d="M6 6L18 18" />
    </svg>
); 

// Firebase 오류 코드를 사용자 친화적인 메시지로 변환
const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return '유효하지 않은 이메일 주소 형식입니다.';
        case 'auth/user-disabled':
            return '사용이 정지된 계정입니다.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': // 새로운 Firebase 버전에서 주로 사용됨
            return '이메일 또는 비밀번호가 올바르지 않습니다.';
        case 'auth/email-already-in-use':
            return '이미 사용 중인 이메일입니다.';
        case 'auth/weak-password':
            return '비밀번호는 최소 6자 이상이어야 합니다.';
        case 'auth/missing-email':
            return '이메일을 입력해 주세요.';
        default:
            return `인증 오류가 발생했습니다: ${errorCode.replace('auth/', '')}`;
    }
};

const LoginModal = ({ onClose, auth, onLoginSuccess }) => {
    // auth prop이 필수입니다. Firebase 인스턴스 체크
    if (!auth) {
        console.error("Firebase Auth instance is missing in LoginModal props.");
        return null; 
    }

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); 
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);
    
    // 'login', 'register', 'reset' 세 가지 상태 관리
    const [authMode, setAuthMode] = useState('login'); 

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            if (authMode === 'register') {
                // 1. 회원가입 (Firebase createUserWithEmailAndPassword)
                if (password !== confirmPassword) {
                    setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
                    setIsLoading(false);
                    return;
                }
                
                // Firebase 회원가입 실행
                await createUserWithEmailAndPassword(auth, email, password);
                
                setMessage('✅ 회원가입 성공! 이제 자동으로 로그인됩니다.');
                // 성공 시 부모 컴포넌트에 알리고 모달 닫기
                onLoginSuccess();
                setTimeout(onClose, 800); 

            } else if (authMode === 'login') {
                // 2. 로그인 (Firebase signInWithEmailAndPassword)
                await signInWithEmailAndPassword(auth, email, password);
                
                setMessage('✅ 로그인 성공!');
                // 성공 시 부모 컴포넌트에 알리고 모달 닫기
                onLoginSuccess();
                setTimeout(onClose, 800); 

            } else if (authMode === 'reset') {
                // 3. 비밀번호 재설정 메일 발송 (Firebase sendPasswordResetEmail)
                await sendPasswordResetEmail(auth, email);

                setMessage('✅ 비밀번호 재설정 링크가 이메일로 전송되었습니다. 확인 후 비밀번호를 재설정해 주세요.');
                setAuthMode('login'); // 재설정 후 로그인 탭으로 전환
            }

        } catch (e) {
            // e.name이 'FirebaseError'인지 확인하고 e.code를 사용하도록 수정
            if (e.name === 'FirebaseError' && e.code) {
                setError(getFirebaseErrorMessage(e.code));
            } else {
                console.error('Unexpected Auth Error:', e);
                setError('예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    
    const tabLabels = [
        { key: 'login', label: '로그인' },
        { key: 'register', label: '회원가입' },
    ];
    
    const getHeaderTitle = () => {
        if (authMode === 'reset') return '비밀번호 재설정';
        return authMode === 'register' ? '회원가입' : '로그인';
    };
    
    const getButtonText = () => {
        if (isLoading) return authMode === 'register' ? '가입 중...' : '처리 중...';
        if (authMode === 'reset') return '재설정 메일 보내기';
        return authMode === 'register' ? '회원가입' : '로그인';
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div 
                className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{getHeaderTitle()}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-900 transition"><CloseIcon /></button>
                </div>
                
                {/* 탭 네비게이션 (재설정 모드가 아닐 때만 표시) */}
                {authMode !== 'reset' && (
                    <div className="flex mb-6 border-b border-gray-200">
                        {tabLabels.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => {setAuthMode(tab.key); setError(''); setMessage('');}}
                                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                                    authMode === tab.key
                                        ? 'border-b-2 border-red-600 text-red-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}
                
                {/* 알림 메시지 */}
                {(error || message) && (
                    <div className={`p-3 mb-4 rounded-lg text-sm ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {error || message}
                    </div>
                )}

                <form onSubmit={handleAuthAction} className="space-y-4">
                    
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="이메일"
                        className="w-full p-3 rounded-md bg-gray-100 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                        disabled={isLoading}
                    />
                    
                    {/* 비밀번호 입력 (재설정 모드가 아닐 때만 표시) */}
                    {(authMode === 'login' || authMode === 'register') && (
                        <>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="비밀번호 (6자 이상)"
                                className="w-full p-3 rounded-md bg-gray-100 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                                required
                                disabled={isLoading}
                            />
                            {/* 회원가입 시 비밀번호 확인 */}
                            {authMode === 'register' && (
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="비밀번호 확인"
                                    className="w-full p-3 rounded-md bg-gray-100 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    required
                                    disabled={isLoading}
                                />
                            )}
                        </>
                    )}

                    {/* 비밀번호 찾기 링크 (로그인 탭에만 표시) */}
                    {authMode === 'login' && (
                        <div className="text-right">
                            <button 
                                type="button" 
                                onClick={() => {setAuthMode('reset'); setError(''); setMessage('');}}
                                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
                            >
                                비밀번호를 잊으셨나요?
                            </button>
                        </div>
                    )}
                    
                    <button
                        type="submit"
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400"
                        disabled={isLoading}
                    >
                        {getButtonText()}
                    </button>
                    
                    {/* 재설정 모드에서 돌아가기 버튼 */}
                    {authMode === 'reset' && (
                            <div className="mt-4 text-center text-sm text-gray-500">
                                <button
                                    onClick={() => {setAuthMode('login'); setError(''); setMessage('');}}
                                    className="ml-1 text-red-600 hover:text-red-800 font-medium transition-colors"
                                    type="button"
                                >
                                    로그인 화면으로 돌아가기
                                </button>
                            </div>
                    )}
                    
                    {/* 익명 사용 계속 링크 (이전 App.js 로직에 따라 onClose를 호출하여 익명 사용 상태로 돌아가도록 함) */}
                    {authMode !== 'reset' && (
                        <p className="text-center text-sm mt-4">
                            <button
                                type="button" 
                                onClick={onClose} 
                                className="text-gray-500 hover:text-gray-700 font-medium"
                            >
                                지금은 로그인하지 않고 앱 사용 계속하기
                            </button>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
