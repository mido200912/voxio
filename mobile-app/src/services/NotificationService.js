import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';
import axios from 'axios';

const STORAGE_KEYS = {
  FCM_TOKEN: '@voxio_fcm_token',
  PENDING_MESSAGES: '@voxio_pending_messages',
  CHAT_HISTORY: '@voxio_chat_history',
  WHATSAPP_MESSAGES: '@voxio_whatsapp_messages',
  TELEGRAM_MESSAGES: '@voxio_telegram_messages',
  INSTAGRAM_MESSAGES: '@voxio_instagram_messages',
};

class NotificationService {
  static async initialize() {
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        { channelId: 'voxio_default', channelName: 'VOXIO Notifications', importance: 4, vibrate: true },
        (created) => console.log(`Push channel created: ${created}`)
      );
    }

    const authStatus = await messaging().requestPermission();
    const enabled = authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      const fcmToken = await messaging().getToken();
      await AsyncStorage.setItem(STORAGE_KEYS.FCM_TOKEN, fcmToken);
      console.log('FCM Token:', fcmToken);

      // Send token to backend
      const API_URL = 'http://localhost:5000/api';
      const token = await AsyncStorage.getItem('@voxio_auth_token');
      if (token) {
        axios.post(`${API_URL}/notifications/fcm-token`, { fcmToken }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
    }

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message:', remoteMessage);
      PushNotification.localNotification({
        channelId: 'voxio_default',
        title: remoteMessage.notification?.title || 'VOXIO',
        message: remoteMessage.notification?.body || '',
        userInfo: remoteMessage.data,
        smallIcon: 'ic_notification',
        largeIcon: 'ic_launcher',
      });

      // Save message locally
      await NotificationService.saveMessageToLocalStorage(remoteMessage.data);
    });

    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message:', remoteMessage);
      await NotificationService.saveMessageToLocalStorage(remoteMessage.data);
    });

    // Handle notification press
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification opened app:', remoteMessage);
    });

    // Check if app opened from notification
    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        console.log('App opened from notification:', remoteMessage);
      }
    });
  }

  static async saveMessageToLocalStorage(data) {
    if (!data) return;

    const { type, platform, customerName, message } = data;
    const messageEntry = {
      type: type || 'message',
      platform: platform || 'unknown',
      customerName: customerName || 'Customer',
      message: message || '',
      timestamp: new Date().toISOString(),
    };

    try {
      // Save to platform-specific storage
      const platformKey = platform === 'whatsapp' ? STORAGE_KEYS.WHATSAPP_MESSAGES
                        : platform === 'telegram' ? STORAGE_KEYS.TELEGRAM_MESSAGES
                        : STORAGE_KEYS.INSTAGRAM_MESSAGES;

      const existing = await AsyncStorage.getItem(platformKey);
      const messages = existing ? JSON.parse(existing) : [];
      messages.unshift(messageEntry);
      if (messages.length > 200) messages.length = 200;
      await AsyncStorage.setItem(platformKey, JSON.stringify(messages));

      // Save to general chat history
      const chatHistory = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      const allChats = chatHistory ? JSON.parse(chatHistory) : [];
      allChats.unshift(messageEntry);
      if (allChats.length > 500) allChats.length = 500;
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(allChats));
    } catch (err) {
      console.error('Error saving message to local storage:', err);
    }
  }

  static async getPlatformMessages(platform) {
    const key = platform === 'whatsapp' ? STORAGE_KEYS.WHATSAPP_MESSAGES
              : platform === 'telegram' ? STORAGE_KEYS.TELEGRAM_MESSAGES
              : STORAGE_KEYS.INSTAGRAM_MESSAGES;
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async getAllMessages() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async clearMessages() {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS).filter(k => k.includes('MESSAGES') || k.includes('CHAT')));
  }

  static async getFcmToken() {
    return await AsyncStorage.getItem(STORAGE_KEYS.FCM_TOKEN);
  }

  static async sendTestNotification() {
    const API_URL = 'http://localhost:5000/api';
    const token = await AsyncStorage.getItem('@voxio_auth_token');
    if (token) {
      return axios.post(`${API_URL}/notifications/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  }
}

export default NotificationService;
