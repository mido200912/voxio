import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

let showToastFn = null;

const VToast = () => {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  const show = useCallback((msg, toastType = 'info', duration = 3000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage(msg);
    setType(toastType);
    setVisible(true);
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setVisible(false);
      });
    }, duration);
  }, [opacity]);

  useEffect(() => {
    showToastFn = show;
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [show]);

  if (!visible) return null;

  const bgColor = type === 'success' ? '#22C55E' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#6C63FF';

  return (
    <Animated.View style={[styles.container, { opacity, backgroundColor: bgColor }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

export const showToast = (message, type, duration) => {
  if (showToastFn) showToastFn(message, type, duration);
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute', bottom: 100, left: 24, right: 24,
    borderRadius: 14, padding: 14, zIndex: 9999,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { color: '#FFF', fontSize: 14, fontWeight: '700', textAlign: 'center' },
});

export default VToast;
