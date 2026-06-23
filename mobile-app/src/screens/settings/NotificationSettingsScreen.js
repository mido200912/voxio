import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import notificationService from '../../services/notificationService';

const NotificationSettingsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';

  const [settings, setSettings] = useState({
    enabled: true,
    newMessage: true,
    aiReply: true,
    newOrder: true,
    humanHandoff: true,
    dailyReport: false,
    platforms: { whatsapp: true, instagram: true, telegram: true, web: true },
    dndEnabled: false,
    sound: true,
    vibration: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const saved = await notificationService.getLocalSettings();
    if (saved) setSettings(saved);
  };

  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    await notificationService.saveLocalSettings(newSettings);
  };

  const toggle = (key) => saveSettings({ ...settings, [key]: !settings[key] });
  const togglePlatform = (p) => saveSettings({ ...settings, platforms: { ...settings.platforms, [p]: !settings.platforms[p] } });

  const s = createStyles(colors, isRTL);

  const ToggleRow = ({ icon, label, value, onToggle }) => (
    <View style={s.row}>
      <View style={s.rowLeft}>
        <Text style={s.rowIcon}>{icon}</Text>
        <Text style={s.rowLabel}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.border, true: '#6C63FF' }} thumbColor="#FFF" />
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>{isRTL ? '→' : '←'}</Text>
        </TouchableOpacity>
        <Text style={s.title}>{t('notificationSettings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* Master Toggle */}
        <View style={s.card}>
          <ToggleRow icon="🔔" label={t('enableNotifications')} value={settings.enabled} onToggle={() => toggle('enabled')} />
        </View>

        {/* Notification Types */}
        <Text style={s.sectionTitle}>Notification Types</Text>
        <View style={s.card}>
          <ToggleRow icon="💬" label={t('newMessageNotif')} value={settings.newMessage} onToggle={() => toggle('newMessage')} />
          <ToggleRow icon="🤖" label={t('aiReplyNotif')} value={settings.aiReply} onToggle={() => toggle('aiReply')} />
          <ToggleRow icon="🛒" label={t('newOrderNotif')} value={settings.newOrder} onToggle={() => toggle('newOrder')} />
          <ToggleRow icon="👤" label={t('humanHandoffNotif')} value={settings.humanHandoff} onToggle={() => toggle('humanHandoff')} />
          <ToggleRow icon="📊" label={t('dailyReportNotif')} value={settings.dailyReport} onToggle={() => toggle('dailyReport')} />
        </View>

        {/* Platform Mute */}
        <Text style={s.sectionTitle}>{t('muteByPlatform')}</Text>
        <View style={s.card}>
          <ToggleRow icon="💬" label="WhatsApp" value={settings.platforms.whatsapp} onToggle={() => togglePlatform('whatsapp')} />
          <ToggleRow icon="📸" label="Instagram" value={settings.platforms.instagram} onToggle={() => togglePlatform('instagram')} />
          <ToggleRow icon="✈️" label="Telegram" value={settings.platforms.telegram} onToggle={() => togglePlatform('telegram')} />
          <ToggleRow icon="🌐" label="Website" value={settings.platforms.web} onToggle={() => togglePlatform('web')} />
        </View>

        {/* DND */}
        <Text style={s.sectionTitle}>{t('doNotDisturb')}</Text>
        <View style={s.card}>
          <ToggleRow icon="🔇" label={t('doNotDisturb')} value={settings.dndEnabled} onToggle={() => toggle('dndEnabled')} />
          <View style={s.dndRow}>
            <View style={s.dndTime}>
              <Text style={s.dndLabel}>{t('from')}</Text>
              <Text style={s.dndValue}>10:00 PM</Text>
            </View>
            <View style={s.dndTime}>
              <Text style={s.dndLabel}>{t('to')}</Text>
              <Text style={s.dndValue}>7:00 AM</Text>
            </View>
          </View>
        </View>

        {/* Sound & Vibration */}
        <Text style={s.sectionTitle}>{t('sound')} & {t('vibration')}</Text>
        <View style={s.card}>
          <ToggleRow icon="🔊" label={t('sound')} value={settings.sound} onToggle={() => toggle('sound')} />
          <ToggleRow icon="📳" label={t('vibration')} value={settings.vibration} onToggle={() => toggle('vibration')} />
        </View>

        {/* Test */}
        <TouchableOpacity style={s.testBtn} onPress={async () => {
          try { await notificationService.sendTestNotification(); } catch (e) { console.warn(e); }
        }}>
          <Text style={s.testBtnText}>🧪 {t('testNotification')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors, isRTL) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: colors.textPrimary },
  title: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  content: { padding: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 1 },
  card: { backgroundColor: colors.card, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: {
    flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  rowLeft: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' },
  rowIcon: { fontSize: 20, marginHorizontal: 10 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  dndRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  dndTime: { alignItems: 'center' },
  dndLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  dndValue: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  testBtn: {
    backgroundColor: '#6C63FF', borderRadius: 14, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  testBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});

export default NotificationSettingsScreen;
