import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import analyticsService from '../../services/analyticsService';

const PERIODS = [7, 30, 90];

const AnalyticsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [period, setPeriod] = useState(30);
  const [dashboard, setDashboard] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [leads, setLeads] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, tsRes, plRes, ldRes] = await Promise.allSettled([
        analyticsService.getDashboard(period),
        analyticsService.getTimeseries(period),
        analyticsService.getPlatforms(period),
        analyticsService.getLeads(period),
      ]);
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data);
      if (tsRes.status === 'fulfilled') setTimeseries(Array.isArray(tsRes.value.data) ? tsRes.value.data : []);
      if (plRes.status === 'fulfilled') setPlatforms(Array.isArray(plRes.value.data) ? plRes.value.data : []);
      if (ldRes.status === 'fulfilled') setLeads(ldRes.value.data);
    } catch (err) { console.warn('Analytics fetch error:', err); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const fmt = (n) => {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
  };

  const s = createKpiStyles(colors);
  const d = dashboard || {};

  return (
    <View style={[mainStyles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[mainStyles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={mainStyles.backBtn}>
          <Text style={[mainStyles.backText, { color: colors.textPrimary }]}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={[mainStyles.title, { color: colors.textPrimary }]}>{t('analytics')}</Text>
        <TouchableOpacity><Text style={{ fontSize: 20 }}>📥</Text></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />}>

        {/* Period Tabs */}
        <View style={mainStyles.periodTabs}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p} style={[mainStyles.periodTab, period === p && { backgroundColor: colors.textPrimary }]} onPress={() => { setPeriod(p); setLoading(true); }}>
              <Text style={[mainStyles.periodText, period === p && { color: colors.background }]}>{p}{isRTL ? 'ي' : 'd'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* KPI Cards */}
            <View style={mainStyles.kpiGrid}>
              <KpiCard colors={colors} icon="💬" value={fmt(d.totalMessages)} label={t('totalMessages')} sub={`${fmt(d.totalConversations)} ${t('conversations_')}`} />
              <KpiCard colors={colors} icon="🤖" value={`${d.aiResolutionRate || 0}%`} label={t('aiResolutionRate')} sub={`${fmt(d.aiReplies)} ${t('aiReplies')}`} />
              <KpiCard colors={colors} icon="👥" value={fmt(leads?.totalLeads || d.newLeads)} label={t('totalLeads')} sub={`${fmt(d.newLeads)} ${t('new')}`} />
              <KpiCard colors={colors} icon="⚡" value="2.3s" label={t('responseTime')} sub={`${t('fastest')}: 0.5s`} />
            </View>

            {/* Chart */}
            <View style={[mainStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[mainStyles.cardTitle, { color: colors.textPrimary }]}>{t('chatActivity')}</Text>
              <View style={mainStyles.chartArea}>
                <MiniBarChart data={timeseries} colors={colors} />
              </View>
            </View>

            {/* Platform Distribution */}
            <View style={[mainStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[mainStyles.cardTitle, { color: colors.textPrimary }]}>{t('channelDistribution')}</Text>
              {platforms.length > 0 ? platforms.map((p, i) => {
                const total = platforms.reduce((s, x) => s + x.count, 0) || 1;
                const pct = Math.round((p.count / total) * 100);
                return (
                  <View key={i} style={mainStyles.platRow}>
                    <Text style={[mainStyles.platName, { color: colors.textPrimary }]}>{p.platform}</Text>
                    <View style={[mainStyles.platTrack, { backgroundColor: colors.border }]}>
                      <View style={[mainStyles.platFill, { width: `${pct}%`, backgroundColor: colors.textPrimary }]} />
                    </View>
                    <Text style={[mainStyles.platPct, { color: colors.textSecondary }]}>{pct}%</Text>
                  </View>
                );
              }) : <Text style={{ color: colors.textMuted, textAlign: 'center', padding: 20 }}>{t('noData')}</Text>}
            </View>

            {/* AI Performance */}
            <View style={[mainStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[mainStyles.cardTitle, { color: colors.textPrimary }]}>{t('aiPerformance')}</Text>
              <View style={mainStyles.aiStats}>
                <View style={mainStyles.aiStatItem}>
                  <Text style={[mainStyles.aiStatVal, { color: '#22C55E' }]}>2.3s</Text>
                  <Text style={[mainStyles.aiStatLbl, { color: colors.textSecondary }]}>{t('avgResponse')}</Text>
                </View>
                <View style={mainStyles.aiStatItem}>
                  <Text style={[mainStyles.aiStatVal, { color: '#6C63FF' }]}>0.5s</Text>
                  <Text style={[mainStyles.aiStatLbl, { color: colors.textSecondary }]}>{t('fastest')}</Text>
                </View>
                <View style={mainStyles.aiStatItem}>
                  <Text style={[mainStyles.aiStatVal, { color: '#F59E0B' }]}>5.2s</Text>
                  <Text style={[mainStyles.aiStatLbl, { color: colors.textSecondary }]}>{t('slowest')}</Text>
                </View>
              </View>
              <View style={mainStyles.replyBreakdown}>
                <View style={mainStyles.replyRow}>
                  <Text style={{ color: colors.textSecondary }}>AI</Text>
                  <View style={[mainStyles.replyTrack, { backgroundColor: colors.border }]}>
                    <View style={[mainStyles.replyFill, { width: '75%', backgroundColor: '#6C63FF' }]} />
                  </View>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>75%</Text>
                </View>
                <View style={mainStyles.replyRow}>
                  <Text style={{ color: colors.textSecondary }}>{t('human')}</Text>
                  <View style={[mainStyles.replyTrack, { backgroundColor: colors.border }]}>
                    <View style={[mainStyles.replyFill, { width: '25%', backgroundColor: '#F59E0B' }]} />
                  </View>
                  <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>25%</Text>
                </View>
              </View>
            </View>

            {/* Leads */}
            {leads && leads.totalLeads > 0 && (
              <View style={[mainStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={mainStyles.leadsHeader}>
                  <Text style={[mainStyles.cardTitle, { color: colors.textPrimary }]}>{t('leadsOverview')}</Text>
                  <Text style={[mainStyles.leadsTotal, { color: colors.textMuted }]}>{fmt(leads.totalLeads)} leads</Text>
                </View>
                {leads.byStatus?.map((item, i) => {
                  const pct = leads.totalLeads > 0 ? Math.round((item.count / leads.totalLeads) * 100) : 0;
                  return (
                    <View key={i} style={mainStyles.leadRow}>
                      <Text style={[mainStyles.leadName, { color: colors.textPrimary }]}>{item.status}</Text>
                      <Text style={[mainStyles.leadCount, { color: colors.textSecondary }]}>{item.count} ({pct}%)</Text>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ─── KPI Card ───
const KpiCard = ({ colors, icon, value, label, sub }) => (
  <View style={[kpiStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={kpiStyles.iconRow}>
      <Text style={kpiStyles.icon}>{icon}</Text>
    </View>
    <Text style={[kpiStyles.value, { color: colors.textPrimary }]}>{value}</Text>
    <Text style={[kpiStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[kpiStyles.sub, { color: colors.textMuted }]}>{sub}</Text>
  </View>
);

// ─── Mini Bar Chart ───
const MiniBarChart = ({ data, colors }) => (
  <View style={{ height: 120, flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingVertical: 8 }}>
    {(data.length > 0 ? data : Array(7).fill({ value: 0 })).map((d, i) => {
      const h = data.length > 0 ? ((d.user || d.value || 0) / Math.max(...data.map(x => x.user || x.value || 0), 1)) * 100 : 20;
      return (
        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ width: '70%', height: `${Math.max(h, 5)}%`, backgroundColor: colors.textPrimary, borderRadius: 4, opacity: 0.8 }} />
        </View>
      );
    })}
  </View>
);

const mainStyles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22 },
  title: { fontSize: 20, fontWeight: '800' },
  periodTabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingVertical: 16 },
  periodTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(128,128,128,0.1)' },
  periodText: { fontSize: 14, fontWeight: '700' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 24, gap: 12, marginBottom: 8 },
  card: { marginHorizontal: 24, marginBottom: 16, borderRadius: 16, padding: 16, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  chartArea: { marginTop: 4 },
  platRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  platName: { width: 80, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  platTrack: { flex: 1, height: 6, borderRadius: 3, marginHorizontal: 10 },
  platFill: { height: '100%', borderRadius: 3 },
  platPct: { width: 35, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  aiStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  aiStatItem: { alignItems: 'center' },
  aiStatVal: { fontSize: 20, fontWeight: '800' },
  aiStatLbl: { fontSize: 12, marginTop: 2 },
  replyBreakdown: { gap: 8 },
  replyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  replyTrack: { flex: 1, height: 6, borderRadius: 3 },
  replyFill: { height: '100%', borderRadius: 3 },
  leadsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  leadsTotal: { fontSize: 13, fontWeight: '600' },
  leadRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  leadName: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  leadCount: { fontSize: 14 },
});

const kpiStyles = StyleSheet.create({
  card: { width: '47%', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  iconRow: { marginBottom: 8 },
  icon: { fontSize: 24 },
  value: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  sub: { fontSize: 11 },
});

const createKpiStyles = (colors) => ({});

export default AnalyticsScreen;
