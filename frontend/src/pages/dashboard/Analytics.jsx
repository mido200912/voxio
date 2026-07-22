import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import { secureStorage } from '../../utils/secureStorage';

import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import './DashboardShared.css';
import './Analytics.css';
import AIPageInsight from '../../components/AIPageInsight';
import PageLoader from '../../components/ui/PageLoader';

/* ── Platform Config ── */
const PLATFORM_CONFIG = {
  whatsapp:  { color: '#25D366', icon: 'fab fa-whatsapp' },
  telegram:  { color: '#229ED9', icon: 'fab fa-telegram-plane' },
  instagram: { color: '#E1306C', icon: 'fab fa-instagram' },
  web:       { color: '#6366f1', icon: 'fas fa-globe' },
  widget:    { color: '#4f46e5', icon: 'fas fa-puzzle-piece' },
  unknown:   { color: '#9ca3af', icon: 'fas fa-question-circle' },
};

const LEAD_STATUS_COLORS = {
  new:       '#3b82f6',
  contacted: '#f59e0b',
  converted: '#10b981',
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
  const [unanswered, setUnanswered]  = useState([]);
  const [topUsers, setTopUsers]      = useState([]);
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
      const [dashRes, tsRes, plRes, hrRes, rtRes, ldRes, tuRes] = await Promise.allSettled([
        axios.get(`${BACKEND_URL}/analytics/dashboard?days=${period}`, { headers }),
        axios.get(`${BACKEND_URL}/analytics/timeseries?days=${period}`, { headers }),
        axios.get(`${BACKEND_URL}/analytics/platforms?days=${period}`, { headers }),
        axios.get(`${BACKEND_URL}/analytics/hourly?days=${period}`, { headers }),
        axios.get(`${BACKEND_URL}/analytics/response-time?days=${period}`, { headers }),
        axios.get(`${BACKEND_URL}/analytics/leads?days=${period}`, { headers }),
        axios.get(`${BACKEND_URL}/analytics/top-users?days=${period}`, { headers }),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      if (tsRes.status  === 'fulfilled') setTimeseries(Array.isArray(tsRes.value.data) ? tsRes.value.data : []);
      if (plRes.status  === 'fulfilled') setPlatforms(Array.isArray(plRes.value.data) ? plRes.value.data : []);
      if (hrRes.status  === 'fulfilled') setHourly(Array.isArray(hrRes.value.data) ? hrRes.value.data : []);
      if (rtRes.status  === 'fulfilled') setResponseTime(rtRes.value.data);
      if (ldRes.status  === 'fulfilled') setLeads(ldRes.value.data);
      if (tuRes.status  === 'fulfilled') setTopUsers(Array.isArray(tuRes.value.data) ? tuRes.value.data : []);

      const unansRes = (await Promise.allSettled([axios.get(`${BACKEND_URL}/analytics/unanswered?days=${period}`, { headers })]))[0];
      if (unansRes && unansRes.status === 'fulfilled') setUnanswered(unansRes.value.data);
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

  /* ── PDF Download ── */
  /* Uses html2canvas@1.4.1 + jsPDF@2.5.2 directly (NOT html2pdf@0.10.1)
     Reason: html2pdf bundles html2canvas@0.10.1 which crashes on modern
     CSS color() functions used by Chrome/Safari. Version 1.4.1 handles them. */
  const handleDownloadPDF = async () => {
    const original = document.getElementById('an-pdf-root');
    if (!original) return;
    setDownloading(true);

    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const bgColor      = currentTheme === 'dark' ? '#0f0f0f' : '#F9FAFB';
    const textColor    = currentTheme === 'dark' ? '#f1f1f1' : '#111827';
    const borderColor  = currentTheme === 'dark' ? '#2a2a2a' : '#e5e7eb';
    const cardBg       = currentTheme === 'dark' ? '#1a1a1a' : '#ffffff';

    // ── 1. Load libraries ──────────────────────────────────────────────
    const loadScript = (src) => new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.head.appendChild(s);
    });

    try {
      // html2canvas 1.4.1 supports color() — load sequentially so jsPDF finds window.jspdf
      await loadScript('https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js');
      await loadScript('https://unpkg.com/jspdf@2.5.2/dist/jspdf.umd.min.js');
    } catch (err) {
      console.error('PDF libraries failed to load:', err);
      setDownloading(false);
      return;
    }

    // ── 2. Build isolated wrapper with resolved (hard-coded) colors ────
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: fixed;
      top: -99999px;
      left: -99999px;
      width: 1200px;
      padding: 24px;
      background: ${bgColor};
      color: ${textColor};
      font-family: 'Segoe UI', Arial, sans-serif;
      direction: ${isArabic ? 'rtl' : 'ltr'};
      box-sizing: border-box;
    `;

    const clone    = original.cloneNode(true);
    const liveEls  = [original, ...original.querySelectorAll('*')];
    const cloneEls = [clone,    ...clone.querySelectorAll('*')];

    // ── 3. Copy computed styles; replace any color() or var() with safe values ──
    const safeProp = (val, fallback) =>
      !val || val.includes('color(') || val.includes('var(') ? fallback : val;

    cloneEls.forEach((el, i) => {
      const live = liveEls[i];
      if (!live) return;
      try {
        const cs = getComputedStyle(live);

        const bg = cs.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          el.style.backgroundColor = safeProp(bg, cardBg);
        }
        el.style.color       = safeProp(cs.color, textColor);
        el.style.borderColor = safeProp(cs.borderColor, borderColor);

        // Fix SVG presentation attributes
        const tag = el.tagName?.toLowerCase();
        if (['path', 'line', 'rect', 'circle', 'polygon', 'polyline', 'stop'].includes(tag)) {
          const stroke = el.getAttribute('stroke');
          if (stroke && (stroke.startsWith('var(') || stroke.includes('color(')))
            el.setAttribute('stroke', borderColor);

          const fill = el.getAttribute('fill');
          if (fill && (fill.startsWith('var(') || fill.includes('color(')))
            el.setAttribute('fill', textColor);

          const sc = el.getAttribute('stop-color');
          if (sc && sc.includes('color('))
            el.setAttribute('stop-color', '#ffffff');
        }
      } catch (_) { /* skip inaccessible cross-origin elements */ }
    });

    // ── 4. Inject page-break styles ───────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box !important; }
      .an-card    { page-break-inside: avoid !important; break-inside: avoid !important;
                    margin-bottom: 20px !important; background: ${cardBg} !important; }
      .an-kpi     { page-break-inside: avoid !important; break-inside: avoid !important; }
      .an-row     { page-break-inside: avoid !important; break-inside: avoid !important; }
      .an-kpi-row { page-break-inside: avoid !important; break-inside: avoid !important; }
    `;
    clone.prepend(style);
    wrapper.appendChild(clone);
    document.body.appendChild(wrapper);

    // Wait for SVGs to paint
    await new Promise(r => setTimeout(r, 800));

    try {
      // ── 5. Capture with html2canvas 1.4.1 ───────────────────────────
      const canvas = await window.html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: bgColor,
        logging: false,
        // Skip invisible placeholder spans Recharts injects (they cause ResizeObserver loops)
        ignoreElements: (el) =>
          el.tagName === 'SPAN' &&
          el.style?.position === 'absolute' &&
          !el.textContent?.trim(),
      });

      // ── 6. Build PDF page-by-page ────────────────────────────────────
      const { jsPDF } = window.jspdf;
      const pdf   = new jsPDF({ unit: 'px', format: 'a4', orientation: 'landscape' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = pageW / canvas.width;       // scale factor canvas → PDF pts
      const sliceH = Math.floor(pageH / ratio); // canvas rows per page

      let yOffset = 0;
      while (yOffset < canvas.height) {
        if (yOffset > 0) pdf.addPage();

        const rowsLeft   = canvas.height - yOffset;
        const rowsOnPage = Math.min(sliceH, rowsLeft);

        // Slice the canvas vertically for this page
        const pageCanvas    = document.createElement('canvas');
        pageCanvas.width    = canvas.width;
        pageCanvas.height   = rowsOnPage;
        pageCanvas.getContext('2d').drawImage(
          canvas,
          0, yOffset,          // source x, y
          canvas.width, rowsOnPage,  // source w, h
          0, 0,                // dest x, y
          canvas.width, rowsOnPage   // dest w, h
        );

        const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
        pdf.addImage(imgData, 'JPEG', 0, 0, pageW, rowsOnPage * ratio);
        yOffset += rowsOnPage;
      }

      pdf.save(`Analytics_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
      document.querySelectorAll('.html2canvas-container').forEach(el => el.remove());
      setDownloading(false);
    }
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
      accent:  '#ffffff',
    },
    {
      icon:    'fas fa-robot',
      label:   t('معدل الـ AI', 'AI Resolution'),
      value:   `${s.aiResolutionRate || 0}%`,
      note:    `${fmt(s.aiReplies)} ${t('رد آلي', 'AI replies')}`,
      accent:  '#bbbbbb',
    },
    {
      icon:    'fas fa-user-plus',
      label:   t('العملاء المحتملون', 'Total Leads'),
      value:   fmt(leads?.totalLeads || 0),
      note:    `${fmt(s.newLeads)} ${t('جديد', 'new')}`,
      accent:  '#dddddd',
    },
    {
      icon:    'fas fa-bolt',
      label:   t('وقت الاستجابة', 'Avg. Response'),
      value:   `${responseTime?.averageResponseTimeSeconds || 0}s`,
      note:    `${t('أسرع', 'Fastest')}: ${responseTime?.fastestResponse || 0}s`,
      accent:  '#cccccc',
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

        <AIPageInsight
          pageName="Analytics"
          dataContext={{ period, dashboard, platforms, topUsers: topUsers?.slice(0, 3) }}
        />

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
              <span className="an-legend-item"><span className="an-legend-dot" style={{ background: '#a855f7' }} />{t('ردود AI', 'AI')}</span>
            </div>
          </div>

          {timeseries.length > 0 ? (
            <div dir="ltr" className="an-chart-wrap an-chart-wrap--tall">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeseries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gUser" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gAi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="var(--dash-border)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--dash-text-sec)' }} tickFormatter={fmtDate} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--dash-text-sec)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="user" name={t('مستخدمون', 'Users')}
                    stroke="#6366f1" strokeWidth={3} fill="url(#gUser)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                  <Area type="monotone" dataKey="ai" name={t('ردود AI', 'AI Replies')}
                    stroke="#a855f7" strokeWidth={3} fill="url(#gAi)" dot={false} activeDot={{ r: 4, fill: '#a855f7' }} />
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
                      fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={20} opacity={0.85} />
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
                { label: t('متوسط', 'Avg'), value: `${responseTime?.averageResponseTimeSeconds ?? 0}s`, color: '#cccccc' },
                { label: t('أسرع', 'Fastest'), value: `${responseTime?.fastestResponse ?? 0}s`, color: '#ffffff' },
                { label: t('أبطأ', 'Slowest'), value: `${responseTime?.slowestResponse ?? 0}s`, color: '#dddddd' },
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
              { label: t('AI', 'AI'), val: s.aiReplies || 0, color: '#bbbbbb' },
              { label: t('بشري', 'Human'), val: s.agentReplies || 0, color: '#dddddd' },
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
                        <Bar dataKey="count" name={t('عملاء', 'Leads')} fill="#6366f1" radius={[3, 3, 0, 0]} maxBarSize={28} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Top Unanswered Questions ── */}
        <div className="an-card an-card--wide">
          <div className="an-card-head">
            <div>
              <div className="an-card-title">{t('أهم الأسئلة غير المجاب عليها', 'Top Unanswered Questions')}</div>
              <div className="an-card-sub">{t('أسئلة فشل البوت في الرد عليها', 'Questions the bot failed to answer')}</div>
            </div>
          </div>
          <div className="an-unanswered-list">
            {unanswered && unanswered.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {unanswered.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--dash-bg)', borderRadius: '8px', border: '1px solid var(--dash-border)' }}>
                    <div style={{ flex: 1, paddingRight: isArabic ? '0' : '16px', paddingLeft: isArabic ? '16px' : '0', color: 'var(--dash-text)', fontSize: '0.95rem' }}>
                      "{item.question}"
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dddddd', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0 }}>
                      <i className="fas fa-times-circle" /> {item.count}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="fas fa-check-circle" text={t('لا توجد أسئلة غير مجابة', 'No unanswered questions found')} />
            )}
          </div>
        </div>

        {/* ── Top AI Users ── */}
        <div className="an-card an-card--wide">
          <div className="an-card-head">
            <div>
              <div className="an-card-title">{t('أكثر العملاء تفاعلاً مع AI', 'Top AI Users')}</div>
              <div className="an-card-sub">{t('العملاء الأكثر استخداماً للذكاء الاصطناعي', 'Customers interacting the most with AI')}</div>
            </div>
          </div>
          <div className="an-unanswered-list">
            {topUsers && topUsers.length > 0 ? (
              <div style={{ display: 'grid', gap: '12px' }}>
                {topUsers.map((user, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--dash-bg)', borderRadius: '8px', border: '1px solid var(--dash-border)' }}>
                    <div style={{ flex: 1, paddingRight: isArabic ? '0' : '16px', paddingLeft: isArabic ? '16px' : '0', color: 'var(--dash-text)', fontSize: '0.95rem' }}>
                      <span style={{ marginRight: isArabic ? 0 : 8, marginLeft: isArabic ? 8 : 0 }}>
                        {user.platform === 'whatsapp' ? <i className="fab fa-whatsapp" style={{ color: '#25d366' }} /> :
                         user.platform === 'telegram' ? <i className="fab fa-telegram-plane" style={{ color: '#229ED9' }} /> :
                         <i className="fas fa-globe" style={{ color: '#6366f1' }} />}
                      </span>
                      {user.userId}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1', fontWeight: 600, fontSize: '0.9rem', flexShrink: 0 }}>
                      {user.count} {t('رسالة', 'Messages')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon="fas fa-user-slash" text={t('لا توجد بيانات للعملاء', 'No user data found')} />
            )}
          </div>
        </div>

      </div>{/* end an-body */}
    </div>
  );
};

export default Analytics;