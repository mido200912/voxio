import api from './api';

const analyticsService = {
  getDashboard: (days = 30) => api.get(`/analytics/dashboard?days=${days}`),
  getTimeseries: (days = 30) => api.get(`/analytics/timeseries?days=${days}`),
  getPlatforms: (days = 30) => api.get(`/analytics/platforms?days=${days}`),
  getHourly: (days = 30) => api.get(`/analytics/hourly?days=${days}`),
  getResponseTime: (days = 30) => api.get(`/analytics/response-time?days=${days}`),
  getLeads: (days = 30) => api.get(`/analytics/leads?days=${days}`),
};

export default analyticsService;
