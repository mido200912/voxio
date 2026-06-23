import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CONSTANTS from '../utils/constants';

const notificationService = {
  saveFcmToken: (fcmToken) => api.post('/notifications/fcm-token', { fcmToken }),
  removeFcmToken: () => api.delete('/notifications/fcm-token'),
  sendTestNotification: () => api.post('/notifications/test'),
  getSettings: () => api.get('/notifications/settings'),
  updateSettings: (settings) => api.put('/notifications/settings', settings),
  muteAll: () => api.post('/notifications/mute', { mute: true }),
  unmuteAll: () => api.post('/notifications/mute', { mute: false }),

  // Local storage for notification settings
  getLocalSettings: async () => {
    try {
      const saved = await AsyncStorage.getItem(CONSTANTS.STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (saved) return JSON.parse(saved);
      return {
        enabled: true,
        newMessage: true,
        aiReply: true,
        newOrder: true,
        humanHandoff: true,
        dailyReport: false,
        platforms: {
          whatsapp: true,
          instagram: true,
          telegram: true,
          web: true,
        },
        dndEnabled: false,
        dndFrom: '22:00',
        dndTo: '07:00',
        sound: true,
        vibration: true,
      };
    } catch { return null; }
  },

  saveLocalSettings: async (settings) => {
    try {
      await AsyncStorage.setItem(
        CONSTANTS.STORAGE_KEYS.NOTIFICATION_SETTINGS,
        JSON.stringify(settings)
      );
    } catch (err) { console.warn('Failed to save notification settings:', err); }
  },

  isMuted: async () => {
    const settings = await notificationService.getLocalSettings();
    if (!settings) return false;
    if (!settings.enabled) return true;

    // Check DND
    if (settings.dndEnabled) {
      const now = new Date();
      const currentHour = now.getHours();
      const [fromHour] = settings.dndFrom.split(':').map(Number);
      const [toHour] = settings.dndTo.split(':').map(Number);
      if (fromHour > toHour) {
        // Overnight DND (e.g., 22:00 - 07:00)
        if (currentHour >= fromHour || currentHour < toHour) return true;
      } else {
        if (currentHour >= fromHour && currentHour < toHour) return true;
      }
    }
    return false;
  },
};

export default notificationService;
