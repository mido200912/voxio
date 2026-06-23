import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const RegisterScreen = ({ navigation }) => {
  const { register, loading } = useAuth();
  const { colors } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    if (!name.trim()) { setError(t('name') + ' مطلوب'); return; }
    if (!email.trim()) { setError(t('email') + ' مطلوب'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    const result = await register(name, email, password);
    if (result.step === 'error') setError(result.error);
  };

  const s = createStyles(colors, isRTL);

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>{isRTL ? '→' : '←'} {t('back')}</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>{t('register')}</Text>
          <Text style={s.subtitle}>Create your VOXIO account</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          {error ? <View style={s.errorBox}><Text style={s.errorText}>⚠️ {error}</Text></View> : null}

          <View style={s.inputGroup}>
            <Text style={s.label}>{t('name')}</Text>
            <View style={s.inputContainer}>
              <Text style={s.inputIcon}>👤</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('name')} placeholderTextColor={colors.textMuted} />
            </View>
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>{t('email')}</Text>
            <View style={s.inputContainer}>
              <Text style={s.inputIcon}>📧</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>{t('password')}</Text>
            <View style={s.inputContainer}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={colors.textMuted} secureTextEntry autoCapitalize="none" />
            </View>
          </View>

          <View style={s.inputGroup}>
            <Text style={s.label}>{t('confirmPassword')}</Text>
            <View style={s.inputContainer}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput style={s.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" placeholderTextColor={colors.textMuted} secureTextEntry autoCapitalize="none" />
            </View>
          </View>

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>{t('registerButton')}</Text>}
          </TouchableOpacity>

          <View style={s.linkRow}>
            <Text style={s.linkText}>{t('hasAccount')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.link}>{t('signIn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors, isRTL) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  backBtn: { marginBottom: 24 },
  backText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, marginBottom: 4 },
  subtitle: { fontSize: 15, color: colors.textSecondary },
  form: { width: '100%' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center', fontWeight: '600' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  inputContainer: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 16, height: 54 },
  inputIcon: { fontSize: 18, marginHorizontal: 8 },
  input: { flex: 1, fontSize: 16, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' },
  btn: { backgroundColor: '#6C63FF', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
  linkRow: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'center', marginTop: 24 },
  linkText: { color: colors.textSecondary, fontSize: 14 },
  link: { color: '#6C63FF', fontSize: 14, fontWeight: '800' },
});

export default RegisterScreen;
