'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, MessageCircle, X, Loader2, Lightbulb } from 'lucide-react';
// 🚨 Gemini 직접 호출을 위한 SDK 임포트
import { GoogleGenerativeAI } from "@google/generative-ai";

const UI_TEXT = {
  ko: { 
    header: "말씀노트 Q&A", welcome: "오늘도 귀한 사역에 힘쓰시는 목회자님을 응원합니다. ✨ 말씀노트가 무엇을 도와드릴까요? 🙏", 
    inputPlaceholder: "질문을 입력하세요...", loading: "생각 중...", 
    error: "연결 오류가 발생했습니다. support@sermonnote.net으로 문의해 주세요.",
    faqTitle: "FAQ", faqs: ["후원 방법", "환불 정책", "아카이브 사용법", "설교 생성 한도"],
    supportLabel: "도움이 필요하시면 support@sermonnote.net으로 연락주세요."
  },
  en: { 
    header: "SermonNote Q&A", welcome: "Supporting your precious ministry today. ✨ How can SermonNote assist you? 🙏", 
    inputPlaceholder: "Ask a question...", loading: "Thinking...", 
    error: "Connection issue. Please contact support@sermonnote.net.",
    faqTitle: "FAQ", faqs: ["How to Support", "Refund Policy", "How to use Archive", "Generation Limit"],
    supportLabel: "Need help? Contact support@sermonnote.net"
  },
  zh: { 
    header: "讲道笔记 Q&A", welcome: "愿上帝祝福您今天的服侍。✨ 讲道笔记可以为您提供什么帮助？ 🙏", 
    inputPlaceholder: "请输入问题...", loading: "正在思考...", 
    error: "连接出现问题。请联系 support@sermonnote.net",
    faqTitle: "常见问题", faqs: ["如何赞助", "退款政策", "档案库用法", "生成限制"],
    supportLabel: "如需帮助，请联系 support@sermonnote.net"
  },
  ru: { 
    header: "SermonNote Q&A", welcome: "Пусть Господь благословит ваше служение. ✨ Чем SermonNote может вам помочь? 🙏", 
    inputPlaceholder: "Введите вопрос...", loading: "Думаю...", 
    error: "Ошибка соединения. Пишите на support@sermonnote.net",
    faqTitle: "FAQ", faqs: ["Как поддержать", "Политика возврата", "Как использовать архив", "Лимит генерации"],
    supportLabel: "Нужна помощь? support@sermonnote.net"
  },
  vi: { 
    header: "Trợ lý SermonNote", welcome: "Nguyện Chúa ban phước cho chức vụ của bạn. ✨ SermonNote có thể giúp gì cho bạn? 🙏", 
    inputPlaceholder: "Nhập câu hỏi...", loading: "Đang suy nghĩ...", 
    error: "Lỗi kết nối. Liên hệ support@sermonnote.net",
    faqTitle: "FAQ", faqs: ["Cách hỗ trợ", "Chính sách hoàn tiền", "Cách sử dụng lưu trữ", "Giới hạn tạo"],
    supportLabel: "Cần hỗ trợ? support@sermonnote.net"
  }
};

