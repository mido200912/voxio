import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion, AnimatePresence } from 'framer-motion';
import PageLoader from '../../components/PageLoader';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';

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


    // ─── PREMIUM STYLES ────────────────────────────────────────────────────────
    const s = {
        wrapper: { padding: '32px', fontFamily: 'inherit', direction: isArabic ? 'rtl' : 'ltr' },
        header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(38, 165, 228, 0.1) 0%, rgba(38, 165, 228, 0.02) 100%)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(38, 165, 228, 0.15)' },
        icon: { width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #26A5E4, #1B7DAE)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', boxShadow: '0 10px 20px rgba(38, 165, 228, 0.3)' },
        mainTabs: { display: 'flex', gap: '8px', background: 'var(--color-card-bg)', padding: '6px', borderRadius: '16px', width: 'fit-content', marginBottom: '32px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
        mainTab: (active) => ({
            padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontWeight: active ? '700' : '500', fontSize: '0.95rem',
            background: active ? '#26A5E4' : 'transparent',
            color: active ? '#ffffff' : 'var(--color-text-secondary)',
            boxShadow: active ? '0 4px 12px rgba(38, 165, 228, 0.3)' : 'none',
            transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center'
        }),
        categoryBar: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' },
        catBtn: (active) => ({
            padding: '8px 20px', borderRadius: '24px', border: '1px solid',
            borderColor: active ? '#26A5E4' : 'var(--color-border)',
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.3s',
            background: active ? 'rgba(38, 165, 228, 0.1)' : 'var(--color-card-bg)',
            color: active ? '#26A5E4' : 'var(--color-text-secondary)',
            fontWeight: active ? '700' : '500'
        }),
        card: { background: 'var(--color-card-bg)', borderRadius: '20px', padding: '24px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
        chatLayout: { display: 'flex', gap: '0', height: '600px', border: '1px solid var(--color-border)', borderRadius: '24px', overflow: 'hidden', background: 'var(--color-bg)', boxShadow: '0 15px 40px rgba(0,0,0,0.05)' },
        sidebar: { width: '280px', borderInlineEnd: '1px solid var(--color-border)', overflowY: 'auto', background: 'var(--color-card-bg)', flexShrink: 0 },
        userItem: (active) => ({
            padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)',
            background: active ? 'rgba(38, 165, 228, 0.05)' : 'transparent',
            borderInlineStart: active ? '4px solid #26A5E4' : '4px solid transparent',
            transition: 'all 0.2s ease'
        }),
        messagesArea: { flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' },
        messagesBody: { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' },
        bubble: (sender) => ({
            maxWidth: '75%', padding: '12px 18px', 
            borderRadius: sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
            background: sender === 'user' ? 'linear-gradient(135deg, #26A5E4, #1B7DAE)' : 'var(--color-card-bg)',
            color: sender === 'user' ? 'white' : 'var(--color-text)',
            alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
            fontSize: '0.95rem', lineHeight: '1.5', wordBreak: 'break-word',
            border: sender !== 'user' ? '1px solid var(--color-border)' : 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }),
    };

    return (
        <div style={s.wrapper}>
            {/* Header */}
            <div style={s.header}>
                <div style={s.icon}><i className="fab fa-telegram-plane" /></div>
                <div>
                    <h1 style={{ fontSize: '1.7rem', color: 'var(--color-text)', margin: 0 }}>
                        {isArabic ? 'تليجرام' : 'Telegram'}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                        {isArabic ? 'إدارة المحادثات والطلبات الواردة' : 'Manage conversations & incoming requests'}
                    </p>
                </div>
            </div>

            {/* Main Tabs */}
            <div style={s.mainTabs}>
                <button style={s.mainTab(mainTab === 'requests')} onClick={() => setMainTab('requests')}>
                    <i className="fas fa-inbox" style={{ marginInlineEnd: '6px' }} />
                    {isArabic ? 'الطلبات' : 'Requests'}
                </button>
                <button style={s.mainTab(mainTab === 'chats')} onClick={() => setMainTab('chats')}>
                    <i className="fas fa-comments" style={{ marginInlineEnd: '6px' }} />
                    {isArabic ? 'المحادثات' : 'Chats'}
                </button>
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
                                <div style={s.categoryBar}>
                                    {categories.map(cat => (
                                        <button key={cat} style={s.catBtn(activeCategory === cat)} onClick={() => setActiveCategory(cat)}>
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Cards Grid */}
                                <motion.div style={s.grid}>
                                    <AnimatePresence>
                                        {filteredRequests.map((req, idx) => (
                                            <motion.div key={idx} style={s.card} layout
                                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '1rem' }}>
                                                            <i className="fas fa-user-circle" style={{ marginInlineEnd: '6px', color: '#26A5E4' }} />
                                                            {req.customerName}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '3px' }}>
                                                            {req.product && <span style={{ background: 'rgba(38, 165, 228, 0.1)', color: '#26A5E4', borderRadius: '8px', padding: '2px 8px', marginInlineEnd: '6px', fontSize: '0.78rem' }}>{req.product}</span>}
                                                            {formatFullDate(req.date)}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => deleteRequest(idx)}
                                                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                                                        <i className="fas fa-trash" />
                                                    </button>
                                                </div>
                                                <div style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text)' }}>
                                                    {req.message}
                                                </div>
                                                {req.aiReply && (
                                                    <div style={{ marginTop: '12px', background: 'rgba(38, 165, 228, 0.05)', padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', color: '#26A5E4', border: '1px solid rgba(38, 165, 228, 0.2)' }}>
                                                        <i className="fas fa-robot" style={{ marginInlineEnd: '6px' }} />
                                                        {req.aiReply}
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    {filteredRequests.length === 0 && (
                                        <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                                            {isArabic ? 'لا توجد طلبات في هذا القسم' : 'No requests in this category'}
                                        </div>
                                    )}
                                </motion.div>
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
                            <div style={s.chatLayout}>
                                {/* Sidebar */}
                                <div style={s.sidebar}>
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {isArabic ? 'المحادثات' : 'Chats'} ({chats.length})
                                    </div>
                                    {chats.map(chat => (
                                        <div key={chat.id} style={s.userItem(activeChatUser === chat.id)} onClick={() => setActiveChatUser(chat.id)}>
                                            <div style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#26A5E4', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>
                                                    {(chat.name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.name}</span>
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingInlineStart: '40px' }}>
                                                {chat.lastMessage}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Chat Area */}
                                <div style={s.messagesArea}>
                                    {activeChatUser ? (
                                        <>
                                            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', fontWeight: '600', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <i className="fab fa-telegram-plane" style={{ color: '#26A5E4' }} />
                                                {activeChatUser}
                                            </div>
                                            <div style={s.messagesBody}>
                                                {messages.length === 0 && (
                                                    <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', margin: 'auto', padding: '20px' }}>
                                                        {isArabic ? 'لا توجد رسائل' : 'No messages'}
                                                    </div>
                                                )}
                                                {messages.map((msg, idx) => (
                                                    <div key={idx} style={s.bubble(msg.sender)}>
                                                        {msg.text}
                                                        <div style={{ fontSize: '0.72rem', opacity: 0.65, marginTop: '4px' }}>
                                                            {formatTime(msg.createdAt)}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
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
