import apiClient, { authClient } from './client';

export const authApi = {
  register: (data) =>
    authClient.post('/api/v1/auth/register', data),

  login: (email, password) =>
    authClient.post('/api/v1/auth/login', { email, password }),

  refresh: (refreshToken) =>
    authClient.post('/api/v1/auth/refresh', JSON.stringify(refreshToken)),

  validateToken: (token) =>
    authClient.get(`/api/v1/auth/validate?token=${token}`),

  getProfile: () =>
    authClient.get('/api/v1/auth/profile'),

  updateProfile: (data) =>
    authClient.put('/api/v1/auth/profile', data),

  changePassword: (currentPassword, newPassword) =>
    authClient.put('/api/v1/auth/password', { currentPassword, newPassword }),

  updateSubscription: (plan) =>
    authClient.put('/api/v1/auth/subscription', { plan }),

  deactivate: () =>
    authClient.delete('/api/v1/auth/deactivate'),

  // Admin
  getAllUsers: () =>
    authClient.get('/api/v1/auth/admin/users'),

  reactivateUser: (userId) =>
    authClient.put(`/api/v1/auth/admin/users/${userId}/reactivate`),

  deactivateUser: (userId) =>
    authClient.put(`/api/v1/auth/admin/users/${userId}/deactivate`),

  updateUserSubscription: (userId, plan) =>
    authClient.put(`/api/v1/auth/admin/users/${userId}/subscription`, { plan }),
};