import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const QuickAction = ({ colors, emoji, label, onPress }) => (
  <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
  </TouchableOpacity>
);

const QuickActions = ({ colors, actions }) => (
  <View style={styles.grid}>
    {actions.map((a, i) => (
      <QuickAction key={i} colors={colors} emoji={a.emoji} label={a.label} onPress={a.onPress} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1 },
  emoji: { fontSize: 28, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '700' },
});

export default QuickActions;
