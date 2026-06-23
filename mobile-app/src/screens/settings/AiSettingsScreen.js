import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const MODES = [
  { key: 'restricted', icon: '🛡️', labelAr: 'مقيد', labelEn: 'Restricted', descAr: 'لأسئلة الشركة فقط', descEn: 'Company info only' },
  { key: 'general', icon: '🌍', labelAr: 'عام', labelEn: 'General', descAr: 'مساعد ذكي شامل', descEn: 'Helpful assistant' },
];

const PERSONAS = [
  { key: 'professional', icon: '💼', labelAr: 'رسمي', labelEn: 'Professional' },
  { key: 'friendly', icon: '😊', labelAr: 'ودود', labelEn: 'Friendly' },
  { key: 'casual', icon: '✌️', labelAr: 'عادي', labelEn: 'Casual' },
  { key: 'enthusiastic', icon: '🔥', labelAr: 'متحمس', labelEn: 'Enthusiastic' },
  { key: 'minimal', icon: '📝', labelAr: 'مختصر', labelEn: 'Minimal' },
  { key: 'expert', icon: '🎓', labelAr: 'خبير', labelEn: 'Expert' },
  { key: 'empathetic', icon: '❤️', labelAr: 'متعاطف', labelEn: 'Empathetic' },
];

const LANGUAGES = ['Arabic', 'English', 'French', 'Spanish', 'German', 'Italian', 'Chinese', 'Japanese', 'Russian', 'Turkish', 'Portuguese'];

const AiSettingsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [mode, setMode] = useState('restricted');
  const [persona, setPersona] = useState('professional');
  const [languages, setLanguages] = useState(['Arabic', 'English']);

  const toggleLang = (l) => {
    setLanguages(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);
  };

  const s = createStyles(colors, isRTL);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backText}>{isRTL ? '→' : '←'}</Text></TouchableOpacity>
        <Text style={s.title}>{t('aiSettings')}</Text>
        <TouchableOpacity><Text style={s.saveText}>{t('save')}</Text></TouchableOpacity>
      </View>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false}>
        {/* Response Mode */}
        <Text style={s.sectionTitle}>{t('responseMode')}</Text>
        <View style={s.card}>
          {MODES.map(m => (
            <TouchableOpacity key={m.key} style={s.modeRow} onPress={() => setMode(m.key)}>
              <View style={s.modeLeft}>
                <Text style={s.modeIcon}>{m.icon}</Text>
                <View>
                  <Text style={[s.modeLabel, { color: colors.textPrimary }]}>{isRTL ? m.labelAr : m.labelEn}</Text>
                  <Text style={[s.modeDesc, { color: colors.textMuted }]}>{isRTL ? m.descAr : m.descEn}</Text>
                </View>
              </View>
              <View style={[s.radio, mode === m.key && s.radioSelected]}>
                {mode === m.key && <View style={s.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Persona */}
        <Text style={s.sectionTitle}>{t('aiPersona')}</Text>
        <View style={s.personaGrid}>
          {PERSONAS.map(p => (
            <TouchableOpacity key={p.key} style={[s.personaCard, persona === p.key && s.personaActive]} onPress={() => setPersona(p.key)}>
              <Text style={s.personaIcon}>{p.icon}</Text>
              <Text style={[s.personaLabel, { color: persona === p.key ? '#6C63FF' : colors.textPrimary }]}>{isRTL ? p.labelAr : p.labelEn}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Languages */}
        <Text style={s.sectionTitle}>{t('supportedLanguages')}</Text>
        <View style={s.langGrid}>
          {LANGUAGES.map(l => (
            <TouchableOpacity key={l} style={[s.langChip, languages.includes(l) && s.langChipActive]} onPress={() => toggleLang(l)}>
              <Text style={[s.langText, languages.includes(l) && s.langTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors, isRTL) => ({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backText: { fontSize: 22, color: colors.textPrimary },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  saveText: { fontSize: 15, fontWeight: '700', color: '#6C63FF' },
  content: { padding: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8, marginTop: 16, letterSpacing: 1 },
  card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  modeRow: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.divider },
  modeLeft: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' },
  modeIcon: { fontSize: 24, marginHorizontal: 12 },
  modeLabel: { fontSize: 15, fontWeight: '700' },
  modeDesc: { fontSize: 12, marginTop: 2 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#6C63FF' },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#6C63FF' },
  personaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  personaCard: { width: '31%', backgroundColor: colors.card, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 8 },
  personaActive: { borderColor: '#6C63FF', backgroundColor: '#6C63FF10' },
  personaIcon: { fontSize: 22, marginBottom: 6 },
  personaLabel: { fontSize: 12, fontWeight: '600' },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  langChipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  langText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  langTextActive: { color: '#FFF' },
});

export default AiSettingsScreen;
