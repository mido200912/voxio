import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './ChatWidget.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ChatWidget = ({ apiKeyProp }) => {
    const params = useParams();
    const apiKey = apiKeyProp || params.apiKey;
    const [company, setCompany] = useState(null);
    const [config, setConfig] = useState({ primaryColor: '#6C63FF', welcomeMessage: 'مرحباً! كيف يمكنني مساعدتك؟', customCss: '' });
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const endRef = useRef(null);
    const recognitionRef = useRef(null);
    const synthRef = useRef(window.speechSynthesis);

    // Persistent session ID
    const [sessionId] = useState(() => {
        let sid = localStorage.getItem('voxio_sess_' + apiKey);
        if (!sid) {
            sid = 'sess_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('voxio_sess_' + apiKey, sid);
        }
        return sid;
    });

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const overrideColor = queryParams.get('color');
        const overrideWelcome = queryParams.get('welcome');
        const overrideCss = queryParams.get('css');

        axios.get(`${API}/public/company/${apiKey}`)
            .then(({ data }) => {
                if (data.success) {
                    setCompany(data.company);
                    const baseConfig = data.company.widgetConfig || {};
                    const finalConfig = {
                        ...baseConfig,
                        primaryColor: overrideColor || baseConfig.primaryColor || '#6C63FF',
                        welcomeMessage: overrideWelcome || baseConfig.welcomeMessage || `مرحباً! أنا المساعد الذكي لـ **${data.company.name}**. كيف يمكنني مساعدتك اليوم؟`,
                        customCss: overrideCss || baseConfig.customCss || ''
                    };
                    setConfig(finalConfig);
                    setMessages([{
                        role: 'ai',
                        text: finalConfig.welcomeMessage,
                        time: new Date(),
                    }]);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [apiKey]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ─── Text-to-Speech ───────────────────────────────────────────────────────
    const speak = useCallback((text) => {
        if (isMuted || !('speechSynthesis' in window)) return;
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        // Try to detect language — rough heuristic
        const hasArabic = /[\u0600-\u06FF]/.test(text);
        utterance.lang = hasArabic ? 'ar-SA' : 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        synthRef.current.speak(utterance);
    }, [isMuted]);

    // ─── Copilot Command Parser ───────────────────────────────────────────────
    const parseCopilotCommands = useCallback((rawReply) => {
        let reply = rawReply;

        // NAVIGATE command
        const navMatch = reply.match(/\[NAVIGATE:\s*(.*?)\]/);
        if (navMatch && navMatch[1]) {
            const target = navMatch[1].trim();
            reply = reply.replace(navMatch[0], '').trim();
            // Send to parent window (the hosting website)
            window.parent.postMessage({ type: 'VOXIO_NAVIGATE', target }, '*');
            // Also handle within iframe if same origin
            try {
                if (target.startsWith('#')) {
                    const el = window.parent.document.querySelector(target);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else if (target.startsWith('/')) {
                    setTimeout(() => { window.parent.location.href = target; }, 1200);
                }
            } catch (_) { /* cross-origin — handled by parent listener */ }
        }

        // HIGHLIGHT command
        const hlMatch = reply.match(/\[HIGHLIGHT:\s*(.*?)\]/);
        if (hlMatch && hlMatch[1]) {
            const selector = hlMatch[1].trim();
            reply = reply.replace(hlMatch[0], '').trim();
            window.parent.postMessage({ type: 'VOXIO_HIGHLIGHT', selector }, '*');
            try {
                const el = window.parent.document.querySelector(selector);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.transition = 'box-shadow 0.3s ease';
                    el.style.boxShadow = '0 0 0 4px #6C63FF, 0 0 30px rgba(108,99,255,0.5)';
                    setTimeout(() => { el.style.boxShadow = ''; }, 3500);
                }
            } catch (_) { /* cross-origin — handled by parent listener */ }
        }

        return reply;
    }, []);

    // ─── Send Message ─────────────────────────────────────────────────────────
    const sendMessage = async (text) => {
        const msg = (text || input).trim();
        if (!msg || sending) return;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: msg, time: new Date() }]);
        setSending(true);

        try {
            const { data } = await axios.post(`${API}/public/chat`, {
                companyApiKey: apiKey,
                prompt: msg,
                platform: 'widget',
                sessionId,
            });
            let reply = data.reply || 'لم يتم الحصول على رد.';
            reply = parseCopilotCommands(reply);

            const newMsg = {
                role: 'ai',
                text: reply,
                time: new Date(),
                buttons: data.buttons || [],
                products: data.products || []
            };
            setMessages(prev => [...prev, newMsg]);
            speak(reply);
        } catch {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
                time: new Date(),
            }]);
        } finally {
            setSending(false);
        }
    };

    const handleQuickMessageSend = async (text) => {
        await sendMessage(text);
    };

    // ─── STT (Speech-to-Text) ─────────────────────────────────────────────────
    const originalInputRef = useRef('');

    const startListening = useCallback(() => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert('متصفحك لا يدعم التعرف على الصوت. جرب Chrome.');
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'ar-SA';
        recognition.continuous = true;
        recognition.interimResults = true;

        originalInputRef.current = input; // Save existing input

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (e) => {
            let currentTranscript = '';
            for (let i = 0; i < e.results.length; ++i) {
                currentTranscript += e.results[i][0].transcript;
            }
            setInput(originalInputRef.current + (originalInputRef.current ? ' ' : '') + currentTranscript);
        };
        recognition.start();
    }, [input]);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    const formatTime = d => new Date(d).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    if (loading) return null;
    if (!company) return <div className="vx-widget-wrapper" style={{ padding: 20, textAlign: 'center' }}>Invalid API Key</div>;

    const color = config.primaryColor || '#6C63FF';

    return (
        <div className="vx-widget-wrapper" style={{ '--vx-color': color }}>
            {config.customCss && <style>{config.customCss}</style>}

            {/* Header */}
            <header className="vx-widget-header">
                <div className="vx-avatar-main" style={{ background: color }}>
                    {company?.name ? company.name[0].toUpperCase() : '🤖'}
                </div>
                <div className="vx-header-info">
                    <h2>{company?.name || 'Support'}</h2>
                    <div className="vx-status">
                        <span className="vx-dot" />
                        <span>متصل الآن</span>
                    </div>
                </div>
                {/* Mute / Unmute TTS toggle */}
                <button
                    className="vx-mute-btn"
                    onClick={() => { setIsMuted(m => !m); synthRef.current.cancel(); }}
                    title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
                >
                    <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`} />
                </button>
            </header>

            {/* Messages */}
            <div className="vx-messages-container">
                <AnimatePresence initial={false}>
                    {messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className={`vx-msg-row ${msg.role}`}
                            style={{ flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-start' : 'flex-end', gap: '4px' }}
                        >
                            <div className={`vx-bubble ${msg.role}`} style={msg.role === 'user' ? { background: color } : {}}>
                                <p>
                                    {msg.text.split('**').map((p, j) =>
                                        j % 2 === 1 ? <strong key={j}>{p}</strong> : p
                                    )}
                                </p>
                                <time>{formatTime(msg.time)}</time>
                            </div>

                            {/* Product Slider */}
                            {msg.role === 'ai' && msg.products && msg.products.length > 0 && (
                                <div className="vx-products-slider">
                                    {msg.products.map((p, idx) => (
                                        <div key={idx} className="vx-product-card">
                                            <div className="vx-product-img-wrap">
                                                <img src={p.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=60'} alt={p.name} />
                                                <span className="vx-product-price">{p.price}</span>
                                            </div>
                                            <div className="vx-product-info">
                                                <h3>{p.name}</h3>
                                                {p.description && <p>{p.description}</p>}
                                                <button onClick={() => handleQuickMessageSend(p.name)} className="vx-product-buy-btn">
                                                    طلب الآن ✅
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Quick Reply Buttons */}
                            {msg.role === 'ai' && msg.buttons && msg.buttons.length > 0 && (
                                <div className="vx-quick-replies">
                                    {msg.buttons.map((btnText, idx) => (
                                        <button key={idx} onClick={() => handleQuickMessageSend(btnText)} className="vx-quick-reply-btn">
                                            {btnText}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {sending && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="vx-msg-row ai">
                        <div className="vx-bubble ai vx-typing">
                            <span /><span /><span />
                        </div>
                    </motion.div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input Area */}
            <div className="vx-input-area">
                <div className="vx-input-wrap">
                    <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                        placeholder="اكتب رسالتك هنا..."
                        rows={1}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                    />

                    {/* Microphone button (STT) */}
                    <button
                        className={`vx-mic-btn ${isListening ? 'listening' : ''}`}
                        onClick={isListening ? stopListening : startListening}
                        title={isListening ? 'إيقاف الاستماع' : 'التحدث بالصوت'}
                    >
                        <i className={`fas ${isListening ? 'fa-circle' : 'fa-microphone'}`} />
                    </button>

                    <button
                        className="vx-send-btn"
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || sending}
                        style={{ background: color }}
                    >
                        <i className={`fas ${sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} />
                    </button>
                </div>
                {isListening && (
                    <div className="vx-listening-indicator">
                        <span className="vx-listening-dot" /><span className="vx-listening-dot" /><span className="vx-listening-dot" />
                        <span>جاري الاستماع...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatWidget;
