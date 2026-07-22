import { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import { useGetOrdersQuery } from '../../store/dashboardApi';
import { dashboardApi } from '../../store/dashboardApi';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';

import AIPageInsight from '../../components/AIPageInsight';
import './DashboardShared.css';
import './Orders.css';
import PageLoader from '../../components/ui/PageLoader';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Orders = () => {
    const { language } = useLanguage();
    const isArabic = language === 'ar';
    const token = secureStorage.getItem('token');

    const [searchQuery, setSearchQuery] = useState('');
    const [platformFilter, setPlatformFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const dispatch = useDispatch();

    const { data: fetchedRequests = [], isLoading: loading, refetch } = useGetOrdersQuery();

    const requests = useMemo(() => {
        // Reverse so newest orders are first, without mutating original array
        return [...fetchedRequests].reverse();
    }, [fetchedRequests]);

    const fetchRequests = () => {
        refetch();
    };

    const handleDeleteRequest = async (originalIndex) => {
        if (!window.confirm(isArabic ? 'هل أنت متأكد من حذف هذا الطلب؟' : 'Are you sure you want to delete this order?')) return;
        
        try {
            // Since we reversed the array to show newest first, the index mapping needs correction:
            const actualDbIndex = requests.length - 1 - originalIndex;
            const res = await fetch(`${BACKEND_URL}/company/requests/${actualDbIndex}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                dispatch(dashboardApi.util.updateQueryData('getOrders', undefined, (draft) => {
                    draft.splice(actualDbIndex, 1);
                }));
                if (selectedOrder && selectedOrder.index === originalIndex) {
                    setSelectedOrder(null);
                }
            }
        } catch (e) {
            alert(isArabic ? 'فشل حذف الطلب.' : 'Failed to delete order.');
        }
    };

    // Helper to determine platform source from request data
    // Returns a `key` (always English lowercase) for filtering + localized `name` for display
    const getPlatformInfo = (req) => {
        const src = (req.source || req.platform || '').toLowerCase().trim();
        const msg = (req.message || '').toLowerCase();
        const cname = (req.customerName || '').toLowerCase();
        const combined = msg + ' ' + cname;

        // 1. Fallback / Retrofit Checks (highest priority to correctly catch legacy Telegram requests with 'web' source)
        if (combined.includes('تليجرام') || combined.includes('telegram') || combined.includes('العميل: @') || cname.includes('@')) {
            return { key: 'telegram', name: 'Telegram', icon: 'fab fa-telegram-plane', color: '#0088cc' };
        } else if (combined.includes('واتساب') || combined.includes('whatsapp') || combined.includes('طلب جديد من واتساب')) {
            return { key: 'whatsapp', name: 'WhatsApp', icon: 'fab fa-whatsapp', color: '#25D366' };
        } else if (combined.includes('إنستجرام') || combined.includes('instagram')) {
            return { key: 'instagram', name: 'Instagram', icon: 'fab fa-instagram', color: '#E1306C' };
        } else if (combined.includes('widget') || combined.includes('أداة الدردشة')) {
            return { key: 'widget', name: isArabic ? 'أداة الدردشة' : 'Chat Widget', icon: 'fas fa-comments', color: '#0ea5e9' };
        }

        // 2. Explicit Database Source Checks
        if (src === 'whatsapp') {
            return { key: 'whatsapp', name: 'WhatsApp', icon: 'fab fa-whatsapp', color: '#25D366' };
        } else if (src === 'telegram') {
            return { key: 'telegram', name: 'Telegram', icon: 'fab fa-telegram-plane', color: '#0088cc' };
        } else if (src === 'instagram') {
            return { key: 'instagram', name: 'Instagram', icon: 'fab fa-instagram', color: '#E1306C' };
        } else if (src === 'widget') {
            return { key: 'widget', name: isArabic ? 'أداة الدردشة' : 'Chat Widget', icon: 'fas fa-comments', color: '#0ea5e9' };
        } else if (src === 'web' || src === 'website') {
            return { key: 'website', name: isArabic ? 'موقع الويب' : 'Website', icon: 'fas fa-globe', color: '#4f46e5' };
        }

        if (combined.includes('طلب ويب') || combined.includes('عميل ويب') || combined.includes('web')) {
            return { key: 'website', name: isArabic ? 'موقع الويب' : 'Website', icon: 'fas fa-globe', color: '#4f46e5' };
        }

        // Default: unknown/other - show as general
        return { key: 'other', name: isArabic ? 'أخرى' : 'Other', icon: 'fas fa-question-circle', color: '#6b7280' };
    };

    // Parse clean name, phone, and product from request
    const parseOrderDetails = (req) => {
        let name = req.customerName || (isArabic ? 'عميل غير معروف' : 'Unknown Client');
        let phone = '';
        let product = req.product || (isArabic ? 'عام / استفسار' : 'General / Info');

        // Extract phone number in parentheses if present (e.g. "John Doe (0123456789)")
        const phoneMatch = name.match(/\((.*?)\)/);
        if (phoneMatch) {
            phone = phoneMatch[1];
            name = name.replace(/\(.*?\)/, '').trim();
        }

        // Fallback for telegram usernames / numbers
        if (!phone && name.startsWith('@')) {
            phone = name; // Telegram handle
        }

        return { name, phone, product };
    };

    // Filter and search — use platform.key (always English) for reliable comparison
    const filteredRequests = requests.filter((req) => {
        const details = parseOrderDetails(req);
        const platform = getPlatformInfo(req);

        const matchesSearch = 
            details.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            details.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
            details.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (req.message || '').toLowerCase().includes(searchQuery.toLowerCase());

        const matchesPlatform = 
            platformFilter === 'all' || 
            platform.key === platformFilter;

        return matchesSearch && matchesPlatform;
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

    const pageInsightData = {
        totalOrders: requests.length,
        ordersShown: filteredRequests.length,
        recentOrders: filteredRequests.slice(0, 5).map(req => {
            const details = parseOrderDetails(req);
            return { product: details.product, customer: details.name, platform: getPlatformInfo(req).key };
        }),
    };

    return (
        <div className="orders-page animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">{isArabic ? 'الطلبات والعملاء' : 'Orders & Leads'}</h1>
                    <p className="dash-page-subtitle">
                        {isArabic ? 'تتبع وإدارة جميع طلبات العملاء وبياناتهم الواردة من جميع المنصات' : 'Track and manage all customer requests and lead details from all platforms'}
                    </p>
                </div>
                <button className="dash-btn dash-btn-primary refresh-btn" onClick={fetchRequests}>
                    <i className="fas fa-sync-alt" />
                    {isArabic ? 'تحديث البيانات' : 'Refresh'}
                </button>
            </div>

            <AIPageInsight pageName="Orders" dataContext={pageInsightData} />

            {/* Filter and Search Bar */}
            <div className="orders-filter-bar card-glass">
                <div className="search-box-container">
                    <i className="fas fa-search search-icon" />
                    <input 
                        type="text" 
                        placeholder={isArabic ? 'ابحث باسم العميل، الهاتف، أو المنتج...' : 'Search by name, phone, product...'} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="platform-tabs">
                    <button 
                        className={`platform-tab ${platformFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setPlatformFilter('all')}
                    >
                        {isArabic ? 'الكل' : 'All'}
                    </button>
                    <button 
                        className={`platform-tab ${platformFilter === 'whatsapp' ? 'active' : ''}`}
                        onClick={() => setPlatformFilter('whatsapp')}
                    >
                        <i className="fab fa-whatsapp" style={{ color: '#25D366' }} /> WhatsApp
                    </button>
                    <button 
                        className={`platform-tab ${platformFilter === 'telegram' ? 'active' : ''}`}
                        onClick={() => setPlatformFilter('telegram')}
                    >
                        <i className="fab fa-telegram-plane" style={{ color: '#0088cc' }} /> Telegram
                    </button>
                    <button 
                        className={`platform-tab ${platformFilter === 'instagram' ? 'active' : ''}`}
                        onClick={() => setPlatformFilter('instagram')}
                    >
                        <i className="fab fa-instagram" style={{ color: '#E1306C' }} /> Instagram
                    </button>
                    <button 
                        className={`platform-tab ${platformFilter === 'website' ? 'active' : ''}`}
                        onClick={() => setPlatformFilter('website')}
                    >
                        <i className="fas fa-globe" style={{ color: '#4f46e5' }} /> Website
                    </button>
                    <button 
                        className={`platform-tab ${platformFilter === 'widget' ? 'active' : ''}`}
                        onClick={() => setPlatformFilter('widget')}
                    >
                        <i className="fas fa-comments" style={{ color: '#0ea5e9' }} /> {isArabic ? 'أداة الدردشة' : 'Widget'}
                    </button>
                </div>
            </div>

            {loading ? (
                <PageLoader text={isArabic ? 'جاري تحميل الطلبات...' : 'Loading orders...'} />
            ) : filteredRequests.length === 0 ? (
                <div className="empty-orders-card card-glass">
                    <i className="fas fa-inbox empty-icon" />
                    <h3>{isArabic ? 'لا توجد طلبات تطابق بحثك' : 'No orders matched your search'}</h3>
                    <p>{isArabic ? 'بمجرد أن يرسل لك عميل طلب شراء أو استفسار سيظهر هنا.' : 'Orders and customer queries will automatically populate here.'}</p>
                </div>
            ) : (
                <div className="orders-content-layout">
                    {/* Orders List Table */}
                    <div className="orders-table-container card-glass">
                        <table className="orders-table">
                            <thead>
                                <tr>
                                    <th>{isArabic ? 'العميل' : 'Customer'}</th>
                                    <th>{isArabic ? 'رقم الهاتف' : 'Phone'}</th>
                                    <th>{isArabic ? 'المنتج المطلوب' : 'Requested Product'}</th>
                                    <th>{isArabic ? 'المنصة' : 'Platform'}</th>
                                    <th>{isArabic ? 'التاريخ' : 'Date'}</th>
                                    <th style={{ textAlign: 'center' }}>{isArabic ? 'إجراءات' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map((req, idx) => {
                                    const details = parseOrderDetails(req);
                                    const platform = getPlatformInfo(req);
                                    const isSelected = selectedOrder && selectedOrder.index === idx;

                                    return (
                                        <tr 
                                            key={idx} 
                                            className={`order-row ${isSelected ? 'selected' : ''}`}
                                            onClick={() => setSelectedOrder({ ...req, index: idx })}
                                        >
                                            <td>
                                                <div className="customer-cell">
                                                    <div className="avatar-mini" style={{ backgroundColor: `${platform.color}15`, color: platform.color }}>
                                                        {details.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="customer-name-text">{details.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="phone-badge">
                                                    {details.phone || (isArabic ? 'غير متوفر' : 'N/A')}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="product-badge">
                                                    {details.product}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="platform-badge" style={{ backgroundColor: `${platform.color}15`, color: platform.color }}>
                                                    <i className={platform.icon} /> {platform.name}
                                                </span>
                                            </td>
                                            <td className="date-cell">{formatDate(req.date)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button 
                                                    className="action-delete-btn" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteRequest(idx);
                                                    }}
                                                    title={isArabic ? 'حذف الطلب' : 'Delete Order'}
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

                    {/* Order Details Panel */}
                    <AnimatePresence>
                        {selectedOrder && (
                            <motion.div 
                                className="order-details-panel card-glass"
                                initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: isArabic ? -20 : 20 }}
                            >
                                <div className="panel-header">
                                    <h3>{isArabic ? 'تفاصيل الطلب' : 'Order Details'}</h3>
                                    <button className="close-panel-btn" onClick={() => setSelectedOrder(null)}>
                                        <i className="fas fa-times" />
                                    </button>
                                </div>

                                <div className="panel-body">
                                    {(() => {
                                        const details = parseOrderDetails(selectedOrder);
                                        const platform = getPlatformInfo(selectedOrder);
                                        return (
                                            <>
                                                <div className="detail-item">
                                                    <span className="detail-label">{isArabic ? 'العميل' : 'Customer'}</span>
                                                    <div className="detail-val customer-val">
                                                        <div className="avatar-large" style={{ backgroundColor: `${platform.color}15`, color: platform.color }}>
                                                            {details.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <h4>{details.name}</h4>
                                                            <p className="detail-date">{formatDate(selectedOrder.date)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="detail-row">
                                                    <div className="detail-item">
                                                        <span className="detail-label">{isArabic ? 'رقم الهاتف' : 'Phone'}</span>
                                                        <span className="detail-val bold">
                                                            {details.phone ? (
                                                                <a href={`tel:${details.phone}`} className="phone-link">
                                                                    <i className="fas fa-phone-alt" /> {details.phone}
                                                                </a>
                                                            ) : (
                                                                isArabic ? 'غير متوفر' : 'N/A'
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">{isArabic ? 'المنصة' : 'Platform'}</span>
                                                        <span className="platform-tag" style={{ color: platform.color, borderColor: `${platform.color}30`, backgroundColor: `${platform.color}08` }}>
                                                            <i className={platform.icon} /> {platform.name}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="detail-item">
                                                    <span className="detail-label">{isArabic ? 'المنتج المطلوبة' : 'Requested Product'}</span>
                                                    <span className="detail-val product-val">{details.product}</span>
                                                </div>

                                                <div className="detail-item">
                                                    <span className="detail-label">{isArabic ? 'نص الرسالة والطلب' : 'Message / Details'}</span>
                                                    <div className="message-content-box">
                                                        {selectedOrder.message}
                                                    </div>
                                                </div>

                                                <div className="panel-actions">
                                                    {details.phone && !details.phone.startsWith('@') && (
                                                        <a 
                                                            href={`https://wa.me/${details.phone.replace(/[^0-9]/g, '')}`} 
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
                                                        onClick={() => handleDeleteRequest(selectedOrder.index)}
                                                    >
                                                        <i className="fas fa-trash-alt" />
                                                        {isArabic ? 'حذف الطلب' : 'Delete Order'}
                                                    </button>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default Orders;
