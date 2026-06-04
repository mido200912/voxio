import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion } from 'framer-motion';  
import PageLoader from '../../components/PageLoader';
import { useToast } from '../../components/Toast';
import './Settings.css';

const Settings = () => {
    const { user, changePassword } = useAuth();
    const { t, language } = useLanguage();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pwdSaving, setPwdSaving] = useState(false);

    // Password Change State
    const [pwdData, setPwdData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [pwdError, setPwdError] = useState('');

    // API Key State
    const [apiKey, setApiKey] = useState('');
    const [chatToken, setChatToken] = useState('');
    const [copySuccess, setCopySuccess] = useState('');

    // Company Data State
    const [companyData, setCompanyData] = useState({
        name: '',
        industry: '',
        companySize: '',
        description: '',
        vision: '',
        mission: '',
        values: '', 
        websiteUrl: '',
        allowedDomains: '', 
        logo: '',
        slug: '',
        customDomain: '',
        aiSettings: {
            mode: 'restricted',
            model: 'inclusionai/ring-2.6-1t',
            languages: ['Arabic', 'English']
        }
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = secureStorage.getItem('token');

    const fetchCompanyData = useCallback(async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/company`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = res.data;
            setCompanyData({
                name: data.name || user?.name || '',
                industry: data.industry || '',
                companySize: data.size || '',
                description: data.description || '',
                vision: data.vision || '',
                mission: data.mission || '',
                values: data.values ? data.values.join(', ') : '',
                websiteUrl: data.websiteUrl || '',
                allowedDomains: data.allowedDomains ? data.allowedDomains.join(', ') : '',
                logo: data.logo || '',
                slug: data.slug || '',
                customDomain: data.customDomain || '',
                aiSettings: data.aiSettings || {
                    mode: 'restricted',
                    model: 'inclusionai/ring-2.6-1t',
                    languages: ['Arabic', 'English']
                }
            });
            if (data.logo) {
                setLogoPreview(data.logo);
            }
        } catch (error) {
            console.error("Error fetching company data", error);
        } finally {
            setLoading(false);
        }
    }, [BACKEND_URL, token, user?.name]);

    const fetchApiKey = useCallback(async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/company/apikey`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApiKey(res.data.apiKey);
        } catch (error) {
            console.error("Error fetching API Key", error);
        }
    }, [BACKEND_URL, token]);

    const fetchChatToken = useCallback(async () => {
        try {
            const res = await axios.get(`${BACKEND_URL}/company`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChatToken(res.data.chatToken);
        } catch (error) {
            console.error("Error fetching Chat Token", error);
        }
    }, [BACKEND_URL, token]);

    useEffect(() => {
        fetchCompanyData();
        fetchApiKey();
        fetchChatToken();
    }, [fetchCompanyData, fetchApiKey, fetchChatToken]);


    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(t.dashboard.settingsPage.copiedText);
        setTimeout(() => setCopySuccess(''), 2000);
    };

    const handleInputChange = (e) => {
        setCompanyData({ ...companyData, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let logoUrl = companyData.logo;
            if (logoFile) {
                const formDataUpload = new FormData();
                formDataUpload.append('image', logoFile);
                const uploadRes = await axios.post(`${BACKEND_URL}/ai/image`, formDataUpload, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                });
                logoUrl = uploadRes.data.imageUrl;
            }

            // Convert values string back to array and attach aiSettings
            const payload = {
                name: companyData.name,
                industry: companyData.industry,
                description: companyData.description,
                vision: companyData.vision,
                mission: companyData.mission,
                values: companyData.values.split(',').map(v => v.trim()).filter(v => v),
                websiteUrl: companyData.websiteUrl,
                allowedDomains: companyData.allowedDomains.split(',').map(d => d.trim()).filter(d => d),
                size: companyData.companySize,
                logo: logoUrl,
                slug: companyData.slug,
                customDomain: companyData.customDomain,
                aiSettings: companyData.aiSettings
            };

            await axios.post(`${BACKEND_URL}/company`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(t.dashboard.settingsPage.saveSuccess);
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error(t.dashboard.settingsPage.saveError);
        } finally {
            setSaving(false);
        }
    };

    const handlePwdChange = (e) => {
        setPwdData({ ...pwdData, [e.target.name]: e.target.value });
        setPwdError('');
    };

    const handleSavePassword = async () => {
        if (!pwdData.oldPassword || !pwdData.newPassword) return setPwdError('All fields are required');
        if (pwdData.newPassword.length < 8) return setPwdError('New password must be at least 8 chars');
        if (pwdData.newPassword !== pwdData.confirmPassword) return setPwdError('New passwords do not match');

        setPwdSaving(true);
        const success = await changePassword(pwdData.oldPassword, pwdData.newPassword);
        if (success) {
            toast.success(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password changed successfully');
            setPwdData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } else {
            toast.error(language === 'ar' ? 'فشل تغيير كلمة المرور. تأكد من كلمة المرور القديمة.' : 'Failed to change password. Check your old password.');
        }
        setPwdSaving(false);
    };

    if (loading) return <PageLoader text={t.dashboard.settingsPage.loading} />;

    return (
        <div className="settings-page animate-fade-in">
            <div className="dash-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h1 className="dash-page-title">{t.dashboard.settingsPage.title}</h1>
                </div>
                <button className="dash-btn dash-btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <i className="fas fa-spinner fa-spin" /> : <i className="fas fa-save" />}
                    <span>{saving ? t.dashboard.settingsPage.saving : t.dashboard.settingsPage.saveChanges}</span>
                </button>
            </div>

            <div className="settings-grid">

                {/* 🤖 AI Configuration Section */}
                <motion.div className="settings-card-glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <div className="card-header-glass">
                        <i className="fas fa-brain"></i>
                        <h3>{language === 'ar' ? 'إعدادات الذكاء الاصطناعي (AI)' : 'AI Settings'}</h3>
                    </div>
                    <div className="card-body">
                        <div className="form-row">
                            <div className="form-group">
                                <label>{language === 'ar' ? 'وضع الاستجابة' : 'Response Mode'}</label>
                                <div className="mode-selector">
                                    <div className={`mode-option ${companyData.aiSettings?.mode === 'restricted' ? 'active' : ''}`}
                                         onClick={() => setCompanyData({...companyData, aiSettings: {...companyData.aiSettings, mode: 'restricted'}})}>
                                        <i className="fas fa-shield-alt"></i>
                                        <div className="mode-option-content">
                                            <span>{language === 'ar' ? 'مقيد' : 'Restricted'}</span>
                                            <small>{language === 'ar' ? 'لأسئلة الشركة فقط' : 'Company info only'}</small>
                                        </div>
                                    </div>
                                    <div className={`mode-option ${companyData.aiSettings?.mode === 'general' ? 'active' : ''}`}
                                         onClick={() => setCompanyData({...companyData, aiSettings: {...companyData.aiSettings, mode: 'general'}})}>
                                        <i className="fas fa-globe"></i>
                                        <div className="mode-option-content">
                                            <span>{language === 'ar' ? 'عام' : 'General'}</span>
                                            <small>{language === 'ar' ? 'مساعد ذكي شامل' : 'Helpful assistant'}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>AI Model</label>
                                <select className="settings-select" value={companyData.aiSettings?.model}
                                    onChange={(e) => setCompanyData({...companyData, aiSettings: {...companyData.aiSettings, model: e.target.value}})}>
                                    <option value="openrouter/owl-alpha">Owl Alpha</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginTop: '16px' }}>
                            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--dash-text-sec)', marginBottom: 8, display: 'block' }}>
                                {language === 'ar' ? 'شخصية الرد (AI Persona)' : 'AI Response Persona'}
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                                {[
                                    { id: 'professional', ar: 'رسمي', en: 'Professional', icon: 'fas fa-briefcase' },
                                    { id: 'friendly', ar: 'ودود', en: 'Friendly', icon: 'fas fa-smile' },
                                    { id: 'casual', ar: 'عادي', en: 'Casual', icon: 'fas fa-hand-peace' },
                                    { id: 'enthusiastic', ar: 'متحمس', en: 'Enthusiastic', icon: 'fas fa-fire' },
                                    { id: 'minimal', ar: 'مختصر', en: 'Minimal', icon: 'fas fa-compress-alt' },
                                    { id: 'expert', ar: 'خبير', en: 'Expert', icon: 'fas fa-graduation-cap' },
                                    { id: 'empathetic', ar: 'متعاطف', en: 'Empathetic', icon: 'fas fa-heart' },
                                ].map(p => (
                                    <div key={p.id}
                                        onClick={() => setCompanyData({...companyData, aiSettings: {...companyData.aiSettings, persona: p.id}})}
                                        style={{
                                            padding: '10px 12px',
                                            borderRadius: 10,
                                            border: `1px solid ${(companyData.aiSettings?.persona || 'professional') === p.id ? 'var(--dash-text)' : 'var(--dash-border)'}`,
                                            background: (companyData.aiSettings?.persona || 'professional') === p.id ? 'var(--dash-text)' : 'transparent',
                                            color: (companyData.aiSettings?.persona || 'professional') === p.id ? 'var(--dash-bg)' : 'var(--dash-text)',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            fontSize: 13,
                                            fontWeight: 600,
                                            transition: 'all 0.2s',
                                        }}>
                                        <i className={p.icon} style={{ fontSize: 16, marginBottom: 4, display: 'block' }}></i>
                                        {language === 'ar' ? p.ar : p.en}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '10px' }}>
                            <label>{language === 'ar' ? 'اللغات المدعومة للمساعد الذكي' : 'AI Supported Languages'}</label>
                            <div className="languages-chip-container">
                                {['Arabic', 'English', 'French', 'Spanish', 'German', 'Italian', 'Chinese', 'Japanese', 'Russian', 'Turkish', 'Portuguese'].map(lang => (
                                    <div key={lang} className={`lang-chip ${companyData.aiSettings?.languages?.includes(lang) ? 'active' : ''}`}
                                        onClick={() => {
                                            const langs = companyData.aiSettings?.languages || [];
                                            const newLangs = langs.includes(lang) ? langs.filter(l => l !== lang) : [...langs, lang];
                                            setCompanyData({...companyData, aiSettings: {...companyData.aiSettings, languages: newLangs}});
                                        }}>
                                        {lang}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* 🚀 Industry Templates */}
                <motion.div className="settings-card-glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                    <div className="card-header-glass">
                        <i className="fas fa-magic"></i>
                        <h3>{language === 'ar' ? 'قوالب الذكاء الاصطناعي الجاهزة' : 'Industry Templates'}</h3>
                    </div>
                    <div className="card-body">
                        <p style={{ color: 'var(--dash-text-sec)', marginBottom: '15px' }}>
                            {language === 'ar' ? 'اختر مجال عملك ليقوم الذكاء الاصطناعي بضبط إعداداته وطريقة رده تلقائياً ليناسب نشاطك.' : 'Choose your industry to automatically set up AI instructions and behavior.'}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                            {[
                                { id: 'real_estate', icon: 'fa-building', color: 'var(--color-text)', ar: 'عقارات', en: 'Real Estate' },
                                { id: 'ecommerce', icon: 'fa-shopping-cart', color: 'var(--color-text)', ar: 'متجر إلكتروني', en: 'E-commerce' },
                                { id: 'clinic', icon: 'fa-stethoscope', color: 'var(--color-text)', ar: 'عيادة طبية', en: 'Healthcare' },
                                { id: 'restaurant', icon: 'fa-utensils', color: 'var(--color-text)', ar: 'مطعم أو مقهى', en: 'Restaurant & Cafe' },
                                { id: 'travel', icon: 'fa-plane', color: 'var(--color-text)', ar: 'سياحة وسفر', en: 'Travel & Tourism' },
                                { id: 'education', icon: 'fa-graduation-cap', color: 'var(--color-text)', ar: 'تعليم ودورات', en: 'Education' },
                                { id: 'law_firm', icon: 'fa-balance-scale', color: 'var(--color-text)', ar: 'مكتب محاماة', en: 'Law Firm' },
                                { id: 'fitness', icon: 'fa-dumbbell', color: 'var(--color-text)', ar: 'صالة رياضية (جيم)', en: 'Gym & Fitness' },
                                { id: 'beauty_spa', icon: 'fa-spa', color: 'var(--color-text)', ar: 'صالون تجميل وسبا', en: 'Beauty & Spa' },
                                { id: 'car_dealership', icon: 'fa-car', color: 'var(--color-text)', ar: 'معرض وتأجير سيارات', en: 'Car Dealership' },
                                { id: 'it_software', icon: 'fa-laptop-code', color: 'var(--color-text)', ar: 'تكنولوجيا وبرمجيات', en: 'IT & Software' },
                                { id: 'marketing', icon: 'fa-bullhorn', color: 'var(--color-text)', ar: 'وكالة تسويق', en: 'Marketing Agency' },
                                { id: 'logistics', icon: 'fa-truck', color: 'var(--color-text)', ar: 'شحن وتوصيل', en: 'Logistics' },
                                { id: 'home_services', icon: 'fa-tools', color: 'var(--color-text)', ar: 'خدمات منزلية وصيانة', en: 'Home Services' },
                                { id: 'accounting', icon: 'fa-calculator', color: 'var(--color-text)', ar: 'محاسبة ومالية', en: 'Accounting' },
                                { id: 'events', icon: 'fa-calendar-alt', color: 'var(--color-text)', ar: 'تنظيم فعاليات', en: 'Event Planning' },
                                { id: 'photography', icon: 'fa-camera', color: 'var(--color-text)', ar: 'تصوير وإنتاج', en: 'Photography' },
                                { id: 'furniture', icon: 'fa-couch', color: 'var(--color-text)', ar: 'أثاث وديكور داخلي', en: 'Furniture' },
                                { id: 'fashion', icon: 'fa-tshirt', color: 'var(--color-text)', ar: 'أزياء وملابس', en: 'Fashion' },
                                { id: 'insurance', icon: 'fa-shield-alt', color: 'var(--color-text)', ar: 'تأمين', en: 'Insurance' },
                                { id: 'consulting', icon: 'fa-handshake', color: 'var(--color-text)', ar: 'استشارات', en: 'Consulting' },
                                { id: 'cleaning', icon: 'fa-broom', color: 'var(--color-text)', ar: 'خدمات تنظيف', en: 'Cleaning Services' },
                                { id: 'hotel', icon: 'fa-hotel', color: 'var(--color-text)', ar: 'فنادق وضيافة', en: 'Hotel & Hospitality' },
                                { id: 'construction', icon: 'fa-hard-hat', color: 'var(--color-text)', ar: 'مقاولات وبناء', en: 'Construction' },
                                { id: 'pharmacy', icon: 'fa-pills', color: 'var(--color-text)', ar: 'صيدلية', en: 'Pharmacy' },
                                { id: 'auto_repair', icon: 'fa-wrench', color: 'var(--color-text)', ar: 'ورشة سيارات', en: 'Auto Repair' },
                                { id: 'pets', icon: 'fa-paw', color: 'var(--color-text)', ar: 'متجر وعيادة حيوانات', en: 'Pet Shop & Care' }
                            ].map(tpl => (
                                <button key={tpl.id} className="dash-btn dash-btn-outline" onClick={async () => {
                                    try {
                                        await axios.post(`${BACKEND_URL}/company/apply-template`, { templateId: tpl.id }, { headers: { Authorization: `Bearer ${token}` } });
                                        toast.success(language === 'ar' ? `تم تفعيل قالب ${tpl.ar}` : `${tpl.en} template applied`);
                                        fetchCompanyData();
                                    } catch(e) { toast.error('Error applying template'); }
                                }} style={{ height: 'auto', padding: '15px', flexDirection: 'column', gap: '10px' }}>
                                    <i className={`fas ${tpl.icon}`} style={{ fontSize: '2rem', color: tpl.color }}></i>
                                    <span style={{ fontSize: '0.85rem', textAlign: 'center' }}>{language === 'ar' ? tpl.ar : tpl.en}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>


                {/* General Settings */}
                <motion.div className="settings-card-glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="card-header-glass">
                        <i className="fas fa-building"></i>
                        <h3>{t.dashboard.settingsPage.orgData}</h3>
                    </div>
                    <div className="card-body">
                        <label htmlFor="logo-upload" className="logo-upload-area">
                            <div className="logo-avatar">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" />
                                ) : (
                                    <i className="fas fa-camera" style={{ fontSize: '1.5rem', color: 'var(--color-text-secondary)' }} />
                                )}
                            </div>
                            <span className="logo-upload-text">
                                <i className="fas fa-cloud-upload-alt" />
                                {language === 'ar' ? 'تحميل لوجو الشركة' : 'Upload Company Logo'}
                            </span>
                        </label>
                        <input id="logo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t.dashboard.settingsPage.companyName}</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={companyData.name}
                                    onChange={handleInputChange}
                                    className="settings-input"
                                    placeholder={t.dashboard.settingsPage.companyNameHint}
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.dashboard.settingsPage.industry}</label>
                                <input
                                    type="text"
                                    name="industry"
                                    value={companyData.industry}
                                    onChange={handleInputChange}
                                    className="settings-input"
                                    placeholder={t.dashboard.settingsPage.industryHint}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{language === 'ar' ? 'رابط الموقع المستضاف (Website Subdomain)' : 'Website Subdomain'}</label>
                            <div className="settings-input-group">
                                <span>voxio-</span>
                                <input
                                    type="text"
                                    name="slug"
                                    value={companyData.slug}
                                    onChange={handleInputChange}
                                    placeholder="your-brand-name"
                                />
                                <span>.vercel.app</span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{language === 'ar' ? 'ربط دومين مخصص (Custom Domain)' : 'Custom Domain (Optional)'}</label>
                            <div className="settings-input-group">
                                <span><i className="fas fa-globe" /></span>
                                <input
                                    type="text"
                                    name="customDomain"
                                    value={companyData.customDomain}
                                    onChange={handleInputChange}
                                    placeholder={language === 'ar' ? 'www.mycompany.com' : 'www.mycompany.com'}
                                />
                            </div>
                            <div className="domain-info-box">
                                <i className="fas fa-info-circle" />
                                {language === 'ar' 
                                    ? 'وجّه إعدادات الـ DNS (CNAME) إلى cname.vercel-dns.com'
                                    : 'Point your DNS (CNAME) to cname.vercel-dns.com'}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.dashboard.settingsPage.description}</label>
                            <textarea
                                name="description"
                                value={companyData.description}
                                onChange={handleInputChange}
                                className="settings-textarea"
                                rows="3"
                                placeholder={t.dashboard.settingsPage.descriptionHint}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{t.dashboard.settingsPage.vision}</label>
                                <textarea
                                    name="vision"
                                    value={companyData.vision}
                                    onChange={handleInputChange}
                                    className="settings-textarea"
                                    rows="2"
                                    placeholder={t.dashboard.settingsPage.visionHint}
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.dashboard.settingsPage.mission}</label>
                                <textarea
                                    name="mission"
                                    value={companyData.mission}
                                    onChange={handleInputChange}
                                    className="settings-textarea"
                                    rows="2"
                                    placeholder={t.dashboard.settingsPage.missionHint}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.dashboard.settingsPage.values}</label>
                            <input
                                type="text"
                                name="values"
                                value={companyData.values}
                                onChange={handleInputChange}
                                className="settings-input"
                                placeholder={t.dashboard.settingsPage.valuesHint}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>{language === 'ar' ? 'رابط الموقع (Website URL)' : 'Website URL'}</label>
                                <input
                                    type="text"
                                    name="websiteUrl"
                                    value={companyData.websiteUrl}
                                    onChange={handleInputChange}
                                    className="settings-input"
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="form-group">
                                <label>{language === 'ar' ? 'النطاقات المسموح بها (Allowed Domains)' : 'Allowed Domains'}</label>
                                <input
                                    type="text"
                                    name="allowedDomains"
                                    value={companyData.allowedDomains}
                                    onChange={handleInputChange}
                                    className="settings-input"
                                    placeholder="example.com, shop.example.com"
                                />
                            </div>
                        </div>
                        <p className="security-note">
                            <i className="fas fa-shield-alt" />
                            {language === 'ar'
                                ? 'أدخل النطاقات التي سيتم تشغيل البوت عليها فقط لمنع استخدامه في مواقع أخرى.'
                                : 'Enter specific domains where your bot is allowed to run to prevent unauthorized use.'}
                        </p>
                    </div>
                </motion.div>

                {/* API Key Section */}
                <motion.div className="settings-card-glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <div className="card-header-glass">
                        <i className="fas fa-key"></i>
                        <h3>{t.dashboard.settingsPage.apiKeyTitle}</h3>
                    </div>
                    <div className="card-body">
                        <p className="instruction-tip">
                            {language === 'ar'
                                ? 'مفاتيح الربط الخاصة بك. استخدم الـ Chat Token لموقعك الإلكتروني لأمان أعلى.'
                                : 'Your API keys. Use the Chat Token for your website for higher security.'}
                        </p>

                        <div className="api-keys-container">
                            <div className="api-key-item">
                                <label>
                                    <span className="key-badge safe"><i className="fas fa-check-circle" /> SAFE</span>
                                    {language === 'ar' ? 'مفتاح الشات (Chat Token)' : 'Chat Token'}
                                </label>
                                <div className="api-key-box">
                                    <input type="text" value={chatToken || "Generating..."} readOnly />
                                    <button className="icon-btn" onClick={() => copyToClipboard(chatToken)} title={t.dashboard.settingsPage.copy}>
                                        <i className={`fas ${copySuccess ? 'fa-check' : 'fa-copy'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="api-key-item">
                                <label>
                                    <span className="key-badge secret"><i className="fas fa-lock" /> SECRET</span>
                                    {language === 'ar' ? 'مفتاح الإدارة (API Key)' : 'Secret API Key'}
                                </label>
                                <div className="api-key-box">
                                    <input type="text" value={apiKey} readOnly />
                                    <button className="icon-btn" onClick={() => copyToClipboard(apiKey)} title={t.dashboard.settingsPage.copy}>
                                        <i className={`fas ${copySuccess ? 'fa-check' : 'fa-copy'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {copySuccess && <span className="copy-feedback">{copySuccess}</span>}

                        <div className="warning-box">
                            <i className="fas fa-exclamation-triangle" />
                            <p>
                                {language === 'ar'
                                    ? 'لا تستخدم الـ Secret API Key داخل كود الجافا سكريبت في موقعك. استخدم دائماً الـ Chat Token.'
                                    : 'Never use your Secret API Key in frontend JavaScript. Always use the Chat Token instead.'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Change Password Section */}
                <motion.div className="settings-card-glass" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                    <div className="card-header-glass">
                        <i className="fas fa-lock"></i>
                        <h3>Change Password</h3>
                    </div>
                    <div className="card-body">
                        {pwdError && <div className="pwd-error"><i className="fas fa-exclamation-circle" /> {pwdError}</div>}

                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                name="oldPassword"
                                value={pwdData.oldPassword}
                                onChange={handlePwdChange}
                                className="settings-input"
                                placeholder="Enter your current password"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={pwdData.newPassword}
                                    onChange={handlePwdChange}
                                    className="settings-input"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={pwdData.confirmPassword}
                                    onChange={handlePwdChange}
                                    className="settings-input"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <button
                            className="dash-btn dash-btn-outline"
                            onClick={handleSavePassword}
                            disabled={pwdSaving}
                        >
                            <i className={`fas ${pwdSaving ? 'fa-spinner fa-spin' : 'fa-key'}`} />
                            {pwdSaving ? (language === 'ar' ? 'جاري التحديث...' : 'Updating...') : (language === 'ar' ? 'تحديث كلمة المرور' : 'Update Password')}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Settings;
