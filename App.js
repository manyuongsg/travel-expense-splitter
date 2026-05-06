import 'react-native-gesture-handler';
import React, { useCallback, useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({ ...MaterialIcons.font });
      } catch (e) {
        console.warn('Font load error:', e);
      } finally {
        setAppReady(true);
      }
    })();
  }, []);

  const onLayout = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <SafeAreaProvider onLayout={onLayout}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
      <Toast />
    </SafeAreaProvider>
  );
}
