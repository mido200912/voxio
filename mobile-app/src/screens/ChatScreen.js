import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';

export default function ChatScreen({ route, navigation }) {
  const { userId, platform, aiEnabled: initialAiEnabled } = route.params;
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [aiEnabled, setAiEnabled] = useState(initialAiEnabled !== false);
  const flatListRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await ApiService.getMessages(userId, platform);
      setMessages(data);
    } catch (err) {
      console.error('Load messages error:', err);
    }
  }, [userId, platform]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await ApiService.reply(userId, platform, replyText.trim());
      setReplyText('');
      loadMessages();
    } catch (err) {
      Alert.alert('Error', 'Failed to send reply');
    }
  };

  const handleToggleAi = async () => {
    try {
      const newState = !aiEnabled;
      await ApiService.toggleAi(userId, platform, newState);
      setAiEnabled(newState);
    } catch (err) {
      Alert.alert('Error', 'Failed to toggle AI');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.msg, item.sender === 'user' ? styles.userMsg : item.sender === 'ai' ? styles.aiMsg : styles.agentMsg]}>
      <Text style={styles.msgSender}>
        {item.sender === 'user' ? '👤 Customer' : item.sender === 'ai' ? '🤖 AI' : '👨‍💼 You'}
      </Text>
      <Text style={styles.msgText}>{item.text}</Text>
      <Text style={styles.msgTime}>{new Date(item.createdAt).toLocaleString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{userId?.substring(0, 20)}</Text>
          <Text style={styles.headerPlatform}>{platform}</Text>
        </View>
        <TouchableOpacity style={[styles.aiToggle, aiEnabled ? styles.aiOn : styles.aiOff]} onPress={handleToggleAi}>
          <Text style={styles.aiToggleText}>AI: {aiEnabled ? 'ON' : 'OFF'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, i) => `${item._id || i}`}
        style={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={<Text style={styles.empty}>No messages</Text>}
      />

      <View style={styles.replyBox}>
        <TextInput style={styles.input} placeholder="Type your reply..." placeholderTextColor="#64748b"
          value={replyText} onChangeText={setReplyText} multiline />
        <TouchableOpacity style={styles.sendBtn} onPress={handleReply} disabled={!replyText.trim()}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  backBtn: { color: '#6C63FF', fontSize: 16, marginRight: 12 },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#f1f5f9', fontWeight: '700', fontSize: 16 },
  headerPlatform: { color: '#64748b', fontSize: 12 },
  aiToggle: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  aiOn: { backgroundColor: '#22c55e30' },
  aiOff: { backgroundColor: '#ef444430' },
  aiToggleText: { fontSize: 12, fontWeight: '700', color: '#f1f5f9' },
  messageList: { flex: 1, padding: 16 },
  msg: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '85%' },
  userMsg: { backgroundColor: '#6C63FF30', alignSelf: 'flex-end' },
  aiMsg: { backgroundColor: '#1e293b', alignSelf: 'flex-start' },
  agentMsg: { backgroundColor: '#22c55e20', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#22c55e40' },
  msgSender: { fontSize: 11, color: '#94a3b8', marginBottom: 4 },
  msgText: { color: '#e2e8f0', fontSize: 14 },
  msgTime: { fontSize: 10, color: '#64748b', marginTop: 4 },
  replyBox: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#334155', backgroundColor: '#1e293b', gap: 8 },
  input: { flex: 1, backgroundColor: '#0f172a', borderRadius: 12, padding: 12, color: '#f1f5f9', fontSize: 14, maxHeight: 80, borderWidth: 1, borderColor: '#334155' },
  sendBtn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 12, justifyContent: 'center', alignItems: 'center', minWidth: 60 },
  sendText: { color: '#fff', fontWeight: '700' },
  empty: { color: '#64748b', textAlign: 'center', padding: 24 },
});
