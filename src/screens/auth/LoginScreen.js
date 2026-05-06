import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { C, F } from '../../theme/postage';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email';
    if (!password) return 'Password is required';
    return null;
  };

  const handleLogin = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      const msg = e.response?.data?.message
        ?? (e.message?.includes('Network') ? 'Cannot reach server. Is the backend running?' : null)
        ?? 'Login failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Logo / cover area */}
        <View style={styles.logoArea}>
          <Text style={styles.logoTitle}>Voyage</Text>
          <View style={styles.logoDivider} />
          <Text style={styles.logoMono}>travel · expenses · shared</Text>
        </View>

        {/* Stamp-framed form */}
        <View style={styles.stampCard}>
          <Text style={styles.cardHeading}>Sign In</Text>

          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={C.border}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={C.border}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.perf} />

          <Pressable
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>SIGN IN</Text>
            }
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>
            No account?{'  '}<Text style={styles.linkBold}>Register →</Text>
          </Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 28 },

  logoArea: { alignItems: 'center', marginBottom: 36 },
  logoTitle: { fontFamily: F.serif, fontSize: 52, fontStyle: 'italic', color: C.ink, letterSpacing: 1 },
  logoDivider: { width: 48, height: 1.5, backgroundColor: C.stamp, marginVertical: 10 },
  logoMono: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 3, textTransform: 'uppercase' },

  stampCard: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 4,
    padding: 24,
  },
  cardHeading: { fontFamily: F.serif, fontSize: 22, fontStyle: 'italic', color: C.ink, marginBottom: 20 },

  label: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
  input: {
    borderBottomWidth: 1.5,
    borderBottomColor: C.border,
    paddingVertical: 9,
    fontSize: 16,
    color: C.ink,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },

  perf: { borderTopWidth: 1, borderTopColor: C.divider, marginVertical: 16 },

  errorText: {
    fontFamily: F.mono, fontSize: 11, color: C.negative,
    marginBottom: 8, paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: C.negativeBg, borderRadius: 2,
  },

  primaryBtn: {
    backgroundColor: C.stamp, borderRadius: 3,
    paddingVertical: 14, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { fontFamily: F.mono, color: '#fff', fontSize: 13, letterSpacing: 2, fontWeight: '700' },

  link: { textAlign: 'center', color: C.inkMid, marginTop: 28, fontSize: 14 },
  linkBold: { color: C.stamp, fontWeight: '700' },
});
