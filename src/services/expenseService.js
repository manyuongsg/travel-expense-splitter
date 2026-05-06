import api from './api';

export const expenseService = {
  getAll: async (tripId) => {
    const { data } = await api.get(`/trips/${tripId}/expenses`);
    return data;
  },

  create: async (tripId, payload) => {
    // payload: { description, amountCents, currency, paidByMemberId, splitType, customSplits }
    // customSplits: [{ memberId, amountCents }] — only for CUSTOM split type
    const { data } = await api.post(`/trips/${tripId}/expenses`, payload);
    return data;
  },

  delete: async (tripId, expenseId) => {
    await api.delete(`/trips/${tripId}/expenses/${expenseId}`);
  },

  getExchangeRates: async (base, targets) => {
    const targetStr = targets.join(',');
    const { data } = await api.get(`/exchange-rates?base=${base}&targets=${targetStr}`);
    return data;
  },
};
