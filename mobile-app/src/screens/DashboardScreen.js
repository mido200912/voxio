import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';
import NotificationService from '../services/NotificationService';

const StatCard = ({ label, value, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color || '#6C63FF' }]}>
    <Text style={styles.statValue}>{value ?? '—'}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [conversations, setConversations] = useState({ handoff: [], total: 0 });
  const [localMessages, setLocalMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [analyticsData, convData] = await Promise.all([
        ApiService.getAnalytics().catch(() => null),
        ApiService.getConversations().catch(() => ({ handoff: [], total: 0 })),
      ]);
      if (analyticsData) setStats(analyticsData.dashboard);
      setConversations(convData);
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
    // Load local messages
    const msgs = await NotificationService.getAllMessages();
    setLocalMessages(msgs.slice(0, 10));
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.header}>Dashboard</Text>

      <View style={styles.statsGrid}>
        <StatCard label="Conversations" value={stats?.totalConversations} color="#6C63FF" />
        <StatCard label="Active Now" value={stats?.activeUsers} color="#22c55e" />
        <StatCard label="AI Resolution" value={`${stats?.aiResolutionRate || 0}%`} color="#f59e0b" />
        <StatCard label="New Leads" value={stats?.newLeads} color="#ef4444" />
      </View>

      {conversations.handoff?.length > 0 && (
        <TouchableOpacity style={styles.handoffBanner} onPress={() => navigation.navigate('Conversations')}>
          <Text style={styles.handoffText}>
            👤 {conversations.handoff.length} conversation(s) need your attention
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Recent Messages (Local)</Text>
      {localMessages.length === 0 ? (
        <Text style={styles.emptyText}>No messages yet</Text>
      ) : localMessages.map((msg, i) => (
        <View key={i} style={styles.messageItem}>
          <View style={styles.msgHeader}>
            <Text style={styles.msgPlatform}>{msg.platform}</Text>
            <Text style={styles.msgTime}>{new Date(msg.timestamp).toLocaleTimeString()}</Text>
          </View>
          <Text style={styles.msgCustomer}>{msg.customerName}</Text>
          <Text style={styles.msgText}>{msg.message}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { fontSize: 28, fontWeight: '800', color: '#f1f5f9', marginBottom: 20, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  statCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, width: '47%', borderLeftWidth: 3 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#f1f5f9' },
  statLabel: { fontSize: 13, color: '#64748b', marginTop: 4 },
  handoffBanner: { backgroundColor: '#f59e0b20', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#f59e0b' },
  handoffText: { color: '#fbbf24', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  emptyText: { color: '#64748b', textAlign: 'center', padding: 24 },
  messageItem: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 8 },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  msgPlatform: { fontSize: 11, color: '#6C63FF', fontWeight: '600' },
  msgTime: { fontSize: 11, color: '#64748b' },
  msgCustomer: { fontSize: 13, fontWeight: '600', color: '#e2e8f0' },
  msgText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
});
