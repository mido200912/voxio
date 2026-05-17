import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion, AnimatePresence } from 'framer-motion';  
import PageLoader from '../../components/PageLoader';
import './DashboardShared.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WhatsappTab = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const token = secureStorage.getItem('token');

    const [subTab, setSubTab] = useState('requests'); // 'requests' | 'inbox' | 'settings'
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
    const [requests, setRequests] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatsLoading, setChatsLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => { 
        fetchSettings();
        fetchChats();
        fetchRequests();
        const chatsInterval = setInterval(fetchChats, 15000);
        const reqInterval = setInterval(fetchRequests, 15000);
        return () => {
            clearInterval(chatsInterval);
            clearInterval(reqInterval);
        };
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

    const fetchRequests = async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/company/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter out WhatsApp-only requests
            const waRequests = res.data.filter(r => 
                r.source === 'whatsapp' || 
                (r.message && (r.message.includes('واتساب') || r.message.includes('whatsapp')))
            );
            const reversed = [...waRequests].reverse();
            setRequests(reversed);
            const unique = [...new Set(reversed.map(r => r.product || 'عام'))];
            setCategories(unique);
            if (unique.length > 0) setActiveCategory(unique[0]);
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
    return (
        <div className="whatsapp-tab-page animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="dash-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #25D366, #128C7E)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(37, 211, 102, 0.2)' }}>
                        <i className="fab fa-whatsapp" />
                    </div>
                    <div>
                        <h1 className="dash-page-title">{isArabic ? 'واتساب' : 'WhatsApp'}</h1>
                        <p className="dash-page-subtitle">{isArabic ? 'إدارة رسائل ومحادثات الواتساب' : 'Manage WhatsApp messages and chats'}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', background: 'var(--dash-card)', padding: '6px', borderRadius: '14px', border: '1px solid var(--dash-border)' }}>
                    <button 
                        className={`dash-btn ${subTab === 'requests' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setSubTab('requests')}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', height: 'auto' }}
                    >
                        <i className="fas fa-inbox"></i>
                        {isArabic ? 'الطلبات' : 'Requests'}
                    </button>
                    <button 
                        className={`dash-btn ${subTab === 'inbox' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setSubTab('inbox')}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', height: 'auto' }}
                    >
                        <i className="fas fa-comments"></i>
                        {isArabic ? 'الرسائل' : 'Inbox'}
                    </button>
                    <button 
                        className={`dash-btn ${subTab === 'settings' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setSubTab('settings')}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', height: 'auto' }}
                    >
                        <i className="fas fa-id-card"></i>
                        {isArabic ? 'البروفايل' : 'Profile'}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {subTab === 'requests' ? (
                    <motion.div key="requests" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {loading ? (
                            <PageLoader text={isArabic ? 'جاري تحميل الطلبات...' : 'Loading requests...'} />
                        ) : requests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '48px', color: '#25D366', marginBottom: '16px' }}><i className="fab fa-whatsapp" /></div>
                                <h3>{isArabic ? 'لا توجد طلبات بعد' : 'No requests yet'}</h3>
                                <p>{isArabic ? 'سيظهر هنا كل طلب شراء يتم فهمه تلقائياً بواسطة المساعد الذكي عبر واتساب.' : 'Requests understood by the AI Assistant on WhatsApp will populate here.'}</p>
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
                                            style={{ borderRadius: '24px', padding: '6px 20px', fontSize: '0.85rem', height: 'auto', background: activeCategory === cat ? '#25D366' : 'transparent', borderColor: activeCategory === cat ? '#25D366' : 'var(--dash-border)', color: activeCategory === cat ? '#fff' : 'var(--dash-text)' }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Cards Grid */}
                                <div className="dash-grid">
                                    <AnimatePresence>
                                        {requests.filter(r => (r.product || 'عام') === activeCategory).map((req, idx) => {
                                            const cleanPhone = (req.customerName || '').match(/\((.*?)\)/)?.[1] || '';
                                            const cleanName = (req.customerName || '').replace(/\(.*?\)/, '').trim();

                                            return (
                                                <motion.div key={idx} className="dash-card animate-slide-in" layout
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                        <div>
                                                            <div style={{ fontWeight: '700', color: 'var(--dash-text)', fontSize: '1rem' }}>
                                                                <i className="fas fa-user-circle" style={{ marginInlineEnd: '8px', color: '#25D366' }} />
                                                                {cleanName}
                                                            </div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--dash-text-sec)', marginTop: '4px' }}>
                                                                {req.product && <span style={{ background: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderRadius: '6px', padding: '2px 8px', marginInlineEnd: '8px', fontSize: '0.7rem', fontWeight: 'bold' }}>{req.product}</span>}
                                                                {req.date ? (new Date(req.date)).toLocaleString() : ''}
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
                                                    
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                                        {cleanPhone && (
                                                            <a 
                                                                href={`https://wa.me/${cleanPhone.replace(/[^0-9]/g, '')}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="dash-btn"
                                                                style={{ flex: 1, padding: '8px 12px', fontSize: '0.8rem', background: '#25D366', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', height: 'auto', borderRadius: '10px' }}
                                                            >
                                                                <i className="fab fa-whatsapp" />
                                                                {isArabic ? 'مراسلة واتساب' : 'Chat WhatsApp'}
                                                            </a>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </motion.div>
                ) : subTab === 'inbox' ? (
                    <motion.div key="inbox" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                        {chats.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                                <div style={{ fontSize: '48px', color: '#25D366', marginBottom: '16px' }}><i className="fab fa-whatsapp" /></div>
                                <h3>{isArabic ? 'لا توجد محادثات واتساب بعد' : 'No WhatsApp chats yet'}</h3>
                                <p>{isArabic ? 'بمجرد أن يراسلك شخص عبر واتساب سيظهر هنا.' : 'Whenever someone messages you on WhatsApp, they will appear here.'}</p>
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
                                                background: activeChatUser === chat.id ? 'rgba(37, 211, 102, 0.08)' : 'transparent',
                                                borderInlineStart: activeChatUser === chat.id ? '4px solid #25D366' : '4px solid transparent',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ fontWeight: '700', color: 'var(--dash-text)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0, fontWeight: 'bold' }}>
                                                    {(chat.name || 'U').charAt(0).toUpperCase()}
                                                </span>
                                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.name || chat.id}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--dash-text-sec)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                                        {chat.lastMessage || (isArabic ? 'بدء محادثة جديدة' : 'New chat started')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Chat Area */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--dash-bg)' }}>
                                    {activeChatUser ? (
                                        <>
                                            <div style={{ padding: '16px 20px', background: 'var(--dash-card)', borderBottom: '1px solid var(--dash-border)', fontWeight: '700', color: 'var(--dash-text)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold' }}>
                                                    {activeChatUser.charAt(0).toUpperCase()}
                                                </span>
                                                {activeChatUser}
                                            </div>
                                            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover', backgroundBlendMode: 'overlay', backgroundOpacity: 0.05 }}>
                                                {messages.length === 0 && (
                                                    <div style={{ textAlign: 'center', background: 'rgba(37, 211, 102, 0.1)', border: '1px solid rgba(37, 211, 102, 0.15)', padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', color: '#128C7E', margin: 'auto', fontWeight: 'bold' }}>
                                                        {isArabic ? 'هذه بداية رسائلك مع هذا الرقم.' : 'This is the beginning of the chat.'}
                                                    </div>
                                                )}
                                                {messages.map((msg, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        style={{
                                                            maxWidth: '75%', padding: '12px 18px', 
                                                            borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                                                            background: msg.sender === 'user' ? '#128C7E' : 'var(--dash-card)',
                                                            color: msg.sender === 'user' ? 'white' : 'var(--dash-text)',
                                                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                                            fontSize: '0.9rem', lineHeight: '1.5', wordBreak: 'break-word',
                                                            border: msg.sender !== 'user' ? '1px solid var(--dash-border)' : 'none',
                                                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                                        }}
                                                    >
                                                        <div style={{ color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'var(--dash-text-sec)', fontSize: '0.7rem', fontWeight: '800', marginBottom: '4px' }}>
                                                            {msg.sender === 'user' ? (isArabic ? 'العميل' : 'Customer') : 'VOXIO Bot'}
                                                        </div>
                                                        {msg.text}
                                                        <div style={{ fontSize: '0.7rem', color: msg.sender === 'user' ? 'rgba(255,255,255,0.6)' : 'var(--dash-text-sec)', marginTop: '6px', textAlign: 'right' }}>
                                                            {formatTime(msg.createdAt)}
                                                        </div>
                                                    </div>
                                                ))}
                                                <div ref={messagesEndRef} />
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'var(--dash-bg)', color: 'var(--dash-text-sec)', fontSize: '1rem', fontWeight: '500' }}>
                                            {isArabic ? 'اختر محادثة لعرض الرسائل' : 'Select a chat to view messages'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div key="settings" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                        <div className="dash-card animate-slide-in" style={{ maxWidth: '800px' }}>
                            <h3 style={{ margin: '0 0 8px', color: '#25D366', fontSize: '1.2rem', fontWeight: '800' }}>{isArabic ? 'بيانات الشركة للواتساب' : 'Company Data for WhatsApp'}</h3>
                            <p style={{ margin: '0 0 24px', fontSize: '0.9rem', color: 'var(--dash-text-sec)' }}>
                                {isArabic ? 'هذه المعلومات ستساعد الذكاء الاصطناعي على الرد بدقة أكبر على عملائك.' : 'This information helps the AI respond more accurately to your customers.'}
                            </p>

                            <div className="dash-input-group">
                                <label className="dash-label">{isArabic ? 'رابط الموقع الإلكتروني' : 'Website URL'}</label>
                                <input 
                                    className="dash-input" 
                                    placeholder="https://example.com" 
                                    value={settings.website}
                                    onChange={e => setSettings({...settings, website: e.target.value})}
                                />
                            </div>

                            <div className="dash-input-group">
                                <label className="dash-label">{isArabic ? 'عن الشركة (نبذة)' : 'About Company'}</label>
                                <textarea 
                                    className="dash-textarea" 
                                    placeholder={isArabic ? 'اكتب نبذة مختصرة عن نشاط شركتك...' : 'Briefly describe your company...'}
                                    value={settings.about}
                                    onChange={e => setSettings({...settings, about: e.target.value})}
                                    style={{ minHeight: '100px' }}
                                />
                            </div>

                            <div className="dash-input-group">
                                <label className="dash-label">{isArabic ? 'قائمة المنتجات والخدمات' : 'Products & Services'}</label>
                                <textarea 
                                    className="dash-textarea" 
                                    placeholder={isArabic ? 'مثال: منتج أ (100 جنيه)، خدمة ب (200 جنيه)...' : 'Example: Product A ($100), Service B ($200)...'}
                                    value={settings.products}
                                    onChange={e => setSettings({...settings, products: e.target.value})}
                                    style={{ minHeight: '120px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                                <div className="dash-input-group" style={{ flex: '1 1 300px' }}>
                                    <label className="dash-label">{isArabic ? 'رابط فيسبوك' : 'Facebook Link'}</label>
                                    <input 
                                        className="dash-input" 
                                        placeholder="https://facebook.com/..." 
                                        value={settings.facebook}
                                        onChange={e => setSettings({...settings, facebook: e.target.value})}
                                    />
                                </div>
                                <div className="dash-input-group" style={{ flex: '1 1 300px' }}>
                                    <label className="dash-label">{isArabic ? 'رابط إنستجرام' : 'Instagram Link'}</label>
                                    <input 
                                        className="dash-input" 
                                        placeholder="https://instagram.com/..." 
                                        value={settings.instagram}
                                        onChange={e => setSettings({...settings, instagram: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="dash-input-group">
                                <label className="dash-label">{isArabic ? 'رقم موبايل إضافي للتواصل' : 'Additional Contact Phone'}</label>
                                <input 
                                    className="dash-input" 
                                    placeholder="+201234567890" 
                                    value={settings.contactPhone}
                                    onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                                />
                            </div>

                            <button 
                                className="dash-btn" 
                                onClick={handleSaveSettings} 
                                disabled={saveLoading}
                                style={{ background: '#25D366', color: 'white', marginTop: '10px', width: 'fit-content', padding: '12px 32px' }}
                            >
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
