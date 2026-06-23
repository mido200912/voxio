import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const VHeader = ({ title, onBack, right, showBack = true }) => {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      {showBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.textPrimary }]}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
      ) : <View style={styles.placeholder} />}

      <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>

      {right || <View style={styles.placeholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22 },
  title: { fontSize: 18, fontWeight: '800', flex: 1, textAlign: 'center' },
  placeholder: { width: 40 },
});

export default VHeader;
