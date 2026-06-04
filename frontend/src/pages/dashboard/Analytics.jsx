import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';
import PageLoader from '../../components/PageLoader';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import './DashboardShared.css';
import './Analytics.css';

/* ── Platform Config ── */
const PLATFORM_CONFIG = {
  whatsapp:  { color: '#25D366', icon: 'fab fa-whatsapp' },
  telegram:  { color: '#229ED9', icon: 'fab fa-telegram-plane' },
  instagram: { color: '#E1306C', icon: 'fab fa-instagram' },
  web:       { color: '#6366f1', icon: 'fas fa-globe' },
  widget:    { color: '#a0a0a0', icon: 'fas fa-puzzle-piece' },
  unknown:   { color: '#a0a0a0', icon: 'fas fa-question-circle' },
};

const LEAD_STATUS_COLORS = {
  new:       '#6366f1',
  contacted: '#f59e0b',
  converted: '#22c55e',
  lost:      '#ef4444',
  qualified: '#8b5cf6',
};

/* ── Custom Tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <div className="an-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="an-tooltip-row">
          <span>{p.name}</span>
          <span style={{ color: p.color, fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ── Empty State ── */
const EmptyState = ({ icon, text }) => (
  <div className="an-empty">
    <i className={icon} />
    <span>{text}</span>
  </div>
);

