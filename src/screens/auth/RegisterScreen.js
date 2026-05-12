import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { C, F } from '../../theme/postage';
import { StampBorder, Postmark } from '../../components/PostageElements';

function getStrength(pw) {
  if (!pw) return { ratio: 0, label: '' };
  let score = 0;
  if (pw.length >= 8)  score += 0.3;
  if (pw.length >= 12) score += 0.2;
  if (/[A-Z]/.test(pw)) score += 0.2;
  if (/[0-9]/.test(pw)) score += 0.15;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 0.15;
  const ratio = Math.min(score, 1);
  const label = ratio < 0.4 ? 'WEAK' : ratio < 0.65 ? 'FAIR' : ratio < 0.85 ? 'GOOD' : 'STRONG';
  return { ratio, label };
}

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const strength = getStrength(password);

  useEffect(() => {
    if (!success) return;
    if (countdown === 0) { navigation.replace('Login'); return; }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [success, countdown, navigation]);

  const validate = () => {
    if (!displayName.trim()) return 'Full name is required';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return 'Enter a valid email';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirm) return 'Passwords do not match';
    if (!agreedToTerms) return 'Please agree to the terms to continue';
    return null;
  };

  const handleRegister = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, displayName.trim());
      setSuccess(true);
    } catch (e) {
      setError(
        e.response?.data?.message
        ?? (!e.response && e.message ? 'Cannot reach server. Make sure the backend is running.' : null)
        ?? 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.flex}>
        <View style={styles.successContainer}>
          <StampBorder width={90} height={110} color={C.stamp} label="ISSUED">
            <Text style={styles.successV}>V</Text>
          </StampBorder>
          <Postmark city="MEMBER" date="2026" size={56} color={C.stamp} tilt={-10} />
          <Text style={styles.successTitle}>Bon voyage</Text>
          <Text style={styles.successBody}>Welcome aboard, {displayName.trim()}.</Text>
          <Text style={styles.successMono}>REDIRECTING IN {countdown}s</Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => navigation.replace('Login')} activeOpacity={0.85}>
            <Text style={styles.signInBtnLabel}>Sign in now</Text>
            <Text style={styles.signInBtnMono}>DEPART →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const fields = [
    { label: 'FULL NAME',        placeholder: 'Jane Doe',          value: displayName, set: setDisplayName, opts: {} },
    { label: 'EMAIL',            placeholder: 'you@example.com',   value: email,       set: setEmail,       opts: { keyboardType: 'email-address', autoCapitalize: 'none' } },
    { label: 'PASSWORD',         placeholder: 'Min. 8 characters', value: password,    set: setPassword,    opts: { secureTextEntry: true }, meter: true },
    { label: 'CONFIRM PASSWORD', placeholder: 'Repeat password',   value: confirm,     set: setConfirm,     opts: { secureTextEntry: true } },
  ];

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          {/* Top nav */}
          <View style={styles.topNav}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.topNavBack}>← SIGN IN</Text>
            </TouchableOpacity>
            <Text style={styles.topNavRight}>VOYAGE · ED.III</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerMono}>NEW TRAVELLER · ISSUE PASSPORT</Text>
            <Text style={styles.headerTitle}>Open an account</Text>
          </View>

          {/* V stamp — top right */}
          <View style={styles.vStampPos}>
            <StampBorder width={56} height={70} color={C.stamp} label="NEW" tilt={6}>
              <Text style={styles.vGlyph}>V</Text>
            </StampBorder>
          </View>

          {/* Form card */}
          <View style={styles.stampCard}>
            <Text style={styles.cardHeading}>Passport details</Text>
            <Text style={styles.cardSubMono}>FILL OUT BELOW · ALL FIELDS REQUIRED</Text>

            {fields.map((f, i) => (
              <View key={f.label}>
                <Text style={[styles.label, { marginTop: i === 0 ? 12 : 10 }]}>{f.label}</Text>
                <TextInput
                  style={[styles.input, f.meter && styles.inputMono]}
                  placeholder={f.placeholder}
                  placeholderTextColor={C.border}
                  value={f.value}
                  onChangeText={t => { f.set(t); setError(''); }}
                  autoCorrect={false}
                  {...f.opts}
                />
                {f.meter && password.length > 0 && (
                  <View style={styles.meterRow}>
                    <View style={styles.meterTrack}>
                      <View style={[styles.meterBar, { width: `${Math.round(strength.ratio * 100)}%` }]} />
                    </View>
                    <Text style={styles.meterLabel}>{strength.label}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Terms */}
            <TouchableOpacity onPress={() => setAgreedToTerms(v => !v)} style={styles.termsRow} activeOpacity={0.7}>
              <View style={[styles.checkbox, agreedToTerms && styles.checkboxOn]}>
                {agreedToTerms && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>terms</Text> and{' '}
                <Text style={styles.termsLink}>privacy policy</Text>. My ledger is mine alone.
              </Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.perf} />

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={C.bg} />
              ) : (
                <>
                  <Text style={styles.primaryBtnLabel}>Bon voyage</Text>
                  <Text style={styles.primaryBtnMono}>ISSUE →</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Sign in link */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footerRow}>
            <Text style={styles.footerText}>Already travelling?{'  '}</Text>
            <Text style={styles.footerLink}>Sign in →</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 32 },

  topNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 10,
  },
  topNavBack: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1, color: C.inkLight },
  topNavRight: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1, color: C.inkLight },

  header: { paddingTop: 24 },
  headerMono: { fontFamily: F.mono, fontSize: 9, letterSpacing: 2.2, color: C.inkLight, textTransform: 'uppercase' },
  headerTitle: {
    fontFamily: F.serif, fontSize: 40, fontStyle: 'italic', fontWeight: '500',
    letterSpacing: -0.8, lineHeight: 44, color: C.ink, marginTop: 6,
  },

  vStampPos: { position: 'absolute', top: 60, right: 22 },
  vGlyph: {
    fontFamily: F.serif, fontSize: 20, fontStyle: 'italic', fontWeight: '600', color: C.stamp,
  },

  stampCard: {
    backgroundColor: C.ticketStub,
    borderWidth: 1.5, borderColor: `${C.ink}55`,
    padding: 18, marginTop: 18,
  },
  cardHeading: { fontFamily: F.serif, fontSize: 20, fontStyle: 'italic', fontWeight: '500', color: C.ink },
  cardSubMono: { fontFamily: F.mono, fontSize: 8, letterSpacing: 1.5, color: C.inkLight, marginTop: 2 },

  label: { fontFamily: F.mono, fontSize: 8, letterSpacing: 1.5, color: C.inkLight, marginBottom: 2 },
  input: {
    fontFamily: F.serif, fontSize: 16, color: C.ink,
    borderBottomWidth: 1, borderBottomColor: `${C.ink}55`,
    paddingVertical: 4, paddingBottom: 6,
    backgroundColor: 'transparent',
  },
  inputMono: { fontFamily: F.mono, letterSpacing: 2 },

  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 2 },
  meterTrack: { flex: 1, height: 2, backgroundColor: `${C.ink}20` },
  meterBar: { height: '100%', backgroundColor: C.ochre },
  meterLabel: { fontFamily: F.mono, fontSize: 7.5, letterSpacing: 1.2, color: C.inkLight },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 14 },
  checkbox: {
    width: 12, height: 12, marginTop: 2, borderWidth: 1.2, borderColor: C.ink,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxOn: { backgroundColor: C.ink },
  checkMark: { color: C.bg, fontSize: 9, lineHeight: 12 },
  termsText: { flex: 1, fontFamily: F.serif, fontSize: 12, lineHeight: 17, color: C.ink, opacity: 0.8 },
  termsLink: { color: C.stamp, fontWeight: '600' },

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
    backgroundColor: C.stamp, paddingVertical: 13, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnLabel: { fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.bg },
  primaryBtnMono: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.8, color: C.bg },

  footerRow: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 20 },
  footerText: { fontFamily: F.serif, fontSize: 14, color: C.inkMid },
  footerLink: { fontFamily: F.serif, fontSize: 14, fontStyle: 'italic', fontWeight: '600', color: C.stamp },

  successContainer: {
    flex: 1, backgroundColor: C.bg,
    justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12,
  },
  successV: { fontFamily: F.serif, fontSize: 36, fontStyle: 'italic', fontWeight: '600', color: C.stamp },
  successTitle: { fontFamily: F.serif, fontSize: 32, fontStyle: 'italic', color: C.ink },
  successBody: { fontFamily: F.serif, fontSize: 16, color: C.inkMid, textAlign: 'center' },
  successMono: { fontFamily: F.mono, fontSize: 11, color: C.inkLight, letterSpacing: 1.5 },
  signInBtn: {
    backgroundColor: C.stamp, paddingVertical: 13, paddingHorizontal: 32, marginTop: 12,
    flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  signInBtnLabel: { fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.bg },
  signInBtnMono: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.8, color: C.bg },
});
