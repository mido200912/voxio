import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../utils/colors';
import CONSTANTS from '../utils/constants';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState(systemColorScheme || 'dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(CONSTANTS.STORAGE_KEYS.THEME);
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (err) {
      console.warn('Failed to load theme:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(CONSTANTS.STORAGE_KEYS.THEME, newTheme);
    } catch (err) {
      console.warn('Failed to save theme:', err);
    }
  };

  const setThemeMode = async (mode) => {
    setTheme(mode);
    try {
      await AsyncStorage.setItem(CONSTANTS.STORAGE_KEYS.THEME, mode);
    } catch (err) {
      console.warn('Failed to save theme:', err);
    }
  };

  const themeColors = colors[theme];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors: themeColors,
        accentColors: colors.accent,
        isDark: theme === 'dark',
        isLoading,
        toggleTheme,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
