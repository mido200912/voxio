import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';  

const ToastContext = createContext(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be inside ToastProvider');
    return ctx;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = useMemo(() => ({
        success: (msg, dur) => addToast(msg, 'success', dur),
        error: (msg, dur) => addToast(msg, 'error', dur),
        info: (msg, dur) => addToast(msg, 'info', dur),
        warning: (msg, dur) => addToast(msg, 'warning', dur),
    }), [addToast]);

    // Reassign methods directly
    const value = { toast: Object.assign(addToast, toast) };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-times-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle',
};

const colorMap = {
    success: { bg: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.4)' },
    error: { bg: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239,68,68,0.4)' },
    warning: { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245,158,11,0.4)' },
    info: { bg: 'linear-gradient(135deg, #6C63FF, #4f46e5)', glow: 'rgba(108,99,255,0.4)' },
};

const ToastItem = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => onRemove(toast.id), toast.duration || 4000);
        return () => clearTimeout(timer);
    }, [toast, onRemove]);

    const colors = colorMap[toast.type] || colorMap.info;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => onRemove(toast.id)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '16px 22px',
                borderRadius: '16px',
                background: 'rgba(20, 20, 30, 0.92)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: `0 12px 40px rgba(0,0,0,0.4), 0 0 20px ${colors.glow}`,
                cursor: 'pointer',
                minWidth: '320px',
                maxWidth: '480px',
                color: '#fff',
                fontFamily: 'Inter, Cairo, sans-serif',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Accent bar */}
            <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '4px',
                background: colors.bg,
                borderRadius: '16px 0 0 16px',
            }} />

            {/* Icon */}
            <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: colors.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0,
                boxShadow: `0 4px 12px ${colors.glow}`,
            }}>
                <i className={iconMap[toast.type] || iconMap.info} />
            </div>

            {/* Message */}
            <div style={{ flex: 1, fontSize: '0.95rem', lineHeight: '1.5', fontWeight: 500, letterSpacing: '-0.01em' }}>
                {toast.message}
            </div>

            {/* Close */}
            <div style={{ opacity: 0.4, fontSize: '12px', flexShrink: 0 }}>
                <i className="fas fa-times" />
            </div>

            {/* Progress bar */}
            <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: (toast.duration || 4000) / 1000, ease: 'linear' }}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: colors.bg,
                    transformOrigin: 'left',
                    borderRadius: '0 0 16px 16px',
                }}
            />
        </motion.div>
    );
};

const ToastContainer = ({ toasts, removeToast }) => {
    return (
        <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'none',
        }}>
            <AnimatePresence mode="popLayout">
                {toasts.map(t => (
                    <div key={t.id} style={{ pointerEvents: 'auto' }}>
                        <ToastItem toast={t} onRemove={removeToast} />
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ToastProvider;
