import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import './VOXIOChatWidget.css';

const VOXIOChatWidget = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            role: 'assistant',
            content: 'مرحباً بك في VOXIO! 👋 أنا مساعدك الذكي، كيف يمكنني مساعدتك في بناء وكيل الذكاء الاصطناعي الخاص بك؟'
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';

    const [sessionId] = useState(() => {
        let sid = localStorage.getItem('voxio_sid');
        if (!sid) {
            sid = "sess_" + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('voxio_sid', sid);
        }
        return sid;
    });

    const toggleChat = () => setIsOpen(!isOpen);

    useEffect(() => {
        // Load history for VOXIO Assistant too if needed, or just keep session alive
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOpen]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await axios.post(`${BACKEND_URL}/voxio-chat`, {
                prompt: input,
                sessionId: sessionId
            });

            const botMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                content: res.data.reply
            };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.',
                isError: true
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="voxio-widget-container" style={{ [isArabic ? 'left' : 'right']: '20px', [isArabic ? 'right' : 'left']: 'auto' }}>
            {/* Chat Button */}
            <button
                className={`widget-toggle-btn ${isOpen ? 'open' : ''}`}
                onClick={toggleChat}
                aria-label="Chat with VOXIO"
            >
                {isOpen ? <i className="fas fa-times"></i> : <i className="fas fa-robot"></i>}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="widget-window animate-pop-up" style={{ [isArabic ? 'left' : 'right']: '0', [isArabic ? 'right' : 'left']: 'auto' }} dir={isArabic ? 'rtl' : 'ltr'}>
                    <div className="widget-header">
                        <div className="header-info">
                            <span className="status-dot"></span>
                            <h3>VOXIO Assistant</h3>
                        </div>
                        <p>اسألني عن خدماتنا وطرق الاشتراك!</p>
                    </div>

                    <div className="widget-body">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`widget-msg ${msg.role} ${msg.isError ? 'error' : ''}`}>
                                <div className="msg-content">{msg.content}</div>
                            </div>
                        ))}
                        {loading && (
                            <div className="widget-msg assistant">
                                <div className="typing-dots">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="widget-footer" onSubmit={sendMessage}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="اكتب استفسارك..."
                            disabled={loading}
                        />
                        <button type="submit" disabled={!input.trim() || loading}>
                            <i className="fas fa-paper-plane"></i>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default VOXIOChatWidget;
