import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatCard = ({ colors, emoji, value, label, accent }) => (
  <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <View style={[styles.iconCircle, { backgroundColor: accent + '15' }]}>
      <Text style={styles.icon}>{emoji}</Text>
    </View>
    <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
    <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { width: '47%', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1 },
  iconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  icon: { fontSize: 20 },
  value: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  label: { fontSize: 12, fontWeight: '600' },
});

export default StatCard;
