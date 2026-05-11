import api from './api';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  register: async (email, password, displayName) => {
    const { data } = await api.post('/auth/register', { email, password, displayName });
    return data;
  },

  loginWithGoogle: async (idToken) => {
    const { data } = await api.post('/auth/google', { idToken });
    return data;
  },

  refresh: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    return data;
  },

  updateProfile: async (displayName) => {
    const { data } = await api.patch('/auth/profile', { displayName });
    return data;
  },

  changePassword: async (currentPassword, newPassword) => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  deleteAccount: async () => {
    await api.delete('/auth/account');
  },
};
