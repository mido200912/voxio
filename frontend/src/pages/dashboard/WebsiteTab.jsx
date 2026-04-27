import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion, AnimatePresence } from 'framer-motion';
import PageLoader from '../../components/PageLoader';
import { useToast } from '../../components/Toast';
import ChatbotEditor from './ChatbotEditor';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';

const WebsiteTab = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const token = secureStorage.getItem('token');
    const { toast } = useToast();

    const [mainTab, setMainTab] = useState('design');  // 'design' | 'requests' | 'chats'
    const [requests, setRequests] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('');
    const [chats, setChats] = useState([]);          
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chatsLoading, setChatsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => { 
        if (mainTab === 'requests') fetchRequests();
        if (mainTab === 'chats') fetchChats();
    }, [mainTab]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BACKEND_URL}/company/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const webRequests = res.data.filter(r => r.source === 'web');
            setRequests(webRequests);
            const unique = [...new Set(webRequests.map(r => r.product || 'عام'))];
            setCategories(unique);
            if (unique.length > 0) setActiveCategory(unique[0]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchChats = async () => {
        setChatsLoading(true);
        try {
            const res = await axios.get(`${BACKEND_URL}/support-chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const webChats = res.data.filter(c => c.platform === 'web');
            setChats(webChats);
            if (webChats.length > 0 && !activeChatUser) setActiveChatUser(webChats[0].id);
        } catch (e) { console.error(e); }
        finally { setChatsLoading(false); }
    };

    const fetchMessages = async (userId) => {
        try {
            const res = await axios.get(`${BACKEND_URL}/support-chat/history/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (activeChatUser && mainTab === 'chats') fetchMessages(activeChatUser);
    }, [activeChatUser, mainTab]);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const s = {
        wrapper: { padding: '32px', direction: isArabic ? 'rtl' : 'ltr' },
        header: { marginBottom: '2rem' },
        tabs: { display: 'flex', gap: '8px', background: 'var(--color-card-bg)', padding: '6px', borderRadius: '16px', width: 'fit-content', marginBottom: '32px', border: '1px solid var(--color-border)' },
        tab: (active) => ({
            padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontWeight: active ? '700' : '500',
            background: active ? '#6C63FF' : 'transparent',
            color: active ? '#ffffff' : 'var(--color-text-secondary)',
            transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center', gap: '8px'
        }),
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
        card: { background: 'var(--color-card-bg)', borderRadius: '20px', padding: '24px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' },
        categoryBar: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' },
        catBtn: (active) => ({
            padding: '8px 20px', borderRadius: '24px', border: '1px solid',
            borderColor: active ? '#6C63FF' : 'var(--color-border)',
            cursor: 'pointer', background: active ? 'rgba(108, 99, 255, 0.1)' : 'var(--color-card-bg)',
            color: active ? '#6C63FF' : 'var(--color-text-secondary)',
            fontWeight: active ? '700' : '500'
        }),
    };

    return (
        <div style={s.wrapper}>
            <div style={s.header}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {isArabic ? 'إدارة صفحة الموقع' : 'Hosted Website Page'}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    {isArabic ? 'هنا يمكنك تصميم الصفحة العامة التي يستضيفها VOXIO وإدارة محادثاتها.' : 'Design your VOXIO-hosted public page and manage its chats.'}
                </p>
            </div>

            <div style={s.tabs}>
                <button style={s.tab(mainTab === 'design')} onClick={() => setMainTab('design')}>
                    <i className="fas fa-wand-magic-sparkles"></i>
                    {isArabic ? 'تصميم الصفحة' : 'Page Designer'}
                </button>
                <button style={s.tab(mainTab === 'requests')} onClick={() => setMainTab('requests')}>
                    <i className="fas fa-inbox"></i>
                    {isArabic ? 'الطلبات' : 'Requests'}
                </button>
                <button style={s.tab(mainTab === 'chats')} onClick={() => setMainTab('chats')}>
                    <i className="fas fa-comments"></i>
                    {isArabic ? 'المحادثات' : 'Chats'}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {mainTab === 'design' && (
                    <motion.div key="design" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <ChatbotEditor />
                    </motion.div>
                )}

                {mainTab === 'requests' && (
                    <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {loading ? <PageLoader /> : (
                            <>
                                <div style={s.categoryBar}>
                                    {categories.map(cat => (
                                        <button key={cat} style={s.catBtn(activeCategory === cat)} onClick={() => setActiveCategory(cat)}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <div style={s.grid}>
                                    {requests.filter(r => (r.product || 'عام') === activeCategory).map((req, i) => (
                                        <div key={i} style={s.card}>
                                            <div style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{req.customerName}</div>
                                            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '12px', fontSize: '0.95rem', marginBottom: '15px' }}>{req.message}</div>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{new Date(req.date?._seconds * 1000 || req.date).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {mainTab === 'chats' && (
                    <motion.div key="chats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div style={{ display: 'flex', height: '600px', border: '1px solid var(--color-border)', borderRadius: '24px', overflow: 'hidden', background: 'var(--color-bg)' }}>
                            <div style={{ width: '280px', borderRight: '1px solid var(--color-border)', background: 'var(--color-card-bg)', overflowY: 'auto' }}>
                                {chats.map(c => (
                                    <div key={c.id} onClick={() => setActiveChatUser(c.id)} style={{ padding: '20px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', background: activeChatUser === c.id ? 'rgba(108,99,255,0.05)' : 'none', borderLeft: activeChatUser === c.id ? '4px solid #6C63FF' : 'none' }}>
                                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.lastMessage}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {messages.map((m, i) => (
                                        <div key={i} style={{ alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '75%', padding: '12px 18px', borderRadius: '18px', background: m.sender === 'user' ? '#6C63FF' : 'var(--color-card-bg)', color: m.sender === 'user' ? 'white' : 'var(--text-primary)', border: m.sender !== 'user' ? '1px solid var(--color-border)' : 'none' }}>
                                            {m.text}
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WebsiteTab;
