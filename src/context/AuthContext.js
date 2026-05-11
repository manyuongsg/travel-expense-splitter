import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const jwt = await SecureStore.getItemAsync('jwt');
        const userData = await SecureStore.getItemAsync('user');
        if (jwt && userData) setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Session restore failed:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const _persist = async (data) => {
    await SecureStore.setItemAsync('jwt', data.token);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    await SecureStore.setItemAsync('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    await _persist(data);
  };

  const loginWithGoogle = async (idToken) => {
    const data = await authService.loginWithGoogle(idToken);
    await _persist(data);
  };

  const register = async (email, password, displayName) => {
    await authService.register(email, password, displayName);
    // Intentionally not auto-logging in; caller handles navigation to Login.
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('jwt');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('user');
    setUser(null);
  };

  const updateUser = async (updatedUser) => {
    await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
