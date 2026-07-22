import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion } from 'framer-motion';  


import {
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import './DashboardHome.css';
import './DashboardShared.css';
import AIPageInsight from '../../components/AIPageInsight';
import PageLoader from '../../components/ui/PageLoader';
import { useToast } from '../../components/ui/Toast';

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'var(--dash-card)', border: '1px solid var(--dash-border)', padding: '12px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <div style={{ color: 'var(--dash-text-sec)', marginBottom: '4px', fontSize: '0.85rem' }}>{label}</div>
            {payload.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--dash-text)', fontWeight: 600 }}>
                    <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: p.color || p.payload?.fill || 'var(--dash-text)' }}></span>
                    {p.name || 'Value'}: {p.value}
                </div>
            ))}
        </div>
    );
};

const DashboardHome = () => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const isArabic = language === 'ar';
    const [stats, setStats] = useState({
        totalConversations: 0,
        activeNow: 0,
        aiResolutionRate: 0,
        recentActivity: [],
        lineChartData: [],
        donutChartData: [],
        heatmapData: [],
        aiInsight: ""
    });

    const [showMenu, setShowMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = secureStorage.getItem('token');
                const response = await axios.get(`${BACKEND_URL}/company/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(response.data);
            } catch (err) {
                console.error("Error fetching analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 30000);
        return () => clearInterval(interval);
    }, []);

    const exportToCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; 
        csvContent += "Overview\nMetric,Value\n";
        csvContent += `Total Conversations,${stats.totalConversations}\n`;
        csvContent += `Active Now,${stats.activeNow}\n`;
        csvContent += `AI Resolution Rate,${stats.aiResolutionRate}%\n\n`;

        if (stats.lineChartData && stats.lineChartData.length > 0) {
            csvContent += "Chat Activity (Last 7 Days)\nDay,Conversations\n";
            stats.lineChartData.forEach(item => csvContent += `${item.label},${item.value}\n`);
            csvContent += "\n";
        }

        if (stats.donutChartData && stats.donutChartData.length > 0) {
            csvContent += "Channel Distribution\nChannel,Value\n";
            stats.donutChartData.forEach(item => csvContent += `${item.label},${item.value}\n`);
            csvContent += "\n";
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "VOXIO_Analytics_Report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(isArabic ? 'تم تصدير التقرير بنجاح!' : 'Report exported successfully!');
    };

    if (loading) return <PageLoader text={t.dashboard.homePage.loading} />;

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    // Format Donut Data
    const formattedDonutData = stats.donutChartData?.length > 0 ? stats.donutChartData.map(d => {
        let fill = '#ffffff';
        if (d.label === 'whatsapp') fill = '#25D366';
        if (d.label === 'instagram') fill = '#E1306C';
        if (d.label === 'telegram') fill = '#229ED9';
        if (d.label === 'messenger') fill = '#0084FF';
        return { name: d.label.charAt(0).toUpperCase() + d.label.slice(1), value: d.value, fill };
    }) : [{ name: isArabic ? 'لا توجد بيانات' : 'No Data', value: 1, fill: 'var(--dash-border)' }];

    // Format Line Data
    const defaultLine = [
        { label: 'Sat', value: 0 }, { label: 'Sun', value: 0 }, { label: 'Mon', value: 0 }, 
        { label: 'Tue', value: 0 }, { label: 'Wed', value: 0 }, { label: 'Thu', value: 0 }, { label: 'Fri', value: 0 }
    ];
    const lineData = stats.lineChartData?.length > 0 ? stats.lineChartData : defaultLine;

    // Heatmap Matrix
    const heatmap = stats.heatmapData?.length > 0 ? stats.heatmapData : Array(24).fill(0).map((_, i) => ({ hour: i, value: 0 }));
    const maxHeat = Math.max(...heatmap.map(d => d.value), 1);
    const cols = 7; 
    const rows = 8;
    const heatmapMatrix = [];
    for (let r = 0; r < rows; r++) {
        let rowItems = [];
        for (let c = 0; c < cols; c++) {
            const hourIndex = (r * cols + c) % 24;
            rowItems.push(heatmap[hourIndex] || { hour: hourIndex, value: 0 });
        }
        heatmapMatrix.push(rowItems);
    }

    return (
        <div className="dashboard-home-v2 animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="dash-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--dash-text)', color: 'var(--dash-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                        <i className="fas fa-chart-pie" />
                    </div>
                    <div>
                        <h1 className="dash-page-title">{isArabic ? 'لوحة المعلومات' : 'Dashboard Overview'}</h1>
                        <p className="dash-page-subtitle">{isArabic ? 'إحصائيات وأداء النظام بشكل عام' : 'System-wide statistics and performance'}</p>
                    </div>
                </div>
            </div>

            <AIPageInsight
              pageName="Dashboard Home"
              dataContext={{ aiResolutionRate: stats.aiResolutionRate, totalConversations: stats.totalMessages, activeUsers: stats.activeUsers, newLeads: stats.newLeads, totalRevenue: stats.totalRevenue }}
            />

            <motion.div className="dh-stats-row" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants} className="dash-card dh-stat-card" style={{ marginBottom: 0 }}>
                    <div className="dh-stat-icon" style={{ background: 'rgba(128,128,128, 0.1)' }}>
                        <i className="fas fa-check-double" style={{ color: 'var(--dash-text)' }}></i>
                    </div>
                    <div className="dh-stat-body">
                        <span className="dh-stat-label">{isArabic ? 'معدل الحل بواسطة AI' : 'AI Resolution Rate'}</span>
                        <span className="dh-stat-sublabel">{isArabic ? 'المحادثات التي تم حلها بواسطة AI' : 'AI-resolved conversations'}</span>
                        <div className="dh-stat-value-row">
                            <span className="dh-stat-value" style={{ color: 'var(--dash-text)' }}>{stats.aiResolutionRate}%</span>
                            <span className="dh-stat-trend" style={{ color: 'var(--dash-text)' }}>Trend <i className="fas fa-arrow-up"></i></span>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="dash-card dh-stat-card" style={{ marginBottom: 0 }}>
                    <div className="dh-stat-icon" style={{ background: 'rgba(128,128,128, 0.1)' }}>
                        <i className="fas fa-users" style={{ color: 'var(--dash-text)' }}></i>
                    </div>
                    <div className="dh-stat-body">
                        <span className="dh-stat-label">{isArabic ? 'نشط الآن' : 'Active Now'}</span>
                        <span className="dh-stat-sublabel">{isArabic ? 'المستخدمين النشطين حالياً' : 'Currently active users'}</span>
                        <div className="dh-stat-value-row">
                            <span className="dh-stat-value" style={{ color: 'var(--dash-text)' }}>{stats.activeNow}</span>
                            <span className="dh-stat-meta">{stats.activeNow > 0 ? stats.activeNow : 0} active <span className="dh-dot-green" style={{ background: '#aaaaaa' }}></span></span>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="dash-card dh-stat-card" style={{ marginBottom: 0 }}>
                    <div className="dh-stat-icon" style={{ background: 'rgba(128,128,128, 0.1)' }}>
                        <i className="fas fa-comments" style={{ color: 'var(--dash-text)' }}></i>
                    </div>
                    <div className="dh-stat-body">
                        <span className="dh-stat-label">{isArabic ? 'إجمالي المحادثات' : 'Total Conversations'}</span>
                        <span className="dh-stat-sublabel">{isArabic ? 'إجمالي المحادثات في كل الأوقات' : 'All-time total'}</span>
                        <div className="dh-stat-value-row">
                            <span className="dh-stat-value" style={{ color: 'var(--dash-text)' }}>{stats.totalConversations}</span>
                            <div className="dh-mini-bars">
                                {[40, 60, 35, 80, 55].map((h, i) => (
                                    <div key={i} className="dh-mini-bar" style={{ height: `${h}%`, background: 'var(--dash-text)', opacity: 0.2 + (i * 0.1) }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            <motion.div className="dash-card dh-analytics animate-slide-in" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ padding: '32px' }}>
                <div className="dh-analytics-header">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--dash-text)' }}>{isArabic ? 'التحليلات المتقدمة' : 'Advanced Analytics'}</h3>
                    <div style={{ position: 'relative' }}>
                        <button className="dh-analytics-menu dash-btn dash-btn-outline" style={{ width: '40px', height: '40px', padding: 0 }} onClick={() => setShowMenu(!showMenu)}>
                            <i className="fas fa-ellipsis-h"></i>
                        </button>
                        {showMenu && (
                            <div className="dash-dropdown-menu animate-slide-in" style={{ position: 'absolute', top: '100%', right: isArabic ? 'auto' : 0, left: isArabic ? 0 : 'auto', marginTop: '8px', background: 'var(--dash-card)', border: '1px solid var(--dash-border)', borderRadius: '12px', padding: '8px', zIndex: 10, minWidth: '180px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                <button className="dash-dropdown-item" onClick={() => { setShowMenu(false); window.location.reload(); }} style={{ width: '100%', textAlign: isArabic ? 'right' : 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--dash-text)', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }} onMouseEnter={(e) => e.target.style.background = 'var(--dash-bg)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <i className="fas fa-sync-alt" style={{ color: 'var(--dash-text)' }}></i>
                                    {isArabic ? 'تحديث البيانات' : 'Refresh Data'}
                                </button>
                                <button className="dash-dropdown-item" onClick={() => { setShowMenu(false); exportToCSV(); }} style={{ width: '100%', textAlign: isArabic ? 'right' : 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--dash-text)', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', marginTop: '4px' }} onMouseEnter={(e) => e.target.style.background = 'var(--dash-bg)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <i className="fas fa-file-csv" style={{ color: 'var(--dash-text)' }}></i>
                                    {isArabic ? 'تصدير كـ CSV' : 'Export as CSV'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dh-charts-grid">
                    {/* Line Chart */}
                    <div style={{ background: 'var(--dash-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--dash-border)' }}>
                        <h4 className="dh-chart-title" style={{ marginBottom: '24px' }}>{isArabic ? 'نشاط المحادثات (آخر 7 أيام)' : 'Chat Activity (Last 7 Days)'}</h4>
                        <div style={{ width: '100%', height: '220px' }} dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dash-border)" />
                                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--dash-text-sec)' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--dash-text-sec)' }} />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Donut Chart */}
                    <div style={{ background: 'var(--dash-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--dash-border)', display: 'flex', flexDirection: 'column' }}>
                        <h4 className="dh-chart-title" style={{ marginBottom: '0px' }}>{isArabic ? 'توزيع القنوات' : 'Channel Distribution'}</h4>
                        <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={formattedDonutData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                                        {formattedDonutData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Heatmap */}
                    <div style={{ background: 'var(--dash-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--dash-border)' }}>
                        <h4 className="dh-chart-title" style={{ marginBottom: '24px' }}>{isArabic ? 'ساعات الذروة' : 'Peak Hours'}</h4>
                        <div style={{ width: '100%', height: '220px', display: 'flex', flexDirection: 'column', gap: '4px' }} dir="ltr">
                            {heatmapMatrix.map((row, rIdx) => (
                                <div key={rIdx} style={{ display: 'flex', flex: 1, gap: '4px' }}>
                                    <div style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--dash-text-sec)' }}>
                                        {rIdx + 1}
                                    </div>
                                    {row.map((col, cIdx) => {
                                        const intensity = maxHeat > 0 ? col.value / maxHeat : 0;
                                        const alpha = col.value > 0 ? (0.2 + intensity * 0.8) : 0.03;
                                        return (
                                            <div key={cIdx} style={{ flex: 1, borderRadius: '4px', background: '#6366f1', opacity: alpha }} title={`Hour ${col.hour}: ${col.value} messages`}></div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>


        </div>
    );
};

export default DashboardHome;
