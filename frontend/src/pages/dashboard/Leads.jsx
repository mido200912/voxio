import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion, AnimatePresence } from 'framer-motion';
import PageLoader from '../../components/PageLoader';
import './DashboardShared.css';
import './Orders.css';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Leads = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const token = secureStorage.getItem('token');

    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${BACKEND_URL}/company/leads`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Reverse so newest leads are first
            setLeads(res.data.reverse());
        } catch (e) {
            console.error("Error fetching leads:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLead = async (originalIndex) => {
        if (!window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا العميل المحتمل؟' : 'Are you sure you want to delete this lead?')) return;
        
        try {
            const actualDbIndex = leads.length - 1 - originalIndex;
            await axios.delete(`${BACKEND_URL}/company/leads/${actualDbIndex}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const updated = [...leads];
            updated.splice(originalIndex, 1);
            setLeads(updated);
            if (selectedLead && selectedLead.index === originalIndex) {
                setSelectedLead(null);
            }
        } catch (e) {
            alert(isArabic ? 'فشل حذف العميل.' : 'Failed to delete lead.');
        }
    };

    const filteredLeads = leads.filter((req) => {
        const nameMatch = (req.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const phoneMatch = (req.phone || '').toLowerCase().includes(searchQuery.toLowerCase());
        const emailMatch = (req.email || '').toLowerCase().includes(searchQuery.toLowerCase());
        return nameMatch || phoneMatch || emailMatch;
    });

    const formatDate = (dateVal) => {
        if (!dateVal) return '';
        const d = new Date(dateVal);
        return isNaN(d.getTime()) ? '' : d.toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="orders-page animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">{isArabic ? 'العملاء المحتملين (Leads)' : 'Potential Leads'}</h1>
                    <p className="dash-page-subtitle">
                        {isArabic ? 'تتبع العملاء المحتملين الذين تم جمع بياناتهم عبر الذكاء الاصطناعي' : 'Track potential leads captured by your AI agent'}
                    </p>
                </div>
                <button className="dash-btn dash-btn-primary refresh-btn" onClick={fetchLeads}>
                    <i className="fas fa-sync-alt" />
                    {isArabic ? 'تحديث البيانات' : 'Refresh'}
                </button>
            </div>

            <div className="orders-filter-bar card-glass" style={{ marginBottom: '20px' }}>
                <div className="search-box-container" style={{ width: '100%' }}>
                    <i className="fas fa-search search-icon" />
                    <input 
                        type="text" 
                        placeholder={isArabic ? 'ابحث بالاسم، الهاتف، أو البريد...' : 'Search by name, phone, or email...'} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {loading ? (
                <PageLoader text={isArabic ? 'جاري التحميل...' : 'Loading...'} />
            ) : filteredLeads.length === 0 ? (
                <div className="empty-orders-card card-glass">
                    <i className="fas fa-user-friends empty-icon" />
                    <h3>{isArabic ? 'لا يوجد عملاء محتملين بعد' : 'No leads found'}</h3>
                    <p>{isArabic ? 'سيتم عرض تفاصيل العملاء بمجرد أن يحصل البوت على بياناتهم.' : 'Lead details will appear here once your AI collects them.'}</p>
                </div>
            ) : (
                <div className="orders-content-layout">
                    <div className="orders-table-container card-glass">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>{isArabic ? 'الاسم' : 'Name'}</th>
                                    <th>{isArabic ? 'رقم الهاتف' : 'Phone'}</th>
                                    <th>{isArabic ? 'البريد الإلكتروني' : 'Email'}</th>
                                    <th>{isArabic ? 'تاريخ الإضافة' : 'Date'}</th>
                                    <th style={{ textAlign: 'center' }}>{isArabic ? 'إجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeads.map((req, idx) => {
                                    const isSelected = selectedLead && selectedLead.index === idx;

                                    return (
                                        <tr 
                                            key={idx} 
                                            className={`order-row ${isSelected ? 'selected' : ''}`}
                                            onClick={() => setSelectedLead({ ...req, index: idx })}
                                        >
                                            <td>
                                                <div className="customer-cell">
                                                    <div className="avatar-mini" style={{ backgroundColor: 'rgba(128,128,128,0.1)', color: 'var(--color-text)' }}>
                                                        {(req.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="customer-name-text">{req.name || (isArabic ? 'غير معروف' : 'Unknown')}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="phone-badge">
                                                    {req.phone || (isArabic ? 'غير متوفر' : 'N/A')}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="product-badge" style={{ background: 'rgba(128,128,128,0.05)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                                                    {req.email || '-'}
                                                </span>
                                            </td>
                                            <td className="date-cell">{formatDate(req.date || req.createdAt)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button 
                                                    className="action-delete-btn" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteLead(idx);
                                                    }}
                                                    title={isArabic ? 'حذف العميل' : 'Delete Lead'}
                                                >
                                                    <i className="fas fa-trash-alt" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <AnimatePresence>
                        {selectedLead && (
                            <motion.div 
                                className="order-details-panel card-glass"
                                initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: isArabic ? -20 : 20 }}
                            >
                                <div className="panel-header">
                                    <h3>{isArabic ? 'تفاصيل العميل' : 'Lead Details'}</h3>
                                    <button className="close-panel-btn" onClick={() => setSelectedLead(null)}>
                                        <i className="fas fa-times" />
                                    </button>
                                </div>

                                <div className="panel-body">
                                    <div className="detail-item">
                                        <span className="detail-label">{isArabic ? 'الاسم' : 'Name'}</span>
                                        <div className="detail-val customer-val">
                                            <div className="avatar-large" style={{ backgroundColor: 'rgba(128,128,128,0.1)', color: 'var(--color-text)' }}>
                                                {(selectedLead.name || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4>{selectedLead.name || 'Unknown'}</h4>
                                                <p className="detail-date">{formatDate(selectedLead.date || selectedLead.createdAt)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-row">
                                        <div className="detail-item">
                                            <span className="detail-label">{isArabic ? 'رقم الهاتف' : 'Phone'}</span>
                                            <span className="detail-val bold">
                                                {selectedLead.phone ? (
                                                    <a href={`tel:${selectedLead.phone}`} className="phone-link">
                                                        <i className="fas fa-phone-alt" /> {selectedLead.phone}
                                                    </a>
                                                ) : (
                                                    isArabic ? 'غير متوفر' : 'N/A'
                                                )}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">{isArabic ? 'البريد الإلكتروني' : 'Email'}</span>
                                            <span className="detail-val" style={{ wordBreak: 'break-all' }}>
                                                {selectedLead.email ? (
                                                    <a href={`mailto:${selectedLead.email}`} style={{ color: 'var(--color-text)', textDecoration: 'underline' }}>
                                                        <i className="fas fa-envelope" /> {selectedLead.email}
                                                    </a>
                                                ) : '-'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {selectedLead.source && (
                                        <div className="detail-item">
                                            <span className="detail-label">{isArabic ? 'المصدر' : 'Source'}</span>
                                            <span className="platform-tag" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)', backgroundColor: 'rgba(128,128,128,0.05)', alignSelf: 'flex-start' }}>
                                                {selectedLead.source}
                                            </span>
                                        </div>
                                    )}

                                    <div className="panel-actions">
                                        {selectedLead.phone && (
                                            <a 
                                                href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="dash-btn whatsapp-btn"
                                            >
                                                <i className="fab fa-whatsapp" />
                                                {isArabic ? 'مراسلة واتساب' : 'Chat on WhatsApp'}
                                            </a>
                                        )}
                                        <button 
                                            className="dash-btn delete-btn"
                                            onClick={() => handleDeleteLead(selectedLead.index)}
                                        >
                                            <i className="fas fa-trash-alt" />
                                            {isArabic ? 'حذف العميل' : 'Delete Lead'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default Leads;
