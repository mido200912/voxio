import api from './api';

const companyService = {
  getProfile: () => api.get('/company'),
  updateProfile: (data) => api.post('/company', data),
  getApiKey: () => api.get('/company/apikey'),
  applyTemplate: (templateId) => api.post('/company/apply-template', { templateId }),
  uploadImage: (formData) => api.post('/ai/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default companyService;
