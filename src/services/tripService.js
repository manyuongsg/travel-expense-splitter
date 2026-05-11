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

  create: async (name, baseCurrency, homeCurrency) => {
    const { data } = await api.post('/trips', { name, baseCurrency, homeCurrency });
    return data;
  },

  update: async (tripId, name, baseCurrency) => {
    const { data } = await api.patch(`/trips/${tripId}`, { name, baseCurrency });
    return data;
  },

  addMember: async (tripId, name) => {
    const { data } = await api.post(`/trips/${tripId}/members`, { name });
    return data;
  },

  removeMember: async (tripId, userId) => {
    await api.delete(`/trips/${tripId}/members/${userId}`);
  },

  getArchived: async () => {
    const { data } = await api.get('/trips/archived');
    return data;
  },

  archive: async (tripId) => {
    const { data } = await api.patch(`/trips/${tripId}/archive`, { archived: true });
    return data;
  },

  unarchive: async (tripId) => {
    const { data } = await api.patch(`/trips/${tripId}/archive`, { archived: false });
    return data;
  },

  deleteTrip: async (tripId) => {
    await api.delete(`/trips/${tripId}`);
  },

  getBalances: async (tripId) => {
    const { data } = await api.get(`/trips/${tripId}/balances`);
    return data;
  },
};
