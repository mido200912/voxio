import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const TelegramTab = () => {
    const { t, language } = useLanguage();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('');
    const [categories, setCategories] = useState([]);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');

    const isArabic = language === 'ar';

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${BACKEND_URL}/company/requests`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Filter out non-telegram requests if possible, or just use all.
            // Since our webhook explicitly assigns category/product from commands, let's just use all for now 
            // or specific ones if we had a pure platform marker.
            const allRequests = res.data;
            const reversed = [...allRequests].reverse();
            setRequests(reversed);

            // Extract unique categories (which were saved in 'product' field)
            const uniqueCategories = [...new Set(reversed.map(r => r.product || (isArabic ? 'عام' : 'General')))];
            setCategories(uniqueCategories);
            if (uniqueCategories.length > 0) setActiveTab(uniqueCategories[0]);

        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
    };

    const deleteRequest = async (indexStr, originalIndex) => {
        if (!confirm(isArabic ? 'متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this request?')) return;
        try {
            // Find the original index in the unreversed DB array
            // since we reversed it to show newest. But wait, Company.js deletes by actual array index.
            // Actually `requests` route deletes by array index in Company requests list.
            const actualDbIndex = requests.length - 1 - originalIndex; 

            await axios.delete(`${BACKEND_URL}/company/requests/${actualDbIndex}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchRequests();
        } catch (err) {
            console.error('Delete error', err);
        }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>;

    if (requests.length === 0) return (
        <div style={{ padding: '60px 40px', textAlign: 'center', color: '#666' }}>
            <div style={{ fontSize: '48px', color: '#26A5E4', marginBottom: '20px' }}><i className="fab fa-telegram-plane"></i></div>
            <h2>{isArabic ? 'لا توجد طلبات تليجرام بعد' : 'No Telegram requests yet'}</h2>
            <p>{isArabic ? 'قم بتفعيل تليجرام وإعداد أوامر لتظهر هنا.' : 'Enable Telegram and setup commands to see them here.'}</p>
        </div>
    );

    const filteredRequests = requests.filter(r => (r.product || (isArabic ? 'عام' : 'General')) === activeTab);

    return (
        <div className="telegram-tab animate-fade-in" style={{ padding: '20px' }}>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <div style={{ background: '#26A5E415', color: '#26A5E4', width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    <i className="fab fa-telegram-plane"></i>
                </div>
                <div>
                    <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', margin: 0 }}>
                        {isArabic ? 'طلبات تليجرام' : 'Telegram Requests'}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0' }}>
                        {isArabic ? 'إدارة الطلبات الواردة عبر أوامر البوت' : 'Manage requests incoming via bot commands'}
                    </p>
                </div>
            </motion.div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        style={{
                            padding: '10px 20px',
                            background: activeTab === cat ? 'var(--primary-color)' : 'transparent',
                            color: activeTab === cat ? 'white' : 'var(--text-secondary)',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontWeight: activeTab === cat ? '600' : '400',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Requests Grid */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                <AnimatePresence>
                    {filteredRequests.map((req, idx) => {
                        const globalIndex = requests.findIndex(r => r === req);
                        return (
                            <motion.div 
                                key={idx} 
                                variants={itemVariants}
                                layout
                                initial="hidden"
                                animate="visible"
                                exit={{ opacity: 0, scale: 0.9 }}
                                style={{
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    boxShadow: 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div>
                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{req.customerName}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                            {new Date(req.date).toLocaleString()}
                                        </div>
                                    </div>
                                    <button onClick={() => deleteRequest(idx, globalIndex)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                                <div style={{ background: 'var(--bg-primary)', padding: '15px', borderRadius: '12px', flex: 1, color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                                    {req.message}
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
                {filteredRequests.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        {isArabic ? 'لا توجد طلبات في هذا القسم' : 'No requests in this category'}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default TelegramTab;
