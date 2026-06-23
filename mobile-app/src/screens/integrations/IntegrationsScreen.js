import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import integrationService from '../../services/integrationService';

const INTEGRATIONS = [
  { key: 'whatsapp', emoji: '💬', name: 'WhatsApp', color: '#25D366' },
  { key: 'instagram', emoji: '📸', name: 'Instagram', color: '#E4405F' },
  { key: 'telegram', emoji: '✈️', name: 'Telegram', color: '#26A5E4' },
  { key: 'website', emoji: '🌐', name: 'Website', color: '#6C63FF' },
  { key: 'shopify', emoji: '🛍️', name: 'Shopify', color: '#96BF48' },
];

const IntegrationsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    try {
      const res = await integrationService.getStatus();
      if (res.data) setStatuses(res.data);
    } catch (err) { console.warn(err); }
    finally { setLoading(false); }
  };

  const s = createStyles(colors, isRTL);
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backText}>{isRTL ? '→' : '←'}</Text></TouchableOpacity>
        <Text style={s.title}>{t('integrations')}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 60 }} />
        ) : INTEGRATIONS.map((item, i) => {
          const connected = statuses[item.key]?.connected || false;
          return (
            <View key={i} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={s.cardLeft}>
                <View style={[s.iconCircle, { backgroundColor: item.color + '15' }]}>
                  <Text style={s.icon}>{item.emoji}</Text>
                </View>
                <View style={s.cardInfo}>
                  <Text style={[s.cardName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[s.cardStatus, { color: connected ? '#22C55E' : colors.textMuted }]}>
                    {connected ? t('connected') : t('disconnected')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: connected ? '#EF444420' : item.color + '20' }]}>
                <Text style={[s.actionText, { color: connected ? '#EF4444' : item.color }]}>
                  {connected ? t('disconnect') : t('connect')}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const createStyles = (colors, isRTL) => ({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backText: { fontSize: 22, color: colors.textPrimary },
  title: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  list: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  card: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  cardLeft: { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginHorizontal: 12 },
  icon: { fontSize: 24 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardStatus: { fontSize: 12, fontWeight: '600' },
  actionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  actionText: { fontSize: 13, fontWeight: '700' },
});

export default IntegrationsScreen;
