import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { useGetLeadsQuery } from '../../store/dashboardApi';
import { dashboardApi } from '../../store/dashboardApi';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

import AIPageInsight from '../../components/AIPageInsight';
import './DashboardShared.css';
import './Orders.css';
import PageLoader from '../../components/ui/PageLoader';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'closed'];

const Leads = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const token = secureStorage.getItem('token');

    const [leads, setLeads] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedLead, setSelectedLead] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage] = useState(1);
    const [editStatus, setEditStatus] = useState('');
    const dispatch = useDispatch();

    const { data, error, isLoading: loading, isFetching, refetch } = useGetLeadsQuery();
    
    // Derived state since RTK query returns all (or we could pass page to query)
    // Assuming backend handles pagination, we should ideally pass page/status to useGetLeadsQuery, 
    // but the original axios called it with params. Let's adapt it to filter on frontend or modify the RTK endpoint if needed.
    // For now, I'll filter the cached data on frontend for speed.
    const allLeads = data?.leads || [];
    const totalLeads = data?.total || allLeads.length;
    const totalPages = data?.pages || 1;

    const fetchLeads = () => {
        refetch();
    };

    const handleSearch = () => {
        setPage(1);
    };

    const handleDeleteLead = async (id) => {
        if (!window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا العميل المحتمل؟' : 'Are you sure you want to delete this lead?')) return;
        
        try {
            const res = await fetch(`${BACKEND_URL}/company/leads/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                dispatch(dashboardApi.util.updateQueryData('getLeads', undefined, (draft) => {
                    if (draft?.leads) draft.leads = draft.leads.filter(l => l._id !== id);
                }));
                if (selectedLead && selectedLead._id === id) setSelectedLead(null);
            }
        } catch (e) {
            alert(isArabic ? 'فشل حذف العميل.' : 'Failed to delete lead.');
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`${BACKEND_URL}/company/leads/${id}`, {
                method: 'PUT',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                dispatch(dashboardApi.util.updateQueryData('getLeads', undefined, (draft) => {
                    if (draft?.leads) {
                        const lead = draft.leads.find(l => l._id === id);
                        if (lead) lead.status = newStatus;
                    }
                }));
                if (selectedLead && selectedLead._id === id) setSelectedLead(prev => ({ ...prev, status: newStatus }));
            }
        } catch (e) {
            console.error("Failed to update lead status:", e);
        }
    };

    const filteredLeads = useMemo(() => {
        return allLeads.filter((req) => {
            if (statusFilter && req.status !== statusFilter) return false;
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase();
            return (req.name || '').toLowerCase().includes(q) ||
                   (req.phone || '').toLowerCase().includes(q) ||
                   (req.email || '').toLowerCase().includes(q);
        });
    }, [allLeads, searchQuery, statusFilter]);

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

    const statusBadge = (status) => {
        const colors = {
            new: '#3b82f6',
            contacted: '#f59e0b',
            qualified: '#10b981',
            converted: '#8b5cf6',
            closed: '#6b7280'
        };
        const labels = {
            new: isArabic ? 'جديد' : 'New',
            contacted: isArabic ? 'تم التواصل' : 'Contacted',
            qualified: isArabic ? 'مؤهل' : 'Qualified',
            converted: isArabic ? 'تم التحويل' : 'Converted',
            closed: isArabic ? 'مغلق' : 'Closed'
        };
        return { color: colors[status] || '#6b7280', label: labels[status] || status };
    };

    const pageInsightData = {
        totalLeads,
        leadsShown: filteredLeads.length,
        statusBreakdown: STATUS_OPTIONS.map(s => ({ status: s, count: allLeads.filter(l => l.status === s).length })),
        recentLeads: filteredLeads.slice(0, 5).map(l => ({ name: l.name, phone: l.phone, status: l.status, source: l.source })),
    };

    return (
        <div className="orders-page animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">{isArabic ? 'العملاء المحتملين (Leads)' : 'Potential Leads'}</h1>
                    <p className="dash-page-subtitle">
                        {isArabic
                            ? `إجمالي ${totalLeads} عميل محتمل — تتبع العملاء الذين تم جمع بياناتهم عبر الذكاء الاصطناعي`
                            : `${totalLeads} total leads — Track potential leads captured by your AI agent`}
                    </p>
                </div>
                <button className="dash-btn dash-btn-primary refresh-btn" onClick={fetchLeads}>
                    <i className="fas fa-sync-alt" />
                    {isArabic ? 'تحديث البيانات' : 'Refresh'}
                </button>
            </div>

            <AIPageInsight pageName="Leads" dataContext={pageInsightData} />

            <div className="orders-filter-bar card-glass" style={{ marginBottom: '20px' }}>
                <div className="search-box-container" style={{ width: '100%' }}>
                    <i className="fas fa-search search-icon" />
                    <input 
                        type="text" 
                        placeholder={isArabic ? 'ابحث بالاسم، الهاتف، أو البريد...' : 'Search by name, phone, or email...'} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="search-input"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="status-select"
                    style={{
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        color: 'var(--color-text)',
                        fontSize: '0.9rem',
                        minWidth: '140px'
                    }}
                >
                    <option value="">{isArabic ? 'كل الحالات' : 'All Status'}</option>
                    {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>{statusBadge(s).label}</option>
                    ))}
                </select>
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
                <>
                    <div className="orders-content-layout">
                        <div className="orders-table-container card-glass">
                            <table className="orders-table">
                                <thead>
                                    <tr>
                                        <th>{isArabic ? 'الاسم' : 'Name'}</th>
                                        <th>{isArabic ? 'رقم الهاتف' : 'Phone'}</th>
                                        <th>{isArabic ? 'البريد الإلكتروني' : 'Email'}</th>
                                        <th>{isArabic ? 'الحالة' : 'Status'}</th>
                                        <th>{isArabic ? 'المصدر' : 'Source'}</th>
                                        <th>{isArabic ? 'تاريخ الإضافة' : 'Date'}</th>
                                        <th style={{ textAlign: 'center' }}>{isArabic ? 'إجراءات' : 'Actions'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map((lead) => {
                                        const isSelected = selectedLead && selectedLead._id === lead._id;
                                        const sb = statusBadge(lead.status);

                                        return (
                                            <tr 
                                                key={lead._id} 
                                                className={`order-row ${isSelected ? 'selected' : ''}`}
                                                onClick={() => setSelectedLead(lead)}
                                            >
                                                <td>
                                                    <div className="customer-cell">
                                                        <div className="avatar-mini" style={{ backgroundColor: 'rgba(128,128,128,0.1)', color: 'var(--color-text)' }}>
                                                            {(lead.name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="customer-name-text">{lead.name || (isArabic ? 'غير معروف' : 'Unknown')}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="phone-badge">
                                                        {lead.phone || (isArabic ? 'غير متوفر' : 'N/A')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="product-badge" style={{ background: 'rgba(128,128,128,0.05)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                                                        {lead.email || '-'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        display: 'inline-block',
                                                        padding: '0.2rem 0.6rem',
                                                        borderRadius: '20px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        background: sb.color + '22',
                                                        color: sb.color,
                                                        border: `1px solid ${sb.color}44`
                                                    }}>
                                                        {sb.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="product-badge" style={{ background: 'rgba(128,128,128,0.05)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                                                        {lead.source || '-'}
                                                    </span>
                                                </td>
                                                <td className="date-cell">{formatDate(lead.createdAt)}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <button 
                                                        className="action-delete-btn" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteLead(lead._id);
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
                                                    <p className="detail-date">{formatDate(selectedLead.createdAt)}</p>
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

                                        <div className="detail-item">
                                            <span className="detail-label">{isArabic ? 'الحالة' : 'Status'}</span>
                                            <select
                                                value={selectedLead.status || 'new'}
                                                onChange={(e) => handleUpdateStatus(selectedLead._id, e.target.value)}
                                                style={{
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--color-border)',
                                                    background: 'var(--color-bg)',
                                                    color: 'var(--color-text)',
                                                    width: '100%',
                                                    marginTop: '0.3rem'
                                                }}
                                            >
                                                {STATUS_OPTIONS.map(s => (
                                                    <option key={s} value={s}>{statusBadge(s).label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        {selectedLead.source && (
                                            <div className="detail-item">
                                                <span className="detail-label">{isArabic ? 'المصدر' : 'Source'}</span>
                                                <span className="platform-tag" style={{ color: 'var(--color-text)', borderColor: 'var(--color-border)', backgroundColor: 'rgba(128,128,128,0.05)', alignSelf: 'flex-start' }}>
                                                    {selectedLead.source}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {selectedLead.sourceData && (selectedLead.sourceData.ip || selectedLead.sourceData.userAgent) && (
                                            <div className="detail-item">
                                                <span className="detail-label">{isArabic ? 'بيانات التصفح' : 'Browser Data'}</span>
                                                <div style={{ background: 'var(--dash-bg)', padding: '10px', borderRadius: '8px', border: '1px solid var(--dash-border)', fontSize: '0.85rem', color: 'var(--dash-text-sec)' }}>
                                                    {selectedLead.sourceData.ip && <div><strong>IP:</strong> {selectedLead.sourceData.ip}</div>}
                                                    {selectedLead.sourceData.userAgent && <div style={{ wordBreak: 'break-all', marginTop: '4px' }}><strong>Device:</strong> {selectedLead.sourceData.userAgent.substring(0, 80)}...</div>}
                                                    {selectedLead.sourceData.firstMessage && <div style={{ marginTop: '8px', fontStyle: 'italic' }}>"{selectedLead.sourceData.firstMessage}"</div>}
                                                </div>
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
                                                onClick={() => handleDeleteLead(selectedLead._id)}
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

                    {totalPages > 1 && (
                        <div className="pagination" style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '1.5rem',
                            alignItems: 'center'
                        }}>
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="dash-btn"
                                style={{ opacity: page <= 1 ? 0.4 : 1 }}
                            >
                                <i className="fas fa-chevron-right" />
                            </button>
                            <span style={{ color: 'var(--color-text)', fontSize: '0.9rem' }}>
                                {isArabic ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="dash-btn"
                                style={{ opacity: page >= totalPages ? 0.4 : 1 }}
                            >
                                <i className="fas fa-chevron-left" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Leads;
