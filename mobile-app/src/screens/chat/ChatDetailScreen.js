import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import chatService from '../../services/chatService';

const ChatDetailScreen = ({ route, navigation }) => {
  const { conversation } = route.params;
  const { colors } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';
  const scrollRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(conversation.aiEnabled !== false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await chatService.getConversation(conversation.userId, conversation.platform);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.warn('Messages fetch error:', err); }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!replyText.trim() || sending) return;
    setSending(true);
    try {
      await chatService.reply(conversation.userId, conversation.platform, replyText.trim());
      setReplyText('');
      const res = await chatService.getConversation(conversation.userId, conversation.platform);
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.warn('Send error:', err); }
    finally { setSending(false); }
  };

  const handleToggleAi = async () => {
    const newVal = !aiEnabled;
    try {
      await chatService.toggleAi(conversation.userId, conversation.platform, newVal);
      setAiEnabled(newVal);
    } catch (err) { console.warn('Toggle AI error:', err); }
  };

  const handleAcceptHandoff = async () => {
    try {
      await chatService.acceptHandoff(conversation.userId, conversation.platform);
      fetchMessages();
    } catch (err) { console.warn('Accept handoff error:', err); }
  };

  const platformEmoji = (p) => {
    const map = { whatsapp: '💬', instagram: '📸', telegram: '✈️', web: '🌐', widget: '🔌' };
    return map[p] || '💬';
  };

  const msgIcon = (sender) => {
    if (sender === 'user') return '👤';
    if (sender === 'ai') return '🤖';
    return '👨‍💼';
  };

  const msgAlign = (sender) => {
    if (sender === 'user') return isRTL ? 'flex-end' : 'flex-start';
    return isRTL ? 'flex-start' : 'flex-end';
  };

  const msgBg = (sender) => {
    if (sender === 'user') return '#6C63FF';
    if (sender === 'ai') return colors.card;
    return colors.border;
  };

  const s = createStyles(colors, isRTL);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle}>{platformEmoji(conversation.platform)} {conversation.userId?.substring(0, 18)}</Text>
          <Text style={s.headerSubtitle}>{conversation.platform} • {messages.length} msgs</Text>
        </View>
        {conversation.handoffRequested && (
          <TouchableOpacity style={s.acceptBtn} onPress={handleAcceptHandoff}>
            <Text style={s.acceptBtnText}>🙋</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={s.messagesList}
        contentContainerStyle={s.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 40 }} />
        ) : messages.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>💬</Text>
            <Text style={s.emptyText}>{t('noMessages')}</Text>
          </View>
        ) : (
          messages.map((msg, i) => (
            <View key={i} style={[s.msgRow, { justifyContent: msgAlign(msg.sender) }]}>
              <View style={[s.msgBubble, { backgroundColor: msgBg(msg.sender), borderColor: msg.sender === 'ai' ? colors.border : 'transparent', borderWidth: msg.sender === 'ai' ? 1 : 0 }]}>
                <View style={s.msgSenderRow}>
                  <Text style={s.msgIcon}>{msgIcon(msg.sender)}</Text>
                  <Text style={[s.msgSender, { color: msg.sender === 'user' ? '#FFF' : colors.textSecondary }]}>
                    {msg.sender === 'user' ? t('customer') : msg.sender === 'ai' ? t('ai') : t('agent')}
                  </Text>
                </View>
                <Text style={[s.msgText, { color: msg.sender === 'user' ? '#FFF' : colors.textPrimary }]}>{msg.text}</Text>
                {msg.createdAt && (
                  <Text style={[s.msgTime, { color: msg.sender === 'user' ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* AI Toggle */}
      <View style={s.aiBar}>
        <TouchableOpacity style={[s.aiToggle, { backgroundColor: aiEnabled ? '#22C55E20' : '#F59E0B20' }]} onPress={handleToggleAi}>
          <Text style={[s.aiToggleText, { color: aiEnabled ? '#22C55E' : '#F59E0B' }]}>
            🤖 AI {aiEnabled ? t('aiOn') : t('aiOff')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input */}
      <View style={s.inputBar}>
        <TextInput
          style={s.input}
          value={replyText}
          onChangeText={setReplyText}
          placeholder={t('typeMessage')}
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[s.sendBtn, (!replyText.trim() || sending) && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!replyText.trim() || sending}
        >
          {sending ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.sendText}>📤</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors, isRTL) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: colors.textPrimary },
  headerInfo: { flex: 1, marginHorizontal: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  headerSubtitle: { fontSize: 12, color: colors.textSecondary, textTransform: 'capitalize' },
  acceptBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#22C55E20',
    alignItems: 'center', justifyContent: 'center',
  },
  acceptBtnText: { fontSize: 20 },
  messagesList: { flex: 1 },
  messagesContent: { padding: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 15, color: colors.textMuted },
  msgRow: { flexDirection: 'row', marginBottom: 12 },
  msgBubble: { maxWidth: '75%', borderRadius: 16, padding: 12 },
  msgSenderRow: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', marginBottom: 4 },
  msgIcon: { fontSize: 14, marginHorizontal: 4 },
  msgSender: { fontSize: 11, fontWeight: '700' },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTime: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  aiBar: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    justifyContent: 'center', paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  aiToggle: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 10 },
  aiToggleText: { fontSize: 13, fontWeight: '700' },
  inputBar: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  input: {
    flex: 1, backgroundColor: colors.inputBg, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    color: colors.textPrimary, maxHeight: 100, borderWidth: 1, borderColor: colors.inputBorder,
    textAlign: isRTL ? 'right' : 'left',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#6C63FF',
    alignItems: 'center', justifyContent: 'center', marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0,
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendText: { fontSize: 20 },
});

export default ChatDetailScreen;