/* ══════════════════════════════════════════ */
const Analytics = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const t = (ar, en) => isArabic ? ar : en;

  const [dashboard, setDashboard] = useState(null);
  const [timeseries, setTimeseries]  = useState([]);
  const [platforms, setPlatforms]    = useState([]);
  const [hourly, setHourly]          = useState([]);
  const [responseTime, setResponseTime] = useState(null);
  const [leads, setLeads]            = useState(null);
  const [loading, setLoading]        = useState(true);
  const [refreshing, setRefreshing]  = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [period, setPeriod]          = useState(30);
  const isFirstLoad = useRef(true);

  const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token   = secureStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    if (isFirstLoad.current) setLoading(true);
    else setRefreshing(true);
    try {
      const [dashRes, tsRes, plRes, hrRes, rtRes, ldRes] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/analytics/dashboard?days=${period}`, { headers }),
        axios.get(`${BACKEND_URL}/analytics/timeseries?days=${period}`, { headers }),
        axios.get(`${BACKEND_URL}/analytics/platforms?days=${period}`, { headers }),
        axios.get(`${BACKEND_URL}/analytics/hourly?days=${period}`, { headers }),
        axios.get(`${BACKEND_URL}/analytics/response-time?days=${period}`, { headers }),
        axios.get(`${BACKEND_URL}/analytics/leads?days=${period}`, { headers }),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      if (tsRes.status  === 'fulfilled') setTimeseries(Array.isArray(tsRes.value.data) ? tsRes.value.data : []);
      if (plRes.status  === 'fulfilled') setPlatforms(Array.isArray(plRes.value.data) ? plRes.value.data : []);
      if (hrRes.status  === 'fulfilled') setHourly(Array.isArray(hrRes.value.data) ? hrRes.value.data : []);
      if (rtRes.status  === 'fulfilled') setResponseTime(rtRes.value.data);
      if (ldRes.status  === 'fulfilled') setLeads(ldRes.value.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFirstLoad.current = false;
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
  };

  const fmtDate = (d) => d?.slice(5) || d || '';

  const heatColor = (pct) => {
    if (pct === 0)  return 'var(--an-heat-0)';
    if (pct < 25)   return 'var(--an-heat-1)';
    if (pct < 50)   return 'var(--an-heat-2)';
    if (pct < 75)   return 'var(--an-heat-3)';
    return 'var(--an-heat-4)';
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('an-pdf-root');
    if (!element) return;
    setDownloading(true);
    const opt = {
      margin:      0.3,
      filename:    `Analytics_${new Date().toISOString().split('T')[0]}.pdf`,
      image:       { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF:       { unit: 'in', format: 'a4', orientation: 'landscape' },
    };
    const run = () => window.html2pdf().set(opt).from(element).save().finally(() => setDownloading(false));
    if (!window.html2pdf) {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      s.onload = run;
      document.body.appendChild(s);
    } else run();
  };

  if (loading) return <PageLoader />;

  const s = dashboard || {};
  const totalPlatformMsgs = platforms.reduce((a, p) => a + p.count, 0) || 1;

  /* ── KPI cards data ── */
  const kpis = [
    {
      icon:    'fas fa-comments',
      label:   t('إجمالي الرسائل', 'Total Messages'),
      value:   fmt(s.totalMessages),
      note:    `${fmt(s.totalConversations)} ${t('محادثة', 'conversations')}`,
      accent:  '#6366f1',
    },
    {
      icon:    'fas fa-robot',
      label:   t('معدل الـ AI', 'AI Resolution'),
      value:   `${s.aiResolutionRate || 0}%`,
      note:    `${fmt(s.aiReplies)} ${t('رد آلي', 'AI replies')}`,
      accent:  '#8b5cf6',
    },
    {
      icon:    'fas fa-user-plus',
      label:   t('العملاء المحتملون', 'Total Leads'),
      value:   fmt(leads?.totalLeads || 0),
      note:    `${fmt(s.newLeads)} ${t('جديد', 'new')}`,
      accent:  '#f59e0b',
    },
    {
      icon:    'fas fa-bolt',
      label:   t('وقت الاستجابة', 'Avg. Response'),
      value:   `${responseTime?.averageResponseTimeSeconds || 0}s`,
      note:    `${t('أسرع', 'Fastest')}: ${responseTime?.fastestResponse || 0}s`,
      accent:  '#22c55e',
    },
  ];

  return (
    <div className="an-page" dir={isArabic ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="an-header">
        <div className="an-header-left">
          <h1 className="an-title">{t('التحليلات', 'Analytics')}</h1>
          <p className="an-subtitle">
            {t(`بيانات آخر ${period} يوم`, `Last ${period} days of data`)}
            {refreshing && <span className="an-refreshing-dot" />}
          </p>
        </div>

        <div className="an-header-right">
          {/* Period tabs */}
          <div className="an-tabs">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                className={`an-tab ${period === d ? 'active' : ''}`}
                onClick={() => setPeriod(d)}
              >
                {d}{t('ي', 'd')}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            className={`an-icon-btn ${refreshing ? 'spinning' : ''}`}
            onClick={fetchData}
            title={t('تحديث', 'Refresh')}
          >
            <i className="fas fa-sync-alt" />
          </button>

          {/* Download PDF */}
          <button
            className="an-icon-btn an-icon-btn--pdf"
            onClick={handleDownloadPDF}
            disabled={downloading}
            title={t('تحميل PDF', 'Download PDF')}
          >
            {downloading
              ? <i className="fas fa-spinner fa-spin" />
              : <i className="fas fa-file-pdf" />}
          </button>
        </div>
      </div>

      {/* ══════════ PDF Root ══════════ */}
      <div id="an-pdf-root" className="an-body">

        {/* ── KPI Row ── */}
        <div className="an-kpi-row">
          {kpis.map((k, i) => (
            <div key={i} className="an-kpi" style={{ '--accent': k.accent }}>
              <div className="an-kpi-icon"><i className={k.icon} /></div>
              <div className="an-kpi-content">
                <div className="an-kpi-value">{k.value}</div>
                <div className="an-kpi-label">{k.label}</div>
                <div className="an-kpi-note">{k.note}</div>
              </div>
              <div className="an-kpi-bar" />
            </div>
          ))}
        </div>

        {/* ── Main chart — full width ── */}
        <div className="an-card an-card--wide">
          <div className="an-card-head">
            <div>
              <div className="an-card-title">{t('نشاط الرسائل', 'Message Activity')}</div>
              <div className="an-card-sub">{t('المستخدمون مقابل ردود AI', 'Users vs AI Replies')}</div>
            </div>
            <div className="an-legend">
              <span className="an-legend-item"><span className="an-legend-dot" style={{ background: '#6366f1' }} />{t('مستخدمون', 'Users')}</span>
              <span className="an-legend-item"><span className="an-legend-dot" style={{ background: '#a78bfa' }} />{t('ردود AI', 'AI')}</span>
            </div>
          </div>

          {timeseries.length > 0 ? (
            <div dir="ltr" className="an-chart-wrap an-chart-wrap--tall">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeseries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gUser" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gAi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--dash-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--dash-text-sec)' }} tickFormatter={fmtDate} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--dash-text-sec)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="user" name={t('مستخدمون', 'Users')}
                    stroke="#6366f1" strokeWidth={2} fill="url(#gUser)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                  <Area type="monotone" dataKey="ai" name={t('ردود AI', 'AI Replies')}
                    stroke="#a78bfa" strokeWidth={2} fill="url(#gAi)" dot={false} activeDot={{ r: 4, fill: '#a78bfa' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <EmptyState icon="fas fa-chart-line" text={t('لا توجد بيانات', 'No data yet')} />}
        </div>

        {/* ── Row: Conversations + Platforms ── */}
        <div className="an-row">

          {/* Conversations bar */}
          <div className="an-card an-card--grow2">
            <div className="an-card-head">
              <div>
                <div className="an-card-title">{t('نشاط المحادثات', 'Conversation Volume')}</div>
                <div className="an-card-sub">{t(`آخر ${period} يوم`, `Last ${period} days`)}</div>
              </div>
            </div>
            {timeseries.length > 0 ? (
              <div dir="ltr" className="an-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeseries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 4" stroke="var(--dash-border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--dash-text-sec)' }} tickFormatter={fmtDate} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--dash-text-sec)' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="conversations" name={t('محادثات', 'Conversations')}
                      fill="var(--dash-text)" radius={[3, 3, 0, 0]} maxBarSize={20} opacity={0.85} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <EmptyState icon="fas fa-chart-bar" text={t('لا توجد بيانات', 'No data yet')} />}
          </div>

          {/* Platforms */}
          <div className="an-card an-card--grow1">
            <div className="an-card-head">
              <div>
                <div className="an-card-title">{t('توزيع المنصات', 'Platform Split')}</div>
                <div className="an-card-sub">{t('حسب الرسائل', 'by messages')}</div>
              </div>
            </div>
            {platforms.length > 0 ? (
              <div className="an-platform-wrap">
                <div dir="ltr" className="an-donut-wrap">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={platforms} dataKey="count" nameKey="platform"
                        cx="50%" cy="50%" innerRadius={42} outerRadius={60} paddingAngle={3} stroke="none">
                        {platforms.map((p, i) => {
                          const cfg = PLATFORM_CONFIG[p.platform] || PLATFORM_CONFIG.unknown;
                          return <Cell key={i} fill={cfg.color} />;
                        })}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="an-platform-list">
                  {platforms.map((p, i) => {
                    const cfg = PLATFORM_CONFIG[p.platform] || PLATFORM_CONFIG.unknown;
                    const pct = Math.round((p.count / totalPlatformMsgs) * 100);
                    return (
                      <div key={i} className="an-platform-item">
                        <div className="an-platform-top">
                          <span className="an-platform-name">
                            <i className={cfg.icon} style={{ color: cfg.color }} />
                            {p.platform}
                          </span>
                          <span className="an-platform-pct">{pct}%</span>
                        </div>
                        <div className="an-bar-track">
                          <div className="an-bar-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <EmptyState icon="fas fa-chart-pie" text={t('لا توجد بيانات', 'No data yet')} />}
          </div>
        </div>

        {/* ── Row: Peak Hours + AI Performance ── */}
        <div className="an-row">

          {/* Peak Hours Heatmap */}
          <div className="an-card an-card--grow1">
            <div className="an-card-head">
              <div>
                <div className="an-card-title">{t('ساعات الذروة', 'Peak Hours')}</div>
                <div className="an-card-sub">{t('توزيع النشاط خلال اليوم', 'activity by hour')}</div>
              </div>
            </div>
            {hourly.length > 0 ? (
              <>
                <div className="an-heatmap" dir="ltr">
                  {hourly.map((h, i) => (
                    <div
                      key={i}
                      className="an-heat-cell"
                      style={{ background: heatColor(h.percentage) }}
                      title={`${h.label}: ${h.count} ${t('رسائل', 'msgs')}`}
                    />
                  ))}
                </div>
                <div className="an-heatmap-labels" dir="ltr">
                  <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
                </div>
                {(() => {
                  const peak = [...hourly].sort((a, b) => b.count - a.count)[0];
                  return peak?.count > 0 ? (
                    <div className="an-peak-badge">
                      <i className="fas fa-fire" />
                      <span>{t('ذروة:', 'Peak:')} <strong>{peak.label}</strong> — {peak.count} {t('رسالة', 'msgs')}</span>
                    </div>
                  ) : null;
                })()}
              </>
            ) : <EmptyState icon="fas fa-clock" text={t('لا توجد بيانات', 'No data yet')} />}
          </div>

          {/* AI Performance */}
          <div className="an-card an-card--grow1">
            <div className="an-card-head">
              <div>
                <div className="an-card-title">{t('أداء الـ AI', 'AI Performance')}</div>
                <div className="an-card-sub">{t('وقت الاستجابة والردود', 'response time & replies')}</div>
              </div>
            </div>

            {/* Response stats */}
            <div className="an-stat-trio">
              {[
                { label: t('متوسط', 'Avg'), value: `${responseTime?.averageResponseTimeSeconds ?? 0}s`, color: '#22c55e' },
                { label: t('أسرع', 'Fastest'), value: `${responseTime?.fastestResponse ?? 0}s`, color: '#6366f1' },
                { label: t('أبطأ', 'Slowest'), value: `${responseTime?.slowestResponse ?? 0}s`, color: '#f59e0b' },
              ].map((st, i) => (
                <div key={i} className="an-stat-item">
                  <div className="an-stat-val" style={{ color: st.color }}>{st.value}</div>
                  <div className="an-stat-lbl">{st.label}</div>
                </div>
              ))}
            </div>

            {/* Reply breakdown */}
            <div className="an-section-label">{t('توزيع الردود', 'Reply Breakdown')}</div>
            {[
              { label: t('AI', 'AI'), val: s.aiReplies || 0, color: '#8b5cf6' },
              { label: t('بشري', 'Human'), val: s.agentReplies || 0, color: '#f59e0b' },
            ].map((item, i) => {
              const total = (s.aiReplies || 0) + (s.agentReplies || 0);
              const pct = total > 0 ? Math.round((item.val / total) * 100) : 0;
              return (
                <div key={i} className="an-reply-row">
                  <div className="an-reply-meta">
                    <span>{item.label}</span>
                    <span style={{ color: item.color }}>{item.val} <span className="an-dim">({pct}%)</span></span>
                  </div>
                  <div className="an-bar-track">
                    <div className="an-bar-fill" style={{ width: `${pct}%`, background: item.color }} />
                  </div>
                </div>
              );
            })}

            {/* Active users pulse */}
            <div className="an-pulse-row">
              <span className="an-pulse-dot" />
              <span>
                <strong>{s.activeUsers || 0}</strong> {t('مستخدم نشط', 'active users')}
                <span className="an-dim"> {t('(آخر ساعة)', '(last hour)')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── Leads ── */}
        {leads && leads.totalLeads > 0 && (
          <div className="an-card">
            <div className="an-card-head">
              <div>
                <div className="an-card-title">{t('العملاء المحتملون', 'Leads Overview')}</div>
                <div className="an-card-sub">{t('توزيع حسب الحالة والمصدر', 'by status & source')}</div>
              </div>
              <div className="an-leads-total-badge">{fmt(leads.totalLeads)} {t('عميل', 'leads')}</div>
            </div>

            <div className="an-leads-body">
              {/* Status list */}
              <div className="an-leads-status">
                {leads.byStatus?.map((item, i) => {
                  const pct = leads.totalLeads > 0 ? Math.round((item.count / leads.totalLeads) * 100) : 0;
                  return (
                    <div key={i} className="an-lead-item">
                      <div className="an-lead-top">
                        <span className="an-lead-dot" style={{ background: LEAD_STATUS_COLORS[item.status] || '#888' }} />
                        <span className="an-lead-name">{item.status}</span>
                        <span className="an-lead-count">{item.count}</span>
                        <span className="an-dim an-lead-pct">{pct}%</span>
                      </div>
                      <div className="an-bar-track">
                        <div className="an-bar-fill" style={{ width: `${pct}%`, background: LEAD_STATUS_COLORS[item.status] || '#888' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Source chart */}
              {leads.bySource?.length > 0 && (
                <div className="an-leads-source">
                  <div className="an-section-label">{t('حسب المصدر', 'By Source')}</div>
                  <div dir="ltr" className="an-chart-wrap an-chart-wrap--sm">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={leads.bySource} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 4" stroke="var(--dash-border)" vertical={false} />
                        <XAxis dataKey="source" tick={{ fontSize: 10, fill: 'var(--dash-text-sec)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--dash-text-sec)' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar dataKey="count" name={t('عملاء', 'Leads')} fill="#f59e0b" radius={[3, 3, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>{/* end an-body */}
    </div>
  );
};

export default Analytics;
