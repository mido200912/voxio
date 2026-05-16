import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion, AnimatePresence } from 'framer-motion';  
import PageLoader from '../../components/PageLoader';
import { useToast } from '../../components/Toast';
import './DashboardShared.css';
import ChatbotEditor from './ChatbotEditor';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

    return (
        <div className="website-tab-page animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">{isArabic ? 'إدارة صفحة الموقع' : 'Hosted Website Page'}</h1>
                    <p className="dash-page-subtitle">{isArabic ? 'هنا يمكنك تصميم الصفحة العامة التي يستضيفها VOXIO وإدارة محادثاتها.' : 'Design your VOXIO-hosted public page and manage its chats.'}</p>
                </div>

                <div style={{ display: 'flex', gap: '8px', background: 'var(--dash-card)', padding: '6px', borderRadius: '14px', border: '1px solid var(--dash-border)' }}>
                    <button 
                        className={`dash-btn ${mainTab === 'design' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setMainTab('design')}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', height: 'auto' }}
                    >
                        <i className="fas fa-wand-magic-sparkles"></i>
                        {isArabic ? 'التصميم' : 'Designer'}
                    </button>
                    <button 
                        className={`dash-btn ${mainTab === 'requests' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setMainTab('requests')}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', height: 'auto' }}
                    >
                        <i className="fas fa-inbox"></i>
                        {isArabic ? 'الطلبات' : 'Requests'}
                    </button>
                    <button 
                        className={`dash-btn ${mainTab === 'chats' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setMainTab('chats')}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', height: 'auto' }}
                    >
                        <i className="fas fa-comments"></i>
                        {isArabic ? 'المحادثات' : 'Chats'}
                    </button>
                </div>
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
                                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' }}>
                                    {categories.map(cat => (
                                        <button 
                                            key={cat} 
                                            className={`dash-btn ${activeCategory === cat ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                                            onClick={() => setActiveCategory(cat)}
                                            style={{ borderRadius: '24px', padding: '6px 20px', fontSize: '0.85rem', height: 'auto' }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                                <div className="dash-grid">
                                    {requests.filter(r => (r.product || 'عام') === activeCategory).map((req, i) => (
                                        <div key={i} className="dash-card animate-slide-in">
                                            <div style={{ fontWeight: '700', marginBottom: '12px', color: 'var(--dash-text)', fontSize: '1.05rem' }}>{req.customerName}</div>
                                            <div style={{ background: 'rgba(var(--color-text-rgb), 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--dash-border)', fontSize: '0.9rem', marginBottom: '15px', color: 'var(--dash-text)', lineHeight: '1.5' }}>{req.message}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--dash-text-sec)', opacity: 0.8 }}>{new Date(req.date?._seconds * 1000 || req.date).toLocaleString()}</div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {mainTab === 'chats' && (
                    <motion.div key="chats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div style={{ display: 'flex', height: '600px', borderRadius: '24px', overflow: 'hidden', background: 'var(--dash-card)', border: '1px solid var(--dash-border)' }}>
                            <div style={{ width: '280px', borderInlineEnd: '1px solid var(--dash-border)', background: 'rgba(var(--color-text-rgb), 0.02)', overflowY: 'auto' }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dash-border)', fontSize: '0.8rem', fontWeight: '800', color: 'var(--dash-text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {isArabic ? 'المحادثات' : 'Chats'} ({chats.length})
                                </div>
                                {chats.map(c => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => setActiveChatUser(c.id)} 
                                        style={{ 
                                            padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid var(--dash-border)', 
                                            background: activeChatUser === c.id ? 'rgba(var(--primary-color-rgb), 0.08)' : 'none', 
                                            borderInlineStart: activeChatUser === c.id ? '4px solid var(--primary-color)' : 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ fontWeight: '700', color: 'var(--dash-text)', fontSize: '0.9rem' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--dash-text-sec)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px' }}>{c.lastMessage}</div>
                                    </div>
                                ))}
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--dash-bg)' }}>
                                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {messages.map((m, i) => (
                                        <div 
                                            key={i} 
                                            style={{ 
                                                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start', 
                                                maxWidth: '75%', padding: '12px 18px', borderRadius: '18px', 
                                                background: m.sender === 'user' ? 'var(--primary-color)' : 'var(--dash-card)', 
                                                color: m.sender === 'user' ? 'white' : 'var(--dash-text)', 
                                                border: m.sender !== 'user' ? '1px solid var(--dash-border)' : 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                fontSize: '0.9rem', lineHeight: '1.5'
                                            }}
                                        >
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
