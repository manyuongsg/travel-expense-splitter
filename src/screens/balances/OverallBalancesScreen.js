import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import Toast from 'react-native-toast-message';
import { C, F } from '../../theme/postage';

export default function AccountScreen() {
  const { user, logout, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const isGoogleUser = !!user?.googleId || user?.provider === 'google';
  const initial = (user?.displayName ?? '?').charAt(0).toUpperCase();
  const nameChanged = displayName.trim() !== (user?.displayName ?? '');

  const handleSaveName = async () => {
    if (!displayName.trim() || !nameChanged) return;
    setSavingName(true);
    try {
      const updated = await authService.updateProfile(displayName.trim());
      await updateUser(updated);
      Toast.show({ type: 'success', text1: 'Name updated', position: 'bottom' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update name', position: 'bottom' });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Please fill in all fields', position: 'bottom' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'New passwords do not match', position: 'bottom' });
      return;
    }
    if (newPassword.length < 8) {
      Toast.show({ type: 'error', text1: 'Password must be at least 8 characters', position: 'bottom' });
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Toast.show({ type: 'success', text1: 'Password updated', position: 'bottom' });
    } catch {
      Toast.show({ type: 'error', text1: 'Incorrect current password', position: 'bottom' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and all associated data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteAccount();
              await logout();
            } catch {
              Toast.show({ type: 'error', text1: 'Failed to delete account', position: 'bottom' });
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Profile card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.profileName}>{user?.displayName}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
        {isGoogleUser && (
          <View style={styles.googleBadge}>
            <MaterialIcons name="link" size={12} color={C.inkLight} />
            <Text style={styles.googleBadgeText}>Signed in with Google</Text>
          </View>
        )}
      </View>

      {/* Display name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display Name</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={C.inkLight}
            autoCapitalize="words"
          />
          <Pressable
            style={[styles.saveBtn, (!nameChanged || savingName) && styles.saveBtnDisabled]}
            onPress={handleSaveName}
            disabled={!nameChanged || savingName}
          >
            {savingName
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>SAVE</Text>
            }
          </Pressable>
        </View>
      </View>

      {/* Change password — email accounts only */}
      {!isGoogleUser && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current password"
            placeholderTextColor={C.inkLight}
            secureTextEntry
          />
          <TextInput
            style={[styles.input, styles.inputSpaced]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            placeholderTextColor={C.inkLight}
            secureTextEntry
          />
          <TextInput
            style={[styles.input, styles.inputSpaced]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor={C.inkLight}
            secureTextEntry
          />
          <Pressable
            style={[styles.saveBtn, styles.saveBtnFull, savingPassword && styles.saveBtnDisabled]}
            onPress={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.saveBtnText}>UPDATE PASSWORD</Text>
            }
          </Pressable>
        </View>
      )}

      {/* Sign out */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session</Text>
        <Pressable style={styles.rowBtn} onPress={logout}>
          <MaterialIcons name="logout" size={18} color={C.stamp} />
          <Text style={styles.rowBtnText}>Sign Out</Text>
          <MaterialIcons name="chevron-right" size={18} color={C.border} style={{ marginLeft: 'auto' }} />
        </Pressable>
      </View>

      {/* Danger zone */}
      <View style={[styles.section, styles.dangerSection]}>
        <Text style={styles.dangerTitle}>DANGER ZONE</Text>
        <Pressable style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <MaterialIcons name="delete-forever" size={18} color={C.negative} />
          <Text style={styles.deleteBtnText}>Delete Account</Text>
        </Pressable>
        <Text style={styles.dangerSub}>
          Permanently deletes your account and all trip data. Cannot be undone.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 48 },

  profileCard: {
    alignItems: 'center',
    backgroundColor: C.ink, paddingVertical: 36, paddingHorizontal: 24,
    marginBottom: 8,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: C.stamp,
    backgroundColor: C.stampBg,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarText: { fontFamily: F.serif, fontSize: 32, fontStyle: 'italic', color: C.stamp },
  profileName: { fontFamily: F.serif, fontSize: 22, fontStyle: 'italic', color: '#fff', marginBottom: 4 },
  profileEmail: { fontFamily: F.mono, fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 },
  googleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    marginTop: 10, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3, paddingHorizontal: 10, paddingVertical: 4,
  },
  googleBadgeText: { fontFamily: F.mono, fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5 },

  section: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4,
    padding: 16,
  },
  sectionTitle: { fontFamily: F.mono, fontSize: 9, color: C.inkLight, letterSpacing: 2, marginBottom: 14 },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: {
    flex: 1, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 3,
    paddingHorizontal: 12, paddingVertical: 10,
    fontFamily: F.mono, fontSize: 13, color: C.ink,
  },
  inputSpaced: { marginTop: 10 },

  saveBtn: {
    backgroundColor: C.stamp, borderRadius: 3,
    paddingHorizontal: 14, paddingVertical: 10, minWidth: 64, alignItems: 'center',
  },
  saveBtnFull: { marginTop: 14, flex: undefined, width: '100%' },
  saveBtnDisabled: { backgroundColor: C.border },
  saveBtnText: { fontFamily: F.mono, fontSize: 10, color: '#fff', letterSpacing: 1.5, fontWeight: '700' },

  rowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 4,
  },
  rowBtnText: { fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.ink },

  dangerSection: { borderColor: C.negative, borderWidth: 1 },
  dangerTitle: { fontFamily: F.mono, fontSize: 9, color: C.negative, letterSpacing: 2, marginBottom: 14 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 4,
  },
  deleteBtnText: { fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.negative },
  dangerSub: {
    fontFamily: F.mono, fontSize: 10, color: C.inkLight,
    marginTop: 12, letterSpacing: 0.4, lineHeight: 16,
  },
});
