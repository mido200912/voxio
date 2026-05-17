import React, { useState, useEffect, useRef } from 'react';
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
    const endRef = useRef(null);

    useEffect(() => {
        // Fetch company data and widget config
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

    const sendMessage = async () => {
        if (!input.trim() || sending) return;
        const text = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text, time: new Date() }]);
        setSending(true);
        try {
            const { data } = await axios.post(`${API}/public/chat`, {
                companyApiKey: apiKey,
                prompt: text,
                platform: 'widget',
            });
            setMessages(prev => [...prev, {
                role: 'ai',
                text: data.reply || 'لم يتم الحصول على رد.',
                time: new Date(),
                buttons: data.buttons || [],
                products: data.products || []
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
                time: new Date(),
            }]);
        } finally { setSending(false); }
    };

    const handleQuickMessageSend = async (text) => {
        if (sending) return;
        setMessages(prev => [...prev, { role: 'user', text, time: new Date() }]);
        setSending(true);
        try {
            const { data } = await axios.post(`${API}/public/chat`, {
                companyApiKey: apiKey,
                prompt: text,
                platform: 'widget',
            });
            setMessages(prev => [...prev, {
                role: 'ai',
                text: data.reply || 'لم يتم الحصول على رد.',
                time: new Date(),
                buttons: data.buttons || [],
                products: data.products || []
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: 'حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
                time: new Date(),
            }]);
        } finally { setSending(false); }
    };

    const formatTime = d => new Date(d).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    if (loading) return null;
    if (!company) return <div className="vx-widget-wrapper" style={{padding:20, textAlign:'center'}}>Invalid API Key</div>;

    const color = config.primaryColor || '#6C63FF';

    return (
        <div className="vx-widget-wrapper" style={{ '--vx-color': color }}>
            {/* Inject Custom CSS from AI */}
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
            </header>

            {/* Messages Area */}
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
                            <div className={`vx-bubble ${msg.role}`} style={msg.role === 'user' ? {background: color} : {}}>
                                <p>
                                    {msg.text.split('**').map((p, j) => 
                                        j % 2 === 1 ? <strong key={j}>{p}</strong> : p
                                    )}
                                </p>
                                <time>{formatTime(msg.time)}</time>
                            </div>

                            {/* Horizontal Showcase Card Slider */}
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
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="vx-msg-row ai"
                    >
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
                        style={{ height: 'auto' }}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                        }}
                    />
                    <button 
                        className="vx-send-btn" 
                        onClick={sendMessage} 
                        disabled={!input.trim() || sending}
                        style={{background: color}}
                    >
                        <i className={`fas ${sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;
