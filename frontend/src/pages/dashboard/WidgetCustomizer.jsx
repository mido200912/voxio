import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { secureStorage } from '../../utils/secureStorage';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/Toast';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';

const WidgetCustomizer = () => {
    const { language } = useLanguage();
    const { toast } = useToast();
    const isArabic = language === 'ar';
    
    const [activeTab, setActiveTab] = useState('settings'); // 'settings', 'embed'
    
    // Default config fallback
    const defaultConfig = { 
        primaryColor: '#6C63FF',
        launcherColor: '#1e293b',
        welcomeMessage: isArabic ? 'مرحباً! كيف يمكنني مساعدتك؟' : 'Hello! How can I help you?',
    };
    const [config, setConfig] = useState(defaultConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [apiKey, setApiKey] = useState('');

    useEffect(() => {
        fetchCurrentConfig();
    }, []);

    const fetchCurrentConfig = async () => {
        try {
            const token = secureStorage.getItem('token');
            const res = await axios.get(`${BACKEND_URL}/company`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setApiKey(res.data.apiKey);
                if (res.data.widgetConfig) {
                    setConfig({ ...defaultConfig, ...res.data.widgetConfig });
                }
            }
        } catch (err) { console.error("Error fetching config:", err); }
    };

    const handleSaveSettings = async () => {
        setIsSaving(true);
        try {
            const token = secureStorage.getItem('token');
            await axios.post(`${BACKEND_URL}/company`, { widgetConfig: config }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(isArabic ? 'تم حفظ الإعدادات' : 'Settings saved');
        } catch (err) {
            console.error(err);
            toast.error(isArabic ? 'فشل الحفظ' : 'Failed to save');
        } finally {
            setIsSaving(false);
        }
    };

    // Construct live preview overrides
    const queryParams = new URLSearchParams({
        color: config.primaryColor || '',
        welcome: config.welcomeMessage || '',
        t: Date.now()
    }).toString();
    const iframeUrl = apiKey ? `${window.location.origin}/widget/${apiKey}?${queryParams}` : '';

    // Generate full widget preview script to show the launcher button + chat window
    const previewSrcDoc = `
<!DOCTYPE html>
<html lang="${isArabic ? 'ar' : 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        body { margin: 0; overflow: hidden; background: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; }
        .bg-pattern { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-image: radial-gradient(#cbd5e1 1px, transparent 1px); background-size: 20px 20px; z-index: -1; }
        .hint-text { color: #64748b; font-size: 1.2rem; font-weight: bold; opacity: 0.5; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 0.4; transform: scale(0.95); } 50% { opacity: 0.8; transform: scale(1); } 100% { opacity: 0.4; transform: scale(0.95); } }

        /* Widget Styles injected dynamically */
        #voxio-w-container { position: fixed; bottom: 20px; right: 20px; z-index: 9999; direction: ${isArabic ? 'rtl' : 'ltr'}; }
        #voxio-w-btn {
            width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;
            background: ${config.launcherColor || '#1e293b'}; color: #fff;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; font-size: 24px;
        }
        #voxio-w-btn:hover { transform: scale(1.05) rotate(5deg); }
        #voxio-w-window {
            position: absolute; bottom: 80px; right: 0; width: 380px; height: 550px;
            max-width: calc(100vw - 40px); background: #fff; border-radius: 24px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.2); display: none; overflow: hidden;
            transform-origin: bottom right; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            opacity: 0; transform: scale(0.8) translateY(40px);
        }
        #voxio-w-window.vx-open { display: flex; opacity: 1; transform: scale(1) translateY(0); }
        #voxio-w-window iframe { border: none; width: 100%; height: 100%; }
    </style>
</head>
<body>
    <div class="bg-pattern"></div>
    <div class="hint-text"><i class="fas fa-arrow-down" style="margin-right: 8px;"></i> ${isArabic ? 'جرب الودجت من هنا' : 'Try widget here'}</div>
    
    <div id="voxio-w-container">
        <div id="voxio-w-window">
            <iframe src="${iframeUrl}"></iframe>
        </div>
        <button id="voxio-w-btn" onclick="toggleWidget()">
            <i class="fas fa-comment-dots" id="voxio-w-icon"></i>
        </button>
    </div>

    <script>
        let isOpen = false;
        function toggleWidget() {
            isOpen = !isOpen;
            const win = document.getElementById('voxio-w-window');
            const icon = document.getElementById('voxio-w-icon');
            if (isOpen) {
                win.style.display = 'flex';
                setTimeout(() => win.classList.add('vx-open'), 10);
                icon.className = 'fas fa-times';
            } else {
                win.classList.remove('vx-open');
                setTimeout(() => win.style.display = 'none', 300);
                icon.className = 'fas fa-comment-dots';
            }
        }
        // Open by default for preview
        setTimeout(toggleWidget, 1000);
    </script>
</body>
</html>
    `;

    const embedCode = `<script 
  src="${BACKEND_URL.replace('/api', '')}/widget.js" 
  data-api-key="${apiKey}" 
  data-primary-color="${config.primaryColor || '#6C63FF'}"
  data-launcher-color="${config.launcherColor || '#1e293b'}">
</script>`;

    const copyEmbedCode = () => {
        navigator.clipboard.writeText(embedCode);
        toast.success(isArabic ? 'تم نسخ الكود!' : 'Code copied!');
    };

    const styles = {
        tabsHeader: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' },
        tabBtn: (active) => ({
            padding: '10px 20px', background: active ? 'var(--color-primary)' : 'transparent',
            color: active ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer',
            fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s'
        }),
        contentArea: { background: 'var(--color-card-bg)', borderRadius: '12px', padding: '24px', border: '1px solid var(--color-border)', minHeight: '400px' },
        inputGroup: { marginBottom: '20px' },
        label: { display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-primary)' },
        input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' },
        colorPickerWrap: { display: 'flex', alignItems: 'center', gap: '15px' },
        colorInput: { width: '50px', height: '50px', border: 'none', borderRadius: '8px', cursor: 'pointer', padding: 0 },
        codeBlock: { background: '#1e293b', padding: '20px', borderRadius: '12px', color: '#e2e8f0', fontFamily: 'monospace', overflowX: 'auto', whiteSpace: 'pre-wrap', direction: 'ltr', textAlign: 'left' }
    };

    return (
        <div className="widget-customizer" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px', alignItems: 'start' }}>
            <div className="customizer-controls">
                <div style={styles.tabsHeader}>
                    <button style={styles.tabBtn(activeTab === 'settings')} onClick={() => setActiveTab('settings')}>
                        <i className="fas fa-sliders-h"></i> {isArabic ? 'الإعدادات والمظهر' : 'Settings & Appearance'}
                    </button>
                    <button style={styles.tabBtn(activeTab === 'embed')} onClick={() => setActiveTab('embed')}>
                        <i className="fas fa-code"></i> {isArabic ? 'كود التضمين' : 'Embed Code'}
                    </button>
                </div>

                <div style={styles.contentArea}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'settings' && (
                            <motion.div key="settings" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}}>
                                <div style={styles.inputGroup}>
                                    <label style={styles.label}>{isArabic ? 'رسالة الترحيب' : 'Welcome Message'}</label>
                                    <textarea 
                                        rows={3}
                                        value={config.welcomeMessage || ''} 
                                        onChange={e => setConfig({...config, welcomeMessage: e.target.value})}
                                        style={{...styles.input, resize: 'none'}}
                                        placeholder={isArabic ? 'مرحباً! كيف أساعدك؟' : 'Hello! How can I help?'}
                                    />
                                </div>

                                <div style={{display: 'flex', gap: '20px', marginBottom: '20px'}}>
                                    <div style={{flex: 1}}>
                                        <label style={styles.label}>{isArabic ? 'اللون الأساسي للودجت' : 'Widget Primary Color'}</label>
                                        <div style={styles.colorPickerWrap}>
                                            <input 
                                                type="color" 
                                                value={config.primaryColor || '#6C63FF'} 
                                                onChange={e => setConfig({...config, primaryColor: e.target.value})}
                                                style={styles.colorInput}
                                            />
                                            <input 
                                                type="text" 
                                                value={config.primaryColor || '#6C63FF'} 
                                                onChange={e => setConfig({...config, primaryColor: e.target.value})}
                                                style={{...styles.input}}
                                            />
                                        </div>
                                        <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px'}}>
                                            {isArabic ? 'يستخدم في الشات والرسائل.' : 'Used in chat header & messages.'}
                                        </p>
                                    </div>

                                    <div style={{flex: 1}}>
                                        <label style={styles.label}>{isArabic ? 'لون الزر الخارجي (اللوجو)' : 'Launcher Button Color'}</label>
                                        <div style={styles.colorPickerWrap}>
                                            <input 
                                                type="color" 
                                                value={config.launcherColor || '#1e293b'} 
                                                onChange={e => setConfig({...config, launcherColor: e.target.value})}
                                                style={styles.colorInput}
                                            />
                                            <input 
                                                type="text" 
                                                value={config.launcherColor || '#1e293b'} 
                                                onChange={e => setConfig({...config, launcherColor: e.target.value})}
                                                style={{...styles.input}}
                                            />
                                        </div>
                                        <p style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px'}}>
                                            {isArabic ? 'لون الزر العائم في الموقع.' : 'Color of the floating button.'}
                                        </p>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSaveSettings} 
                                    disabled={isSaving}
                                    style={{...styles.tabBtn(true), width: '100%', justifyContent: 'center', padding: '15px'}}
                                >
                                    {isSaving ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-save"></i> {isArabic ? 'حفظ الإعدادات' : 'Save Settings'}</>}
                                </button>
                            </motion.div>
                        )}

                        {activeTab === 'embed' && (
                            <motion.div key="embed" initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}}>
                                <h3 style={{marginBottom: '15px', color: 'var(--text-primary)'}}>
                                    {isArabic ? 'ضع هذا الكود في موقعك' : 'Put this code in your website'}
                                </h3>
                                <p style={{color: 'var(--text-secondary)', marginBottom: '20px'}}>
                                    {isArabic ? 'انسخ الكود التالي وضعه قبل إغلاق وسم </body> في صفحات موقعك.' : 'Copy the code below and paste it before the closing </body> tag in your website.'}
                                </p>
                                <div style={{position: 'relative'}}>
                                    <pre style={styles.codeBlock}>
                                        <code>{embedCode}</code>
                                    </pre>
                                    <button 
                                        onClick={copyEmbedCode}
                                        style={{position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer'}}
                                    >
                                        <i className="fas fa-copy"></i>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div className="customizer-preview" style={{ background: 'var(--color-card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--color-border)', position: 'sticky', top: '20px' }}>
                <div className="preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{isArabic ? 'معاينة حية' : 'Live Preview'}</span>
                    <div className="preview-status" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        <span className="live-dot" style={{width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite'}}></span>
                        Live
                    </div>
                </div>
                
                {/* True Widget Preview Window */}
                <div className="preview-window" style={{ position: 'relative', width: '100%', height: '600px', background: '#e2e8f0', borderRadius: '24px', overflow: 'hidden', border: '4px solid #cbd5e1' }}>
                    {apiKey ? (
                        <iframe 
                            key={JSON.stringify(config)} 
                            srcDoc={previewSrcDoc} 
                            title="Widget Preview" 
                            style={{width: '100%', height: '100%', border: 'none'}}
                        />
                    ) : (
                        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8'}}>
                            Loading preview...
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
                @media (max-width: 1024px) { .widget-customizer { grid-template-columns: 1fr !important; } }
            `}</style>
        </div>
    );
};

export default WidgetCustomizer;
