import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { useToast } from '../../components/Toast';
import WidgetCustomizer from './WidgetCustomizer';
import './WidgetTab.css';
import './WidgetCustomizer.css';
import './DashboardShared.css';

const WidgetTab = () => {
    const { t, language } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState('install');
    
    const [apiKey, setApiKey] = useState('YOUR_API_KEY');
    const [config, setConfig] = useState({});
    
    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const CLEAN_BACKEND_URL = BACKEND_URL.replace('/api', '');
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = secureStorage.getItem('token');
                const res = await axios.get(`${BACKEND_URL}/company`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data?.apiKey) {
                    setApiKey(res.data.apiKey);
                }
                if (res.data?.widgetConfig) {
                    setConfig(res.data.widgetConfig);
                }
            } catch (err) {
                console.error("Failed to fetch API key:", err);
            }
        };
        fetchData();
    }, []);

    const widgetCode = `<script 
  src="${CLEAN_BACKEND_URL}/widget.js" 
  data-api-key="${apiKey}"
  data-primary-color="${config?.primaryColor || '#1a1a1a'}"
  data-launcher-color="${config?.launcherColor || '#ffffff'}">
</script>`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(widgetCode);
        setCopied(true);
        toast.success(
            language === 'ar' ? 'تم النسخ!' : 'Copied!',
            language === 'ar' ? 'تم نسخ الكود إلى الحافظة' : 'Widget code copied to clipboard'
        );
        setTimeout(() => setCopied(false), 2000);
    };

    const steps = [
        {
            title: language === 'ar' ? 'نسخ الكود' : 'Copy the Code',
            desc: language === 'ar' 
                ? 'انسخ كود الودجت الفريد الخاص بك الموضح أدناه.' 
                : 'Copy your unique widget code snippet shown below.',
            icon: 'fa-copy'
        },
        {
            title: language === 'ar' ? 'الإضافة للموقع' : 'Add to Website',
            desc: language === 'ar' 
                ? 'قم بلصق الكود داخل وسم <head> في موقعك.' 
                : 'Paste the code inside the <head> tag of your website.',
            icon: 'fa-code'
        },
        {
            title: language === 'ar' ? 'الحفظ والنشر' : 'Save & Publish',
            desc: language === 'ar' 
                ? 'احفظ التغييرات وسيظهر الشات بوت تلقائياً!' 
                : 'Save changes and the chatbot will appear automatically!',
            icon: 'fa-rocket'
        }
    ];

    return (
        <div style={{ animation: 'slideIn 0.5s ease-out' }}>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">{language === 'ar' ? 'ودجت الموقع' : 'Web Widget'}</h1>
                    <p style={{ margin: '8px 0 0', color: 'var(--dash-text-sec)', fontSize: '0.95rem' }}>
                        {language === 'ar' 
                            ? 'قم بإضافة المساعد الذكي لموقعك وتخصيص مظهره ليتناسب مع هويتك.' 
                            : 'Add the AI assistant to your website and customize its appearance.'}
                    </p>
                </div>
                
                <div style={{ display: 'flex', gap: '8px', background: 'var(--dash-card)', padding: '6px', borderRadius: '14px', border: '1px solid var(--dash-border)' }}>
                    <button 
                        className={`dash-btn ${activeTab === 'install' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setActiveTab('install')}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', height: 'auto' }}
                    >
                        <i className="fas fa-download"></i>
                        {language === 'ar' ? 'التركيب' : 'Installation'}
                    </button>
                    <button 
                        className={`dash-btn ${activeTab === 'customize' ? 'dash-btn-primary' : 'dash-btn-outline'}`} 
                        onClick={() => setActiveTab('customize')}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', height: 'auto' }}
                    >
                        <i className="fas fa-sliders-h"></i>
                        {language === 'ar' ? 'المظهر' : 'Appearance'}
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'install' ? (
                    <motion.div 
                        key="install"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="dash-grid"
                        style={{ gridTemplateColumns: '1fr 350px', alignItems: 'start' }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="dash-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--dash-text)', color: 'var(--dash-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                                        <i className="fas fa-list-ol"></i>
                                    </div>
                                    <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: '700', color: 'var(--dash-text)' }}>{language === 'ar' ? 'خطوات التركيب' : 'Installation Steps'}</h2>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                                    {steps.map((step, idx) => (
                                        <div key={idx} style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--dash-card)', border: '1px solid var(--dash-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--dash-text)', fontSize: '1.1rem' }}>
                                                <i className={`fas ${step.icon}`}></i>
                                            </div>
                                            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--dash-text)' }}>
                                                <span style={{ color: 'var(--dash-text-sec)', marginInlineEnd: '4px' }}>{idx + 1}.</span> {step.title}
                                            </h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--dash-text-sec)', margin: 0, lineHeight: '1.5' }}>{step.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="dash-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--dash-text)', color: 'var(--dash-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                                        <i className="fas fa-code"></i>
                                    </div>
                                    <h2 style={{ fontSize: '1.15rem', margin: 0, fontWeight: '700', color: 'var(--dash-text)' }}>{language === 'ar' ? 'كود الودجت' : 'Widget Script'}</h2>
                                </div>
                                
                                <div style={{ background: '#0a0a0a', borderRadius: '16px', border: '1px solid var(--dash-border)', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: '#111' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></div>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></div>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></div>
                                        </div>
                                        <button className="dash-btn" onClick={copyToClipboard} style={{ padding: '6px 12px', fontSize: '0.8rem', background: copied ? 'var(--dash-text)' : 'rgba(255,255,255,0.1)', color: copied ? 'var(--dash-bg)' : '#fff', border: 'none', height: 'auto' }}>
                                            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i> {copied ? (language === 'ar' ? 'تم النسخ' : 'Copied') : (language === 'ar' ? 'نسخ الكود' : 'Copy')}
                                        </button>
                                    </div>
                                    <pre style={{ padding: '20px', margin: 0, overflowX: 'auto', color: '#e2e8f0', fontSize: '0.9rem', fontFamily: 'monospace' }}>
                                        <code>{widgetCode}</code>
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div className="dash-card" style={{ padding: '24px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--dash-bg)', border: '1px solid var(--dash-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-text)', fontSize: '1.2rem', marginBottom: '16px' }}>
                                    <i className="fas fa-shield-halved"></i>
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--dash-text)' }}>{language === 'ar' ? 'نطاقات آمنة' : 'Trusted Domains'}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--dash-text-sec)', lineHeight: '1.5', marginBottom: '20px' }}>
                                    {language === 'ar' 
                                        ? 'حدد النطاقات المسموح لها بتشغيل الودجت لزيادة الأمان.' 
                                        : 'Specify domains allowed to run the widget for extra security.'}
                                </p>
                                <button className="dash-btn dash-btn-outline" onClick={() => navigate('/dashboard/settings')} style={{ width: '100%' }}>
                                    {language === 'ar' ? 'إعدادات الأمان' : 'Security Settings'}
                                </button>
                            </div>

                            <div className="dash-card" style={{ padding: '24px', background: 'var(--dash-text)', color: 'var(--dash-bg)', border: 'none' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dash-bg)', fontSize: '1.2rem', marginBottom: '16px' }}>
                                    <i className="fas fa-headset"></i>
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px', color: 'var(--dash-bg)' }}>{language === 'ar' ? 'تحتاج مساعدة؟' : 'Need Help?'}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--dash-bg)', opacity: 0.8, lineHeight: '1.5', marginBottom: '20px' }}>
                                    {language === 'ar' ? 'فريق الدعم الفني متواجد لمساعدتك في أي وقت.' : 'Our support team is available to help anytime.'}
                                </p>
                                <a href="mailto:support@voxio.app" className="dash-btn" style={{ width: '100%', background: 'var(--dash-bg)', color: 'var(--dash-text)', textDecoration: 'none', display: 'flex', justifyContent: 'center' }}>
                                    <i className="fas fa-envelope"></i> {language === 'ar' ? 'تواصل معنا' : 'Contact Us'}
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="customize"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <WidgetCustomizer />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WidgetTab;
