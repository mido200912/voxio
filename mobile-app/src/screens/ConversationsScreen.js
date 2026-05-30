import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert } from 'react-native';
import ApiService from '../services/ApiService';

export default function ConversationsScreen({ navigation }) {
  const [conversations, setConversations] = useState({ all: [], handoff: [], active: [], manual: [] });
  const [tab, setTab] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ApiService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Load conversations error:', err);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const getList = () => {
    switch (tab) {
      case 'handoff': return conversations.handoff || [];
      case 'active': return conversations.active || [];
      case 'manual': return conversations.manual || [];
      default: return conversations.all || [];
    }
  };

  const openChat = (conv) => {
    navigation.navigate('Chat', { userId: conv.userId, platform: conv.platform, aiEnabled: conv.aiEnabled });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={[styles.convItem, item.handoffRequested && styles.handoffItem]} onPress={() => openChat(item)}>
      <View style={styles.convHeader}>
        <Text style={styles.convUser}>{item.userId?.substring(0, 20)}</Text>
        <Text style={styles.convPlatform}>{item.platform}</Text>
      </View>
      <Text style={styles.convPreview}>{item.lastText?.substring(0, 60)}</Text>
      <View style={styles.convFooter}>
        <Text style={styles.convTime}>{new Date(item.lastMessage).toLocaleString()}</Text>
        <Text style={[styles.aiStatus, item.aiEnabled !== false ? styles.aiOn : styles.aiOff]}>
          AI: {item.aiEnabled !== false ? 'ON' : 'OFF'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Conversations</Text>

      <View style={styles.tabs}>
        {['all', 'handoff', 'active', 'manual'].map(key => (
          <TouchableOpacity key={key} style={[styles.tab, tab === key && styles.activeTab]} onPress={() => setTab(key)}>
            <Text style={[styles.tabText, tab === key && styles.activeTabText]}>{key}</Text>
            <Text style={styles.tabCount}>{conversations[key]?.length || 0}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={getList()}
        renderItem={renderItem}
        keyExtractor={(item, i) => `${item.userId}-${i}`}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No conversations</Text>}
        contentContainerStyle={getList().length === 0 && { flex: 1, justifyContent: 'center' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 16, marginTop: 8 },
  tabs: { flexDirection: 'row', marginBottom: 16, gap: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, borderRadius: 8, backgroundColor: '#1e293b', gap: 4 },
  activeTab: { backgroundColor: '#6C63FF' },
  tabText: { color: '#64748b', fontSize: 12, fontWeight: '600' },
  activeTabText: { color: '#fff' },
  tabCount: { color: '#94a3b8', fontSize: 11, backgroundColor: '#334155', paddingHorizontal: 6, borderRadius: 8, overflow: 'hidden' },
  convItem: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  handoffItem: { borderWidth: 1, borderColor: '#f59e0b' },
  convHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  convUser: { fontWeight: '700', color: '#e2e8f0', fontSize: 14 },
  convPlatform: { fontSize: 11, color: '#6C63FF', backgroundColor: '#6C63FF20', paddingHorizontal: 8, borderRadius: 4, overflow: 'hidden' },
  convPreview: { color: '#94a3b8', fontSize: 13, marginBottom: 6 },
  convFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  convTime: { color: '#64748b', fontSize: 11 },
  aiStatus: { fontSize: 11, fontWeight: '600' },
  aiOn: { color: '#22c55e' },
  aiOff: { color: '#ef4444' },
  empty: { color: '#64748b', textAlign: 'center', padding: 24 },
});
