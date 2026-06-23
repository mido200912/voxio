import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const MessageBubble = ({ message, isUser, isAi }) => {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();

  const align = isUser ? (isRTL ? 'flex-end' : 'flex-start') : (isRTL ? 'flex-start' : 'flex-end');
  const bg = isUser ? '#6C63FF' : colors.card;
  const textColor = isUser ? '#FFF' : colors.textPrimary;
  const borderColor = isAi ? colors.border : 'transparent';

  return (
    <View style={[styles.row, { justifyContent: align }]}>
      <View style={[styles.bubble, { backgroundColor: bg, borderColor, borderWidth: isAi ? 1 : 0 }]}>
        <Text style={[styles.text, { color: textColor }]}>{message.text}</Text>
        {message.createdAt && (
          <Text style={[styles.time, { color: isUser ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 12 },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 12 },
  text: { fontSize: 15, lineHeight: 20 },
  time: { fontSize: 10, marginTop: 4, textAlign: 'right' },
});

export default MessageBubble;