const CopilotPanel = ({ user, lang = 'ko' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);
  
  const ui = useMemo(() => UI_TEXT[lang] || UI_TEXT['ko'], [lang]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ id: 'welcome', role: 'assistant', content: ui.welcome }]);
    } else {
      setMessages(prev => prev.map(msg => 
        msg.id === 'welcome' ? { ...msg, content: ui.welcome } : msg
      ));
    }
  }, [lang, ui.welcome]);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // 🚨 [핵심 수정] 서버 fetch 대신 Gemini SDK 직접 사용
  const handleSendMessage = useCallback(async (overrideInput) => {
    const finalInput = overrideInput || input;
    if (!finalInput.trim() || isTyping) return;

    const userMessage = { id: Date.now(), role: 'user', content: finalInput };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // 1. 환경 변수에서 API 키 가져오기 (NEXT_PUBLIC_ 확인 필수)
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      const genAI = new GoogleGenerativeAI(apiKey);

      // 2. 말씀노트 전용 모델 설정: gemini-1.5-flash
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // 3. 시스템 프롬프트 구성
      const systemPrompt = `
        당신은 '말씀노트(SermonNote)'의 전용 AI 도우미입니다. 
        사용자의 질문에 대해 아래 가이드라인을 바탕으로 반드시 사용자의 언어(${lang})로 답변하세요.

        [1. 아카이브 사용법]
        - 등록: 설교 생성 후 '아카이브 등록' 버튼 클릭 시 저장됩니다.
        - 기능: 저장된 설교 열람, 인쇄, 다운로드 가능.
        - 혜택: 프리미엄 회원은 월 10회 등록 및 '설교 재탄생(Rebirth)' 기능 제공.

        [2. 환불 정책]
        - 결제 후 7일 이내, 사용 내역이 없을 때만 전액 환불 가능.
        - 이용 기록이 있다면 디지털 콘텐츠 특성상 환불이 제한됨.

        [3. 특별 예배 준비]
        - 상황별 설교는 '생활화 설교' 기능을 추천하고 해당 메뉴를 안내하세요.

        [4. 기타 문의]
        - 기술 문의는 support@sermonnote.net으로 안내하세요.
      `;

      // 4. 대화 기록을 포함하여 콘텐츠 생성
      const history = messages.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n');
      const result = await model.generateContent(`${systemPrompt}\n\n대화 내역:\n${history}\n\nUser Question: ${finalInput}`);
      const response = await result.response;
      const text = response.text();

      if (text) {
        setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: text }]);
      }
    } catch (error) {
      console.error("Gemini 호출 오류:", error);
      setMessages(prev => [...prev, { id: Date.now() + 2, role: 'assistant', content: ui.error }]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, lang, messages, ui.error]);

  return (
    <div className="fixed bottom-6 right-6" style={{ zIndex: 9999 }}>
      <button onClick={() => setIsOpen(!isOpen)} className="bg-[#E91E63] p-4 rounded-full text-white shadow-xl hover:scale-110 transition-transform flex items-center justify-center">
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[380px] h-[600px] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="p-5 bg-white border-b flex justify-between items-center shadow-sm">
            <span className="font-bold text-gray-800 text-lg">{ui.header}</span>
            <span className="text-[10px] bg-gray-100 px-2 py-1 rounded-md text-gray-500 font-medium uppercase tracking-wider">{lang}</span>
          </div>

          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50/30" ref={scrollRef}>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3.5 px-4 rounded-2xl max-w-[85%] text-[14px] leading-relaxed shadow-sm ${
                  msg.role === 'user' ? 'bg-[#E91E63] text-white rounded-tr-none' : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start items-center">
                <div className="bg-white border border-gray-100 p-3 px-4 rounded-2xl rounded-tl-none shadow-sm flex items-center tracking-tighter">
                  <Loader2 size={14} className="animate-spin mr-2 text-gray-400" />
                  <span className="text-[13px] text-gray-400">{ui.loading}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white px-4 py-2 border-t border-gray-50 flex-shrink-0">
            <div className="flex items-center overflow-x-auto no-scrollbar py-1 space-x-2">
              <span className="text-[11px] font-bold text-[#E91E63] whitespace-nowrap mr-1 flex items-center">
                <Lightbulb size={12} className="mr-0.5" /> {ui.faqTitle}
              </span>
              {ui.faqs.map((faq, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(faq)}
                  className="whitespace-nowrap text-[12px] bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-[#E91E63] hover:text-[#E91E63] transition-all flex-shrink-0"
                >
                  {faq}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-white border-t flex-shrink-0">
            <div className="flex bg-gray-100 rounded-2xl px-4 py-2 items-center focus-within:ring-2 focus-within:ring-[#E91E63]/20 transition-all">
              <input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} 
                placeholder={ui.inputPlaceholder} 
                className="bg-transparent flex-grow outline-none text-[14px] text-gray-700 min-h-[40px]" 
              />
              <button onClick={() => handleSendMessage()} disabled={!input.trim() || isTyping} className={`ml-2 p-1.5 rounded-full ${input.trim() && !isTyping ? 'bg-[#E91E63] text-white' : 'text-gray-300'}`}>
                <Send size={18}/>
              </button>
            </div>
            <p className="text-[10px] text-center text-gray-400 mt-2 tracking-tight">
              {ui.supportLabel}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CopilotPanel;