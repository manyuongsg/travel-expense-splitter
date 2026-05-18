const listeners = new Set();

export const authEvents = {
  onForceLogout: (cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  forceLogout: () => {
    listeners.forEach((cb) => cb());
  },
};
