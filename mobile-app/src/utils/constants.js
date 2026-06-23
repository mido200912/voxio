// VOXIO Constants
const CONSTANTS = {
  // API
  API_BASE_URL: 'https://aithor1.vercel.app/api',
  API_TIMEOUT: 30000,

  // Storage Keys
  STORAGE_KEYS: {
    TOKEN: 'voxio_token',
    USER: 'voxio_user',
    THEME: 'voxio_theme',
    LANGUAGE: 'voxio_lang',
    NOTIFICATION_SETTINGS: 'voxio_notification_settings',
    FCM_TOKEN: 'voxio_fcm_token',
    REMEMBER_ME: 'voxio_remember_me',
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    NEW_MESSAGE: 'new_message',
    AI_REPLY: 'ai_reply',
    NEW_ORDER: 'new_order',
    HUMAN_HANDOFF: 'human_handoff',
    DAILY_REPORT: 'daily_report',
    BROADCAST: 'broadcast',
  },

  // Platforms
  PLATFORMS: {
    WHATSAPP: 'whatsapp',
    INSTAGRAM: 'instagram',
    TELEGRAM: 'telegram',
    WEB: 'web',
    WIDGET: 'widget',
    MESSENGER: 'messenger',
  },

  // Conversation Tabs
  CONVERSATION_TABS: {
    ALL: 'all',
    HANDOFF: 'handoff',
    ACTIVE: 'active',
    MANUAL: 'manual',
  },

  // Order Status
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },

  // Lead Status
  LEAD_STATUS: {
    NEW: 'new',
    CONTACTED: 'contacted',
    QUALIFIED: 'qualified',
    CONVERTED: 'converted',
    LOST: 'lost',
  },

  // AI Settings
  AI_MODES: {
    RESTRICTED: 'restricted',
    GENERAL: 'general',
  },

  AI_PERSONAS: {
    PROFESSIONAL: 'professional',
    FRIENDLY: 'friendly',
    CASUAL: 'casual',
    ENTHUSIASTIC: 'enthusiastic',
    MINIMAL: 'minimal',
    EXPERT: 'expert',
    EMPATHETIC: 'empathetic',
  },

  // Languages
  LANGUAGES: {
    AR: 'ar',
    EN: 'en',
  },

  // Themes
  THEMES: {
    DARK: 'dark',
    LIGHT: 'light',
  },

  // Pagination
  PAGE_SIZE: 20,

  // Refresh Intervals (ms)
  REFRESH_INTERVALS: {
    CONVERSATIONS: 15000,
    ANALYTICS: 30000,
    NOTIFICATIONS: 10000,
  },
};

export default CONSTANTS;
