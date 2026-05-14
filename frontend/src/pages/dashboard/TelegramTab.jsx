import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import PageLoader from '../../components/PageLoader';
import './DashboardShared.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TelegramTab = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const token = secureStorage.getItem('token');

    const [mainTab, setMainTab] = useState('requests');  // 'requests' | 'chats'
    const [requests, setRequests] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('');
    const [chats, setChats] = useState([]);          // unique users (chat IDs)
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chatsLoading, setChatsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => { 
        fetchRequests();
        const interval = setInterval(fetchRequests, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => { 
        if (mainTab === 'chats') {
            fetchChats();
            const interval = setInterval(fetchChats, 15000);
            return () => clearInterval(interval);
        }
    }, [mainTab]);

    useEffect(() => { 
        if (activeChatUser) {
            fetchMessages(activeChatUser);
            const interval = setInterval(() => fetchMessages(activeChatUser), 10000);
            return () => clearInterval(interval);
        }
    }, [activeChatUser]);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BACKEND_URL}/company/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter out website requests to completely isolate Telegram from Web
            const tgRequests = res.data.filter(r => 
                r.source !== 'web' && 
                (!r.message || !r.message.includes('طلب ويب')) &&
                (!r.customerName || !r.customerName.includes('عميل ويب'))
            );
            const reversed = [...tgRequests].reverse();
            setRequests(reversed);
            const unique = [...new Set(reversed.map(r => r.product || 'عام'))];
            setCategories(unique);
            if (unique.length > 0) setActiveCategory(unique[0]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchChats = async () => {
        setChatsLoading(true);
        try {
            const res = await axios.get(`${BACKEND_URL}/support-chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter telegram only
            const tgChats = res.data.filter(c => c.platform === 'telegram');
            setChats(tgChats);
            if (tgChats.length > 0 && !activeChatUser) setActiveChatUser(tgChats[0].id);
        } catch (e) {
            console.error(e);
        } finally {
            setChatsLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const res = await axios.get(`${BACKEND_URL}/support-chat/history/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const deleteRequest = async (originalIndex) => {
        if (!confirm(isArabic ? 'متأكد من حذف هذا الطلب؟' : 'Delete this request?')) return;
        try {
            const actualDbIndex = requests.length - 1 - originalIndex;
            await axios.delete(`${BACKEND_URL}/company/requests/${actualDbIndex}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRequests();
        } catch (e) {
            console.error(e);
        }
    };

    const filteredRequests = requests.filter(r => (r.product || 'عام') === activeCategory);

    const formatTime = (val) => {
        if (!val) return '';
        const d = val?._seconds ? new Date(val._seconds * 1000) : new Date(val);
        return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatFullDate = (val) => {
        if (!val) return '';
        const d = val?._seconds ? new Date(val._seconds * 1000) : new Date(val);
        return isNaN(d.getTime()) ? '' : d.toLocaleString();
    };


    return (
        <div className="telegram-tab-page animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="dash-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #26A5E4, #1B7DAE)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(38, 165, 228, 0.2)' }}>
                        <i className="fab fa-telegram-plane" />
                    </div>
                    <div>
                        <h1 className="dash-page-title">{isArabic ? 'تليجرام' : 'Telegram'}</h1>
                        <p className="dash-page-subtitle">{isArabic ? 'إدارة المحادثات والطلبات الواردة' : 'Manage conversations & incoming requests'}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', background: 'var(--dash-card)', padding: '6px', borderRadius: '14px', border: '1px solid var(--dash-border)' }}>
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

            {/* ─── REQUESTS TAB ─── */}
            <AnimatePresence mode="wait">
                {mainTab === 'requests' && (
                    <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {loading ? (
                            <PageLoader text={isArabic ? 'جاري تحميل الطلبات...' : 'Loading requests...'} />
                        ) : requests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '48px', color: '#26A5E4', marginBottom: '16px' }}><i className="fab fa-telegram-plane" /></div>
                                <h3>{isArabic ? 'لا توجد طلبات بعد' : 'No requests yet'}</h3>
                                <p>{isArabic ? 'فعّل التليجرام وأعدّ أوامر من صفحة التكاملات.' : 'Enable Telegram & configure commands in Integrations.'}</p>
                            </div>
                        ) : (
                            <>
                                {/* Category Tabs */}
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

                                {/* Cards Grid */}
                                <div className="dash-grid">
                                    <AnimatePresence>
                                        {filteredRequests.map((req, idx) => (
                                            <motion.div key={idx} className="dash-card animate-slide-in" layout
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '700', color: 'var(--dash-text)', fontSize: '1rem' }}>
                                                            <i className="fas fa-user-circle" style={{ marginInlineEnd: '8px', color: '#26A5E4' }} />
                                                            {req.customerName}
                                                        </div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--dash-text-sec)', marginTop: '4px' }}>
                                                            {req.product && <span style={{ background: 'rgba(38, 165, 228, 0.1)', color: '#26A5E4', borderRadius: '6px', padding: '2px 8px', marginInlineEnd: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>{req.product}</span>}
                                                            {formatFullDate(req.date)}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => deleteRequest(idx)}
                                                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', opacity: 0.6 }}>
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                </div>
                                                <div style={{ background: 'rgba(var(--color-text-rgb), 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--dash-border)', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--dash-text)' }}>
                                                    {req.message}
                                                </div>
                                                {req.aiReply && (
                                                    <div style={{ marginTop: '12px', background: 'rgba(38, 165, 228, 0.05)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.85rem', color: '#26A5E4', border: '1px solid rgba(38, 165, 228, 0.1)' }}>
                                                        <i className="fas fa-robot" style={{ marginInlineEnd: '6px' }} />
                                                        {req.aiReply}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {filteredRequests.length === 0 && (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--dash-text-sec)', padding: '40px' }}>
                                            {isArabic ? 'لا توجد طلبات في هذا القسم' : 'No requests in this category'}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                )}

                {/* ─── CHATS TAB ─── */}
                {mainTab === 'chats' && (
                    <motion.div key="chats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {chatsLoading ? (
                            <PageLoader text={isArabic ? 'جاري تحميل المحادثات...' : 'Loading chats...'} />
                        ) : chats.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '48px', color: '#26A5E4', marginBottom: '16px' }}><i className="fas fa-comments" /></div>
                                <h3>{isArabic ? 'لا توجد محادثات بعد' : 'No chats yet'}</h3>
                                <p>{isArabic ? 'سيظهر هنا كل من تحدث مع البوت.' : 'Everyone who chats with the bot will appear here.'}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', height: '600px', borderRadius: '24px', overflow: 'hidden', background: 'var(--dash-card)', border: '1px solid var(--dash-border)' }}>
                                {/* Sidebar */}
                                <div style={{ width: '280px', borderInlineEnd: '1px solid var(--dash-border)', overflowY: 'auto', background: 'rgba(var(--color-text-rgb), 0.02)', flexShrink: 0 }}>
                                    <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dash-border)', fontSize: '0.8rem', fontWeight: '800', color: 'var(--dash-text-sec)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {isArabic ? 'المحادثات' : 'Chats'} ({chats.length})
                                    </div>
                                    {chats.map(chat => (
                                        <div 
                                            key={chat.id} 
                                            onClick={() => setActiveChatUser(chat.id)}
                                            style={{
                                                padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid var(--dash-border)',
                                                background: activeChatUser === chat.id ? 'rgba(38, 165, 228, 0.08)' : 'transparent',
                                                borderInlineStart: activeChatUser === chat.id ? '4px solid #26A5E4' : '4px solid transparent',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ fontWeight: '700', color: 'var(--dash-text)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#26A5E4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0, fontWeight: 'bold' }}>
                                                    {(chat.name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.name}</span>
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--dash-text-sec)', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingInlineStart: '42px' }}>
                                                {chat.lastMessage}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Chat Area */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--dash-bg)' }}>
                                    {activeChatUser ? (
                                        <>
                                            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--dash-border)', fontWeight: '700', color: 'var(--dash-text)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--dash-card)' }}>
                                                <i className="fab fa-telegram-plane" style={{ color: '#26A5E4' }} />
                                                {activeChatUser}
                                            </div>
                                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {messages.length === 0 && (
                                                    <div style={{ textAlign: 'center', color: 'var(--dash-text-sec)', margin: 'auto', padding: '20px' }}>
                                                        {isArabic ? 'لا توجد رسائل' : 'No messages'}
                                                    </div>
                                                )}
                                                {messages.map((msg, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        style={{
                                                            maxWidth: '75%', padding: '12px 18px', 
                                                            borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                            background: msg.sender === 'user' ? 'linear-gradient(135deg, #26A5E4, #1B7DAE)' : 'var(--dash-card)',
                                                            color: msg.sender === 'user' ? 'white' : 'var(--dash-text)',
                                                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                                            fontSize: '0.9rem', lineHeight: '1.5', wordBreak: 'break-word',
                                                            border: msg.sender !== 'user' ? '1px solid var(--dash-border)' : 'none',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                                        }}
                                                    >
                                                        {msg.text}
                                                        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '6px', textAlign: 'end' }}>
                                                            {formatTime(msg.createdAt)}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--dash-text-sec)' }}>
                                            {isArabic ? 'اختر محادثة من القائمة' : 'Select a chat'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TelegramTab;
