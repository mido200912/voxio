import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

const VAvatar = ({ name, size = 48, color }) => {
  const { colors } = useTheme();
  const initial = (name || 'U')[0].toUpperCase();
  const bgColor = color || '#6C63FF';

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '800', color: '#FFF' },
});

export default VAvatar;
