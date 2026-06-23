import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONSTANTS from '../utils/constants';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

const DEFAULT_SETTINGS = {
  enabled: true,
  newMessage: true,
  aiReply: true,
  newOrder: true,
  humanHandoff: true,
  dailyReport: false,
  broadcast: true,
  platforms: {
    whatsapp: true,
    instagram: true,
    telegram: true,
    web: true,
    widget: true,
    messenger: true,
  },
  dndEnabled: false,
  dndFrom: '22:00',
  dndTo: '07:00',
  sound: true,
  vibration: true,
};

export const NotificationProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(CONSTANTS.STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (saved) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      }
    } catch (err) {
      console.warn('Failed to load notification settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = useCallback(async (newSettings) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    try {
      await AsyncStorage.setItem(
        CONSTANTS.STORAGE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(updated)
      );
    } catch (err) {
      console.warn('Failed to save notification settings:', err);
    }
  }, [settings]);

  const toggleMaster = useCallback(async () => {
    await updateSettings({ enabled: !settings.enabled });
  }, [settings.enabled, updateSettings]);

  const toggleType = useCallback(async (type) => {
    await updateSettings({ [type]: !settings[type] });
  }, [settings, updateSettings]);

  const togglePlatform = useCallback(async (platform) => {
    const newPlatforms = { ...settings.platforms, [platform]: !settings.platforms[platform] };
    await updateSettings({ platforms: newPlatforms });
  }, [settings.platforms, updateSettings]);

  const isMuted = useCallback(() => {
    if (!settings.enabled) return true;
    if (settings.dndEnabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const [fromHour] = settings.dndFrom.split(':').map(Number);
      const [toHour] = settings.dndTo.split(':').map(Number);
      if (fromHour > toHour) {
        if (currentHour >= fromHour || currentHour < toHour) return true;
      } else {
        if (currentHour >= fromHour && currentHour < toHour) return true;
      }
    }
    return false;
  }, [settings]);

  const shouldNotify = useCallback((type, platform) => {
    if (isMuted()) return false;
    if (!settings[type]) return false;
    if (platform && !settings.platforms[platform]) return false;
    return true;
  }, [settings, isMuted]);

  return (
    <NotificationContext.Provider
      value={{
        settings,
        loading,
        unreadCount,
        setUnreadCount,
        updateSettings,
        toggleMaster,
        toggleType,
        togglePlatform,
        isMuted,
        shouldNotify,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
