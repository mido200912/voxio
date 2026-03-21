import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'framer-motion';
import './Integrations.css';

const Integrations = () => {
    const { t } = useLanguage();
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showWhatsappModal, setShowWhatsappModal] = useState(false);
    const [whatsappData, setWhatsappData] = useState({ phoneNumberId: '', accessToken: '' });
    const [availableIntegrations, setAvailableIntegrations] = useState([
        {
            id: 'facebook',
            name: 'Facebook Messenger',
            icon: 'facebook-f',
            color: '#1877f2',
            descKey: 'messengerDesc',
            available: false
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp Business',
            icon: 'whatsapp',
            color: '#25d366',
            descKey: 'whatsappDesc',
            available: false
        },
        {
            id: 'shopify',
            name: 'Shopify',
            icon: 'shopify',
            color: '#96bf48',
            descKey: 'shopifyDesc',
            available: false
        },
        {
            id: 'instagram',
            name: 'Instagram',
            icon: 'instagram',
            color: '#e4405f',
            descKey: 'instagramDesc',
            available: false
        },
        {
            id: 'tiktok',
            name: 'TikTok',
            icon: 'tiktok',
            color: '#000000',
            descKey: 'tiktokDesc',
            available: false
        }
    ]);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchIntegrations();

        // Check for OAuth callback status
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status');
        const platform = urlParams.get('platform');

        if (status && platform) {
            if (status === 'success') {
                alert(`✅ ${t.dashboard.integrationsPage.success} ${platform}!`);
            } else {
                alert(`❌ ${t.dashboard.integrationsPage.failed} ${platform}`);
            }
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchIntegrations(); // Refresh integrations
        }
    }, []);

    const fetchIntegrations = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${BACKEND_URL}/integration-manager`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIntegrations(res.data);
        } catch (error) {
            console.error('Error fetching integrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const getIntegrationStatus = (platformId) => {
        const integration = integrations.find(int => int.platform === platformId);
        if (!integration) return 'disconnected';
        return integration.isActive ? 'connected' : 'disconnected';
    };

    const handleConnect = async (integration) => {
        if (!integration.available) return;

        try {
            // Get company ID from local storage or token
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            // For Meta (Facebook/Instagram)
            if (integration.id === 'facebook' || integration.id === 'instagram') {
                // Redirect to Meta OAuth flow
                const companyRes = await axios.get(`${BACKEND_URL}/company`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const companyId = companyRes.data._id;

                window.location.href = `${BACKEND_URL}/integrations/meta/login?companyId=${companyId}`;
            }
            // For WhatsApp Manual Flow
            else if (integration.id === 'whatsapp') {
                setShowWhatsappModal(true);
            }
            // For TikTok
            else if (integration.id === 'tiktok') {
                const companyRes = await axios.get(`${BACKEND_URL}/company`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const companyId = companyRes.data._id;

                window.location.href = `${BACKEND_URL}/integrations/tiktok/login?companyId=${companyId}`;
            }
            // For Shopify
            else if (integration.id === 'shopify') {
                const shopUrl = prompt(t.dashboard.integrationsPage.shopifyPrompt);
                if (!shopUrl) return;

                const companyRes = await axios.get(`${BACKEND_URL}/company`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const companyId = companyRes.data._id;

                window.location.href = `${BACKEND_URL}/integrations/shopify/login?shop=${shopUrl}&companyId=${companyId}`;
            }
        } catch (error) {
            console.error('Error connecting integration:', error);
            alert(t.dashboard.integrationsPage.errorConnect);
        }
    };

    const handleWhatsappSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${BACKEND_URL}/integration-manager/whatsapp`, whatsappData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(`✅ ${t.dashboard.integrationsPage.whatsappConfigSuccess || 'WhatsApp configured successfully'}`);
            setShowWhatsappModal(false);
            setWhatsappData({ phoneNumberId: '', accessToken: '' });
            fetchIntegrations();
        } catch (error) {
            console.error('Error configuring WhatsApp:', error);
            alert(t.dashboard.integrationsPage.errorConnect);
        }
    };

    const handleToggle = async (platformId) => {
        const integration = integrations.find(int => int.platform === platformId);
        if (!integration) return;

        try {
            await axios.patch(`${BACKEND_URL}/integration-manager/${integration.id}/toggle`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchIntegrations(); // Refresh
        } catch (error) {
            console.error('Error toggling integration:', error);
            alert(t.dashboard.integrationsPage.errorGen);
        }
    };

    const handleDisconnect = async (platformId) => {
        const integration = integrations.find(int => int.platform === platformId);
        if (!integration) return;

        if (!confirm(t.dashboard.integrationsPage.confirmDisconnect)) return;

        try {
            await axios.delete(`${BACKEND_URL}/integration-manager/${integration.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchIntegrations(); // Refresh
        } catch (error) {
            console.error('Error disconnecting integration:', error);
            alert(t.dashboard.integrationsPage.errorDisconnect);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 }
    };

    return (
        <div className="integrations-page animate-fade-in">
            <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="page-title"
            >
                {t.dashboard.integrationsPage.title}
            </motion.h1>
            <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="page-subtitle"
            >
                {t.dashboard.integrationsPage.subtitle}
            </motion.p>

            {/* NEW: Web Widget Section (Not locked) */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="widget-integration-section"
            >
                <div className="integration-item connected" style={{ marginBottom: '20px', cursor: 'default' }}>
                    <div className="integration-icon" style={{ backgroundColor: '#6C63FF15', color: '#6C63FF' }}>
                        <i className="fas fa-code"></i>
                    </div>
                    <div className="integration-info">
                        <h3>{t.language === 'ar' ? 'ودجت الموقع (Web Widget)' : 'Web Widget'}</h3>
                        <p>{t.language === 'ar' ? 'أضف شات بوت Aithor لموقعك الإلكتروني بضغطة واحدة.' : 'Add Aithor chatbot to your website with a single script.'}</p>
                    </div>
                    <div className="integration-action">
                        <button 
                            className="btn btn-primary"
                            onClick={() => {
                                const btn = document.getElementById('copy-widget-btn');
                                const apiKey = JSON.parse(localStorage.getItem('user'))?.apiKey || 'YOUR_API_KEY';
                                const code = `<script \n  src="https://aithor0.vercel.app/widget.js" \n  data-api-key="${apiKey}" \n  data-base-url="https://aithor0.vercel.app"\n></script>`;
                                navigator.clipboard.writeText(code);
                                const originalText = btn.innerText;
                                btn.innerText = t.language === 'ar' ? 'تم النسخ!' : 'Copied!';
                                setTimeout(() => btn.innerText = originalText, 2000);
                            }}
                            id="copy-widget-btn"
                        >
                            <i className="fas fa-copy" style={{ marginInlineEnd: '8px' }}></i>
                            {t.language === 'ar' ? 'نسخ الكود' : 'Copy Code'}
                        </button>
                    </div>
                </div>
                
                <div className="widget-code-preview">
                    <pre>
                        <code>
{`<script 
  src="https://aithor0.vercel.app/widget.js" 
  data-api-key="${JSON.parse(localStorage.getItem('user'))?.apiKey || 'YOUR_API_KEY'}" 
  data-base-url="https://aithor-v1.vercel.app"
></script>`}
                        </code>
                    </pre>
                </div>
            </motion.div>

            <div className="section-divider" style={{ margin: '40px 0', borderTop: '1px dashed var(--border-color)', opacity: 0.5 }}></div>

            {loading ? (
                <p style={{ textAlign: 'center', padding: '40px' }}>{t.dashboard.integrationsPage.loading}</p>
            ) : (
                <div style={{ position: 'relative' }}>
                    {/* Locked Overlay Start */}
                    <div className="locked-overlay" style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        zIndex: 10,
                        WebkitBackdropFilter: 'blur(8px)',
                        backdropFilter: 'blur(8px)',
                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.7)',
                        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                        padding: '20px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'var(--primary-color)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            marginBottom: '20px', color: '#fff', fontSize: '2rem',
                            boxShadow: '0 10px 25px var(--primary-glow)'
                        }}>
                            <i className="fas fa-lock"></i>
                        </div>
                        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '10px', fontWeight: 'bold' }}>
                            {t.language === 'ar' ? 'قريباً جداً' : 'Coming Soon'}
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '400px' }}>
                            {t.language === 'ar' 
                                ? 'هذا القسم قيد التطوير حالياً وسيتم إطلاق روبوتات تيليجرام وتكاملات المنصات الأخرى قريباً.' 
                                : 'This section is currently under development. Telegram bots and other integrations will be launched soon.'}
                        </p>
                    </div>
                    {/* Locked Overlay End */}

                    <motion.div
                        className="integrations-list"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        style={{ pointerEvents: 'none' }} // Disable pointer events underneath
                    >
                    {availableIntegrations.map(integration => {
                        const status = getIntegrationStatus(integration.id);

                        return (
                            <motion.div variants={itemVariants} key={integration.id} className={`integration-item ${status}`}>
                                <div className="integration-icon" style={{ backgroundColor: `${integration.color}15`, color: integration.color }}>
                                    <i className={`fab fa-${integration.icon}`}></i>
                                </div>
                                <div className="integration-info">
                                    <h3>{integration.name}</h3>
                                    <p>{t.integrations[integration.descKey]}</p>
                                </div>
                                <div className="integration-action">
                                    {!integration.available ? (
                                        <span className="badge badge-gray">{t.integrations.soon}</span>
                                    ) : status === 'connected' ? (
                                        <>
                                            <button
                                                className="btn btn-outline"
                                                onClick={() => handleToggle(integration.id)}
                                            >
                                                {t.dashboard.integrationsPage.pause}
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                style={{ marginInlineEnd: '10px' }}
                                                onClick={() => handleDisconnect(integration.id)}
                                            >
                                                {t.dashboard.integrationsPage.disconnect}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => handleConnect(integration)}
                                        >
                                            {t.dashboard.integrationsPage.connect}
                                        </button>
                                    )}
                                </div>
                                {status === 'connected' && <div className="status-dot"></div>}
                            </motion.div>
                        );
                    })}
                    </motion.div>
                </div>
            )}

            {/* WhatsApp Modal */}
            {showWhatsappModal && (
                <div className="modal-overlay" onClick={() => setShowWhatsappModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2>{t.dashboard.integrationsPage.whatsappModalTitle || 'WhatsApp Integration'}</h2>
                        <form onSubmit={handleWhatsappSubmit} className="whatsapp-form">
                            <div className="form-group">
                                <label>{t.dashboard.integrationsPage.whatsappPhoneNumberId || 'Phone Number ID'}</label>
                                <input
                                    type="text"
                                    required
                                    value={whatsappData.phoneNumberId}
                                    onChange={(e) => setWhatsappData({ ...whatsappData, phoneNumberId: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>{t.dashboard.integrationsPage.whatsappAccessToken || 'Access Token'}</label>
                                <textarea
                                    required
                                    rows="3"
                                    value={whatsappData.accessToken}
                                    onChange={(e) => setWhatsappData({ ...whatsappData, accessToken: e.target.value })}
                                ></textarea>
                            </div>
                            <p className="help-text" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
                                {t.dashboard.integrationsPage.whatsappHelp || 'Get these details from the Meta Developer Dashboard.'}
                            </p>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowWhatsappModal(false)}>
                                    {t.dashboard.integrationsPage.whatsappCancel || 'Cancel'}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {t.dashboard.integrationsPage.whatsappSave || 'Save & Connect'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Integrations;
