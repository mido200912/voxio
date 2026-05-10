import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion } from 'framer-motion';
import PageLoader from '../../components/PageLoader';
import { useToast } from '../../components/Toast';
import './Settings.css';
import './DashboardShared.css';

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
        values: '', // Handle as comma separated string for UI
        websiteUrl: '',
        allowedDomains: '', // Handle as comma separated string for UI
        logo: ''
    });
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';
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
                logo: data.logo || ''
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

            // Convert values string back to array
            const payload = {
                ...companyData,
                values: companyData.values.split(',').map(v => v.trim()).filter(v => v),
                allowedDomains: companyData.allowedDomains.split(',').map(d => d.trim()).filter(d => d),
                size: companyData.companySize,
                logo: logoUrl
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="settings-page animate-fade-in">
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">{t.dashboard.settingsPage.title}</h1>
                </div>
            </div>

            <div className="dash-grid">
                {/* Global AI Configuration */}
                <div className="dash-card animate-slide-in" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <i className="fas fa-robot"></i>
                        <h3>{language === 'ar' ? 'إعدادات الذكاء الاصطناعي العالمية' : 'Global AI Configuration'}</h3>
                    </div>
                    <div className="card-body">
                        <div className="form-row">
                            <div className="form-group half">
                                <label>{language === 'ar' ? 'وضع الرد الذكي' : 'AI Response Mode'}</label>
                                <select 
                                    className="dash-input"
                                    value={companyData.aiSettings?.mode || 'restricted'}
                                    onChange={(e) => setCompanyData({
                                        ...companyData, 
                                        aiSettings: { ...companyData.aiSettings, mode: e.target.value }
                                    })}
                                >
                                    <option value="restricted">{language === 'ar' ? 'وضع مقيد (يرد على بيانات الشركة فقط)' : 'Restricted (Answers company info only)'}</option>
                                    <option value="general">{language === 'ar' ? 'وضع عام (يساعد في أي شيء)' : 'General (Answers anything)'}</option>
                                </select>
                            </div>
                            <div className="form-group half">
                                <label>{language === 'ar' ? 'موديل الذكاء الاصطناعي المفصل' : 'Preferred AI Model'}</label>
                                <select 
                                    className="dash-input"
                                    value={companyData.aiSettings?.model || 'meta-llama/llama-3.1-8b-instruct'}
                                    onChange={(e) => setCompanyData({
                                        ...companyData, 
                                        aiSettings: { ...companyData.aiSettings, model: e.target.value }
                                    })}
                                >
                                    <option value="meta-llama/llama-3.1-8b-instruct">Llama 3.1 8B (Fastest)</option>
                                    <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B (Smartest)</option>
                                    <option value="google/gemma-2-9b-it">Gemma 2 9B (Google)</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{language === 'ar' ? 'اللغات المسموح بها' : 'Supported Languages'}</label>
                            <div className="language-tags" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                                {['Arabic', 'English', 'French', 'Spanish'].map(lang => (
                                    <label key={lang} className="lang-tag" style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px',
                                        background: 'var(--bg-secondary)', borderRadius: '10px', cursor: 'pointer',
                                        border: (companyData.aiSettings?.languages || []).includes(lang) ? '2px solid var(--dash-accent)' : '2px solid transparent'
                                    }}>
                                        <input 
                                            type="checkbox"
                                            style={{ display: 'none' }}
                                            checked={(companyData.aiSettings?.languages || []).includes(lang)}
                                            onChange={(e) => {
                                                const currentLangs = companyData.aiSettings?.languages || ['Arabic', 'English'];
                                                const newLangs = e.target.checked 
                                                    ? [...currentLangs, lang]
                                                    : currentLangs.filter(l => l !== lang);
                                                setCompanyData({
                                                    ...companyData,
                                                    aiSettings: { ...companyData.aiSettings, languages: newLangs }
                                                });
                                            }}
                                        />
                                        <span style={{ fontSize: '14px', fontWeight: '500' }}>{lang}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="dash-card animate-slide-in" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header">
                        <i className="fas fa-building"></i>
                        <h3>{t.dashboard.settingsPage.orgData}</h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group" style={{ textAlign: 'center', marginBottom: '25px' }}>
                            <label htmlFor="logo-upload" style={{ cursor: 'pointer', display: 'inline-block' }}>
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--bg-secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '2px dashed var(--border-color)',
                                    margin: '0 auto 10px'
                                }}>
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ fontSize: '24px', color: 'var(--text-secondary)' }}>📷</span>
                                    )}
                                </div>
                                <span className="text-sm" style={{ color: 'var(--primary-color)' }}>
                                    {language === 'ar' ? 'تحميل لوجو الشركة' : 'Upload Company Logo'}
                                </span>
                            </label>
                            <input
                                id="logo-upload"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={handleLogoChange}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group half">
                                <label>{t.dashboard.settingsPage.companyName}</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={companyData.name}
                                    onChange={handleInputChange}
                                    className="dash-input"
                                    placeholder={t.dashboard.settingsPage.companyNameHint}
                                />
                            </div>
                            <div className="form-group half">
                                <label>{t.dashboard.settingsPage.industry}</label>
                                <input
                                    type="text"
                                    name="industry"
                                    value={companyData.industry}
                                    onChange={handleInputChange}
                                    className="dash-input"
                                    placeholder={t.dashboard.settingsPage.industryHint}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>{t.dashboard.settingsPage.description}</label>
                            <textarea
                                name="description"
                                value={companyData.description}
                                onChange={handleInputChange}
                                className="dash-textarea"
                                rows="3"
                                placeholder={t.dashboard.settingsPage.descriptionHint}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group half">
                                <label>{t.dashboard.settingsPage.vision}</label>
                                <textarea
                                    name="vision"
                                    value={companyData.vision}
                                    onChange={handleInputChange}
                                    className="dash-textarea"
                                    rows="2"
                                    placeholder={t.dashboard.settingsPage.visionHint}
                                />
                            </div>
                            <div className="form-group half">
                                <label>{t.dashboard.settingsPage.mission}</label>
                                <textarea
                                    name="mission"
                                    value={companyData.mission}
                                    onChange={handleInputChange}
                                    className="dash-textarea"
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
                                className="dash-input"
                                placeholder={t.dashboard.settingsPage.valuesHint}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group half">
                                <label>{language === 'ar' ? 'رابط الموقع (Website URL)' : 'Website URL'}</label>
                                <input
                                    type="text"
                                    name="websiteUrl"
                                    value={companyData.websiteUrl}
                                    onChange={handleInputChange}
                                    className="dash-input"
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="form-group half">
                                <label>{language === 'ar' ? 'النطاقات المسموح بها (Allowed Domains)' : 'Allowed Domains'}</label>
                                <input
                                    type="text"
                                    name="allowedDomains"
                                    value={companyData.allowedDomains}
                                    onChange={handleInputChange}
                                    className="dash-input"
                                    placeholder="example.com, shop.example.com"
                                />
                            </div>
                        </div>
                        <p style={{fontSize: '12px', opacity: 0.6, marginBottom: '20px'}}>
                            {language === 'ar' 
                                ? '⚠️ تأمين الـ API: أدخل النطاقات التي سيتم تشغيل البوت عليها فقط لمنع استخدامه في مواقع أخرى.' 
                                : '⚠️ API Security: Enter specific domains where your bot is allowed to run to prevent unauthorized use.'}
                        </p>

                        <button
                            className="dash-btn dash-btn-primary"
                            onClick={handleSave}
                            disabled={saving}
                            style={{ marginTop: '20px' }}
                        >
                            {saving ? t.dashboard.settingsPage.saving : t.dashboard.settingsPage.saveChanges}
                        </button>
                    </div>
                </div>

                {/* API Key Section */}
                <div className="dash-card animate-slide-in">
                    <div className="card-header">
                        <i className="fas fa-key"></i>
                        <h3>{t.dashboard.settingsPage.apiKeyTitle}</h3>
                    </div>
                    <div className="card-body">
                        <p className="instruction-tip">
                            {language === 'ar' 
                                ? 'مفاتيح الربط الخاصة بك. استخدم الـ Chat Token لموقعك الإلكتروني لأمان أعلى.' 
                                : 'Your API keys. Use the Chat Token for your website for higher security.'}
                        </p>
                        
                        <div className="api-keys-container" style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                            <div className="api-key-item">
                                <label style={{fontSize:'13px', fontWeight:'600', marginBottom:'5px', display:'block'}}>
                                    {language === 'ar' ? 'مفتاح الشات (Chat Token) - آمن للمتصفح' : 'Chat Token - Browser Safe'}
                                </label>
                                <div className="api-key-box">
                                    <input type="text" value={chatToken || "Generating..."} readOnly />
                                    <button className="icon-btn" onClick={() => copyToClipboard(chatToken)} title={t.dashboard.settingsPage.copy}>
                                        <i className={`fas ${copySuccess ? 'fa-check' : 'fa-copy'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="api-key-item">
                                <label style={{fontSize:'13px', fontWeight:'600', marginBottom:'5px', display:'block', color: '#ff4444'}}>
                                    {language === 'ar' ? 'مفتاح الإدارة (Secret API Key) - لا تشاركه أبداً' : 'Secret API Key - Never Share'}
                                </label>
                                <div className="api-key-box">
                                    <input type="text" value={apiKey} readOnly />
                                    <button className="icon-btn" onClick={() => copyToClipboard(apiKey)} title={t.dashboard.settingsPage.copy}>
                                        <i className={`fas ${copySuccess ? 'fa-check' : 'fa-copy'}`}></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {copySuccess && <span className="copy-feedback" style={{marginTop:'10px', display:'block'}}>{copySuccess}</span>}

                        <div className="warning-box" style={{marginTop:'20px'}}>
                            <i className="fas fa-exclamation-triangle"></i>
                            <p>
                                {language === 'ar' 
                                    ? 'تنبيه: لا تستخدم الـ Secret API Key داخل كود الجافا سكريبت في موقعك، استخدم دائماً الـ Chat Token.' 
                                    : 'Warning: Never use your Secret API Key inside your website\'s JavaScript code. Always use the Chat Token instead.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Change Password Section */}
                <div className="dash-card animate-slide-in">
                    <div className="card-header">
                        <i className="fas fa-lock"></i>
                        <h3>Change Password</h3>
                    </div>
                    <div className="card-body">
                        {pwdError && <p style={{color: 'red', marginBottom: '10px'}}>{pwdError}</p>}
                        
                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                name="oldPassword"
                                value={pwdData.oldPassword}
                                onChange={handlePwdChange}
                                className="dash-input"
                                placeholder="Enter your current password"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group half">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={pwdData.newPassword}
                                    onChange={handlePwdChange}
                                    className="dash-input"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="form-group half">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={pwdData.confirmPassword}
                                    onChange={handlePwdChange}
                                    className="dash-input"
                                    placeholder="Confirm new password"
                                />
                            </div>
                        </div>

                        <button
                            className="dash-btn dash-btn-primary"
                            onClick={handleSavePassword}
                            disabled={pwdSaving}
                            style={{ marginTop: '20px' }}
                        >
                            {pwdSaving ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
