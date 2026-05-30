import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import ApiService from '../services/ApiService';

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ApiService.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load orders error:', err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Orders</Text>

      <FlatList
        data={orders}
        renderItem={({ item, index }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderSource}>{item.source || 'web'}</Text>
              <Text style={styles.orderDate}>{new Date(item.date || item.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.orderCustomer}>👤 {item.customerName || 'Customer'}</Text>
            <Text style={styles.orderProduct}>📦 {item.product || (item.items?.map(i => i.name).join(', ')) || '—'}</Text>
            <Text style={styles.orderMessage}>{item.message || ''}</Text>
            {item.totalPrice > 0 && <Text style={styles.orderPrice}>💰 {item.totalPrice} {item.currency || 'USD'}</Text>}
          </View>
        )}
        keyExtractor={(item, i) => `${item.orderId || item._id || i}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
        contentContainerStyle={orders.length === 0 && { flex: 1, justifyContent: 'center' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 16, marginTop: 8 },
  orderCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderSource: { fontSize: 11, color: '#6C63FF', backgroundColor: '#6C63FF20', paddingHorizontal: 8, borderRadius: 4, overflow: 'hidden' },
  orderDate: { color: '#64748b', fontSize: 11 },
  orderCustomer: { color: '#e2e8f0', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  orderProduct: { color: '#94a3b8', fontSize: 13, marginBottom: 2 },
  orderMessage: { color: '#64748b', fontSize: 12, marginBottom: 2 },
  orderPrice: { color: '#22c55e', fontSize: 14, fontWeight: '700', marginTop: 4 },
  empty: { color: '#64748b', textAlign: 'center', padding: 24 },
});
