import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const AppearanceScreen = ({ navigation }) => {
  const { theme, colors, toggleTheme, setThemeMode } = useTheme();
  const { language, changeLanguage, t } = useLanguage();
  const isRTL = language === 'ar';

  const OptionRow = ({ icon, label, selected, onPress }) => (
    <TouchableOpacity style={s.row} onPress={onPress}>
      <View style={s.rowLeft}>
        <Text style={s.icon}>{icon}</Text>
        <Text style={[s.label, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      <View style={[s.radio, selected && s.radioSelected]}>
        {selected && <View style={s.radioDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={[s.backText, { color: colors.textPrimary }]}>{isRTL ? '→' : '←'}</Text></TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>{t('appearance')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        <Text style={[s.section, { color: colors.textMuted }]}>THEME</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <OptionRow icon="🌙" label={t('darkMode')} selected={theme === 'dark'} onPress={toggleTheme} />
          <OptionRow icon="☀️" label={t('lightMode')} selected={theme === 'light'} onPress={toggleTheme} />
        </View>

        <Text style={[s.section, { color: colors.textMuted }]}>LANGUAGE</Text>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <OptionRow icon="🌐" label={t('arabic')} selected={language === 'ar'} onPress={() => changeLanguage('ar')} />
          <OptionRow icon="🌐" label={t('english')} selected={language === 'en'} onPress={() => changeLanguage('en')} />
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1 },
  backText: { fontSize: 22 },
  title: { fontSize: 18, fontWeight: '800' },
  content: { padding: 24 },
  section: { fontSize: 13, fontWeight: '700', marginBottom: 8, marginTop: 16, letterSpacing: 1 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 20, marginRight: 12 },
  label: { fontSize: 15, fontWeight: '600' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#666', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#6C63FF' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#6C63FF' },
});

export default AppearanceScreen;
