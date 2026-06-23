import React, { createContext, useState, useContext, useEffect } from 'react';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import translations from '../utils/translations';
import CONSTANTS from '../utils/constants';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ar');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem(CONSTANTS.STORAGE_KEYS.LANGUAGE);
      if (savedLang) {
        setLanguage(savedLang);
        I18nManager.allowRTL(savedLang === 'ar');
        I18nManager.forceRTL(savedLang === 'ar');
      } else {
        // Default: Arabic RTL
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(true);
      }
    } catch (err) {
      console.warn('Failed to load language:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    try {
      await AsyncStorage.setItem(CONSTANTS.STORAGE_KEYS.LANGUAGE, lang);
      const isRTL = lang === 'ar';
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
    } catch (err) {
      console.warn('Failed to save language:', err);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider
      value={{
        language,
        isRTL,
        isLoading,
        changeLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
