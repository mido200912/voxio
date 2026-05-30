import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';
import NotificationService from '../services/NotificationService';

export default function SettingsScreen({ navigation }) {
  const [company, setCompany] = useState(null);
  const [fcmToken, setFcmToken] = useState('');
  const [localMsgCount, setLocalMsgCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await ApiService.getCompany();
        setCompany(data);
      } catch {}
      const token = await NotificationService.getFcmToken();
      setFcmToken(token || 'Not registered');
      const msgs = await NotificationService.getAllMessages();
      setLocalMsgCount(msgs.length);
    })();
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await ApiService.clearToken();
        navigation.replace('Login');
      }},
    ]);
  };

  const handleTestNotification = async () => {
    try {
      await NotificationService.sendTestNotification();
      Alert.alert('Success', 'Test notification sent');
    } catch (err) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleClearLocalData = async () => {
    Alert.alert('Clear Data', 'Delete all locally stored messages?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await NotificationService.clearMessages();
        setLocalMsgCount(0);
        Alert.alert('Done', 'Local data cleared');
      }},
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      {company && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company</Text>
          <Text style={styles.field}>{company.name || '—'}</Text>
          <Text style={styles.fieldLabel}>Industry: {company.industry || '—'}</Text>
          <Text style={styles.fieldLabel}>API Key: {company.apiKey?.substring(0, 16)}...</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Text style={styles.fieldLabel}>FCM Token: {fcmToken?.substring(0, 20)}...</Text>
        <Text style={styles.fieldLabel}>Local Messages: {localMsgCount}</Text>
        <TouchableOpacity style={styles.button} onPress={handleTestNotification}>
          <Text style={styles.buttonText}>🔔 Test Notification</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.dangerBtn]} onPress={handleClearLocalData}>
          <Text style={styles.buttonText}>🗑️ Clear Local Messages</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <Text style={styles.fieldLabel}>
          WhatsApp/Telegram/Instagram messages are saved locally on your device.
          You can access them offline at any time.
        </Text>
      </View>

      <TouchableOpacity style={[styles.button, styles.logoutBtn]} onPress={handleLogout}>
        <Text style={styles.buttonText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { fontSize: 24, fontWeight: '800', color: '#f1f5f9', marginBottom: 20, marginTop: 8 },
  section: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#6C63FF', marginBottom: 12 },
  field: { fontSize: 16, fontWeight: '600', color: '#f1f5f9', marginBottom: 4 },
  fieldLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 4 },
  button: { backgroundColor: '#6C63FF', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dangerBtn: { backgroundColor: '#ef4444' },
  logoutBtn: { backgroundColor: '#dc2626', marginTop: 8 },
});
