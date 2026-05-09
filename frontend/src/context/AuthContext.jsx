import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const initAuth = async () => {
            const token = secureStorage.getItem('token');
            const savedUser = secureStorage.getItem('user');

            if (token && savedUser) {
                try {
                    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    setUser(savedUser);
                } catch (err) {
                    console.error('Auth initialization error:', err);
                    secureStorage.removeItem('token');
                    secureStorage.removeItem('user');
                    delete axios.defaults.headers.common['Authorization'];
                }
            }
            setLoading(false);
            setIsAuthChecked(true);
        };
        initAuth();

        // Setup global Axios interceptor for 401 errors
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    console.error('Global 401 intercepted. Logging out.');
                    setUser(null);
                    secureStorage.removeItem('token');
                    secureStorage.removeItem('user');
                    localStorage.removeItem('token'); // Fallback cleanup
                    delete axios.defaults.headers.common['Authorization'];
                }
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(interceptor);
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
            return { success: true, isNew };
        } catch (err) {
            setError(err.response?.data?.error || "Google auth failed");
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        secureStorage.removeItem('token');
        secureStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
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

