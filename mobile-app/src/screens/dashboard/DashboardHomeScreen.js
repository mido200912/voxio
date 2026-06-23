import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import analyticsService from '../../services/analyticsService';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 12) / 2;

const DashboardHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [stats, setStats] = useState({
    totalConversations: 0, activeNow: 0, aiResolutionRate: 0,
    totalMessages: 0, totalLeads: 0, avgResponseTime: 0,
    aiReplies: 0, agentReplies: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [platformData, setPlatformData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, tsRes, plRes] = await Promise.allSettled([
        analyticsService.getDashboard(7),
        analyticsService.getTimeseries(7),
        analyticsService.getPlatforms(7),
      ]);

      if (dashRes.status === 'fulfilled') {
        const d = dashRes.value.data;
        setStats({
          totalConversations: d.totalConversations || 0,
          activeNow: d.activeUsers || 0,
          aiResolutionRate: d.aiResolutionRate || 0,
          totalMessages: d.totalMessages || 0,
          totalLeads: d.newLeads || 0,
          avgResponseTime: d.avgResponseTime || 0,
          aiReplies: d.aiReplies || 0,
          agentReplies: d.agentReplies || 0,
        });
      }
      if (tsRes.status === 'fulfilled') setChartData(Array.isArray(tsRes.value.data) ? tsRes.value.data : []);
      if (plRes.status === 'fulfilled') setPlatformData(Array.isArray(plRes.value.data) ? plRes.value.data : []);
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const s = createStyles(colors, isRTL);

  const formatNum = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n || 0);
  };

  const platformEmoji = (p) => {
    const map = { whatsapp: '💬', instagram: '📸', telegram: '✈️', web: '🌐', widget: '🔌', messenger: '👍' };
    return map[p] || '💬';
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{t('welcome')}, {user?.name || 'User'} 👋</Text>
          <Text style={s.date}>{new Date().toLocaleDateString(isRTL ? 'ar' : 'en', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={s.iconBtn}>
            <Text style={s.iconText}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn}>
            <Text style={s.iconText}>🔔</Text>
            {stats.activeNow > 0 && <View style={s.badge}><Text style={s.badgeText}>{stats.activeNow}</Text></View>}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />}
        contentContainerStyle={s.scrollContent}
      >
        {/* Stats Grid */}
        <View style={s.statsGrid}>
          <StatCard colors={colors} emoji="💬" value={formatNum(stats.totalConversations)} label={t('totalConversations')} accent="#6C63FF" />
          <StatCard colors={colors} emoji="🤖" value={`${stats.aiResolutionRate}%`} label={t('aiResolutionRate')} accent="#22C55E" />
          <StatCard colors={colors} emoji="👥" value={formatNum(stats.activeNow)} label={t('activeNow')} accent="#F59E0B" />
          <StatCard colors={colors} emoji="⚡" value={`${stats.avgResponseTime}s`} label={t('responseTime')} accent="#3B82F6" />
        </View>

        {/* Chart Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('chatActivity')}</Text>
          <View style={s.chartCard}>
            {chartData.length > 0 ? (
              <MiniLineChart data={chartData} colors={colors} />
            ) : (
              <View style={s.chartPlaceholder}>
                <Text style={s.chartPlaceholderText}>📈 {t('last7Days')}</Text>
                <View style={s.chartBars}>
                  {[40, 65, 30, 80, 55, 70, 45].map((h, i) => (
                    <View key={i} style={s.barContainer}>
                      <View style={[s.bar, { height: `${h}%`, backgroundColor: '#6C63FF', opacity: 0.3 + (i * 0.1) }]} />
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Platform Distribution */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('channelDistribution')}</Text>
          <View style={s.platformCard}>
            {platformData.length > 0 ? (
              platformData.map((p, i) => {
                const total = platformData.reduce((s, x) => s + x.count, 0) || 1;
                const pct = Math.round((p.count / total) * 100);
                return (
                  <View key={i} style={s.platformRow}>
                    <View style={s.platformLeft}>
                      <Text style={s.platformEmoji}>{platformEmoji(p.platform)}</Text>
                      <Text style={s.platformName}>{p.platform}</Text>
                    </View>
                    <View style={s.platformRight}>
                      <View style={s.progressTrack}>
                        <View style={[s.progressFill, { width: `${pct}%`, backgroundColor: colors.textPrimary }]} />
                      </View>
                      <Text style={s.platformPct}>{pct}%</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              ['whatsapp', 'instagram', 'telegram', 'web'].map((p, i) => (
                <View key={i} style={s.platformRow}>
                  <View style={s.platformLeft}>
                    <Text style={s.platformEmoji}>{platformEmoji(p)}</Text>
                    <Text style={s.platformName}>{p}</Text>
                  </View>
                  <View style={s.platformRight}>
                    <View style={s.progressTrack}>
                      <View style={[s.progressFill, { width: `${[40, 30, 20, 10][i]}%`, backgroundColor: colors.textPrimary }]} />
                    </View>
                    <Text style={s.platformPct}>{[40, 30, 20, 10][i]}%</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        {/* AI Insight */}
        <TouchableOpacity style={s.insightCard} onPress={() => navigation.navigate('Analytics')}>
          <View style={styles.insightIcon}>
            <Text style={styles.insightEmoji}>💡</Text>
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>{t('aiInsight')}</Text>
            <Text style={styles.insightText}>
              {stats.aiResolutionRate > 70
                ? 'Your AI is performing great! ' + stats.aiResolutionRate + '% resolution rate.'
                : 'AI resolution rate is ' + stats.aiResolutionRate + '%. Consider training your bot more.'}
            </Text>
          </View>
          <Text style={styles.insightArrow}>{isRTL ? '←' : '→'}</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t('quickActions')}</Text>
          <View style={s.quickGrid}>
            <QuickAction colors={colors} emoji="💬" label={t('conversations')} onPress={() => navigation.navigate('Tabs', { screen: 'Conversations' })} />
            <QuickAction colors={colors} emoji="📊" label={t('analytics')} onPress={() => navigation.navigate('Analytics')} />
            <QuickAction colors={colors} emoji="🛒" label={t('orders')} onPress={() => navigation.navigate('Tabs', { screen: 'Orders' })} />
            <QuickAction colors={colors} emoji="⚙️" label={t('settings')} onPress={() => navigation.navigate('Tabs', { screen: 'Settings' })} />
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

// ─── Stat Card ───
const StatCard = ({ colors, emoji, value, label, accent }) => (
  <View style={[statCardStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[statCardStyles.iconCircle, { backgroundColor: accent + '15' }]}>
      <Text style={statCardStyles.icon}>{emoji}</Text>
    </View>
    <Text style={[statCardStyles.value, { color: colors.textPrimary }]}>{value}</Text>
    <Text style={[statCardStyles.label, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

const statCardStyles = StyleSheet.create({
  card: { width: CARD_WIDTH, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  icon: { fontSize: 20 },
  value: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: 12, fontWeight: '600' },
});

// ─── Mini Line Chart ───
const MiniLineChart = ({ data, colors }) => {
  const maxVal = Math.max(...data.map(d => d.user || d.value || 0), 1);
  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.bars}>
        {data.map((d, i) => {
          const h = ((d.user || d.value || 0) / maxVal) * 100;
          return (
            <View key={i} style={chartStyles.barCol}>
              <View style={[chartStyles.bar, { height: `${Math.max(h, 5)}%`, backgroundColor: colors.textPrimary, opacity: 0.8 }]} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const chartStyles = StyleSheet.create({
  container: { height: 120, paddingVertical: 8 },
  bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center' },
  bar: { width: '80%', borderRadius: 4 },
});

// ─── Quick Action ───
const QuickAction = ({ colors, emoji, label, onPress }) => (
  <TouchableOpacity style={[qaStyles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
    <Text style={qaStyles.emoji}>{emoji}</Text>
    <Text style={[qaStyles.label, { color: colors.textPrimary }]}>{label}</Text>
  </TouchableOpacity>
);

const qaStyles = StyleSheet.create({
  card: { width: (width - 48 - 12) / 2, borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1 },
  emoji: { fontSize: 28, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700' },
});

// ─── Main Styles ───
const createStyles = (colors, isRTL) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 16,
  },
  greeting: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  date: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  iconText: { fontSize: 18 },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#EF4444', borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 24 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16 },
  chartCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  chartPlaceholder: { height: 120, justifyContent: 'center' },
  chartPlaceholderText: { textAlign: 'center', color: colors.textMuted, marginBottom: 16 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 80 },
  barContainer: { width: 24, height: 80, justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  platformCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  platformRow: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 14 },
  platformLeft: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', width: 100 },
  platformEmoji: { fontSize: 18, marginHorizontal: 6 },
  platformName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, textTransform: 'capitalize' },
  platformRight: { flex: 1, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' },
  progressTrack: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, marginHorizontal: 12 },
  progressFill: { height: '100%', borderRadius: 3 },
  platformPct: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, width: 35, textAlign: 'center' },
  insightCard: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center', backgroundColor: colors.card, borderRadius: 16,
    padding: 16, marginTop: 24, borderWidth: 1, borderColor: colors.border,
  },
  insightIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#6C63FF15', alignItems: 'center', justifyContent: 'center', marginHorizontal: 12,
  },
  insightEmoji: { fontSize: 22 },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  insightText: { fontSize: 13, color: colors.textSecondary },
  insightArrow: { fontSize: 18, color: colors.textMuted },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});

export default DashboardHomeScreen;
