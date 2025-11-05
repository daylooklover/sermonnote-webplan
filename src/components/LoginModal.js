// src/components/LoginModal.js (수정된 내용)
import React, { useState } from 'react';
import { auth } from '@/lib/firebase'; // firebase.js에서 auth 인스턴스를 가져옵니다.
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { t } from '@/lib/translations'; // 번역 함수 임포트

const LoginModal = ({ isOpen, onClose, onLoginSuccess, lang }) => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(''); // LoginModal 내부에서 관리하도록 변경

    if (!isOpen) return null;

    const handleAuth = async () => {
        setErrorMessage(''); // 메시지 초기화
        try {
            if (isSignUp) {
                await createUserWithEmailAndPassword(auth, email, password);
                alert(t('signUpSuccess', lang)); // 회원가입 성공 메시지
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onLoginSuccess(); // 로그인 또는 회원가입 성공 시 호출
            onClose(); // 모달 닫기
        } catch (error) {
            console.error("Authentication error:", error);
            switch (error.code) {
                case 'auth/email-already-in-use':
                    setErrorMessage(t('emailInUseError', lang));
                    break;
                case 'auth/invalid-email':
                    setErrorMessage(t('invalidEmailError', lang));
                    break;
                case 'auth/operation-not-allowed':
                    setErrorMessage(t('operationNotAllowedError', lang));
                    break;
                case 'auth/weak-password':
                    setErrorMessage(t('weakPasswordError', lang));
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    setErrorMessage(t('invalidCredentialsError', lang));
                    break;
                case 'auth/popup-closed-by-user':
                    setErrorMessage(t('popupClosedError', lang));
                    break;
                default:
                    setErrorMessage(t('loginFailedGeneric', lang) + `: ${error.message}`);
                    break;
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md mx-4">
                <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                    {isSignUp ? t('signUp', lang) : t('login', lang)}
                </h2>

                {errorMessage && (
                    <p className="text-red-600 text-center mb-4">{errorMessage}</p>
                )}

                <input
                    type="email"
                    placeholder={t('emailPlaceholder', lang)}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="password"
                    placeholder={t('passwordPlaceholder', lang)}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 mb-6 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                    onClick={handleAuth}
                    className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300"
                >
                    {isSignUp ? t('signUpButton', lang) : t('loginButton', lang)}
                </button>

                <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="w-full mt-4 text-blue-600 hover:underline"
                >
                    {isSignUp ? t('hasAccount', lang) : t('noAccount', lang)}
                </button>
                <button
                    onClick={onClose}
                    className="w-full mt-4 text-gray-600 hover:underline"
                >
                    {t('close', lang)}
                </button>
            </div>
        </div>
    );
};

export default LoginModal;