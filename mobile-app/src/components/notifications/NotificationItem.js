import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const NotificationItem = ({ item, onPress }) => {
  const { colors } = useTheme();

  const typeEmoji = {
    new_message: '💬', ai_reply: '🤖', new_order: '🛒',
    human_handoff: '👤', daily_report: '📊', broadcast: '📢',
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h`;
    return `${Math.floor(mins / 1440)}d`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: (item.color || '#6C63FF') + '15' }]}>
        <Text style={styles.icon}>{typeEmoji[item.type] || '🔔'}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>{item.body}</Text>
      </View>
      <Text style={[styles.time, { color: colors.textMuted }]}>{formatTime(item.createdAt)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    padding: 14, marginBottom: 8, borderWidth: 1,
  },
  iconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  body: { fontSize: 13 },
  time: { fontSize: 11, marginLeft: 8 },
});

export default NotificationItem;
