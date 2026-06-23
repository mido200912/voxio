import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const VBadge = ({ text, color = '#6C63FF', bgColor, style }) => (
  <View style={[styles.badge, { backgroundColor: bgColor || color + '20' }, style]}>
    <Text style={[styles.text, { color }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '800' },
});

export default VBadge;
