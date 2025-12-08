'use client';

import React, { useState } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    sendPasswordResetEmail,
} from 'firebase/auth'; 

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

// 임시 t 함수 정의 (prop으로 받게 되므로 이 컴포넌트에서는 사용하지 않지만, 기본 구조 유지를 위해 남겨둡니다.)
const dummyT = (key, ...args) => {
    let text = key;
    args.forEach((arg, index) => {
        text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), arg);
    });
    return text;
};


// Firebase 오류 코드를 사용자 친화적인 메시지로 변환
const getFirebaseErrorMessage = (errorCode, t) => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return t('auth_invalid_email') || 'Invalid email address format.';
        case 'auth/user-disabled':
            return t('auth_user_disabled') || 'Account has been disabled.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential': 
            return t('auth_wrong_credentials') || 'Email or password is incorrect.';
        case 'auth/email-already-in-use':
            return t('auth_email_in_use') || 'Email is already in use.';
        case 'auth/weak-password':
            return t('auth_weak_password') || 'Password must be at least 6 characters.';
        case 'auth/missing-email':
            return t('auth_missing_email') || 'Please enter an email.';
        default:
            return t('auth_generic_error', errorCode.replace('auth/', '')) || `Authentication error occurred: ${errorCode.replace('auth/', '')}`;
    }
};

