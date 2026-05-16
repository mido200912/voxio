import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion, AnimatePresence } from 'framer-motion';  
import PageLoader from '../../components/PageLoader';
import { useToast } from '../../components/Toast';
import './DashboardShared.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const InstagramTab = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const token = secureStorage.getItem('token');
    const { toast } = useToast();

    const [mainTab, setMainTab] = useState('chatbot'); // 'chatbot', 'comments', 'api', 'analytics'
    const [loading, setLoading] = useState(false);
    const [apiLoading, setApiLoading] = useState(false);

    // API Config State
    const [pageId, setPageId] = useState('');
    const [igAccountId, setIgAccountId] = useState('');
    const [accessToken, setAccessToken] = useState('');

    // Analytics State
    const [analytics, setAnalytics] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Chatbot Rules
    const [chatbotRules, setChatbotRules] = useState([]);
    const [newChatbotRule, setNewChatbotRule] = useState({ trigger: '', response: '' });

    // Comment Rules
    const [globalCommentRules, setGlobalCommentRules] = useState([]);
    const [newGlobalRule, setNewGlobalRule] = useState({ keyword: '', commentReply: '', dmReply: '', requireFollow: false, notFollowingReply: '' });
    
    // Fallback DM closed
    const [dmClosedFallback, setDmClosedFallback] = useState('');

    // Fetch integration settings
    useEffect(() => {
        fetchInstagramSettings();
    }, []);

    const fetchInstagramSettings = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BACKEND_URL}/integration-manager/instagram/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const settings = res.data.settings || {};
            setChatbotRules(settings.chatbotRules || []);
            setGlobalCommentRules(settings.globalCommentRules || []);
            setDmClosedFallback(settings.dmClosedFallback || '');
        } catch (e) {
            console.error('Error fetching Instagram settings:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const res = await axios.get(`${BACKEND_URL}/integration-manager/instagram/analytics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalytics(res.data);
        } catch (e) {
            console.error('Error fetching analytics:', e);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    useEffect(() => {
        if (mainTab === 'analytics' && !analytics) {
            fetchAnalytics();
        }
    }, [mainTab]);

    const saveApiConfig = async () => {
        if (!pageId || !igAccountId || !accessToken) return toast.warning(isArabic ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
        setApiLoading(true);
        try {
            await axios.post(`${BACKEND_URL}/integration-manager/instagram`, {
                pageId,
                igAccountId,
                accessToken
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(isArabic ? 'تم حفظ إعدادات الـ API بنجاح!' : 'API Settings saved successfully!');
        } catch (e) {
            console.error('Error saving API config:', e);
            toast.error(isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings');
        } finally {
            setApiLoading(false);
        }
    };

    const saveSettings = async (newSettingsObj) => {
        try {
            await axios.put(`${BACKEND_URL}/integration-manager/instagram/settings`, newSettingsObj, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Show toast or something
        } catch (e) {
            console.error('Error saving settings:', e);
        }
    };

    // Chatbot actions
    const addChatbotRule = () => {
        if (!newChatbotRule.trigger || !newChatbotRule.response) return;
        const updated = [...chatbotRules, newChatbotRule];
        setChatbotRules(updated);
        setNewChatbotRule({ trigger: '', response: '' });
        saveSettings({ chatbotRules: updated });
    };

    const removeChatbotRule = (idx) => {
        const updated = chatbotRules.filter((_, i) => i !== idx);
        setChatbotRules(updated);
        saveSettings({ chatbotRules: updated });
    };

    // Global Comment actions
    const addGlobalRule = () => {
        if (!newGlobalRule.keyword || !newGlobalRule.commentReply || !newGlobalRule.dmReply) return;
        const updated = [...globalCommentRules, newGlobalRule];
        setGlobalCommentRules(updated);
        setNewGlobalRule({ keyword: '', commentReply: '', dmReply: '', requireFollow: false, notFollowingReply: '' });
        saveSettings({ globalCommentRules: updated });
    };

    const removeGlobalRule = (idx) => {
        const updated = globalCommentRules.filter((_, i) => i !== idx);
        setGlobalCommentRules(updated);
        saveSettings({ globalCommentRules: updated });
    };

    const saveDmFallback = () => {
        saveSettings({ dmClosedFallback });
        toast.success(isArabic ? 'تم الحفظ!' : 'Saved!');
    };

    // ─── PREMIUM STYLES ────────────────────────────────────────────────────────
    return (
        <div className="instagram-tab-page animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="dash-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(228, 64, 95, 0.2)' }}>
                        <i className="fab fa-instagram" />
                    </div>
                    <div>
                        <h1 className="dash-page-title">{isArabic ? 'إنستاجرام' : 'Instagram'}</h1>
                        <p className="dash-page-subtitle">{isArabic ? 'إدارة رسائل الأوتوميشن والتعليقات' : 'Manage automations and auto-replies'}</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', background: 'var(--dash-card)', padding: '6px', borderRadius: '14px', border: '1px solid var(--dash-border)' }}>
                    <button 
                        className={`dash-btn ${mainTab === 'chatbot' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setMainTab('chatbot')}
                        style={{ padding: '8px 16px', fontSize: '0.85rem', height: 'auto' }}
                    >
                        <i className="fas fa-robot"></i>
                        {isArabic ? 'بوت' : 'Bot'}
                    </button>
                    <button 
                        className={`dash-btn ${mainTab === 'comments' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setMainTab('comments')}
                        style={{ padding: '8px 16px', fontSize: '0.85rem', height: 'auto' }}
                    >
                        <i className="fas fa-comment-dots"></i>
                        {isArabic ? 'التعليقات' : 'Comments'}
                    </button>
                    <button 
                        className={`dash-btn ${mainTab === 'api' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setMainTab('api')}
                        style={{ padding: '8px 16px', fontSize: '0.85rem', height: 'auto' }}
                    >
                        <i className="fas fa-key"></i>
                        {isArabic ? 'الـ API' : 'API'}
                    </button>
                    <button 
                        className={`dash-btn ${mainTab === 'analytics' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setMainTab('analytics')}
                        style={{ padding: '8px 16px', fontSize: '0.85rem', height: 'auto' }}
                    >
                        <i className="fas fa-chart-line"></i>
                        {isArabic ? 'الإحصائيات' : 'Analytics'}
                    </button>
                </div>
            </div>

            {loading ? <PageLoader text={isArabic ? 'جاري تحميل إعدادات إنستجرام...' : 'Loading Instagram settings...'} /> : (
                <AnimatePresence mode="wait">
                    {mainTab === 'chatbot' && (
                        <motion.div key="chatbot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="dash-card animate-slide-in">
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--dash-text)', marginBottom: '8px' }}>{isArabic ? 'قواعد الشات بوت' : 'Chatbot Rules'}</h3>
                                <p style={{ color: 'var(--dash-text-sec)', fontSize: '0.9rem', marginBottom: '24px' }}>
                                    {isArabic ? 'رد تلقائي عند استلام كلمة معينة في الخاص.' : 'Auto reply when a specific word is received in DM.'}
                                </p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '12px', marginTop: '20px' }}>
                                    <input className="dash-input" placeholder={isArabic ? 'الكلمة المفتاحية' : 'Keyword'} value={newChatbotRule.trigger} onChange={e => setNewChatbotRule({...newChatbotRule, trigger: e.target.value})} style={{ marginBottom: 0 }} />
                                    <input className="dash-input" placeholder={isArabic ? 'الرد (رسالة)' : 'Reply message'} value={newChatbotRule.response} onChange={e => setNewChatbotRule({...newChatbotRule, response: e.target.value})} style={{ marginBottom: 0 }} />
                                    <button onClick={addChatbotRule} className="dash-btn dash-btn-primary" style={{ padding: '0 24px' }}>{isArabic ? 'إضافة' : 'Add'}</button>
                                </div>

                                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {chatbotRules.map((r, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(var(--color-text-rgb), 0.03)', borderRadius: '12px', border: '1px solid var(--dash-border)' }}>
                                            <div style={{ color: 'var(--dash-text)', fontSize: '0.95rem' }}><strong style={{ color: '#dc2743', fontWeight: '800' }}>{r.trigger}</strong>: {r.response}</div>
                                            <button onClick={() => removeChatbotRule(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', padding: '4px', opacity: 0.6 }}><i className="fas fa-trash" /></button>
                                        </div>
                                    ))}
                                    {chatbotRules.length === 0 && (
                                        <div style={{ textAlign: 'center', color: 'var(--dash-text-sec)', padding: '20px', fontSize: '0.9rem' }}>
                                            {isArabic ? 'لم يتم إضافة قواعد بعد' : 'No rules added yet'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mainTab === 'comments' && (
                        <motion.div key="comments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            
                            {/* Fallback Message */}
                            <div className="dash-card animate-slide-in">
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--dash-text)', marginBottom: '8px' }}>{isArabic ? 'رسالة بديلة (في حال الخاص مغلق)' : 'Fallback Message (If DM is closed)'}</h3>
                                <p style={{ color: 'var(--dash-text-sec)', fontSize: '0.85rem', marginBottom: '20px' }}>
                                    {isArabic ? 'لو العميل قافلรับ رسائل الخاص، يترد عليه في الكومنت بالرسالة دي.' : 'If the user has DMs closed, reply to their comment with this.'}
                                </p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input className="dash-input" value={dmClosedFallback} onChange={e => setDmClosedFallback(e.target.value)} placeholder={isArabic ? 'مثال: نرجو فتح الرسائل الخاصة لنتواصل معك.' : 'e.g., Please open your DMs so we can message you.'} style={{ marginBottom: 0 }} />
                                    <button onClick={saveDmFallback} className="dash-btn dash-btn-primary" style={{ padding: '0 24px' }}>{isArabic ? 'حفظ' : 'Save'}</button>
                                </div>
                            </div>

                            {/* Global Rules */}
                            <div className="dash-card animate-slide-in">
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--dash-text)', marginBottom: '8px' }}>{isArabic ? 'قواعد عامة لأي منشور/فيديو' : 'Global Rules for Any Post/Reel'}</h3>
                                <p style={{ color: 'var(--dash-text-sec)', fontSize: '0.9rem', marginBottom: '24px' }}>
                                    {isArabic ? 'إذا كتب شخص هذه الكلمة في أي تعليق، أرسل له بالخاص والتعليق.' : 'If someone comments this word on ANY post, reply to comment and send DM.'}
                                </p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                                    <input className="dash-input" placeholder={isArabic ? 'الكلمة (مثل: تفاصيل)' : 'Keyword (e.g., details)'} value={newGlobalRule.keyword} onChange={e => setNewGlobalRule({...newGlobalRule, keyword: e.target.value})} />
                                    <input className="dash-input" placeholder={isArabic ? 'الرد في التعليق' : 'Comment Reply'} value={newGlobalRule.commentReply} onChange={e => setNewGlobalRule({...newGlobalRule, commentReply: e.target.value})} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                    <input className="dash-input" placeholder={isArabic ? 'الرد في الخاص (DM)' : 'DM Message'} value={newGlobalRule.dmReply} onChange={e => setNewGlobalRule({...newGlobalRule, dmReply: e.target.value})} />
                                </div>
                                
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: 'var(--dash-text)', fontSize: '0.9rem', cursor: 'pointer', width: 'fit-content' }}>
                                    <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: '#E4405F', cursor: 'pointer' }} checked={newGlobalRule.requireFollow} onChange={e => setNewGlobalRule({...newGlobalRule, requireFollow: e.target.checked})} />
                                    {isArabic ? 'يتطلب متابعة الصفحة' : 'Requires Page Follow'}
                                </label>

                                {newGlobalRule.requireFollow && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                        <input className="dash-input" placeholder={isArabic ? 'رسالة التعليق في حال لم يكن يتابع الصفحة (اختياري)' : 'Comment reply if not following (Optional)'} value={newGlobalRule.notFollowingReply} onChange={e => setNewGlobalRule({...newGlobalRule, notFollowingReply: e.target.value})} />
                                    </div>
                                )}
                                
                                <button onClick={addGlobalRule} className="dash-btn dash-btn-primary" style={{ width: '100%', height: '48px' }}>{isArabic ? 'إضافة القاعدة' : 'Add Rule'}</button>

                                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {globalCommentRules.map((r, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '20px', background: 'rgba(var(--color-text-rgb), 0.03)', borderRadius: '16px', border: '1px solid var(--dash-border)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                                <div style={{ fontSize: '1rem', color: 'var(--dash-text)' }}><strong style={{ color: '#dc2743', fontWeight: '800' }}>{isArabic ? 'الكلمة' : 'Keyword'}:</strong> {r.keyword}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--dash-text-sec)' }}><strong>{isArabic ? 'التعليق' : 'Comment'}:</strong> {r.commentReply}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--dash-text)' }}><strong>{isArabic ? 'الخاص' : 'DM'}:</strong> {r.dmReply}</div>
                                                {r.requireFollow && (
                                                    <div style={{ fontSize: '0.75rem', color: '#e67e22', background: 'rgba(230, 126, 34, 0.1)', padding: '4px 10px', borderRadius: '6px', width: 'fit-content', marginTop: '4px', fontWeight: '700' }}>
                                                        <i className="fas fa-user-check" style={{ marginInlineEnd: '6px' }}></i>
                                                        {isArabic ? 'يتطلب المتابعة' : 'Requires Follow'}
                                                        {r.notFollowingReply && ` - ${r.notFollowingReply}`}
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={() => removeGlobalRule(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', alignSelf: 'flex-start', padding: '4px', opacity: 0.6 }}><i className="fas fa-trash" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="dash-card animate-slide-in">
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--dash-text)', marginBottom: '8px' }}>{isArabic ? 'تخصيص الرد لفيديو/منشور معين' : 'Video/Post Specific Rules'}</h3>
                                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--dash-text-sec)', background: 'rgba(var(--color-text-rgb), 0.02)', borderRadius: '16px', border: '1px dashed var(--dash-border)' }}>
                                    <i className="fas fa-video" style={{ fontSize: '32px', marginBottom: '16px', opacity: 0.2 }} />
                                    <p style={{ fontSize: '0.9rem' }}>{isArabic ? 'سيتم جلب جميع مقاطع الفيديو الخاصة بك هنا لاحقاً.' : 'All your videos and posts will be listed here later.'}</p>
                                </div>
                            </div>

                        </motion.div>
                    )}

                    {mainTab === 'api' && (
                        <motion.div key="api" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="dash-card animate-slide-in" style={{ maxWidth: '700px' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--dash-text)', marginBottom: '8px' }}>{isArabic ? 'إعدادات ربط إنستاجرام (API)' : 'Instagram API Settings'}</h3>
                                <p style={{ color: 'var(--dash-text-sec)', fontSize: '0.9rem', marginBottom: '24px' }}>
                                    {isArabic ? 'قم بإدخال بيانات الـ API الخاصة بك لربط التطبيق بحسابك.' : 'Enter your API credentials to connect the application with your account.'}
                                </p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="dash-input-group">
                                        <label className="dash-label">
                                            {isArabic ? 'معرف الصفحة (Page ID)' : 'Page ID'}
                                        </label>
                                        <input className="dash-input" value={pageId} onChange={(e) => setPageId(e.target.value)} placeholder="e.g. 102345678901234" />
                                    </div>
                                    <div className="dash-input-group">
                                        <label className="dash-label">
                                            {isArabic ? 'معرف حساب إنستاجرام (IG Account ID)' : 'IG Account ID'}
                                        </label>
                                        <input className="dash-input" value={igAccountId} onChange={(e) => setIgAccountId(e.target.value)} placeholder="e.g. 17841400000000000" />
                                    </div>
                                    <div className="dash-input-group">
                                        <label className="dash-label">
                                            {isArabic ? 'رمز الوصول (Access Token)' : 'Access Token'}
                                        </label>
                                        <input className="dash-input" type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="EAA..." />
                                    </div>
                                    
                                    <button onClick={saveApiConfig} className="dash-btn dash-btn-primary" style={{ width: 'fit-content', marginTop: '10px', padding: '12px 32px' }} disabled={apiLoading}>
                                        {apiLoading ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ البيانات' : 'Save Credentials')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mainTab === 'analytics' && (
                        <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div className="dash-card animate-slide-in">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--dash-text)' }}>{isArabic ? 'إحصائيات إنستاجرام' : 'Instagram Analytics'}</h3>
                                    <button onClick={fetchAnalytics} className="dash-btn dash-btn-outline" style={{ height: '40px', width: '40px', padding: 0, borderRadius: '10px' }}>
                                        <i className={`fas fa-sync-alt ${analyticsLoading ? 'fa-spin' : ''}`} />
                                    </button>
                                </div>
                                
                                {analyticsLoading && !analytics ? (
                                    <div style={{ textAlign: 'center', padding: '40px' }}>
                                        <PageLoader text={isArabic ? 'جاري التحميل...' : 'Loading analytics...'} />
                                    </div>
                                ) : analytics ? (
                                    <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                        <div style={{ background: 'rgba(var(--color-text-rgb), 0.02)', padding: '32px 24px', borderRadius: '20px', border: '1px solid var(--dash-border)', textAlign: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(228, 64, 95, 0.1)', color: '#E4405F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.2rem' }}>
                                                <i className="fas fa-inbox" />
                                            </div>
                                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#E4405F', marginBottom: '8px' }}>{analytics.totalReceived}</div>
                                            <div style={{ color: 'var(--dash-text-sec)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isArabic ? 'الرسائل المستلمة' : 'Messages Received'}</div>
                                        </div>
                                        <div style={{ background: 'rgba(var(--color-text-rgb), 0.02)', padding: '32px 24px', borderRadius: '20px', border: '1px solid var(--dash-border)', textAlign: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(228, 64, 95, 0.1)', color: '#E4405F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.2rem' }}>
                                                <i className="fas fa-paper-plane" />
                                            </div>
                                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#E4405F', marginBottom: '8px' }}>{analytics.totalSent}</div>
                                            <div style={{ color: 'var(--dash-text-sec)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isArabic ? 'الرسائل المرسلة (AI)' : 'Messages Sent (AI)'}</div>
                                        </div>
                                        <div style={{ background: 'rgba(var(--color-text-rgb), 0.02)', padding: '32px 24px', borderRadius: '20px', border: '1px solid var(--dash-border)', textAlign: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.2rem' }}>
                                                <i className="fas fa-check-circle" />
                                            </div>
                                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#2ecc71', marginBottom: '8px' }}>{analytics.deliveryRate}%</div>
                                            <div style={{ color: 'var(--dash-text-sec)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isArabic ? 'نسبة الوصول' : 'Delivery Rate'}</div>
                                        </div>
                                        <div style={{ background: 'rgba(var(--color-text-rgb), 0.02)', padding: '32px 24px', borderRadius: '20px', border: '1px solid var(--dash-border)', textAlign: 'center' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.2rem' }}>
                                                <i className="fas fa-users" />
                                            </div>
                                            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#3498db', marginBottom: '8px' }}>{analytics.activeChats}</div>
                                            <div style={{ color: 'var(--dash-text-sec)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isArabic ? 'المحادثات النشطة' : 'Active Chats'}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '48px', color: 'var(--dash-text-sec)', background: 'rgba(var(--color-text-rgb), 0.02)', borderRadius: '16px', border: '1px dashed var(--dash-border)' }}>
                                        <p style={{ fontSize: '0.9rem' }}>{isArabic ? 'لا توجد بيانات حالياً.' : 'No data available.'}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    );
};

export default InstagramTab;
