import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
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
    const [activeTab, setActiveTab] = useState('install'); // 'install' or 'customize'
    
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
  data-primary-color="${config?.primaryColor || '#6C63FF'}"
  data-launcher-color="${config?.launcherColor || '#1e293b'}">
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
            title: language === 'ar' ? '1. نسخ الكود' : '1. Copy the Code',
            desc: language === 'ar' 
                ? 'قم بنسخ كود الودجت الفريد الخاص بك الموضح أدناه.' 
                : 'Copy your unique widget code snippet shown below.',
            icon: 'fa-copy'
        },
        {
            title: language === 'ar' ? '2. الإضافة للموقع' : '2. Add to Website',
            desc: language === 'ar' 
                ? 'قم بلصق الكود داخل وسم <head> أو في نهاية وسم <body> في موقعك الإلكتروني.' 
                : 'Paste the code inside the <head> tag or at the end of the <body> tag in your website.',
            icon: 'fa-code'
        },
        {
            title: language === 'ar' ? '3. الحفظ والنشر' : '3. Save & Publish',
            desc: language === 'ar' 
                ? 'احفظ التغييرات وقم بنشر موقعك. سيظهر الشات بوت تلقائياً!' 
                : 'Save the changes and publish your site. The chatbot will appear automatically!',
            icon: 'fa-rocket'
        }
    ];

    return (
        <div className="widget-tab">
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">{language === 'ar' ? 'ودجت الموقع' : 'Web Widget'}</h1>
                    <p className="dash-page-subtitle" style={{ margin: '4px 0 0', color: 'var(--dash-text-sec)', fontSize: '0.95rem' }}>
                        {language === 'ar' 
                            ? 'أضف ذكاء VOXIO الاصطناعي إلى موقعك الإلكتروني في ثوانٍ معدودة.' 
                            : 'Add VOXIO AI to your website in just a few seconds.'}
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
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="widget-grid"
                    >
                        <div className="widget-main" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="dash-card animate-slide-in">
                                <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <i className="fas fa-list-ol" style={{ color: 'var(--dash-text-sec)' }}></i>
                                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{language === 'ar' ? 'خطوات التركيب' : 'Installation Steps'}</h2>
                                </div>
                                <div className="steps-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                                    {steps.map((step, idx) => (
                                        <div key={idx} className="step-item">
                                            <div className="step-icon" style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(var(--dash-text-rgb), 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: 'var(--dash-text)' }}>
                                                <i className={`fas ${step.icon}`}></i>
                                            </div>
                                            <h3 style={{ fontSize: '1rem', marginBottom: '8px' }}>{step.title}</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--dash-text-sec)', margin: 0, lineHeight: '1.5' }}>{step.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="dash-card animate-slide-in">
                                <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                    <i className="fas fa-terminal" style={{ color: 'var(--dash-text-sec)' }}></i>
                                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{language === 'ar' ? 'كود الودجت' : 'Widget Script'}</h2>
                                </div>
                                <div className="code-container" style={{ background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                                    <div className="code-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#111', borderBottom: '1px solid #222' }}>
                                        <span className="file-name" style={{ color: '#888', fontSize: '0.8rem' }}>index.html</span>
                                        <button className={`dash-btn dash-btn-outline ${copied ? 'copied' : ''}`} onClick={copyToClipboard} style={{ padding: '4px 12px', fontSize: '0.75rem', height: 'auto', borderColor: '#333' }}>
                                            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                                            {copied ? (language === 'ar' ? 'تم النسخ' : 'Copied') : (language === 'ar' ? 'نسخ الكود' : 'Copy Code')}
                                        </button>
                                    </div>
                                    <pre className="code-block" style={{ padding: '20px', margin: 0, overflowX: 'auto', color: '#50c8b4', fontSize: '0.9rem' }}>
                                        <code>{widgetCode}</code>
                                    </pre>
                                </div>
                                <div className="code-tip" style={{ marginTop: '16px', display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px', background: 'rgba(var(--dash-text-rgb), 0.03)', borderRadius: '10px' }}>
                                    <i className="fas fa-lightbulb" style={{ color: '#f59e0b', marginTop: '3px' }}></i>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--dash-text-sec)', lineHeight: '1.5' }}>
                                        {language === 'ar' 
                                            ? 'نصيحة: تأكد من وضع الكود في جميع الصفحات التي تريد أن يظهر فيها الشات بوت.' 
                                            : 'Tip: Make sure to place the code on all pages where you want the chatbot to appear.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="widget-sidebar">
                            <div className="info-card">
                                <div className="card-icon">
                                    <i className="fas fa-shield-halved"></i>
                                </div>
                                <h3>{language === 'ar' ? 'نطاقات آمنة' : 'Trusted Domains'}</h3>
                                <p>
                                    {language === 'ar' 
                                        ? 'يمكنك تحديد النطاقات المسموح لها بتشغيل الودجت من الإعدادات لزيادة الأمان.' 
                                        : 'You can specify domains allowed to run the widget from settings for extra security.'}
                                </p>
                                <button className="card-link" onClick={() => navigate('/dashboard/settings')}>
                                    {language === 'ar' ? 'إدارة النطاقات' : 'Manage Domains'}
                                    <i className="fas fa-arrow-right"></i>
                                </button>
                            </div>

                            <div className="support-card">
                                <h3>{language === 'ar' ? 'تحتاج مساعدة؟' : 'Need Help?'}</h3>
                                <p>{language === 'ar' ? 'فريقنا متاح لمساعدتك في عملية الربط.' : 'Our team is available to help with integration.'}</p>
                                <a href="mailto:support@voxio.app" className="support-btn">
                                    <i className="fas fa-envelope"></i>
                                    {language === 'ar' ? 'اتصل بالدعم' : 'Contact Support'}
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="customize"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <WidgetCustomizer />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WidgetTab;
