import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { C, F } from '../../theme/postage';
import { Postmark } from '../../components/PostageElements';

const PERF_CORNERS = [
  { left: -5, top: -5 },
  { right: -5, top: -5 },
  { left: -5, bottom: -5 },
  { right: -5, bottom: -5 },
];

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email';
    if (!password) return 'Password is required';
    return null;
  };

  const handleLogin = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e) {
      setError(
        e.response?.data?.message
        ?? (e.message?.includes('Network') ? 'Cannot reach server. Is the backend running?' : null)
        ?? 'Login failed. Check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Postmark — top right */}
          <View style={styles.postmarkWrap} pointerEvents="none">
            <Postmark city="ENTRY" date="MAR 2026" size={64} color={C.stamp} tilt={10} />
          </View>

          {/* Wordmark */}
          <View style={styles.wordmark}>
            <Text style={styles.welcomeMono}>WELCOME BACK · TRAVELLER</Text>
            <Text style={styles.voyageTitle}>Voyage</Text>
            <View style={styles.redLine} />
            <Text style={styles.taglineMono}>TRAVEL · EXPENSES · SHARED</Text>
          </View>

          {/* Stamp card */}
          <View style={styles.stampCard}>
            {PERF_CORNERS.map((pos, i) => (
              <View key={i} style={[styles.perfDot, pos]} />
            ))}

            <Text style={styles.cardHeading}>Sign in</Text>
            <Text style={styles.receiptNo}>RECEIPT NO. 0001</Text>

            <Text style={[styles.label, { marginTop: 14 }]}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={C.border}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={t => { setEmail(t); setError(''); }}
            />

            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.pwRow}>
              <TextInput
                style={[styles.input, styles.pwInput]}
                placeholder="••••••••"
                placeholderTextColor={C.border}
                secureTextEntry={!showPw}
                value={password}
                onChangeText={t => { setPassword(t); setError(''); }}
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.showLabel}>{showPw ? 'HIDE' : 'SHOW'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.optionsRow}>
              <TouchableOpacity onPress={() => setRememberMe(v => !v)} style={styles.checkRow} activeOpacity={0.7}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
                  {rememberMe && <Text style={styles.checkMark}>✓</Text>}
                </View>
                <Text style={styles.checkLabel}>REMEMBER ME</Text>
              </TouchableOpacity>
              <Text style={styles.forgotLink}>FORGOT? →</Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.perf} />

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={C.bg} />
              ) : (
                <>
                  <Text style={styles.primaryBtnLabel}>Sign in</Text>
                  <Text style={styles.primaryBtnMono}>STAMP →</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* OR divider */}
          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orLabel}>OR ENTER VIA</Text>
            <View style={styles.orLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            {[
              { label: 'GOOGLE',       glyph: 'G' },
              { label: 'APPLE',        glyph: '' },
              { label: 'EMAIL · CODE', glyph: '✉' },
            ].map(o => (
              <View key={o.label} style={styles.socialBtn}>
                <Text style={styles.socialGlyph}>{o.glyph}</Text>
                <Text style={styles.socialLabel}>{o.label}</Text>
              </View>
            ))}
          </View>

          {/* Register link */}
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.footerRow}>
            <Text style={styles.footerText}>No account?{'  '}</Text>
            <Text style={styles.footerLink}>Register a new traveller →</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 32 },

  postmarkWrap: { position: 'absolute', top: 36, right: 22, zIndex: 1 },

  wordmark: { paddingTop: 34, marginBottom: 24 },
  welcomeMono: {
    fontFamily: F.mono, fontSize: 9, letterSpacing: 2.2,
    color: C.inkLight, textTransform: 'uppercase',
  },
  voyageTitle: {
    fontFamily: F.serif, fontSize: 56, fontStyle: 'italic', fontWeight: '500',
    letterSpacing: -1.4, lineHeight: 60, color: C.ink, marginTop: 4,
  },
  redLine: { width: 48, height: 1.4, backgroundColor: C.stamp, marginTop: 6 },
  taglineMono: {
    fontFamily: F.mono, fontSize: 9, letterSpacing: 2.2,
    color: C.inkLight, marginTop: 8, textTransform: 'uppercase',
  },

  stampCard: {
    backgroundColor: C.ticketStub,
    borderWidth: 1.5, borderColor: `${C.ink}55`,
    padding: 18,
  },
  perfDot: {
    position: 'absolute', width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.bg, borderWidth: 1, borderColor: `${C.ink}55`,
  },
  cardHeading: {
    fontFamily: F.serif, fontSize: 22, fontStyle: 'italic', fontWeight: '500', color: C.ink,
  },
  receiptNo: {
    fontFamily: F.mono, fontSize: 8, letterSpacing: 1.5, color: C.inkLight, marginTop: 2,
  },

  label: {
    fontFamily: F.mono, fontSize: 8, letterSpacing: 1.5,
    color: C.inkLight, marginBottom: 4, textTransform: 'uppercase',
  },
  input: {
    fontFamily: F.serif, fontSize: 17, color: C.ink,
    borderBottomWidth: 1, borderBottomColor: `${C.ink}55`,
    paddingVertical: 4, paddingBottom: 6, marginBottom: 12,
    backgroundColor: 'transparent',
  },

  pwRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: `${C.ink}55`, marginBottom: 12,
  },
  pwInput: { flex: 1, borderBottomWidth: 0, marginBottom: 0, fontFamily: F.mono, letterSpacing: 3 },
  showLabel: { fontFamily: F.mono, fontSize: 8, letterSpacing: 1.5, color: C.stamp },

  optionsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 4,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: {
    width: 12, height: 12, borderWidth: 1.2, borderColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: C.ink },
  checkMark: { color: C.bg, fontSize: 9, lineHeight: 12 },
  checkLabel: { fontFamily: F.mono, fontSize: 8.5, letterSpacing: 1.3, color: C.inkLight },
  forgotLink: { fontFamily: F.mono, fontSize: 8.5, letterSpacing: 1.3, color: C.stamp },

  errorText: {
    fontFamily: F.mono, fontSize: 11, color: C.negative,
    marginTop: 8, paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: C.negativeBg,
  },

  perf: {
    borderTopWidth: 1, borderTopColor: `${C.ink}55`,
    borderStyle: 'dashed', marginTop: 14, marginBottom: 14,
  },

  primaryBtn: {
    backgroundColor: C.ink, paddingVertical: 13, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnLabel: { fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.bg },
  primaryBtnMono: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.8, color: C.bg },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  orLine: { flex: 1, height: 1, borderTopWidth: 1, borderTopColor: `${C.ink}55`, borderStyle: 'dashed' },
  orLabel: { fontFamily: F.mono, fontSize: 8, letterSpacing: 1.8, color: C.inkLight },

  socialRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  socialBtn: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 6,
    borderWidth: 1, borderColor: `${C.ink}55`,
    alignItems: 'center', gap: 4,
  },
  socialGlyph: { fontFamily: F.serif, fontSize: 18, color: C.ink },
  socialLabel: { fontFamily: F.mono, fontSize: 7.5, letterSpacing: 1.2, color: C.inkLight },

  footerRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 },
  footerText: { fontFamily: F.serif, fontSize: 14, color: C.inkMid },
  footerLink: { fontFamily: F.serif, fontSize: 14, fontStyle: 'italic', fontWeight: '600', color: C.stamp },
});
