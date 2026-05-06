import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { C, F } from '../../theme/postage';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!success) return;
    if (countdown === 0) { navigation.replace('Login'); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, countdown, navigation]);

  const validate = () => {
    if (!displayName.trim()) return 'Full name is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirm) return 'Passwords do not match';
    return null;
  };

  const handleRegister = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError('');
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, displayName.trim());
      setSuccess(true);
    } catch (e) {
      const serverMsg = e.response?.data?.message;
      const isNetwork = !e.response && e.message;
      setError(
        serverMsg
          ?? (isNetwork ? 'Cannot reach server. Make sure the backend is running.' : null)
          ?? 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successStamp}>
          <MaterialIcons name="check" size={40} color={C.stamp} />
        </View>
        <Text style={styles.successTitle}>Bon Voyage!</Text>
        <Text style={styles.successBody}>Welcome aboard, {displayName.trim()}.</Text>
        <Text style={styles.successMono}>Redirecting in {countdown}s</Text>
        <Pressable style={styles.signInBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.signInBtnText}>SIGN IN NOW</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.logoArea}>
          <Text style={styles.logoTitle}>Voyage</Text>
          <Text style={styles.logoMono}>create your account</Text>
        </View>

        <View style={styles.stampCard}>
          <Text style={styles.cardHeading}>New Traveller</Text>

          {[
            { label: 'FULL NAME', placeholder: 'Jane Doe', value: displayName, set: setDisplayName, opts: {} },
            { label: 'EMAIL', placeholder: 'you@example.com', value: email, set: setEmail, opts: { keyboardType: 'email-address', autoCapitalize: 'none' } },
            { label: 'PASSWORD', placeholder: 'Min. 8 characters', value: password, set: setPassword, opts: { secureTextEntry: true } },
            { label: 'CONFIRM PASSWORD', placeholder: 'Repeat password', value: confirm, set: setConfirm, opts: { secureTextEntry: true } },
          ].map(({ label, placeholder, value, set, opts }) => (
            <View key={label}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={C.border}
                value={value}
                onChangeText={(t) => { set(t); setError(''); }}
                autoCorrect={false}
                {...opts}
              />
            </View>
          ))}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.perf} />

          <Pressable
            style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>CREATE ACCOUNT</Text>
            }
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Already travelling?{'  '}<Text style={styles.linkBold}>Sign In →</Text></Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 28 },

  logoArea: { alignItems: 'center', marginBottom: 28 },
  logoTitle: { fontFamily: F.serif, fontSize: 44, fontStyle: 'italic', color: C.ink },
  logoMono: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 2.5, marginTop: 6, textTransform: 'uppercase' },

  stampCard: {
    backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border, borderRadius: 4, padding: 24,
  },
  cardHeading: { fontFamily: F.serif, fontSize: 22, fontStyle: 'italic', color: C.ink, marginBottom: 18 },

  label: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6, marginTop: 4 },
  input: {
    borderBottomWidth: 1.5, borderBottomColor: C.border,
    paddingVertical: 9, fontSize: 16, color: C.ink, marginBottom: 14, backgroundColor: 'transparent',
  },

  perf: { borderTopWidth: 1, borderTopColor: C.divider, marginVertical: 14 },

  errorText: {
    fontFamily: F.mono, fontSize: 11, color: C.negative,
    marginBottom: 8, paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: C.negativeBg, borderRadius: 2,
  },

  primaryBtn: { backgroundColor: C.stamp, borderRadius: 3, paddingVertical: 14, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { fontFamily: F.mono, color: '#fff', fontSize: 13, letterSpacing: 2, fontWeight: '700' },

  link: { textAlign: 'center', color: C.inkMid, marginTop: 28, fontSize: 14 },
  linkBold: { color: C.stamp, fontWeight: '700' },

  successContainer: { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successStamp: {
    width: 96, height: 96, borderWidth: 3, borderColor: C.stamp, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  successTitle: { fontFamily: F.serif, fontSize: 32, fontStyle: 'italic', color: C.ink, marginBottom: 10 },
  successBody: { fontSize: 16, color: C.inkMid, textAlign: 'center', marginBottom: 6 },
  successMono: { fontFamily: F.mono, fontSize: 11, color: C.inkLight, letterSpacing: 1.5, marginBottom: 36 },
  signInBtn: { backgroundColor: C.stamp, borderRadius: 3, paddingVertical: 13, paddingHorizontal: 40 },
  signInBtnText: { fontFamily: F.mono, color: '#fff', fontSize: 13, letterSpacing: 2, fontWeight: '700' },
});
