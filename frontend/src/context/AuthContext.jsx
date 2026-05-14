import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const refreshTimerRef = useRef(null);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // ⚡ Ensure cookies are sent with every request (critical for refresh token)
    axios.defaults.withCredentials = true;

    // Silent token refresh using the httpOnly refresh cookie
    const silentRefresh = useCallback(async () => {
        try {
            const res = await axios.post(`${BACKEND_URL}/auth/refresh`);
            const { accessToken } = res.data;
            if (accessToken) {
                secureStorage.setItem('token', accessToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                // Schedule next refresh in 6 days (token lasts 7 days)
                scheduleRefresh();
                return true;
            }
        } catch (err) {
            console.warn('Silent refresh failed, session expired.');
            performLogout();
            return false;
        }
    }, [BACKEND_URL]);

    // Schedule next auto-refresh (every 6 days)
    const scheduleRefresh = useCallback(() => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        // Refresh 1 day before expiry (6 days = 518400000ms)
        refreshTimerRef.current = setTimeout(() => {
            silentRefresh();
        }, 6 * 24 * 60 * 60 * 1000);
    }, [silentRefresh]);

    const performLogout = useCallback(() => {
        setUser(null);
        
        // 1. Save preferences
        const theme = localStorage.getItem('voxio-theme');
        const lang = localStorage.getItem('voxio-lang');
        
        // 2. Aggressively clear storages
        localStorage.clear();
        sessionStorage.clear();
        
        // 3. Restore preferences
        if(theme) localStorage.setItem('voxio-theme', theme);
        if(lang) localStorage.setItem('voxio-lang', lang);

        delete axios.defaults.headers.common['Authorization'];
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

        // 4. Disable Google Auto-Select
        if (typeof window !== 'undefined' && window.google?.accounts?.id) {
            window.google.accounts.id.disableAutoSelect();
        }

        // 5. Hard Redirect to clear all React state memory
        window.location.href = '/login';
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            const token = secureStorage.getItem('token');
            const savedUser = secureStorage.getItem('user');

            if (token && savedUser) {
                try {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    setUser(savedUser);
                    // Schedule automatic refresh
                    scheduleRefresh();
                } catch (err) {
                    console.error('Auth initialization error:', err);
                    performLogout();
                }
            }
            setLoading(false);
            setIsAuthChecked(true);
        };
        initAuth();

        // Setup global Axios interceptor for 401 errors — try refresh before logout
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                if (error.response && error.response.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    // Don't try to refresh if this IS the refresh request
                    if (originalRequest.url?.includes('/auth/refresh')) {
                        performLogout();
                        return Promise.reject(error);
                    }
                    const refreshed = await silentRefresh();
                    if (refreshed) {
                        // Retry the original request with new token
                        const newToken = secureStorage.getItem('token');
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return axios(originalRequest);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${BACKEND_URL}/auth/login`, { email, password });
            if (response.data.step === 'otp_required') return { step: 'otp_required', email: response.data.email };
            const { user, token } = response.data;
            setUser(user);
            secureStorage.setItem('token', token);
            secureStorage.setItem('user', user);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            scheduleRefresh();
            return { step: 'done' };
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || err.message);
            return { step: 'error' };
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (email, otp) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${BACKEND_URL}/auth/verify-otp`, { email, otp });
            const { user, token } = response.data;
            setUser(user);
            secureStorage.setItem('token', token);
            secureStorage.setItem('user', user);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            scheduleRefresh();
            return true;
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (name, email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${BACKEND_URL}/auth/register`, { name, email, password });
            if (response.data.step === 'otp_required') return { step: 'otp_required', email: response.data.email };
            const { user, token } = response.data;
            setUser(user);
            secureStorage.setItem('token', token);
            secureStorage.setItem('user', user);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            scheduleRefresh();
            return { step: 'done' };
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || err.message);
            return { step: 'error' };
        } finally {
            setLoading(false);
        }
    };

    const forgotPassword = async (email) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${BACKEND_URL}/auth/forgot-password`, { email });
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email, otp, newPassword) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${BACKEND_URL}/auth/reset-password`, { email, otp, newPassword });
            return response.data;
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (oldPassword, newPassword) => {
        setLoading(true);
        setError(null);
        try {
            await axios.post(`${BACKEND_URL}/auth/change-password`, { oldPassword, newPassword });
            return true;
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const googleLogin = async (idToken) => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(`${BACKEND_URL}/auth/google-login`, { idToken });
            const { user, token, isNew } = response.data;
            setUser(user);
            secureStorage.setItem('token', token);
            secureStorage.setItem('user', user);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            scheduleRefresh();
            return { success: true, isNew };
        } catch (err) {
            setError(err.response?.data?.error || "Google auth failed");
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${BACKEND_URL}/auth/logout`);
        } catch (e) {
            // ignore network errors on logout
        }
        performLogout();
    };

    return (
        <AuthContext.Provider value={{ 
            user, loading, error, setError, login, verifyOtp, 
            register, logout, isAuthChecked, forgotPassword, 
            resetPassword, changePassword, googleLogin 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