const LoginModal = ({ onClose, Instance, onLoginSuccess, t = dummyT, lang = 'ko' }) => {
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(''); 
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);
    
    // 'login', 'register', 'reset' 세 가지 상태 관리
    const [authMode, setAuthMode] = useState('login'); 

    // Instance가 undefined일 경우, 모달 내부에 안내 메시지를 표시합니다.
    if (!Instance) {
        return (
            <div 
                className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 text-center">
                    <h3 className="text-xl font-bold text-red-600 mb-4">
                        {t('auth_error_title') || 'Authentication System Error'}
                    </h3>
                    <p className="text-gray-700 mb-6">
                        {t('auth_error_desc') || 'The authentication system is not initialized. Please try again later.'}
                    </p>
                    <button onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-lg hover:bg-gray-300">
                        {t('closeButton') || 'Close'}
                    </button>
                </div>
            </div>
        );
    }
    
    const handleAuthAction = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            if (authMode === 'register') {
                // 1. 회원가입 (Firebase createUserWithEmailAndPassword)
                if (password !== confirmPassword) {
                    setError(t('auth_password_mismatch') || 'Password and confirmation do not match.');
                    setIsLoading(false);
                    return;
                }
                
                await createUserWithEmailAndPassword(Instance, email, password);
                
                setMessage(t('auth_register_success') || 'Registration successful! You will be logged in automatically.');
                onLoginSuccess();
                setTimeout(onClose, 800); 

            } else if (authMode === 'login') {
                // 2. 로그인 (Firebase signInWithEmailAndPassword)
                await signInWithEmailAndPassword(Instance, email, password);
                
                setMessage(t('auth_login_success') || 'Login successful!');
                onLoginSuccess();
                setTimeout(onClose, 800); 

            } else if (authMode === 'reset') {
                // 3. 비밀번호 재설정 메일 발송 (Firebase sendPasswordResetEmail)
                await sendPasswordResetEmail(Instance, email);

                setMessage(t('auth_reset_sent') || 'Password reset link sent to your email. Please check your email to proceed.');
                setAuthMode('login'); // 재설정 후 로그인 탭으로 전환
            }

        } catch (e) {
            if (e.name === 'FirebaseError' && e.code) {
                setError(getFirebaseErrorMessage(e.code, t));
            } else {
                console.error('Unexpected Auth Error:', e);
                setError(t('auth_unexpected_error') || 'An unexpected error occurred. Please try again later.');
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
    
    // 🚨 FIX: t 함수를 사용하여 번역 적용
    const tabLabels = [
        { key: 'login', label: t('login') || 'Login' },
        { key: 'register', label: t('register') || 'Register' },
    ];
    
    const getHeaderTitle = () => {
        if (authMode === 'reset') return t('auth_reset_title') || 'Password Reset';
        // 🚨 FIX: t 함수를 사용하여 번역 적용
        return authMode === 'register' ? (t('register') || 'Register') : (t('login') || 'Login');
    };
    
    const getButtonText = () => {
        // 🚨 FIX: t 함수를 사용하여 번역 적용
        if (isLoading) return authMode === 'register' ? (t('auth_registering') || 'Registering...') : (t('auth_processing') || 'Processing...');
        if (authMode === 'reset') return t('auth_send_reset') || 'Send Reset Email';
        return authMode === 'register' ? (t('register') || 'Register') : (t('login') || 'Login');
    };

    return (
        <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div 
                className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 transform transition-all duration-300 scale-100" // 디자인 개선: 더 큰 패딩, 더 둥근 모서리, max-w-sm
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6"> {/* 여백 증가 */}
                    <h3 className="text-2xl font-extrabold text-gray-900">{getHeaderTitle()}</h3> {/* 폰트 강조 */}
                    <button onClick={onClose} className="text-gray-500 hover:text-red-600 transition p-1 rounded-full hover:bg-gray-100"><CloseIcon /></button>
                </div>
                
                {/* 탭 네비게이션 (재설정 모드가 아닐 때만 표시) */}
                {authMode !== 'reset' && (
                    <div className="flex mb-8 border-b border-gray-200"> {/* 여백 및 구분선 강조 */}
                        {tabLabels.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => {setAuthMode(tab.key); setEmail(''); setPassword(''); setConfirmPassword(''); setError(''); setMessage('');}}
                                className={`flex-1 pb-3 text-base font-semibold transition-colors relative 
                                    ${authMode === tab.key
                                        ? 'text-red-600 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-red-600'
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
                    <div className={`p-3 mb-4 rounded-lg text-sm font-medium ${error ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                        {error || message}
                    </div>
                )}

                <form onSubmit={handleAuthAction} className="space-y-4">
                    
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('email_placeholder') || "Email Address"} // 다국어 키 사용
                        className="w-full p-3 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-150" // 디자인 개선: 둥근 모서리, 포커스 링
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
                                placeholder={t('password_placeholder') || "Password (6+ characters)"} // 다국어 키 사용
                                className="w-full p-3 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-150"
                                required
                                disabled={isLoading}
                            />
                            {/* 회원가입 시 비밀번호 확인 */}
                            {authMode === 'register' && (
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t('auth_placeholder_confirm_password') || "Confirm Password"} // 다국어 키 사용
                                    className="w-full p-3 rounded-lg bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-150"
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
                                className="text-sm text-gray-500 hover:text-red-600 transition-colors font-medium"
                            >
                                {t('forgot_password') || 'Forgot your password?'} {/* 다국어 키 사용 */}
                            </button>
                        </div>
                    )}
                    
                    <button
                        type="submit"
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition duration-300 disabled:bg-gray-400 disabled:shadow-none mt-6" // 디자인 개선: 굵은 폰트, 둥근 모서리, 쉐도우
                        disabled={isLoading}
                    >
                        {getButtonText()}
                    </button>
                    
                    {/* 재설정 모드에서 돌아가기 버튼 */}
                    {authMode === 'reset' && (
                        <div className="mt-6 text-center text-sm text-gray-500 pt-2 border-t border-gray-100">
                            {t('auth_reset_prompt') || 'Remembered your password?'}
                            <button
                                onClick={() => {setAuthMode('login'); setError(''); setMessage('');}}
                                className="ml-1 text-red-600 hover:text-red-800 font-semibold transition-colors"
                                type="button"
                            >
                                {t('auth_back_to_login') || 'Back to Login'}
                            </button>
                        </div>
                    )}
                    
                    {/* 익명 사용 계속 링크 */}
                    {authMode !== 'reset' && (
                        <p className="text-center text-sm mt-4 pt-2 border-t border-gray-100"> {/* 구분선 추가 */}
                            <button
                                type="button" 
                                onClick={onClose} 
                                className="text-gray-500 hover:text-red-600 font-medium transition-colors"
                            >
                                {t('auth_continue_anon') || 'Continue using the app without logging in'}
                            </button>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
};

export default LoginModal;