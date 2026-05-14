import apiClient from './client';

// Section Service
export const sectionApi = {
  create: (data) =>
    apiClient.post('/api/v1/sections', data),

  getByResume: (resumeId) =>
    apiClient.get(`/api/v1/sections/resume/${resumeId}`),

  getById: (sectionId) =>
    apiClient.get(`/api/v1/sections/${sectionId}`),

  update: (sectionId, data) =>
    apiClient.put(`/api/v1/sections/${sectionId}`, data),

  delete: (sectionId) =>
    apiClient.delete(`/api/v1/sections/${sectionId}`),

  reorder: (resumeId, sectionIds) =>
    apiClient.put(`/api/v1/sections/resume/${resumeId}/reorder`, { sectionIds }),

  duplicate: (sourceResumeId, targetResumeId) =>
    apiClient.post(`/api/v1/sections/resume/${sourceResumeId}/duplicate/${targetResumeId}`),

  deleteAllByResume: (resumeId) =>
    apiClient.delete(`/api/v1/sections/resume/${resumeId}/all`),
};

// AI Service
export const aiApi = {
  generateSummary: ({ jobTitle, skills, experienceLevel }) =>
    apiClient.post('/api/v1/ai/summary/generate', { jobTitle, skills, experienceLevel }),

  generateExperienceBullets: ({ jobTitle, companyName, workSummary }) =>
    apiClient.post('/api/v1/ai/experience/generate', {
      jobTitle,
      companyName: companyName || '',
      workSummary,
    }),

  analyzeAts: ({ resumeId, resumeText, jobDescription }) =>
    apiClient.post('/api/v1/ai/ats/analyze', { resumeId, resumeText, jobDescription }),

  getUsage: () =>
    apiClient.get('/api/v1/ai/usage'),
};

// Template Service
export const templateApi = {
  getPublic: () => apiClient.get('/api/v1/templates/public'),
  getAll: () => apiClient.get('/api/v1/templates'),
  getById: (id) => apiClient.get(`/api/v1/templates/${id}`),
  getUsage: (id) => apiClient.get(`/api/v1/templates/${id}/usage`),
  create: (data) => apiClient.post('/api/v1/templates', data),
  update: (id, data) => apiClient.put(`/api/v1/templates/${id}`, data),
  delete: (id) => apiClient.delete(`/api/v1/templates/${id}`),
};

// Export Service
export const exportApi = {
  exportResume: ({ resumeId, templateId = 1, exportFormat = 'PDF' }) =>
    apiClient.post('/api/v1/exports', { resumeId, templateId, exportFormat }),

  getJobStatus: (exportId) =>
    apiClient.get(`/api/v1/exports/${exportId}`),

  getHistory: () =>
    apiClient.get('/api/v1/exports'),

  getHistoryByResume: (resumeId) =>
    apiClient.get(`/api/v1/exports/resume/${resumeId}`),

  getHistoryByUser: (userId) =>
    apiClient.get(`/api/v1/exports/user/${userId}`),

  downloadFile: (fileUrl) => {
    window.open(fileUrl, '_blank');
  },
};

// JobMatch Service
export const jobMatchApi = {
  // Create / Analyze
  create: ({ resumeId, jobTitle, jobDescription, companyName, jobUrl }) =>
    apiClient.post('/api/v1/job-matches', { resumeId, jobTitle, jobDescription, companyName, jobUrl }),

  analyze: ({ resumeId, jobTitle, companyName, jobUrl, jobDescription }) =>
    apiClient.post('/api/v1/job-matches/analyze', { resumeId, jobTitle, companyName, jobUrl, jobDescription }),

  // Queries
  getAll: () => apiClient.get('/api/v1/job-matches'),
  getById: (id) => apiClient.get(`/api/v1/job-matches/${id}`),
  getByResume: (resumeId) => apiClient.get(`/api/v1/job-matches/resume/${resumeId}`),
  getTopMatches: (limit = 5) => apiClient.get(`/api/v1/job-matches/top?limit=${limit}`),

  // Bookmarks
  getBookmarks: () => apiClient.get('/api/v1/job-matches/bookmarks'),
  bookmark: (id) => apiClient.put(`/api/v1/job-matches/${id}/bookmark`),
  unbookmark: (id) => apiClient.put(`/api/v1/job-matches/${id}/unbookmark`),

  // Delete
  delete: (id) => apiClient.delete(`/api/v1/job-matches/${id}`),

  // Live job search
  searchJobs: ({ jobTitle, location }) =>
    apiClient.post('/api/v1/job-matches/search', { jobTitle, location }),
  fetchLinkedIn: ({ jobTitle, location }) =>
    apiClient.post('/api/v1/job-matches/fetch/linkedin', { jobTitle, location }),
  fetchNaukri: ({ jobTitle, location }) =>
    apiClient.post('/api/v1/job-matches/fetch/naukri', { jobTitle, location }),

  // Recommendations
  getRecommendations: (id) => apiClient.get(`/api/v1/job-matches/${id}/recommendations`),
};

// Notification Service
export const notificationApi = {
  getAll: () => apiClient.get('/api/v1/notifications'),
  markAsRead: (id) => apiClient.put(`/api/v1/notifications/${id}/read`),
  markAllAsRead: () => apiClient.put('/api/v1/notifications/read-all'),
  delete: (id) => apiClient.delete(`/api/v1/notifications/${id}`),
};
