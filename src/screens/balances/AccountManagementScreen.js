/**
 * A10 · Account management — Voyage · Postage.
 * Passport-style header card, four settings sections, danger zone.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { tripService } from '../../services/tripService';
import { formatCurrency } from '../../utils/currency';
import Toast from 'react-native-toast-message';
import { C, F } from '../../theme/postage';
import { MonoLabel, SerifHead, Postmark, MemberAvatar } from '../../components/PostageElements';

// ─── Helper rows ─────────────────────────────────────────────────────────────

function SectionHead({ title }) {
  return (
    <View style={styles.sectionHead}>
      <MonoLabel size={9} tracking={2}>{title}</MonoLabel>
      <View style={styles.sectionDash} />
    </View>
  );
}

function SettingsRow({ label, value, onEdit, swatch }) {
  return (
    <View style={styles.row}>
      {swatch ? <View style={[styles.swatch, { backgroundColor: swatch }]} /> : null}
      <View style={styles.rowInfo}>
        <SerifHead size={15} weight="500">{label}</SerifHead>
        <MonoLabel size={8} tracking={1.1} style={{ marginTop: 2 }}>{value}</MonoLabel>
      </View>
      {onEdit ? (
        <Pressable onPress={onEdit} hitSlop={10}>
          <MonoLabel size={8.5} tracking={1.5} color={C.stamp}>EDIT →</MonoLabel>
        </Pressable>
      ) : null}
    </View>
  );
}

function ToggleRow({ label, value, on, onToggle }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <SerifHead size={15} weight="500">{label}</SerifHead>
        <MonoLabel size={8} tracking={1.1} style={{ marginTop: 2 }}>{value}</MonoLabel>
      </View>
      <Pressable onPress={onToggle} style={[styles.toggle, on && styles.toggleOn]}>
        <View style={[styles.toggleThumb, on ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </Pressable>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AccountScreen() {
  const { user, logout, updateUser } = useAuth();

  // Passport stats
  const [tripCount, setTripCount]     = useState(0);
  const [entryCount, setEntryCount]   = useState(0);
  const [lifetimeCents, setLifetime]  = useState(0);
  const [mateCount, setMateCount]     = useState(0);

  // Display-name edit
  const [editingName, setEditingName]   = useState(false);
  const [displayName, setDisplayName]   = useState(user?.displayName ?? '');
  const [savingName, setSavingName]     = useState(false);

  // Password change (email accounts only)
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPw, setCurrentPw]             = useState('');
  const [newPw, setNewPw]                     = useState('');
  const [confirmPw, setConfirmPw]             = useState('');
  const [savingPassword, setSavingPassword]   = useState(false);

  // Notification toggles (local state — no backend)
  const [pushNotifs, setPushNotifs]           = useState(true);
  const [weeklyDigest, setWeeklyDigest]       = useState(true);
  const [settleReminders, setSettleReminders] = useState(false);

  const isGoogleUser = !!user?.googleId || user?.provider === 'google';
  const passportId   = user?.id ? `V-${String(user.id).padStart(4, '0')}` : 'V-0001';
  const initials     = (user?.displayName ?? '??').slice(0, 2).toUpperCase();

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const trips = await tripService.getAll();
        setTripCount(trips.length);
        setEntryCount(trips.reduce((s, t) => s + (t.expenseCount ?? 0), 0));
        setLifetime(trips.reduce((s, t) => s + (t.totalAmountCents ?? 0), 0));
        const ids = new Set(trips.flatMap((t) => (t.members ?? []).map((m) => m.id)));
        setMateCount(Math.max(0, ids.size - 1));
      } catch { /* offline — leave zeros */ }
    })();
  }, []));

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveName = async () => {
    if (!displayName.trim() || displayName.trim() === user?.displayName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const updated = await authService.updateProfile(displayName.trim());
      await updateUser(updated);
      setEditingName(false);
      Toast.show({ type: 'success', text1: 'Name updated', position: 'bottom' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update name', position: 'bottom' });
    } finally {
      setSavingName(false);
    }
  };

  const cancelEditName = () => {
    setEditingName(false);
    setDisplayName(user?.displayName ?? '');
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Toast.show({ type: 'error', text1: 'Fill in all password fields', position: 'bottom' });
      return;
    }
    if (newPw !== confirmPw) {
      Toast.show({ type: 'error', text1: 'Passwords do not match', position: 'bottom' });
      return;
    }
    if (newPw.length < 8) {
      Toast.show({ type: 'error', text1: 'Password must be at least 8 characters', position: 'bottom' });
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword(currentPw, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setEditingPassword(false);
      Toast.show({ type: 'success', text1: 'Password updated', position: 'bottom' });
    } catch {
      Toast.show({ type: 'error', text1: 'Incorrect current password', position: 'bottom' });
    } finally {
      setSavingPassword(false);
    }
  };

  const cancelEditPassword = () => {
    setEditingPassword(false);
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  };

  const handleLogout = () =>
    Alert.alert('Sign out', 'Sign out from all devices?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', onPress: logout },
    ]);

  const handleDeleteAccount = () =>
    Alert.alert(
      'Close account',
      'This permanently deletes your account and all trip data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close account',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteAccount();
              await logout();
            } catch {
              Toast.show({ type: 'error', text1: 'Failed to close account', position: 'bottom' });
            }
          },
        },
      ]
    );

  // ── Render ────────────────────────────────────────────────────────────────

  const lifetimeLabel = lifetimeCents > 0
    ? formatCurrency(lifetimeCents, 'USD')
    : '—';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Passport header card ── */}
      <View style={styles.passportCard}>
        <View style={styles.passportTop}>
          <MemberAvatar initials={initials} hue={200} size={64} />
          <View style={styles.passportInfo}>
            <MonoLabel size={8} tracking={1.5}>PASSPORT · {passportId}</MonoLabel>
            <SerifHead size={22} italic weight="500" style={{ marginTop: 3 }}>
              {user?.displayName ?? 'Traveller'}
            </SerifHead>
            <MonoLabel size={8.5} tracking={1.2} style={{ marginTop: 3 }}>
              {user?.email ?? ''}
            </MonoLabel>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <MonoLabel size={8} tracking={1.5} color={C.surface}>
                  {isGoogleUser ? 'GOOGLE · LINKED' : 'EMAIL · PASSWORD'}
                </MonoLabel>
              </View>
            </View>
          </View>
          <Postmark city="MEMBER" date="2026" size={54} color={C.stamp} tilt={-10} />
        </View>

        {/* Stat bar */}
        <View style={styles.statBar}>
          {[
            [String(tripCount), 'TRIPS'],
            [String(entryCount), 'ENTRIES'],
            [lifetimeLabel, 'LIFETIME'],
            [String(mateCount), 'MATES'],
          ].map(([n, l]) => (
            <View key={l} style={styles.statItem}>
              <SerifHead size={16} weight="600">{n}</SerifHead>
              <MonoLabel size={7.5} tracking={1.2} style={{ marginTop: 3 }}>{l}</MonoLabel>
            </View>
          ))}
        </View>
      </View>

      {/* ── PROFILE ── */}
      <View style={styles.section}>
        <SectionHead title="PROFILE" />

        {editingName ? (
          <View style={styles.editBlock}>
            <MonoLabel size={8} tracking={1.5} style={{ marginBottom: 6 }}>DISPLAY NAME</MonoLabel>
            <TextInput
              style={styles.editInput}
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
              autoCapitalize="words"
              placeholderTextColor={C.inkLight}
            />
            <View style={styles.editActions}>
              {savingName ? (
                <ActivityIndicator size="small" color={C.stamp} />
              ) : (
                <>
                  <Pressable onPress={handleSaveName} hitSlop={10}>
                    <MonoLabel size={8.5} tracking={1.5} color={C.stamp}>SAVE →</MonoLabel>
                  </Pressable>
                  <Pressable onPress={cancelEditName} hitSlop={10}>
                    <MonoLabel size={8.5} tracking={1.5} color={C.inkLight}>CANCEL</MonoLabel>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        ) : (
          <SettingsRow
            label="Display name"
            value={user?.displayName ?? ''}
            onEdit={() => setEditingName(true)}
          />
        )}

        <SettingsRow label="Email" value={user?.email ?? ''} />
        <SettingsRow label="Passport ID" value={passportId} />
        <SettingsRow
          label="Auth method"
          value={isGoogleUser ? 'Google OAuth' : 'Email & password'}
          swatch={isGoogleUser ? C.blue : C.stamp}
        />
      </View>

      {/* ── PREFERENCES ── */}
      <View style={styles.section}>
        <SectionHead title="PREFERENCES" />
        <SettingsRow label="Base currency" value="USD · United States Dollar" onEdit={() => {}} />
        <SettingsRow label="Date format" value="MMM DD · short month" onEdit={() => {}} />
        <SettingsRow label="Settlement algo" value="Greedy · min. transfers" onEdit={() => {}} />
      </View>

      {/* ── DISPATCHES ── */}
      <View style={styles.section}>
        <SectionHead title="DISPATCHES" />
        <ToggleRow
          label="Push notifications"
          value={pushNotifs ? 'On · new entries only' : 'Off'}
          on={pushNotifs}
          onToggle={() => setPushNotifs((v) => !v)}
        />
        <ToggleRow
          label="Weekly digest"
          value={weeklyDigest ? 'Sundays · 9:00 local' : 'Off'}
          on={weeklyDigest}
          onToggle={() => setWeeklyDigest((v) => !v)}
        />
        <ToggleRow
          label="Settle reminders"
          value={settleReminders ? 'On' : 'Off'}
          on={settleReminders}
          onToggle={() => setSettleReminders((v) => !v)}
        />
      </View>

      {/* ── DATA & SECURITY ── */}
      <View style={styles.section}>
        <SectionHead title="DATA · SECURITY" />
        <SettingsRow
          label="Two-factor auth"
          value={isGoogleUser ? 'Google · enabled' : 'Email code · available'}
          onEdit={() => {}}
        />

        {!isGoogleUser && (
          editingPassword ? (
            <View style={styles.editBlock}>
              <MonoLabel size={8} tracking={1.5} style={{ marginBottom: 6 }}>CHANGE PASSWORD</MonoLabel>
              <TextInput
                style={styles.editInput}
                value={currentPw}
                onChangeText={setCurrentPw}
                placeholder="Current password"
                placeholderTextColor={C.inkLight}
                secureTextEntry
              />
              <TextInput
                style={[styles.editInput, { marginTop: 8 }]}
                value={newPw}
                onChangeText={setNewPw}
                placeholder="New password (min. 8)"
                placeholderTextColor={C.inkLight}
                secureTextEntry
              />
              <TextInput
                style={[styles.editInput, { marginTop: 8 }]}
                value={confirmPw}
                onChangeText={setConfirmPw}
                placeholder="Confirm new password"
                placeholderTextColor={C.inkLight}
                secureTextEntry
              />
              <View style={[styles.editActions, { marginTop: 10 }]}>
                {savingPassword ? (
                  <ActivityIndicator size="small" color={C.stamp} />
                ) : (
                  <>
                    <Pressable onPress={handleChangePassword} style={styles.pwSaveBtn} hitSlop={8}>
                      <MonoLabel size={9} tracking={1.5} color={C.surface}>UPDATE PASSWORD →</MonoLabel>
                    </Pressable>
                    <Pressable onPress={cancelEditPassword} hitSlop={10} style={{ marginTop: 10 }}>
                      <MonoLabel size={8.5} tracking={1.5} color={C.inkLight}>CANCEL</MonoLabel>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          ) : (
            <SettingsRow
              label="Password"
              value="••••••••"
              onEdit={() => setEditingPassword(true)}
            />
          )
        )}

        <SettingsRow label="Offline cache" value="Synced locally" />
        <SettingsRow label="Export ledger" value="CSV · PDF · JSON" onEdit={() => {}} />
      </View>

      {/* ── RETURN POST (danger zone) ── */}
      <View style={styles.dangerZone}>
        <MonoLabel size={9} tracking={2} color={C.stamp} style={{ marginBottom: 10 }}>
          RETURN POST
        </MonoLabel>

        <Pressable style={styles.outlineBtn} onPress={handleLogout}>
          <SerifHead size={14} italic style={{ fontStyle: 'italic' }}>Sign out everywhere</SerifHead>
          <MonoLabel size={9} tracking={1.5}>→</MonoLabel>
        </Pressable>

        <Pressable style={[styles.dangerBtn, { marginTop: 8 }]} onPress={handleDeleteAccount}>
          <SerifHead size={14} italic color={C.surface}>Close account</SerifHead>
          <MonoLabel size={9} tracking={1.5} color={C.surface}>RETURN TO SENDER →</MonoLabel>
        </Pressable>
      </View>

      {/* ── Version footer ── */}
      <View style={styles.footer}>
        <MonoLabel size={7.5} tracking={1.8}>VOYAGE · ED. III · SPLIT &amp; SHARE</MonoLabel>
      </View>

    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content:   { paddingBottom: 48 },

  // Passport card
  passportCard: {
    margin: 16,
    marginTop: 14,
    backgroundColor: C.ticketStub,
    borderWidth: 1.5,
    borderColor: `${C.ink}55`,
    padding: 14,
  },
  passportTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  passportInfo: {
    flex: 1,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  badge: {
    backgroundColor: C.stamp,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // Stat bar
  statBar: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: `${C.ink}40`,
    borderStyle: 'dashed',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: { alignItems: 'center' },

  // Sections
  section: {
    marginHorizontal: 16,
    marginTop: 14,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionDash: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: `${C.ink}40`,
    borderStyle: 'dashed',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: `${C.ink}20`,
    borderStyle: 'dotted',
  },
  rowInfo: { flex: 1, minWidth: 0 },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: `${C.ink}30`,
    flexShrink: 0,
  },

  // Toggle switch (square, per design)
  toggle: {
    width: 28,
    height: 16,
    backgroundColor: `${C.ink}20`,
    borderWidth: 1,
    borderColor: `${C.ink}55`,
    position: 'relative',
    flexShrink: 0,
  },
  toggleOn: {
    backgroundColor: C.ink,
  },
  toggleThumb: {
    position: 'absolute',
    top: 1,
    width: 12,
    height: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: `${C.ink}55`,
  },
  toggleThumbOff: { left: 1 },
  toggleThumbOn:  { right: 1 },

  // Edit block
  editBlock: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: `${C.ink}20`,
    borderStyle: 'dotted',
  },
  editInput: {
    borderBottomWidth: 1,
    borderBottomColor: `${C.ink}55`,
    fontFamily: F.serif,
    fontSize: 17,
    fontStyle: 'italic',
    color: C.ink,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  editActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },

  // Password save button
  pwSaveBtn: {
    backgroundColor: C.ink,
    paddingHorizontal: 12,
    paddingVertical: 9,
    alignSelf: 'flex-start',
  },

  // Danger zone
  dangerZone: {
    margin: 16,
    marginTop: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: `${C.stamp}55`,
    backgroundColor: '#fbeee9',
  },
  outlineBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: `${C.ink}55`,
    backgroundColor: 'transparent',
  },
  dangerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: C.stamp,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
});
