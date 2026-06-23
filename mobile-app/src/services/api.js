import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONSTANTS from '../utils/constants';

const api = axios.create({
  baseURL: CONSTANTS.API_BASE_URL,
  timeout: CONSTANTS.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(CONSTANTS.STORAGE_KEYS.TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Interceptor error:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      try {
        const refreshRes = await axios.post(`${CONSTANTS.API_BASE_URL}/auth/refresh`, null, {
          withCredentials: true,
        });
        if (refreshRes.data?.accessToken) {
          const newToken = refreshRes.data.accessToken;
          await AsyncStorage.setItem(CONSTANTS.STORAGE_KEYS.TOKEN, newToken);
          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          // Retry original request
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        }
      } catch (refreshErr) {
        // Refresh failed, logout
        await AsyncStorage.multiRemove([
          CONSTANTS.STORAGE_KEYS.TOKEN,
          CONSTANTS.STORAGE_KEYS.USER,
        ]);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
