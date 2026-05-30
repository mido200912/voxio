import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/ApiService';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('login');
  const [loading, setLoading] = useState(false);
  const [tempEmail, setTempEmail] = useState('');

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password'); return; }
    setLoading(true);
    try {
      const data = await ApiService.login(email, password);
      if (data.requiresOtp) {
        setTempEmail(email);
        setStep('otp');
      } else {
        navigation.replace('Main');
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) { Alert.alert('Error', 'Please enter OTP'); return; }
    setLoading(true);
    try {
      await ApiService.verifyOtp(tempEmail, otp);
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>VOXIO</Text>
      <Text style={styles.subtitle}>AI-Powered Business Platform</Text>

      {step === 'login' ? (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#64748b"
            value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#64748b"
            value={password} onChangeText={setPassword} secureTextEntry />
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <Text style={styles.otpLabel}>Enter OTP sent to {tempEmail}</Text>
          <TextInput style={styles.input} placeholder="OTP Code" placeholderTextColor="#64748b"
            value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { fontSize: 48, fontWeight: '800', color: '#6C63FF', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b', marginBottom: 48 },
  form: { width: '100%', maxWidth: 360 },
  input: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, fontSize: 16, color: '#f1f5f9', marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  button: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  otpLabel: { color: '#94a3b8', fontSize: 14, marginBottom: 16, textAlign: 'center' },
});
