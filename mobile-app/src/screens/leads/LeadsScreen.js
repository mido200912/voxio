import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import leadService from '../../services/leadService';

const LeadsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { t, language: lang } = useLanguage();
  const isRTL = lang === 'ar';
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    try { const res = await leadService.getLeads(); setLeads(Array.isArray(res.data) ? res.data : []); }
    catch (err) { console.warn(err); }
    finally { setLoading(false); }
  };

  const statusColor = (s) => {
    const m = { new: '#6C63FF', contacted: '#F59E0B', converted: '#22C55E', lost: '#EF4444', qualified: '#8B5CF6' };
    return m[s] || '#666';
  };

  const s = createStyles(colors, isRTL);
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backText}>{isRTL ? '→' : '←'}</Text></TouchableOpacity>
        <Text style={s.title}>{t('leads')}</Text>
        <TouchableOpacity><Text style={{ fontSize: 20 }}>+</Text></TouchableOpacity>
      </View>
      <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
        {leads.length === 0 ? (
          <View style={s.empty}><Text style={s.emptyEmoji}>👥</Text><Text style={s.emptyText}>{t('noLeads')}</Text></View>
        ) : leads.map((lead, i) => (
          <View key={i} style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.cardTop}>
              <Text style={[s.leadName, { color: colors.textPrimary }]}>{lead.name || lead.email || 'Lead'}</Text>
              <View style={[s.badge, { backgroundColor: statusColor(lead.status) + '20' }]}>
                <Text style={[s.badgeText, { color: statusColor(lead.status) }]}>{lead.status}</Text>
              </View>
            </View>
            {lead.email && <Text style={[s.leadEmail, { color: colors.textSecondary }]}>{lead.email}</Text>}
            {lead.phone && <Text style={[s.leadPhone, { color: colors.textSecondary }]}>{lead.phone}</Text>}
            <Text style={[s.leadDate, { color: colors.textMuted }]}>{new Date(lead.createdAt || Date.now()).toLocaleDateString()}</Text>
          </View>
        ))}
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
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: colors.textMuted },
  card: { borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1 },
  cardTop: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  leadName: { fontSize: 16, fontWeight: '700', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  leadEmail: { fontSize: 13, marginBottom: 2 },
  leadPhone: { fontSize: 13, marginBottom: 4 },
  leadDate: { fontSize: 11 },
});

export default LeadsScreen;
