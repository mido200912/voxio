import api from './api';

const chatService = {
  getConversations: () => api.get('/handoff/conversations'),
  getConversation: (userId, platform) =>
    api.get(`/handoff/conversation/${encodeURIComponent(userId)}/${platform}`),
  reply: (userId, platform, message) =>
    api.post('/handoff/reply', { userId, platform, message }),
  toggleAi: (userId, platform, aiEnabled) =>
    api.post('/handoff/toggle-ai', { userId, platform, aiEnabled }),
  acceptHandoff: (userId, platform) =>
    api.post('/handoff/accept', { userId, platform }),
  sendMessage: (prompt) => api.post('/chat', { prompt }),
};

export default chatService;
