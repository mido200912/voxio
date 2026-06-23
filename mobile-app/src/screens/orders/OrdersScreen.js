import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import orderService from '../../services/orderService';

const TABS = ['all', 'pending', 'processing', 'completed'];

const OrdersScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, language: lang } = useTheme();
  const isRTL = lang === 'ar';
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await orderService.getOrders();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.warn('Orders fetch error:', err); }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const onRefresh = async () => { setRefreshing(true); await fetchOrders(); setRefreshing(false); };

  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);

  const statusColor = (status) => {
    const map = { pending: '#F59E0B', processing: '#3B82F6', completed: '#22C55E', cancelled: '#EF4444' };
    return map[status] || colors.textMuted;
  };

  const s = createStyles(colors, isRTL);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{t('orders')}</Text>
        <TouchableOpacity style={s.iconBtn}><Text style={{ fontSize: 20 }}>+</Text></TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsContainer} contentContainerStyle={s.tabsContent}>
        {TABS.map(item => (
          <TouchableOpacity key={item} style={[s.tab, tab === item && { backgroundColor: colors.textPrimary }]} onPress={() => setTab(item)}>
            <Text style={[s.tabText, tab === item && { color: colors.background }]}>{t(item) || item}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} style={s.list} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyEmoji}>🛒</Text><Text style={s.emptyText}>{t('noOrders')}</Text></View>
        ) : filtered.map((order, i) => (
          <View key={i} style={[s.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.orderTop}>
              <Text style={[s.orderNum, { color: colors.textPrimary }]}>#{order._id?.substring(0, 8) || i + 1000}</Text>
              <View style={[s.statusBadge, { backgroundColor: statusColor(order.status) + '20' }]}>
                <Text style={[s.statusText, { color: statusColor(order.status) }]}>{t(order.status) || order.status}</Text>
              </View>
            </View>
            <Text style={[s.orderCustomer, { color: colors.textPrimary }]}>{order.customerName || order.customer?.name || 'Customer'}</Text>
            <Text style={[s.orderItems, { color: colors.textSecondary }]}>{order.items?.length || 0} items</Text>
            <View style={s.orderBottom}>
              <Text style={[s.orderPrice, { color: colors.textPrimary }]}>{order.totalPrice || 0} SAR</Text>
              <Text style={[s.orderDate, { color: colors.textMuted }]}>{new Date(order.createdAt || Date.now()).toLocaleDateString()}</Text>
            </View>
          </View>
        ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors, isRTL) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 50, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  tabsContainer: { maxHeight: 50, marginBottom: 8 },
  tabsContent: { paddingHorizontal: 24, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'capitalize' },
  list: { flex: 1, paddingHorizontal: 24 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textMuted, fontWeight: '600' },
  orderCard: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  orderTop: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderNum: { fontSize: 14, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  orderCustomer: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  orderItems: { fontSize: 13, marginBottom: 8 },
  orderBottom: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderPrice: { fontSize: 18, fontWeight: '800' },
  orderDate: { fontSize: 12 },
});

export default OrdersScreen;
