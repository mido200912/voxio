import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { secureStorage } from '../utils/secureStorage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthChecked, setIsAuthChecked] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://aithor1.vercel.app/api';

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
            setError(err.response?.data?.message || err.message);
            return { step: 'error' };
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
        <AuthContext.Provider value={{ user, loading, error, setError, login, logout, isAuthChecked }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

