import apiClient from './client';

export const resumeApi = {
  create: (data) =>
    apiClient.post('/api/v1/resumes', data),

  getAll: () =>
    apiClient.get('/api/v1/resumes'),

  getRecent: () =>
    apiClient.get('/api/v1/resumes/recent'),

  getById: (resumeId) =>
    apiClient.get(`/api/v1/resumes/${resumeId}`),

  update: (resumeId, data) =>
    apiClient.put(`/api/v1/resumes/${resumeId}`, data),

  delete: (resumeId) =>
    apiClient.delete(`/api/v1/resumes/${resumeId}`),

  duplicate: (resumeId) =>
    apiClient.post(`/api/v1/resumes/${resumeId}/duplicate`),

  publish: (resumeId) =>
    apiClient.put(`/api/v1/resumes/${resumeId}/publish`),

  unpublish: (resumeId) =>
    apiClient.put(`/api/v1/resumes/${resumeId}/unpublish`),

  updateAtsScore: (resumeId, atsScore) =>
    apiClient.put(`/api/v1/resumes/${resumeId}/ats-score`, { atsScore }),

  incrementView: (resumeId) =>
    apiClient.put(`/api/v1/resumes/${resumeId}/view`),

  getPublic: () =>
    apiClient.get('/api/v1/resumes/public'),

  getByTemplate: (templateId) =>
    apiClient.get(`/api/v1/resumes/template/${templateId}`),
};
