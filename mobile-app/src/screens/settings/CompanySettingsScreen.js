import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const CompanySettingsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [form, setForm] = useState({
    name: '', industry: '', description: '', vision: '', mission: '', websiteUrl: '', values: '',
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const Field = ({ label, value, onChangeText, multiline, placeholder }) => (
    <View style={s.field}>
      <Text style={[s.label, { color: colors.textPrimary }]}>{label}</Text>
      <TextInput
        style={[s.input, multiline && s.inputMultiline, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.textPrimary }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlign={isRTL ? 'right' : 'left'}
      />
    </View>
  );

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={[s.backText, { color: colors.textPrimary }]}>{isRTL ? '→' : '←'}</Text></TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>{t('companyData')}</Text>
        <TouchableOpacity><Text style={s.saveText}>{t('save')}</Text></TouchableOpacity>
      </View>
      <ScrollView style={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Field label={t('companyName')} value={form.name} onChangeText={v => update('name', v)} placeholder={t('companyName')} />
        <Field label={t('industry')} value={form.industry} onChangeText={v => update('industry', v)} placeholder={t('industry')} />
        <Field label={t('description_')} value={form.description} onChangeText={v => update('description', v)} placeholder={t('description_')} multiline />
        <Field label={t('vision')} value={form.vision} onChangeText={v => update('vision', v)} placeholder={t('vision')} multiline />
        <Field label={t('mission')} value={form.mission} onChangeText={v => update('mission', v)} placeholder={t('mission')} multiline />
        <Field label={t('websiteUrl')} value={form.websiteUrl} onChangeText={v => update('websiteUrl', v)} placeholder="https://example.com" />
        <Field label={t('values')} value={form.values} onChangeText={v => update('values', v)} placeholder="Value 1, Value 2" />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1 },
  backText: { fontSize: 22 },
  title: { fontSize: 18, fontWeight: '800' },
  saveText: { fontSize: 15, fontWeight: '700', color: '#6C63FF' },
  content: { padding: 24 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15 },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
});

export default CompanySettingsScreen;
