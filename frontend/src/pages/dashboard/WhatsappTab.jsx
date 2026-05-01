import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion, AnimatePresence } from 'framer-motion';
import PageLoader from '../../components/PageLoader';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';

const WhatsappTab = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const token = secureStorage.getItem('token');

    const [subTab, setSubTab] = useState('inbox'); // 'inbox' | 'settings'
    const [settings, setSettings] = useState({
        website: '',
        about: '',
        products: '',
        facebook: '',
        instagram: '',
        contactPhone: ''
    });
    
    const [chats, setChats] = useState([]);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [chatsLoading, setChatsLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => { 
        fetchSettings();
        fetchChats();
        const interval = setInterval(fetchChats, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => { 
        if (activeChatUser) {
            fetchMessages(activeChatUser);
            const interval = setInterval(() => fetchMessages(activeChatUser), 10000);
            return () => clearInterval(interval);
        }
    }, [activeChatUser]);

    useEffect(() => { 
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); 
    }, [messages]);

    const fetchSettings = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/integration-manager/whatsapp/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.settings) {
                setSettings(prev => ({ ...prev, ...res.data.settings }));
            }
        } catch (e) {
            console.error("Error fetching settings:", e);
        }
    };

    const handleSaveSettings = async () => {
        setSaveLoading(true);
        try {
            await axios.put(`${BACKEND_URL}/integration-manager/whatsapp/settings`, settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(isArabic ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
        } catch (e) {
            alert(isArabic ? 'فشل حفظ الإعدادات.' : 'Failed to save settings.');
        } finally {
            setSaveLoading(false);
        }
    };

    const fetchChats = async () => {
        setChatsLoading(true);
        try {
            const res = await axios.get(`${BACKEND_URL}/support-chat/conversations`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const waChats = res.data.filter(c => c.platform === 'whatsapp');
            setChats(waChats);
            if (waChats.length > 0 && !activeChatUser) setActiveChatUser(waChats[0].id);
        } catch (e) {
            console.error(e);
        } finally {
            setChatsLoading(false);
            setLoading(false);
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

    const formatTime = (val) => {
        if (!val) return '';
        const d = val?._seconds ? new Date(val._seconds * 1000) : new Date(val);
        return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // ─── PREMIUM STYLES ────────────────────────────────────────────────────────
    const s = {
        wrapper: { padding: '32px', fontFamily: 'inherit', direction: isArabic ? 'rtl' : 'ltr' },
        header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.1) 0%, rgba(37, 211, 102, 0.02) 100%)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(37, 211, 102, 0.15)' },
        icon: { width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', boxShadow: '0 10px 20px rgba(37, 211, 102, 0.3)' },
        mainTabs: { display: 'flex', gap: '8px', background: 'var(--color-card-bg)', padding: '6px', borderRadius: '16px', width: 'fit-content', marginBottom: '32px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
        mainTab: (active) => ({
            padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontWeight: active ? '700' : '500', fontSize: '0.95rem',
            background: active ? '#25D366' : 'transparent',
            color: active ? '#ffffff' : 'var(--color-text-secondary)',
            boxShadow: active ? '0 4px 12px rgba(37, 211, 102, 0.3)' : 'none',
            transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center'
        }),
        chatLayout: { display: 'flex', gap: '0', height: '600px', border: '1px solid var(--color-border)', borderRadius: '24px', overflow: 'hidden', background: 'var(--color-bg)', boxShadow: '0 15px 40px rgba(0,0,0,0.05)' },
        sidebar: { width: '280px', borderInlineEnd: '1px solid var(--color-border)', overflowY: 'auto', background: 'var(--color-card-bg)', flexShrink: 0 },
        userItem: (active) => ({
            padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid var(--color-border)',
            background: active ? 'rgba(37, 211, 102, 0.05)' : 'transparent',
            borderInlineStart: active ? '4px solid #25D366' : '4px solid transparent',
            transition: 'all 0.2s ease'
        }),
        messagesArea: { flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg)' },
        messagesBody: { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover', backgroundBlendMode: 'overlay', opacity: 0.95 },
        bubble: (sender) => ({
            maxWidth: '75%', padding: '12px 18px', 
            borderRadius: sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
            background: sender === 'user' ? '#128C7E' : 'var(--color-card-bg)',
            color: sender === 'user' ? 'white' : 'var(--color-text)',
            alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
            fontSize: '0.95rem', lineHeight: '1.5', wordBreak: 'break-word',
            border: sender !== 'user' ? '1px solid var(--color-border)' : 'none',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }),
        settingsForm: {
            background: 'var(--color-card-bg)', padding: '32px', borderRadius: '24px',
            border: '1px solid var(--color-border)', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px'
        },
        inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
        label: { fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--color-text)' },
        input: { padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.95rem' },
        textarea: { padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: '0.95rem', minHeight: '100px', resize: 'vertical' },
        saveBtn: { background: '#25D366', color: 'white', border: 'none', padding: '14px 32px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-start', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)', transition: 'all 0.2s ease' }
    };

    if (loading) return <PageLoader text={isArabic ? 'جاري التحميل...' : 'Loading...'} />;

    return (
        <div style={s.wrapper}>
            <div style={s.header}>
                <div style={s.icon}><i className="fab fa-whatsapp" /></div>
                <div>
                    <h1 style={{ fontSize: '1.7rem', color: 'var(--text-primary)', margin: 0 }}>
                        {isArabic ? 'واتساب' : 'WhatsApp'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                        {isArabic ? 'إدارة رسائل ومحادثات الواتساب' : 'Manage WhatsApp messages and chats'}
                    </p>
                </div>
            </div>

            <div style={s.mainTabs}>
                <button style={s.mainTab(subTab === 'inbox')} onClick={() => setSubTab('inbox')}>
                    <i className="fas fa-comments" style={{ marginInlineEnd: '6px' }} />
                    {isArabic ? 'صندوق الرسائل' : 'Chat Inbox'}
                </button>
                <button style={s.mainTab(subTab === 'settings')} onClick={() => setSubTab('settings')}>
                    <i className="fas fa-cog" style={{ marginInlineEnd: '6px' }} />
                    {isArabic ? 'إعدادات الشركة' : 'Company Profile'}
                </button>
            </div>

            <AnimatePresence mode="wait">
                {subTab === 'inbox' ? (
                    <motion.div key="inbox" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        {chats.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '48px', color: '#25D366', marginBottom: '16px' }}><i className="fab fa-whatsapp" /></div>
                                <h3>{isArabic ? 'لا توجد محادثات واتساب بعد' : 'No WhatsApp chats yet'}</h3>
                                <p>{isArabic ? 'بمجرد أن يراسلك شخص عبر واتساب سيظهر هنا.' : 'Whenever someone messages you on WhatsApp, they will appear here.'}</p>
                            </div>
                        ) : (
                            <div style={s.chatLayout}>
                                {/* Sidebar */}
                                <div style={s.sidebar}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)', background: 'var(--color-card-bg)' }}>
                                        {isArabic ? 'المحادثات' : 'Chats'} ({chats.length})
                                    </div>
                                    {chats.map(chat => (
                                        <div key={chat.id} style={s.userItem(activeChatUser === chat.id)} onClick={() => setActiveChatUser(chat.id)}>
                                            <div style={{ fontWeight: 'bold', color: 'var(--color-text)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                                                    {(chat.name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.name || chat.id}</span>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {chat.lastMessage || (isArabic ? 'بدء محادثة جديدة' : 'New chat started')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Chat Area */}
                                <div style={s.messagesArea}>
                                    {activeChatUser ? (
                                        <>
                                            <div style={{ padding: '12px 18px', background: 'var(--color-card-bg)', borderBottom: '1px solid var(--color-border)', fontWeight: 'bold', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                                                    {activeChatUser.charAt(0).toUpperCase()}
                                                </span>
                                                {activeChatUser}
                                            </div>
                                            <div style={s.messagesBody}>
                                                {messages.length === 0 && (
                                                    <div style={{ textAlign: 'center', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.2)', padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', color: '#25D366', margin: 'auto' }}>
                                                        {isArabic ? 'هذه بداية رسائلك مع هذا الرقم.' : 'This is the beginning of the chat.'}
                                                    </div>
                                                )}
                                                {messages.map((msg, idx) => (
                                                    <div key={idx} style={s.bubble(msg.sender)}>
                                                        <div style={{ color: msg.sender === 'user' ? 'rgba(255,255,255,0.8)' : 'var(--color-text-secondary)', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '2px' }}>
                                                            {msg.sender === 'user' ? (isArabic ? 'العميل' : 'Customer') : 'VOXIO Bot'}
                                                        </div>
                                                        {msg.text}
                                                        <div style={{ fontSize: '0.7rem', color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--color-text-secondary)', marginTop: '4px', textAlign: 'right' }}>
                                                            {formatTime(msg.createdAt)}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontSize: '1.1rem' }}>
                                            {isArabic ? 'اختر محادثة لعرض الرسائل' : 'Select a chat to view messages'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="settings" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                        <div style={s.settingsForm}>
                            <h3 style={{ margin: 0, color: '#25D366' }}>{isArabic ? 'بيانات الشركة للواتساب' : 'Company Data for WhatsApp'}</h3>
                            <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                {isArabic ? 'هذه المعلومات ستساعد الذكاء الاصطناعي على الرد بدقة أكبر على عملائك.' : 'This information helps the AI respond more accurately to your customers.'}
                            </p>

                            <div style={s.inputGroup}>
                                <label style={s.label}>{isArabic ? 'رابط الموقع الإلكتروني' : 'Website URL'}</label>
                                <input 
                                    style={s.input} 
                                    placeholder="https://example.com" 
                                    value={settings.website}
                                    onChange={e => setSettings({...settings, website: e.target.value})}
                                />
                            </div>

                            <div style={s.inputGroup}>
                                <label style={s.label}>{isArabic ? 'عن الشركة (نبذة)' : 'About Company'}</label>
                                <textarea 
                                    style={s.textarea} 
                                    placeholder={isArabic ? 'اكتب نبذة مختصرة عن نشاط شركتك...' : 'Briefly describe your company...'}
                                    value={settings.about}
                                    onChange={e => setSettings({...settings, about: e.target.value})}
                                />
                            </div>

                            <div style={s.inputGroup}>
                                <label style={s.label}>{isArabic ? 'قائمة المنتجات والخدمات' : 'Products & Services'}</label>
                                <textarea 
                                    style={s.textarea} 
                                    placeholder={isArabic ? 'مثال: منتج أ (100 جنيه)، خدمة ب (200 جنيه)...' : 'Example: Product A ($100), Service B ($200)...'}
                                    value={settings.products}
                                    onChange={e => setSettings({...settings, products: e.target.value})}
                                />
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                                <div style={{ ...s.inputGroup, flex: '1 1 300px' }}>
                                    <label style={s.label}>{isArabic ? 'رابط فيسبوك' : 'Facebook Link'}</label>
                                    <input 
                                        style={s.input} 
                                        placeholder="https://facebook.com/..." 
                                        value={settings.facebook}
                                        onChange={e => setSettings({...settings, facebook: e.target.value})}
                                    />
                                </div>
                                <div style={{ ...s.inputGroup, flex: '1 1 300px' }}>
                                    <label style={s.label}>{isArabic ? 'رابط إنستجرام' : 'Instagram Link'}</label>
                                    <input 
                                        style={s.input} 
                                        placeholder="https://instagram.com/..." 
                                        value={settings.instagram}
                                        onChange={e => setSettings({...settings, instagram: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div style={s.inputGroup}>
                                <label style={s.label}>{isArabic ? 'رقم موبايل إضافي للتواصل' : 'Additional Contact Phone'}</label>
                                <input 
                                    style={s.input} 
                                    placeholder="+201234567890" 
                                    value={settings.contactPhone}
                                    onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                                />
                            </div>

                            <button style={s.saveBtn} onClick={handleSaveSettings} disabled={saveLoading}>
                                {saveLoading ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ الإعدادات' : 'Save Settings')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WhatsappTab;
