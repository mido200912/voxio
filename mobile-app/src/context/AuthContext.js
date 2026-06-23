import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONSTANTS from '../utils/constants';

const AuthContext = createContext();

const API_URL = CONSTANTS.API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    initAuth();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const initAuth = async () => {
    try {
      const savedToken = await AsyncStorage.getItem(CONSTANTS.STORAGE_KEYS.TOKEN);
      const savedUser = await AsyncStorage.getItem(CONSTANTS.STORAGE_KEYS.USER);

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setToken(savedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        scheduleRefresh();
      }
    } catch (err) {
      console.warn('Auth init error:', err);
      await logout();
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      silentRefresh();
    }, 6 * 24 * 60 * 60 * 1000);
  }, []);

  const silentRefresh = async () => {
    try {
      const res = await axios.post(`${API_URL}/auth/refresh`);
      if (res.data?.accessToken) {
        const newToken = res.data.accessToken;
        await AsyncStorage.setItem(CONSTANTS.STORAGE_KEYS.TOKEN, newToken);
        setToken(newToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        scheduleRefresh();
        return true;
      }
    } catch (err) {
      await logout();
      return false;
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });

      if (res.data?.step === 'otp_required') {
        return { step: 'otp_required', email: res.data.email };
      }

      const { user: userData, token: newToken } = res.data;
      await saveAuth(userData, newToken);
      scheduleRefresh();
      return { step: 'done' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      return { step: 'error', error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, { name, email, password });

      if (res.data?.step === 'otp_required') {
        return { step: 'otp_required', email: res.data.email };
      }

      const { user: userData, token: newToken } = res.data;
      await saveAuth(userData, newToken);
      scheduleRefresh();
      return { step: 'done' };
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      return { step: 'error', error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email, otp) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
      const { user: userData, token: newToken } = res.data;
      await saveAuth(userData, newToken);
      scheduleRefresh();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || err.message };
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async (idToken) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/google-login`, { idToken });
      const { user: userData, token: newToken, isNew } = res.data;
      await saveAuth(userData, newToken);
      scheduleRefresh();
      return { success: true, isNew };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Google auth failed' };
    } finally {
      setLoading(false);
    }
  };

  const saveAuth = async (userData, tokenValue) => {
    setUser(userData);
    setToken(tokenValue);
    await AsyncStorage.setItem(CONSTANTS.STORAGE_KEYS.TOKEN, tokenValue);
    await AsyncStorage.setItem(CONSTANTS.STORAGE_KEYS.USER, JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${tokenValue}`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (e) { /* ignore */ }

    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove([
      CONSTANTS.STORAGE_KEYS.TOKEN,
      CONSTANTS.STORAGE_KEYS.USER,
    ]);
    delete axios.defaults.headers.common['Authorization'];
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      await axios.post(`${API_URL}/auth/change-password`, { oldPassword, newPassword });
      return true;
    } catch (err) {
      return false;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authChecked,
        login,
        register,
        verifyOtp,
        googleLogin,
        logout,
        changePassword,
        forgotPassword,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
