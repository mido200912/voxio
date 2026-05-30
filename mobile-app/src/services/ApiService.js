import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:5000/api';

class ApiService {
  static async getToken() {
    return await AsyncStorage.getItem('@voxio_auth_token');
  }

  static async setToken(token) {
    await AsyncStorage.setItem('@voxio_auth_token', token);
    await AsyncStorage.setItem('@voxio_auth_token_expiry', String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  }

  static async clearToken() {
    await AsyncStorage.multiRemove(['@voxio_auth_token', '@voxio_auth_token_expiry']);
  }

  static async isAuthenticated() {
    const token = await AsyncStorage.getItem('@voxio_auth_token');
    const expiry = await AsyncStorage.getItem('@voxio_auth_token_expiry');
    if (!token || !expiry) return false;
    return Date.now() < parseInt(expiry);
  }

  static async request(method, path, data = null) {
    const token = await ApiService.getToken();
    const config = {
      method,
      url: `${API_URL}${path}`,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      timeout: 30000,
    };
    if (data) config.data = data;
    const response = await axios(config);
    return response.data;
  }

  static async login(email, password) {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    if (res.data.token) await ApiService.setToken(res.data.token);
    return res.data;
  }

  static async verifyOtp(email, otp) {
    const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
    if (res.data.token) await ApiService.setToken(res.data.token);
    return res.data;
  }

  static async getCompany() { return ApiService.request('GET', '/company'); }
  static async getConversations() { return ApiService.request('GET', '/handoff/conversations'); }
  static async getMessages(userId, platform) { return ApiService.request('GET', `/handoff/conversation/${userId}/${platform}`); }
  static async reply(userId, platform, message) { return ApiService.request('POST', '/handoff/reply', { userId, platform, message }); }
  static async toggleAi(userId, platform, aiEnabled) { return ApiService.request('POST', '/handoff/toggle-ai', { userId, platform, aiEnabled }); }
  static async acceptHandoff(userId, platform) { return ApiService.request('POST', '/handoff/accept', { userId, platform }); }
  static async getProducts() { return ApiService.request('GET', '/products'); }
  static async getOrders() { return ApiService.request('GET', '/company/requests'); }
  static async getAnalytics() { return ApiService.request('GET', '/analytics/comprehensive'); }
  static async saveFcmToken(fcmToken) { return ApiService.request('POST', '/notifications/fcm-token', { fcmToken }); }
}

export default ApiService;
