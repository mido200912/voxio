import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { secureStorage } from '../../utils/secureStorage';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import PageLoader from '../../components/PageLoader';
import { useToast } from '../../components/Toast';
import './DashboardHome.css';
import './DashboardShared.css';
import VOXIOChatWidget from '../../components/VOXIOChatWidget';

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
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const chartCanvasRef = useRef(null);
    const donutCanvasRef = useRef(null);
    const heatmapCanvasRef = useRef(null);

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
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Add BOM for UTF-8 (Arabic support)

        // 1. Overview Stats
        csvContent += "Overview\n";
        csvContent += `Metric,Value\n`;
        csvContent += `Total Conversations,${stats.totalConversations}\n`;
        csvContent += `Active Now,${stats.activeNow}\n`;
        csvContent += `AI Resolution Rate,${stats.aiResolutionRate}%\n\n`;

        // 2. Line Chart Data (Last 7 Days Activity)
        if (stats.lineChartData && stats.lineChartData.length > 0) {
            csvContent += "Chat Activity (Last 7 Days)\n";
            csvContent += "Day,Conversations\n";
            stats.lineChartData.forEach(item => {
                csvContent += `${item.label},${item.value}\n`;
            });
            csvContent += "\n";
        }

        // 3. Donut Chart Data (Channel Distribution)
        if (stats.donutChartData && stats.donutChartData.length > 0) {
            csvContent += "Channel Distribution\n";
            csvContent += "Channel,Value\n";
            stats.donutChartData.forEach(item => {
                csvContent += `${item.label},${item.value}\n`;
            });
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

    // Draw line chart
    useEffect(() => {
        let animationFrame;
        const timeout = setTimeout(() => {
            const canvas = chartCanvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            const w = rect.width;
            const h = rect.height;
            const pad = { top: 30, right: 20, bottom: 40, left: 40 };

            const style = getComputedStyle(document.documentElement);
            const textColor = style.getPropertyValue('--dash-text-sec').trim() || 'rgba(255,255,255,0.4)';
            const borderColor = style.getPropertyValue('--dash-border').trim() || 'rgba(255,255,255,0.06)';
            const bg = style.getPropertyValue('--dash-bg').trim() || '#fff';

            const labels = stats.lineChartData.length > 0 ? stats.lineChartData.map(d => d.label) : (isArabic ? ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
            const data = stats.lineChartData.length > 0 ? stats.lineChartData.map(d => d.value) : [0, 0, 0, 0, 0, 0, 0];
            const maxVal = Math.max(...data, 1);

            const plotW = w - pad.left - pad.right;
            const plotH = h - pad.top - pad.bottom;

            const startTime = performance.now();
            const duration = 1000;

            const draw = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 4);

                ctx.clearRect(0, 0, rect.width, rect.height);

                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 1;
                for (let i = 0; i <= 4; i++) {
                    const y = pad.top + (plotH / 4) * i;
                    ctx.beginPath();
                    ctx.moveTo(pad.left, y);
                    ctx.lineTo(w - pad.right, y);
                    ctx.stroke();
                }

                const points = data.map((v, i) => ({
                    x: pad.left + (plotW / (data.length - 1)) * i,
                    y: pad.top + plotH - (v / maxVal) * plotH * ease
                }));

                const gradient = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
                gradient.addColorStop(0, 'rgba(80, 200, 180, 0.15)');
                gradient.addColorStop(1, 'rgba(80, 200, 180, 0)');

                ctx.beginPath();
                ctx.moveTo(points[0].x, h - pad.bottom);
                points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.lineTo(points[points.length - 1].x, h - pad.bottom);
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    const cpx = (points[i - 1].x + points[i].x) / 2;
                    ctx.bezierCurveTo(cpx, points[i - 1].y, cpx, points[i].y, points[i].x, points[i].y);
                }
                ctx.strokeStyle = '#50c8b4';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                points.forEach(p => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                    ctx.fillStyle = '#50c8b4';
                    ctx.fill();
                    ctx.strokeStyle = bg;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                });

                ctx.fillStyle = textColor;
                ctx.font = '11px Outfit';
                ctx.textAlign = 'right';
                for (let i = 0; i <= 4; i++) {
                    const y = pad.top + (plotH / 4) * i;
                    const val = Math.round((maxVal / 4) * (4 - i));
                    ctx.fillText(val, pad.left - 8, y + 4);
                }

                ctx.textAlign = 'center';
                labels.forEach((label, i) => {
                    const x = pad.left + (plotW / (labels.length - 1)) * i;
                    ctx.fillText(label, x, h - pad.bottom + 20);
                });

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(draw);
                }
            };
            animationFrame = requestAnimationFrame(draw);
        }, 50);

        return () => {
            clearTimeout(timeout);
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [loading, stats, theme]);

    // Draw donut chart
    useEffect(() => {
        let animationFrame;
        const timeout = setTimeout(() => {
            const canvas = donutCanvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            const cx = rect.width / 2;
            const cy = rect.height / 2 - 10;
            const r = Math.min(cx, cy) - 10;
            const innerR = r * 0.6;

            const segments = stats.donutChartData.length > 0 ? stats.donutChartData.map(d => {
                let color = '#50c8b4';
                if (d.label === 'whatsapp') color = '#25D366';
                if (d.label === 'instagram') color = '#E4405F';
                if (d.label === 'telegram') color = '#26A5E4';
                if (d.label === 'messenger') color = '#1877F2';
                return { value: d.value, color, label: d.label.charAt(0).toUpperCase() + d.label.slice(1) };
            }) : [
                { value: 100, color: 'rgba(255,255,255,0.05)', label: isArabic ? 'لا بيانات' : 'No Data' }
            ];

            const total = segments.reduce((s, seg) => s + seg.value, 0);
            const style = getComputedStyle(document.documentElement);
            const cardBg = style.getPropertyValue('--dash-card').trim() || '#111';
            const textColor = style.getPropertyValue('--dash-text-sec').trim() || 'rgba(255,255,255,0.5)';

            const startTime = performance.now();
            const duration = 1000;

            const draw = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 4);

                ctx.clearRect(0, 0, rect.width, rect.height);

                let startAngle = -Math.PI / 2;
                segments.forEach(seg => {
                    const sliceAngle = (seg.value / total) * Math.PI * 2 * ease;
                    ctx.beginPath();
                    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
                    ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
                    ctx.closePath();
                    ctx.fillStyle = seg.color;
                    ctx.fill();
                    startAngle += sliceAngle;
                });

                ctx.beginPath();
                ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
                ctx.fillStyle = cardBg;
                ctx.fill();

                const legendY = cy + r + 20;
                ctx.font = '11px Outfit';
                let legendX = cx - 80;
                segments.forEach(seg => {
                    ctx.fillStyle = seg.color;
                    ctx.beginPath();
                    ctx.arc(legendX, legendY, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = textColor;
                    ctx.textAlign = 'left';
                    ctx.fillText(seg.label, legendX + 8, legendY + 4);
                    legendX += 70;
                });

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(draw);
                }
            };
            animationFrame = requestAnimationFrame(draw);
        }, 50);

        return () => {
            clearTimeout(timeout);
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [loading, stats, theme]);

    // Draw heatmap
    useEffect(() => {
        let animationFrame;
        const timeout = setTimeout(() => {
            const canvas = heatmapCanvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            const cols = 7;
            const rows = 8;
            const padTop = 10;
            const padLeft = 30;
            const cellW = (rect.width - padLeft - 10) / cols;
            const cellH = (rect.height - padTop - 10) / rows;
            const gap = 2;

            const heatmap = stats.heatmapData.length > 0 ? stats.heatmapData : Array(24).fill(0).map((_, i) => ({ hour: i, value: 0 }));
            const maxHeat = Math.max(...heatmap.map(d => d.value), 1);

            const style = getComputedStyle(document.documentElement);
            const textColor = style.getPropertyValue('--dash-text-sec').trim() || 'rgba(255,255,255,0.25)';

            const startTime = performance.now();
            const duration = 1000;

            const draw = (now) => {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 4);

                ctx.clearRect(0, 0, rect.width, rect.height);

                for (let r = 0; r < rows; r++) {
                    ctx.fillStyle = textColor;
                    ctx.font = '10px Outfit';
                    ctx.textAlign = 'right';
                    ctx.fillText(r + 1, padLeft - 6, padTop + r * cellH + cellH / 2 + 3);

                    for (let c = 0; c < cols; c++) {
                        const hourIndex = (r * cols + c) % 24;
                        const hVal = heatmap[hourIndex]?.value || 0;
                        const intensity = hVal / maxHeat;
                        const alpha = hVal > 0 ? (0.1 + intensity * 0.7) * ease : 0.02 * ease;
                        ctx.fillStyle = `rgba(80, 200, 180, ${alpha})`;
                        ctx.beginPath();
                        ctx.roundRect(padLeft + c * cellW + gap, padTop + r * cellH + gap, cellW - gap * 2, cellH - gap * 2, 3);
                        ctx.fill();
                    }
                }

                if (progress < 1) {
                    animationFrame = requestAnimationFrame(draw);
                }
            };
            animationFrame = requestAnimationFrame(draw);
        }, 50);

        return () => {
            clearTimeout(timeout);
            if (animationFrame) cancelAnimationFrame(animationFrame);
        };
    }, [loading, stats, theme]);

    if (loading) return <PageLoader text={t.dashboard.homePage.loading} />;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="dashboard-home-v2 animate-fade-in" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            {/* Header */}
            <div className="dash-page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--dash-accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
                        <i className="fas fa-chart-pie" />
                    </div>
                    <div>
                        <h1 className="dash-page-title">{isArabic ? 'لوحة المعلومات' : 'Dashboard Overview'}</h1>
                        <p className="dash-page-subtitle">{isArabic ? 'إحصائيات وأداء النظام بشكل عام' : 'System-wide statistics and performance'}</p>
                    </div>
                </div>
            </div>

            {/* Stats Row */}
            <motion.div
                className="dh-stats-row"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants} className="dash-card dh-stat-card" style={{ marginBottom: 0 }}>
                    <div className="dh-stat-icon" style={{ background: 'rgba(var(--dash-accent-rgb), 0.1)' }}>
                        <i className="fas fa-check-double" style={{ color: 'var(--dash-accent)' }}></i>
                    </div>
                    <div className="dh-stat-body">
                        <span className="dh-stat-label">{isArabic ? 'معدل الحل بواسطة AI' : 'AI Resolution Rate'}</span>
                        <span className="dh-stat-sublabel">{isArabic ? 'المحادثات التي تم حلها بواسطة AI' : 'AI-resolved conversations'}</span>
                        <div className="dh-stat-value-row">
                            <span className="dh-stat-value" style={{ color: 'var(--dash-accent)' }}>{stats.aiResolutionRate}%</span>
                            <span className="dh-stat-trend" style={{ color: 'var(--dash-accent)' }}>Trend <i className="fas fa-arrow-up"></i></span>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="dash-card dh-stat-card" style={{ marginBottom: 0 }}>
                    <div className="dh-stat-icon" style={{ background: 'rgba(var(--dash-text-rgb), 0.05)' }}>
                        <i className="fas fa-users" style={{ color: 'var(--dash-text-sec)' }}></i>
                    </div>
                    <div className="dh-stat-body">
                        <span className="dh-stat-label">{isArabic ? 'نشط الآن' : 'Active Now'}</span>
                        <span className="dh-stat-sublabel">{isArabic ? 'المستخدمين النشطين حالياً' : 'Currently active users'}</span>
                        <div className="dh-stat-value-row">
                            <span className="dh-stat-value">{stats.activeNow}</span>
                            <span className="dh-stat-meta">{stats.activeNow > 0 ? stats.activeNow : 0} active <span className="dh-dot-green"></span></span>
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="dash-card dh-stat-card" style={{ marginBottom: 0 }}>
                    <div className="dh-stat-icon" style={{ background: 'rgba(var(--dash-primary-rgb), 0.1)' }}>
                        <i className="fas fa-comments" style={{ color: 'var(--dash-primary)' }}></i>
                    </div>
                    <div className="dh-stat-body">
                        <span className="dh-stat-label">{isArabic ? 'إجمالي المحادثات' : 'Total Conversations'}</span>
                        <span className="dh-stat-sublabel">{isArabic ? 'إجمالي المحادثات في كل الأوقات' : 'All-time total'}</span>
                        <div className="dh-stat-value-row">
                            <span className="dh-stat-value">{stats.totalConversations}</span>
                            <div className="dh-mini-bars">
                                {[40, 60, 35, 80, 55].map((h, i) => (
                                    <div key={i} className="dh-mini-bar" style={{ height: `${h}%`, background: 'var(--dash-accent)', opacity: 0.2 + (i * 0.1) }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* Analytics Section */}
            <motion.div
                className="dash-card dh-analytics animate-slide-in"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{ padding: '32px' }}
            >
                <div className="dh-analytics-header">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--dash-text)' }}>{isArabic ? 'التحليلات المتقدمة' : 'Advanced Analytics'}</h3>
                    <div style={{ position: 'relative' }}>
                        <button 
                            className="dh-analytics-menu dash-btn dash-btn-outline" 
                            style={{ width: '40px', height: '40px', padding: 0 }}
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <i className="fas fa-ellipsis-h"></i>
                        </button>
                        {showMenu && (
                            <div className="dash-dropdown-menu animate-slide-in" style={{ position: 'absolute', top: '100%', right: isArabic ? 'auto' : 0, left: isArabic ? 0 : 'auto', marginTop: '8px', background: 'var(--dash-card)', border: '1px solid var(--dash-border)', borderRadius: '12px', padding: '8px', zIndex: 10, minWidth: '180px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                <button className="dash-dropdown-item" onClick={() => { setShowMenu(false); window.location.reload(); }} style={{ width: '100%', textAlign: isArabic ? 'right' : 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--dash-text)', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }} onMouseEnter={(e) => e.target.style.background = 'var(--dash-bg)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <i className="fas fa-sync-alt" style={{ color: 'var(--dash-primary)' }}></i>
                                    {isArabic ? 'تحديث البيانات' : 'Refresh Data'}
                                </button>
                                <button className="dash-dropdown-item" onClick={() => { setShowMenu(false); exportToCSV(); }} style={{ width: '100%', textAlign: isArabic ? 'right' : 'left', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--dash-text)', cursor: 'pointer', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', marginTop: '4px' }} onMouseEnter={(e) => e.target.style.background = 'var(--dash-bg)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>
                                    <i className="fas fa-file-csv" style={{ color: 'var(--dash-accent)' }}></i>
                                    {isArabic ? 'تصدير كـ CSV' : 'Export as CSV'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="dh-charts-grid">
                    {/* Line Chart */}
                    <div style={{ background: 'rgba(var(--dash-text-rgb), 0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--dash-border)' }}>
                        <h4 className="dh-chart-title">{isArabic ? 'نشاط المحادثات (24 ساعة)' : 'Chat Activity (24h)'}</h4>
                        <canvas ref={chartCanvasRef} className="dh-chart-canvas" style={{ width: '100%', height: '200px' }}></canvas>
                    </div>

                    {/* Donut Chart */}
                    <div style={{ background: 'rgba(var(--dash-text-rgb), 0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--dash-border)' }}>
                        <h4 className="dh-chart-title">{isArabic ? 'توزيع القنوات' : 'Channel Distribution'}</h4>
                        <canvas ref={donutCanvasRef} className="dh-chart-canvas" style={{ width: '100%', height: '200px' }}></canvas>
                    </div>

                    {/* Heatmap */}
                    <div style={{ background: 'rgba(var(--dash-text-rgb), 0.02)', padding: '24px', borderRadius: '16px', border: '1px solid var(--dash-border)' }}>
                        <h4 className="dh-chart-title">{isArabic ? 'ساعات الذروة' : 'Peak Hours'}</h4>
                        <canvas ref={heatmapCanvasRef} className="dh-chart-canvas" style={{ width: '100%', height: '200px' }}></canvas>
                    </div>
                </div>
            </motion.div>

            {/* AI Insight Floating Button */}
            <div className="dh-ai-insight">
                {stats.aiInsight && (
                    <div className="dh-ai-insight-bubble animate-pop-up">
                        <i className="fas fa-magic"></i> {stats.aiInsight}
                    </div>
                )}
                <button className="dh-ai-insight-btn" onClick={() => setIsAIOpen(!isAIOpen)}>
                    <i className="fas fa-lightbulb"></i>
                    <span>AI Insight</span>
                </button>
            </div>

            {/* Integrate the Real Chat Widget */}
            <VOXIOChatWidget />
        </div>
    );
};

export default DashboardHome;
