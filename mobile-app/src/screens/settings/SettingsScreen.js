import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, language: lang, changeLanguage } = useLanguage();
  const isRTL = lang === 'ar';

  const s = createStyles(colors, isRTL);

  const MenuItem = ({ icon, label, onPress, right }) => (
    <TouchableOpacity style={s.menuItem} onPress={onPress}>
      <View style={s.menuLeft}>
        <Text style={s.menuIcon}>{icon}</Text>
        <Text style={s.menuLabel}>{label}</Text>
      </View>
      {right || <Text style={s.menuArrow}>{isRTL ? '←' : '→'}</Text>}
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>{t('settings')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Profile */}
        <View style={s.profileCard}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{user?.name || 'User'}</Text>
            <Text style={s.profileEmail}>{user?.email || ''}</Text>
          </View>
        </View>

        {/* Company */}
        <Text style={s.sectionTitle}>{t('profile')}</Text>
        <View style={s.menuCard}>
          <MenuItem icon="🏢" label={t('companyData')} onPress={() => navigation.navigate('CompanySettings')} />
          <MenuItem icon="🤖" label={t('aiSettings')} onPress={() => navigation.navigate('AiSettings')} />
          <MenuItem icon="🔗" label={t('integrations')} onPress={() => navigation.navigate('Integrations')} />
          <MenuItem icon="🔑" label={t('apiKeys')} onPress={() => {}} />
        </View>

        {/* Notifications */}
        <Text style={s.sectionTitle}>{t('notifications')}</Text>
        <View style={s.menuCard}>
          <MenuItem icon="🔔" label={t('notificationSettings')} onPress={() => navigation.navigate('NotificationSettings')} />
        </View>

        {/* Appearance */}
        <Text style={s.sectionTitle}>{t('appearance')}</Text>
        <View style={s.menuCard}>
          <MenuItem
            icon="🌙"
            label={t('darkMode')}
            right={<Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: '#6C63FF' }} thumbColor="#FFF" />}
          />
          <MenuItem
            icon="🌐"
            label={`${t('language')}: ${isRTL ? t('arabic') : t('english')}`}
            right={<TouchableOpacity onPress={() => changeLanguage(isRTL ? 'en' : 'ar')} style={s.langSwitch}><Text style={s.langSwitchText}>{isRTL ? 'EN' : 'عربي'}</Text></TouchableOpacity>}
          />
        </View>

        {/* Account */}
        <Text style={s.sectionTitle}>{t('profile')}</Text>
        <View style={s.menuCard}>
          <MenuItem icon="🔒" label={t('changePassword')} onPress={() => {}} />
          <TouchableOpacity style={s.menuItem} onPress={logout}>
            <View style={s.menuLeft}>
              <Text style={s.menuIcon}>🚪</Text>
              <Text style={[s.menuLabel, { color: '#EF4444' }]}>{t('logout')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <Text style={s.version}>VOXIO v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors, isRTL) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 24, paddingTop: 50, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  scrollContent: { paddingHorizontal: 24 },
  profileCard: {
    flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  profileEmail: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textMuted, marginBottom: 8, marginTop: 8, textTransform: 'uppercase', letterSpacing: 1 },
  menuCard: { backgroundColor: colors.card, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  menuItem: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  menuLeft: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' },
  menuIcon: { fontSize: 20, marginHorizontal: 10 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  menuArrow: { fontSize: 16, color: colors.textMuted },
  langSwitch: {
    backgroundColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4,
  },
  langSwitchText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  version: { textAlign: 'center', color: colors.textMuted, fontSize: 12, marginTop: 16 },
});

export default SettingsScreen;
