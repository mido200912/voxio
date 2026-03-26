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
    
    // Telegram State
    const [showTelegramModal, setShowTelegramModal] = useState(false);
    const [telegramData, setTelegramData] = useState({ botToken: '', commands: [] });
    const [newCommand, setNewCommand] = useState({ command: '', description: '', category: '', type: 'ai', message: '', products: [] });
    const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '' });

    const [availableIntegrations, setAvailableIntegrations] = useState([
        {
            id: 'whatsapp',
            name: 'WhatsApp Business',
            icon: 'whatsapp',
            color: '#25d366',
            descKey: 'whatsappDesc',
            available: false
        },
        {
            id: 'telegram',
            name: 'Telegram Bot',
            icon: 'telegram',
            color: '#26A5E4',
            descKey: 'telegramDesc',
            available: true
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
            id: 'facebook',
            name: 'Facebook Messenger',
            icon: 'facebook-f',
            color: '#1877f2',
            descKey: 'messengerDesc',
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
            // For Telegram
            else if (integration.id === 'telegram') {
                setShowTelegramModal(true);
            }
        } catch (error) {
            console.error('Error connecting integration:', error);
            alert(t.dashboard.integrationsPage.errorConnect || 'Error connecting. Try again later.');
        }
    };

    const handleTelegramSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${BACKEND_URL}/integration-manager/telegram`, telegramData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert(t.language === 'ar' ? 'تم ربط تليجرام بنجاح!' : 'Telegram connected successfully!');
            setShowTelegramModal(false);
            setTelegramData({ botToken: '', commands: [] });
            fetchIntegrations();
        } catch (error) {
            console.error('Error configuring Telegram:', error);
            alert(t.language === 'ar' ? 'حدث خطأ. تأكد من البوت توكن.' : 'Validation failed. Check your bot token.');
        }
    };

    const addTelegramCommand = () => {
        if (!newCommand.command || !newCommand.category) return;
        setTelegramData({ ...telegramData, commands: [...telegramData.commands, { ...newCommand }] });
        setNewCommand({ command: '', description: '', category: '', type: 'ai', message: '', products: [] });
        setNewProduct({ name: '', price: '', description: '' });
    };

    const removeTelegramCommand = (index) => {
        const updated = [...telegramData.commands];
        updated.splice(index, 1);
        setTelegramData({ ...telegramData, commands: updated });
    };

    const addProductToCommand = () => {
        if (!newProduct.name) return;
        setNewCommand({ ...newCommand, products: [...(newCommand.products || []), { ...newProduct }] });
        setNewProduct({ name: '', price: '', description: '' });
    };

    const removeProductFromCommand = (idx) => {
        const updated = [...newCommand.products];
        updated.splice(idx, 1);
        setNewCommand({ ...newCommand, products: updated });
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
                    <motion.div
                        className="integrations-list"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
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

            {/* Telegram Modal */}
            {showTelegramModal && (
                <div className="modal-overlay" onClick={() => setShowTelegramModal(false)}>
                    <div className="modal-content telegram-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <h2>{t.language === 'ar' ? 'إعداد تليجرام' : 'Telegram Setup'}</h2>
                        <form onSubmit={handleTelegramSubmit} className="whatsapp-form">
                            <div className="form-group">
                                <label>{t.language === 'ar' ? 'Bot Token (احصل عليه من @BotFather)' : 'Bot Token (from @BotFather)'}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="123456789:ABCDefghIJKlmnoPQRstUVwxYZ"
                                    value={telegramData.botToken}
                                    onChange={(e) => setTelegramData({ ...telegramData, botToken: e.target.value })}
                                />
                            </div>

                            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>
                                    {t.language === 'ar' ? '⚙️ الأوامر المخصصة' : '⚙️ Custom Commands'}
                                </h3>
                                <p style={{ fontSize: '0.82rem', color: '#888', marginBottom: '15px' }}>
                                    {t.language === 'ar' ? 'أضف أوامر للبوت (مثال: /shopping) مع تحديد نوع ردّه.' : 'Add bot commands (e.g. /shopping) and define how it responds.'}
                                </p>

                                {/* Added commands list */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    {telegramData.commands.map((cmd, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f8ff', padding: '10px 14px', borderRadius: '10px', border: '1px solid #26A5E430' }}>
                                            <div>
                                                <span style={{ fontWeight: 700, color: '#26A5E4' }}>/{cmd.command}</span>
                                                <span style={{ color: '#888', marginInlineStart: '8px', fontSize: '0.82rem' }}>[{cmd.type}]</span>
                                                <span style={{ color: '#555', marginInlineStart: '8px', fontSize: '0.82rem' }}>→ {cmd.category}</span>
                                                {cmd.products?.length > 0 && <span style={{ marginInlineStart: '8px', fontSize: '0.78rem', color: '#26A5E4' }}>{cmd.products.length} منتج</span>}
                                            </div>
                                            <button type="button" onClick={() => removeTelegramCommand(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <i className="fas fa-trash" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* New command builder */}
                                <div style={{ background: '#fafafa', border: '1px dashed #ccc', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <div className="form-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.82rem' }}>{t.language === 'ar' ? 'الأمر (بدون /)' : 'Command (no /)'}</label>
                                            <input type="text" placeholder="shopping" value={newCommand.command}
                                                onChange={e => setNewCommand({ ...newCommand, command: e.target.value })} />
                                        </div>
                                        <div className="form-group" style={{ flex: '1 1 120px', marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.82rem' }}>{t.language === 'ar' ? 'التصنيف' : 'Category'}</label>
                                            <input type="text" placeholder={t.language === 'ar' ? 'المبيعات' : 'Sales'} value={newCommand.category}
                                                onChange={e => setNewCommand({ ...newCommand, category: e.target.value })} />
                                        </div>
                                        <div className="form-group" style={{ flex: '1 1 140px', marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.82rem' }}>{t.language === 'ar' ? 'نوع الرد' : 'Response Type'}</label>
                                            <select value={newCommand.type} onChange={e => setNewCommand({ ...newCommand, type: e.target.value })}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', background: 'white' }}>
                                                <option value="ai">{t.language === 'ar' ? '🤖 رد ذكاء اصطناعي' : '🤖 AI Reply'}</option>
                                                <option value="fixed_message">{t.language === 'ar' ? '💬 رسالة ثابتة' : '💬 Fixed Message'}</option>
                                                <option value="product_menu">{t.language === 'ar' ? '🛍️ قائمة منتجات' : '🛍️ Product Menu'}</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Fixed message input */}
                                    {newCommand.type !== 'ai' && (
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.82rem' }}>
                                                {newCommand.type === 'fixed_message'
                                                    ? (t.language === 'ar' ? 'الرسالة الثابتة' : 'Fixed Message Text')
                                                    : (t.language === 'ar' ? 'نص قبل قائمة المنتجات (اختياري)' : 'Intro text before menu (optional)')}
                                            </label>
                                            <textarea rows="2" value={newCommand.message}
                                                placeholder={t.language === 'ar' ? 'مرحباً! هذه قائمة خدماتنا...' : 'Hello! Here are our services...'}
                                                onChange={e => setNewCommand({ ...newCommand, message: e.target.value })}
                                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical' }} />
                                        </div>
                                    )}

                                    {/* Product menu builder */}
                                    {newCommand.type === 'product_menu' && (
                                        <div style={{ background: 'white', borderRadius: '10px', padding: '12px', border: '1px solid #e0e0e0' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '10px', color: '#333' }}>
                                                {t.language === 'ar' ? '🛍️ إضافة منتجات (ستظهر كأزرار)' : '🛍️ Add Products (shown as buttons)'}
                                            </div>
                                            {newCommand.products?.map((p, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: '#f0f8ff', borderRadius: '8px', marginBottom: '6px' }}>
                                                    <span style={{ fontSize: '0.85rem' }}><b>{p.name}</b>{p.price && ` - ${p.price}`}</span>
                                                    <button type="button" onClick={() => removeProductFromCommand(i)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                        <i className="fas fa-times" />
                                                    </button>
                                                </div>
                                            ))}
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                                                <input type="text" placeholder={t.language === 'ar' ? 'اسم المنتج' : 'Product name'} value={newProduct.name}
                                                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                                                    style={{ flex: '1 1 130px', padding: '7px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem' }} />
                                                <input type="text" placeholder={t.language === 'ar' ? 'السعر (اختياري)' : 'Price (optional)'} value={newProduct.price}
                                                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                                                    style={{ flex: '0 1 110px', padding: '7px 10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.85rem' }} />
                                                <button type="button" onClick={addProductToCommand}
                                                    style={{ padding: '7px 14px', background: '#26A5E4', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                    <i className="fas fa-plus" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <button type="button" onClick={addTelegramCommand}
                                        style={{ alignSelf: 'flex-start', padding: '8px 20px', background: '#26A5E4', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>
                                        <i className="fas fa-plus" style={{ marginInlineEnd: '6px' }} />
                                        {t.language === 'ar' ? 'إضافة الأمر' : 'Add Command'}
                                    </button>
                                </div>
                            </div>

                            <div className="modal-actions" style={{ marginTop: '30px' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setShowTelegramModal(false)}>
                                    {t.dashboard.integrationsPage.whatsappCancel || 'Cancel'}
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ background: '#26A5E4', borderColor: '#26A5E4' }}>
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
