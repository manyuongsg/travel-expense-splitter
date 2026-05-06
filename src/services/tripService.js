import api from './api';

export const tripService = {
  getAll: async () => {
    const { data } = await api.get('/trips');
    return data;
  },

  getById: async (tripId) => {
    const { data } = await api.get(`/trips/${tripId}`);
    return data;
  },

  create: async (name, baseCurrency) => {
    const { data } = await api.post('/trips', { name, baseCurrency });
    return data;
  },

  addMember: async (tripId, name) => {
    const { data } = await api.post(`/trips/${tripId}/members`, { name });
    return data;
  },

  removeMember: async (tripId, userId) => {
    await api.delete(`/trips/${tripId}/members/${userId}`);
  },

  getBalances: async (tripId) => {
    const { data } = await api.get(`/trips/${tripId}/balances`);
    return data;
  },
};
