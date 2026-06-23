import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const ForgotPasswordScreen = ({ navigation }) => {
  const { forgotPassword, loading } = useAuth();
  const { colors } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email.trim()) { setError(t('email') + ' مطلوب'); return; }
    const result = await forgotPassword(email);
    if (result.success) setSent(true);
    else setError(result.error);
  };

  const s = createStyles(colors, isRTL);

  return (
    <View style={s.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Text style={s.backText}>{isRTL ? '→' : '←'} {t('back')}</Text>
      </TouchableOpacity>

      <View style={s.content}>
        <Text style={s.emoji}>🔑</Text>
        <Text style={s.title}>{t('forgotPassword')}</Text>
        <Text style={s.subtitle}>Enter your email and we'll send you a reset code</Text>

        {sent ? (
          <View style={s.successBox}>
            <Text style={s.successText}>✅ Reset code sent to {email}</Text>
          </View>
        ) : (
          <View style={s.form}>
            {error ? <View style={s.errorBox}><Text style={s.errorText}>⚠️ {error}</Text></View> : null}
            <View style={s.inputContainer}>
              <Text style={s.inputIcon}>📧</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder={t('email')} placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" />
            </View>
            <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSubmit} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.btnText}>Send Reset Code</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors, isRTL) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingTop: 60 },
  backBtn: { marginBottom: 32 },
  backText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
  content: { flex: 1, alignItems: 'center', paddingTop: 40 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  form: { width: '100%' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center', fontWeight: '600' },
  successBox: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  successText: { color: '#22C55E', fontSize: 14, textAlign: 'center', fontWeight: '600' },
  inputContainer: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', backgroundColor: colors.inputBg, borderRadius: 14, borderWidth: 1, borderColor: colors.inputBorder, paddingHorizontal: 16, height: 54, marginBottom: 20 },
  inputIcon: { fontSize: 18, marginHorizontal: 8 },
  input: { flex: 1, fontSize: 16, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' },
  btn: { backgroundColor: '#6C63FF', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: 17, fontWeight: '800' },
});

export default ForgotPasswordScreen;
