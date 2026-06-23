import api from './api';

const integrationService = {
  getStatus: () => api.get('/integrations'),
  connectWhatsApp: (data) => api.post('/integrations/whatsapp', data),
  connectTelegram: (data) => api.post('/integrations/telegram', data),
  connectInstagram: (data) => api.post('/integrations/instagram', data),
  connectShopify: (data) => api.post('/integrations/shopify', data),
  disconnect: (platform) => api.delete(`/integrations/${platform}`),
  getChatbotConfig: () => api.get('/chatbot-editor'),
  updateChatbotConfig: (data) => api.post('/chatbot-editor', data),
  getWidgetConfig: () => api.get('/widget-editor'),
  updateWidgetConfig: (data) => api.post('/widget-editor', data),
};

export default integrationService;
