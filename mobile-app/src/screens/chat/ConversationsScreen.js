import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import chatService from '../../services/chatService';
import CONSTANTS from '../../utils/constants';

const TABS = [
  { key: 'all', labelAr: 'الكل', labelEn: 'All' },
  { key: 'handoff', labelAr: 'تحويل بشري', labelEn: 'Handoff' },
  { key: 'active', labelAr: 'تلقائي', labelEn: 'Auto' },
  { key: 'manual', labelAr: 'يدوي', labelEn: 'Manual' },
];

const ConversationsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [data, setData] = useState({ all: [], handoff: [], active: [], manual: [] });
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatService.getConversations();
      if (res.data) setData(res.data);
    } catch (err) { console.warn('Conversations fetch error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchConversations();
    const iv = setInterval(fetchConversations, CONSTANTS.REFRESH_INTERVALS.CONVERSATIONS);
    return () => clearInterval(iv);
  }, [fetchConversations]);

  const onRefresh = async () => { setRefreshing(true); await fetchConversations(); setRefreshing(false); };

  const list = data[tab] || data.all || [];
  const filtered = search
    ? list.filter(c => (c.userId || '').toLowerCase().includes(search.toLowerCase()))
    : list;

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return t('now');
    if (diffMins < 60) return `${diffMins}${isRTL ? 'د' : 'm'}`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}${isRTL ? 'س' : 'h'}`;
    return d.toLocaleDateString();
  };

  const platformEmoji = (p) => {
    const map = { whatsapp: '💬', instagram: '📸', telegram: '✈️', web: '🌐', widget: '🔌', messenger: '👍' };
    return map[p] || '💬';
  };

  const s = createStyles(colors, isRTL);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>{t('conversations')}</Text>
        <View style={s.headerIcons}>
          <TouchableOpacity style={s.iconBtn}><Text style={s.iconText}>🔍</Text></TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchContainer}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t('search')}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsContainer} contentContainerStyle={s.tabsContent}>
        {TABS.map(item => {
          const count = data[item.key]?.length || 0;
          const isActive = tab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[s.tab, isActive && s.tabActive]}
              onPress={() => setTab(item.key)}
            >
              <Text style={[s.tabText, isActive && s.tabTextActive]}>
                {isRTL ? item.labelAr : item.labelEn}
              </Text>
              {count > 0 && (
                <View style={[s.tabBadge, isActive && s.tabBadgeActive]}>
                  <Text style={[s.tabBadgeText, isActive && s.tabBadgeTextActive]}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView
        style={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>💬</Text>
            <Text style={s.emptyText}>{t('noConversations')}</Text>
          </View>
        ) : (
          filtered.map((conv, i) => (
            <TouchableOpacity
              key={`${conv.userId}_${conv.platform}_${i}`}
              style={[
                s.convItem,
                conv.handoffRequested && s.convItemHandoff,
                conv.aiEnabled === false && s.convItemManual,
              ]}
              onPress={() => navigation.navigate('ChatDetail', { conversation: conv })}
            >
              <View style={s.convTop}>
                <View style={s.convUserRow}>
                  <Text style={s.convPlatform}>{platformEmoji(conv.platform)}</Text>
                  <Text style={styles.convUser} numberOfLines={1}>
                    {conv.userId?.substring(0, 20) || 'Unknown'}
                  </Text>
                </View>
                <Text style={styles.convTime}>{formatTime(conv.lastMessage)}</Text>
              </View>
              <Text style={styles.convText} numberOfLines={1}>
                {conv.lastText || t('noData')}
              </Text>
              <View style={s.convBottom}>
                <Text style={styles.convPlatformName}>{conv.platform}</Text>
                <View style={s.convBadges}>
                  {conv.handoffRequested && (
                    <View style={[s.badge, { backgroundColor: '#EF444420' }]}>
                      <Text style={[s.badgeText, { color: '#EF4444' }]}>H</Text>
                    </View>
                  )}
                  <View style={[s.badge, { backgroundColor: conv.aiEnabled !== false ? '#22C55E20' : '#F59E0B20' }]}>
                    <Text style={[s.badgeText, { color: conv.aiEnabled !== false ? '#22C55E' : '#F59E0B' }]}>
                      AI {conv.aiEnabled !== false ? 'ON' : 'OFF'}
                    </Text>
                  </View>
                  <Text style={styles.convMsgCount}>{conv.messageCount || 0} msg</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors, isRTL) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 50, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  headerIcons: { flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border,
  },
  iconText: { fontSize: 18 },
  searchContainer: {
    flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center',
    backgroundColor: colors.inputBg, borderRadius: 14, marginHorizontal: 24,
    paddingHorizontal: 16, height: 48, marginBottom: 12, borderWidth: 1, borderColor: colors.inputBorder,
  },
  searchIcon: { fontSize: 16, marginHorizontal: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' },
  tabsContainer: { maxHeight: 50, marginBottom: 8 },
  tabsContent: { paddingHorizontal: 24, gap: 8 },
  tab: {
    flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: colors.background },
  tabBadge: {
    backgroundColor: colors.border, borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 6, paddingHorizontal: 6,
  },
  tabBadgeActive: { backgroundColor: colors.background + '30' },
  tabBadgeText: { fontSize: 11, fontWeight: '800', color: colors.textPrimary },
  tabBadgeTextActive: { color: colors.background },
  list: { flex: 1, paddingHorizontal: 24 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textMuted, fontWeight: '600' },
  convItem: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  convItemHandoff: { borderColor: '#EF4444', borderWidth: 2 },
  convItemManual: { borderColor: '#F59E0B', borderWidth: 1 },
  convTop: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  convUserRow: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', flex: 1 },
  convPlatform: { fontSize: 16, marginHorizontal: 6 },
  convUser: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, flex: 1 },
  convTime: { fontSize: 12, color: colors.textMuted },
  convText: { fontSize: 14, color: colors.textSecondary, marginBottom: 8 },
  convBottom: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  convPlatformName: { fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' },
  convBadges: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  convMsgCount: { fontSize: 11, color: colors.textMuted },
});

export default ConversationsScreen;
