import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion, AnimatePresence } from 'framer-motion';
import PageLoader from '../../components/PageLoader';
import { useToast } from '../../components/Toast';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';

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
    const s = {
        wrapper: { padding: '32px', fontFamily: 'inherit', direction: isArabic ? 'rtl' : 'ltr' },
        header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(228, 64, 95, 0.1) 0%, rgba(228, 64, 95, 0.02) 100%)', padding: '24px', borderRadius: '20px', border: '1px solid rgba(228, 64, 95, 0.15)' },
        icon: { width: '64px', height: '64px', borderRadius: '18px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', boxShadow: '0 10px 20px rgba(228, 64, 95, 0.3)' },
        mainTabs: { display: 'flex', gap: '8px', background: 'var(--color-card-bg)', padding: '6px', borderRadius: '16px', width: 'fit-content', marginBottom: '32px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
        mainTab: (active) => ({
            padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontWeight: active ? '700' : '500', fontSize: '0.95rem',
            background: active ? 'linear-gradient(45deg, #dc2743, #bc1888)' : 'transparent',
            color: active ? '#ffffff' : 'var(--color-text-secondary)',
            boxShadow: active ? '0 4px 12px rgba(228, 64, 95, 0.3)' : 'none',
            transition: 'all 0.3s ease',
            display: 'flex', alignItems: 'center'
        }),
        card: { background: 'var(--color-card-bg)', borderRadius: '20px', padding: '24px', border: '1px solid var(--color-border)', marginBottom: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' },
        input: { width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', marginBottom: '12px', fontSize: '0.95rem', transition: 'border 0.3s' },
        checkboxContainer: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', color: 'var(--color-text)', fontSize: '0.95rem', cursor: 'pointer' },
        checkbox: { width: '20px', height: '20px', accentColor: '#E4405F', cursor: 'pointer' },
        btn: { padding: '14px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(45deg, #dc2743, #bc1888)', color: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', transition: 'opacity 0.3s' },
        analyticsCard: { background: 'var(--color-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--color-border)', textAlign: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' },
        analyticsValue: { fontSize: '2.5rem', fontWeight: '800', color: '#E4405F', margin: '15px 0' },
        analyticsLabel: { color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontWeight: '600' }
    };

    return (
        <div style={s.wrapper}>
            <div style={s.header}>
                <div style={s.icon}><i className="fab fa-instagram" /></div>
                <div>
                    <h1 style={{ fontSize: '1.7rem', color: 'var(--color-text)', margin: 0 }}>
                        {isArabic ? 'إنستاجرام' : 'Instagram'}
                    </h1>
                    <p style={{ color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                        {isArabic ? 'إدارة رسائل الأوتوميشن والتعليقات' : 'Manage automations and auto-replies'}
                    </p>
                </div>
            </div>

            <div style={s.mainTabs}>
                <button style={s.mainTab(mainTab === 'chatbot')} onClick={() => setMainTab('chatbot')}>
                    <i className="fas fa-robot" style={{ marginInlineEnd: '6px' }} />
                    {isArabic ? 'شات بوت (للرسائل)' : 'Chatbot (DMs)'}
                </button>
                <button style={s.mainTab(mainTab === 'comments')} onClick={() => setMainTab('comments')}>
                    <i className="fas fa-comment-dots" style={{ marginInlineEnd: '6px' }} />
                    {isArabic ? 'الرد التلقائي على التعليقات' : 'Comment Auto-Reply'}
                </button>
                <button style={s.mainTab(mainTab === 'api')} onClick={() => setMainTab('api')}>
                    <i className="fas fa-key" style={{ marginInlineEnd: '6px' }} />
                    {isArabic ? 'إعدادات API' : 'API Settings'}
                </button>
                <button style={s.mainTab(mainTab === 'analytics')} onClick={() => setMainTab('analytics')}>
                    <i className="fas fa-chart-line" style={{ marginInlineEnd: '6px' }} />
                    {isArabic ? 'الإحصائيات' : 'Analytics'}
                </button>
            </div>

            {loading ? <PageLoader text={isArabic ? 'جاري تحميل إعدادات إنستجرام...' : 'Loading Instagram settings...'} /> : (
                <AnimatePresence mode="wait">
                    {mainTab === 'chatbot' && (
                        <motion.div key="chatbot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div style={s.card}>
                                <h3>{isArabic ? 'قواعد الشات بوت' : 'Chatbot Rules'}</h3>
                                <p style={{ color: 'var(--color-text-secondary)' }}>
                                    {isArabic ? 'رد تلقائي عند استلام كلمة معينة في الخاص.' : 'Auto reply when a specific word is received in DM.'}
                                </p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 100px', gap: '10px', marginTop: '20px' }}>
                                    <input placeholder={isArabic ? 'الكلمة المفتاحية' : 'Keyword'} value={newChatbotRule.trigger} onChange={e => setNewChatbotRule({...newChatbotRule, trigger: e.target.value})} style={s.input} />
                                    <input placeholder={isArabic ? 'الرد (رسالة)' : 'Reply message'} value={newChatbotRule.response} onChange={e => setNewChatbotRule({...newChatbotRule, response: e.target.value})} style={s.input} />
                                    <button onClick={addChatbotRule} style={s.btn}>{isArabic ? 'إضافة' : 'Add'}</button>
                                </div>

                                <div style={{ marginTop: '20px' }}>
                                    {chatbotRules.map((r, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px', background: 'var(--color-bg)', borderRadius: '12px', marginBottom: '10px', border: '1px solid var(--color-border)' }}>
                                            <div><strong style={{ color: '#E4405F' }}>{r.trigger}</strong>: {r.response}</div>
                                            <button onClick={() => removeChatbotRule(i)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}><i className="fas fa-trash" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mainTab === 'comments' && (
                        <motion.div key="comments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            
                            {/* Fallback Message */}
                            <div style={s.card}>
                                <h3>{isArabic ? 'رسالة بديلة (في حال الخاص مغلق)' : 'Fallback Message (If DM is closed)'}</h3>
                                <p style={{ color: 'var(--color-text-secondary)' }}>
                                    {isArabic ? 'لو العميل قافلรับ رسائل الخاص، يترد عليه في الكومنت بالرسالة دي.' : 'If the user has DMs closed, reply to their comment with this.'}
                                </p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input style={s.input} value={dmClosedFallback} onChange={e => setDmClosedFallback(e.target.value)} placeholder={isArabic ? 'مثال: نرجو فتح الرسائل الخاصة لنتواصل معك.' : 'e.g., Please open your DMs so we can message you.'} />
                                    <button onClick={saveDmFallback} style={s.btn}>{isArabic ? 'حفظ' : 'Save'}</button>
                                </div>
                            </div>

                            {/* Global Rules */}
                            <div style={s.card}>
                                <h3>{isArabic ? 'قواعد عامة لأي منشور/فيديو' : 'Global Rules for Any Post/Reel'}</h3>
                                <p style={{ color: 'var(--color-text-secondary)' }}>
                                    {isArabic ? 'إذا كتب شخص هذه الكلمة في أي تعليق، أرسل له بالخاص والتعليق.' : 'If someone comments this word on ANY post, reply to comment and send DM.'}
                                </p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
                                    <input placeholder={isArabic ? 'الكلمة (مثل: تفاصيل)' : 'Keyword (e.g., details)'} value={newGlobalRule.keyword} onChange={e => setNewGlobalRule({...newGlobalRule, keyword: e.target.value})} style={s.input} />
                                    <input placeholder={isArabic ? 'الرد في التعليق' : 'Comment Reply'} value={newGlobalRule.commentReply} onChange={e => setNewGlobalRule({...newGlobalRule, commentReply: e.target.value})} style={s.input} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                    <input placeholder={isArabic ? 'الرد في الخاص (DM)' : 'DM Message'} value={newGlobalRule.dmReply} onChange={e => setNewGlobalRule({...newGlobalRule, dmReply: e.target.value})} style={s.input} />
                                </div>
                                
                                <label style={s.checkboxContainer}>
                                    <input type="checkbox" style={s.checkbox} checked={newGlobalRule.requireFollow} onChange={e => setNewGlobalRule({...newGlobalRule, requireFollow: e.target.checked})} />
                                    {isArabic ? 'يتطلب متابعة الصفحة' : 'Requires Page Follow'}
                                </label>

                                {newGlobalRule.requireFollow && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                                        <input placeholder={isArabic ? 'رسالة التعليق في حال لم يكن يتابع الصفحة (اختياري)' : 'Comment reply if not following (Optional)'} value={newGlobalRule.notFollowingReply} onChange={e => setNewGlobalRule({...newGlobalRule, notFollowingReply: e.target.value})} style={s.input} />
                                    </div>
                                )}
                                
                                <button onClick={addGlobalRule} style={{...s.btn, width: '100%'}}>{isArabic ? 'إضافة القاعدة' : 'Add Rule'}</button>

                                <div style={{ marginTop: '20px' }}>
                                    {globalCommentRules.map((r, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '18px', background: 'var(--color-bg)', borderRadius: '12px', marginBottom: '12px', border: '1px solid var(--color-border)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ fontSize: '1.05rem', color: 'var(--color-text)' }}><strong>{isArabic ? 'الكلمة المفتاحية' : 'Keyword'}:</strong> <span style={{ color: '#E4405F' }}>{r.keyword}</span></div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}><strong>{isArabic ? 'التعليق' : 'Comment'}:</strong> {r.commentReply}</div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}><strong>{isArabic ? 'الخاص' : 'DM'}:</strong> {r.dmReply}</div>
                                                {r.requireFollow && (
                                                    <div style={{ fontSize: '0.85rem', color: '#e67e22', background: '#e67e2215', padding: '4px 8px', borderRadius: '6px', width: 'fit-content', marginTop: '4px' }}>
                                                        <i className="fas fa-user-check" style={{ marginInlineEnd: '4px' }}></i>
                                                        {isArabic ? 'يتطلب المتابعة' : 'Requires Follow'}
                                                        {r.notFollowingReply && ` - ${r.notFollowingReply}`}
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={() => removeGlobalRule(i)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', alignSelf: 'flex-start', padding: '4px' }}><i className="fas fa-trash" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div style={s.card}>
                                <h3>{isArabic ? 'تخصيص الرد لفيديو/منشور معين' : 'Video/Post Specific Rules'}</h3>
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)', background: 'var(--color-bg)', borderRadius: '12px', border: '1px dashed var(--color-border)' }}>
                                    <i className="fas fa-video" style={{ fontSize: '32px', marginBottom: '10px', color: '#ccc' }} />
                                    <p>{isArabic ? 'سيتم جلب جميع مقاطع الفيديو الخاصة بك هنا لاحقاً.' : 'All your videos and posts will be listed here later.'}</p>
                                </div>
                            </div>

                        </motion.div>
                    )}

                    {mainTab === 'api' && (
                        <motion.div key="api" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div style={s.card}>
                                <h3>{isArabic ? 'إعدادات ربط إنستاجرام (API)' : 'Instagram API Settings'}</h3>
                                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
                                    {isArabic ? 'قم بإدخال بيانات الـ API الخاصة بك لربط التطبيق بحسابك.' : 'Enter your API credentials to connect the application with your account.'}
                                </p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                                            {isArabic ? 'معرف الصفحة (Page ID)' : 'Page ID'}
                                        </label>
                                        <input style={s.input} value={pageId} onChange={(e) => setPageId(e.target.value)} placeholder="e.g. 102345678901234" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                                            {isArabic ? 'معرف حساب إنستاجرام (IG Account ID)' : 'IG Account ID'}
                                        </label>
                                        <input style={s.input} value={igAccountId} onChange={(e) => setIgAccountId(e.target.value)} placeholder="e.g. 17841400000000000" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                                            {isArabic ? 'رمز الوصول (Access Token)' : 'Access Token'}
                                        </label>
                                        <input style={s.input} type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="EAA..." />
                                    </div>
                                    
                                    <button onClick={saveApiConfig} style={{ ...s.btn, width: 'fit-content', marginTop: '10px' }} disabled={apiLoading}>
                                        {apiLoading ? (isArabic ? 'جاري الحفظ...' : 'Saving...') : (isArabic ? 'حفظ البيانات' : 'Save Credentials')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {mainTab === 'analytics' && (
                        <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <div style={s.card}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3>{isArabic ? 'إحصائيات إنستاجرام' : 'Instagram Analytics'}</h3>
                                    <button onClick={fetchAnalytics} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E4405F' }}>
                                        <i className={`fas fa-sync-alt ${analyticsLoading ? 'fa-spin' : ''}`} />
                                    </button>
                                </div>
                                
                                {analyticsLoading && !analytics ? (
                                    <p>{isArabic ? 'جاري التحميل...' : 'Loading analytics...'}</p>
                                ) : analytics ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                        <div style={s.analyticsCard}>
                                            <i className="fas fa-inbox" style={{ fontSize: '24px', color: '#E4405F' }} />
                                            <div style={s.analyticsValue}>{analytics.totalReceived}</div>
                                            <div style={s.analyticsLabel}>{isArabic ? 'الرسائل المستلمة' : 'Messages Received'}</div>
                                        </div>
                                        <div style={s.analyticsCard}>
                                            <i className="fas fa-paper-plane" style={{ fontSize: '24px', color: '#E4405F' }} />
                                            <div style={s.analyticsValue}>{analytics.totalSent}</div>
                                            <div style={s.analyticsLabel}>{isArabic ? 'الرسائل المرسلة (AI)' : 'Messages Sent (AI)'}</div>
                                        </div>
                                        <div style={s.analyticsCard}>
                                            <i className="fas fa-check-circle" style={{ fontSize: '24px', color: '#2ecc71' }} />
                                            <div style={{ ...s.analyticsValue, color: '#2ecc71' }}>{analytics.deliveryRate}%</div>
                                            <div style={s.analyticsLabel}>{isArabic ? 'نسبة الوصول' : 'Delivery Rate'}</div>
                                        </div>
                                        <div style={s.analyticsCard}>
                                            <i className="fas fa-users" style={{ fontSize: '24px', color: '#3498db' }} />
                                            <div style={{ ...s.analyticsValue, color: '#3498db' }}>{analytics.activeChats}</div>
                                            <div style={s.analyticsLabel}>{isArabic ? 'المحادثات النشطة' : 'Active Chats'}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <p>{isArabic ? 'لا توجد بيانات حالياً.' : 'No data available.'}</p>
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
