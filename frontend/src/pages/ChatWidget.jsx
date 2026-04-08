import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './AgentsExplorer.css'; // We'll reuse/extend these styles

const API = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';

const PALETTE = [
  '#6C63FF','#2563eb','#16a34a','#d97706',
  '#db2777','#0891b2','#7c3aed','#dc2626',
];
const getColor    = (name = '') => PALETTE[name.charCodeAt(0) % PALETTE.length];
const getInitials = (name = '') => name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();

const ChatWidget = ({ apiKeyProp }) => {
    const params = useParams();
    const apiKey = apiKeyProp || params.apiKey;
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
        axios.get(`${API}/public/company/${apiKey}`)
            .then(({ data }) => {
                if (data.success) {
                    setCompany(data.company);
                    setMessages([{
                        role: 'ai',
                        text: `مرحباً! أنا المساعد الذكي لـ **${data.company.name}**. كيف يمكنني مساعدتك؟`,
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
            });
            setMessages(prev => [...prev, {
                role: 'ai',
                text: data.reply || 'لم يتم الحصول على رد.',
                time: new Date(),
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: 'حدث خطأ. حاول مجدداً.',
                time: new Date(),
            }]);
        } finally { setSending(false); }
    };

    const formatTime = d => new Date(d).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    if (loading) return null;
    if (!company) return <div style={{padding:20, textAlign:'center'}}>Invalid API Key</div>;

    const color = getColor(company.name);

    return (
        <div className="ac-page widget-view" style={{ height: '100dvh', background: 'var(--color-bg)' }}>
            {/* Minimal Header */}
            <div className="ac-header" style={{ padding: '0.6rem 1rem' }}>
                <div className="ac-header-company">
                    <div className="ac-header-avatar" style={{ background: color, width: 34, height: 34, fontSize: '0.8rem' }}>
                        {getInitials(company.name)}
                    </div>
                    <div className="ac-header-info">
                        <h2 style={{ fontSize: '0.9rem' }}>{company.name}</h2>
                        <div className="ac-header-status">
                            <span className="ac-live-dot" />
                            <span>متصل</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="ac-messages" style={{ padding: '1rem' }}>
                {messages.map((msg, i) => (
                    <div key={i} className={`ac-row ${msg.role}`}>
                        {msg.role === 'ai' && (
                            <div className="ac-msg-avatar" style={{ background: color, width: 24, height: 24, fontSize: '0.6rem' }}>
                                {getInitials(company.name)}
                            </div>
                        )}
                        <div className={`ac-bubble ${msg.role}`} style={msg.role === 'user' ? { background: color } : {}}>
                            <p style={{ fontSize: '0.85rem' }}>{msg.text.split('**').map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>
                            <time>{formatTime(msg.time)}</time>
                        </div>
                    </div>
                ))}
                {sending && (
                    <div className="ac-row ai">
                        <div className="ac-msg-avatar" style={{ background: color, width: 24, height: 24 }}>AI</div>
                        <div className="ac-bubble ai ac-typing">
                            <span /><span /><span />
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="ac-input-area" style={{ padding: '0.8rem' }}>
                <div className="ac-input-wrap">
                    <textarea
                        className="ac-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                        placeholder="اكتب استفسارك..."
                        rows={1}
                    />
                    <button className="ac-send" onClick={sendMessage} disabled={!input.trim() || sending} style={{ background: color, width: 34, height: 34 }}>
                        <i className={`fas ${sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatWidget;
