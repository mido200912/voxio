import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.app.vercel/api';

const WebsiteTab = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const token = localStorage.getItem('token');

    const [mainTab, setMainTab] = useState('requests');  // 'requests' | 'chats'
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
        fetchRequests();
        const interval = setInterval(fetchRequests, 15000); // Auto-refresh every 15s
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
            // Filter only website requests (by source field, message, or customerName fallback)
            const webRequests = res.data.filter(r => 
                r.source === 'web' || 
                (r.message && r.message.includes('طلب ويب')) ||
                (r.customerName && r.customerName.includes('عميل ويب'))
            );
            const reversed = [...webRequests].reverse();
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
            // Filter website only
            const webChats = res.data.filter(c => c.platform === 'web');
            setChats(webChats);
            if (webChats.length > 0 && !activeChatUser) setActiveChatUser(webChats[0].id);
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
            // Need the actual DB index in the unfiltered array
            // It's safer to fetch all and find the actual _id, but currently backend uses array index.
            // Assuming this must be handled carefully, we'll refetch.
            alert('To delete, please manage from general requests for now due to filtering mismatch.');
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

    // ─── STYLES ──────────────────────────────────────────────────────────
    const s = {
        wrapper: { padding: '24px', fontFamily: 'inherit', direction: isArabic ? 'rtl' : 'ltr' },
        header: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' },
        icon: { width: '52px', height: '52px', borderRadius: '14px', background: '#eab30815', color: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' },
        mainTabs: { display: 'flex', gap: '4px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '12px', width: 'fit-content', marginBottom: '24px' },
        mainTab: (active) => ({
            padding: '8px 22px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontWeight: active ? '600' : '400', fontSize: '0.92rem',
            background: active ? 'var(--bg-primary)' : 'transparent',
            color: active ? '#eab308' : 'var(--text-secondary)',
            boxShadow: active ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s'
        }),
        categoryBar: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)' },
        catBtn: (active) => ({
            padding: '8px 18px', borderRadius: '20px', border: 'none', cursor: 'pointer',
            whiteSpace: 'nowrap', transition: 'all 0.2s',
            background: active ? '#eab308' : 'transparent',
            color: active ? 'white' : 'var(--text-secondary)',
            fontWeight: active ? '600' : '400'
        }),
        card: { background: 'var(--bg-secondary)', borderRadius: '16px', padding: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
        chatLayout: { display: 'flex', gap: '0', height: '520px', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' },
        sidebar: { width: '240px', borderInlineEnd: '1px solid var(--border-color)', overflowY: 'auto', background: 'var(--bg-secondary)', flexShrink: 0 },
        userItem: (active) => ({
            padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
            background: active ? '#eab30815' : 'transparent',
            borderInlineStart: active ? '3px solid #eab308' : '3px solid transparent',
            transition: 'background 0.15s'
        }),
        messagesArea: { flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' },
        messagesBody: { flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' },
        bubble: (sender) => ({
            maxWidth: '70%', padding: '10px 14px', borderRadius: sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: sender === 'user' ? '#eab308' : 'var(--bg-secondary)',
            color: sender === 'user' ? 'white' : 'var(--text-primary)',
            alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
            fontSize: '0.92rem', lineHeight: '1.5', wordBreak: 'break-word',
            border: sender !== 'user' ? '1px solid var(--border-color)' : 'none'
        }),
    };

    return (
        <div style={s.wrapper}>
            {/* Header */}
            <div style={s.header}>
                <div style={s.icon}><i className="fas fa-globe" /></div>
                <div>
                    <h1 style={{ fontSize: '1.7rem', color: 'var(--text-primary)', margin: 0 }}>
                        {isArabic ? 'طلبات الموقع' : 'Website'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                        {isArabic ? 'إدارة الطلبات والمحادثات القادمة من شات موقعك' : 'Manage requests & chats from your website'}
                    </p>
                </div>
            </div>

            {/* Main Tabs */}
            <div style={s.mainTabs}>
                <button style={s.mainTab(mainTab === 'requests')} onClick={() => setMainTab('requests')}>
                    <i className="fas fa-inbox" style={{ marginInlineEnd: '6px' }} />
                    {isArabic ? 'طلبات الويب' : 'Web Requests'}
                </button>
                <button style={s.mainTab(mainTab === 'chats')} onClick={() => setMainTab('chats')}>
                    <i className="fas fa-comments" style={{ marginInlineEnd: '6px' }} />
                    {isArabic ? 'محادثات الويب' : 'Web Chats'}
                </button>
            </div>

            {/* ─── REQUESTS TAB ─── */}
            <AnimatePresence mode="wait">
                {mainTab === 'requests' && (
                    <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px' }} />
                            </div>
                        ) : requests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '48px', color: '#eab308', marginBottom: '16px' }}><i className="fas fa-globe" /></div>
                                <h3>{isArabic ? 'لا توجد طلبات ويب بعد' : 'No web requests yet'}</h3>
                                <p>{isArabic ? 'ستظهر هنا طلبات عملائك من الموقع.' : 'Website orders will appear here.'}</p>
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
                                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1rem' }}>
                                                            <i className="fas fa-user-circle" style={{ marginInlineEnd: '6px', color: '#eab308' }} />
                                                            {req.customerName}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                                                            {req.product && <span style={{ background: '#eab30815', color: '#eab308', borderRadius: '8px', padding: '2px 8px', marginInlineEnd: '6px', fontSize: '0.78rem' }}>{req.product}</span>}
                                                            {formatFullDate(req.date)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '10px', whiteSpace: 'pre-line', border: '1px solid var(--border-color)', fontSize: '0.92rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                                                    {req.message}
                                                </div>
                                                {req.aiReply && (
                                                    <div style={{ marginTop: '10px', background: '#eab30810', padding: '10px 12px', borderRadius: '10px', fontSize: '0.88rem', color: '#eab308', border: '1px solid #eab30830' }}>
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
                            <div style={{ textAlign: 'center', padding: '60px' }}><i className="fas fa-spinner fa-spin" style={{ fontSize: '24px' }} /></div>
                        ) : chats.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '48px', color: '#eab308', marginBottom: '16px' }}><i className="fas fa-comments" /></div>
                                <h3>{isArabic ? 'لا توجد محادثات ويب بعد' : 'No web chats yet'}</h3>
                                <p>{isArabic ? 'محادثات الموقع ستظهر هنا.' : 'Website chats will appear here.'}</p>
                            </div>
                        ) : (
                            <div style={s.chatLayout}>
                                {/* Sidebar */}
                                <div style={s.sidebar}>
                                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {isArabic ? 'محادثات الموقع' : 'Web Chats'} ({chats.length})
                                    </div>
                                    {chats.map(chat => (
                                        <div key={chat.id} style={s.userItem(activeChatUser === chat.id)} onClick={() => setActiveChatUser(chat.id)}>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#eab308', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>
                                                    <i className="fas fa-globe"></i>
                                                </span>
                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.name}</span>
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingInlineStart: '40px' }}>
                                                {chat.lastMessage}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Chat Area */}
                                <div style={s.messagesArea}>
                                    {activeChatUser ? (
                                        <>
                                            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-color)', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <i className="fas fa-globe" style={{ color: '#eab308' }} />
                                                {isArabic ? 'زائر' : 'Visitor'}: {String(activeChatUser).substring(0,8)}...
                                            </div>
                                            <div style={s.messagesBody}>
                                                {messages.length === 0 && (
                                                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', margin: 'auto', padding: '20px' }}>
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
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
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

export default WebsiteTab;
