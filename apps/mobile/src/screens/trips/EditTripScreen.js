import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/tripService';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import Toast from 'react-native-toast-message';
import { C, F } from '../../theme/postage';

export default function EditTripScreen({ route, navigation }) {
  const {
    tripId,
    tripName: initialName,
    currency: initialCurrency,
    members: initialMembers = [],
  } = route.params;

  const [name, setName] = useState(initialName);
  const [currency, setCurrency] = useState(initialCurrency);
  const [existingMembers, setExistingMembers] = useState(initialMembers);
  const [removedIds, setRemovedIds] = useState(new Set());
  const [newMembers, setNewMembers] = useState([]);
  const [memberInput, setMemberInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const addMember = () => {
    const trimmed = memberInput.trim();
    if (!trimmed) {
      Toast.show({ type: 'error', text1: 'Enter a name', position: 'bottom' });
      return;
    }
    const allNames = [
      ...existingMembers.filter((m) => !removedIds.has(m.id)).map((m) => m.name.toLowerCase()),
      ...newMembers.map((n) => n.toLowerCase()),
    ];
    if (allNames.includes(trimmed.toLowerCase())) {
      Toast.show({ type: 'error', text1: 'Already added', position: 'bottom' });
      return;
    }
    setNewMembers((prev) => [...prev, trimmed]);
    setMemberInput('');
  };

  const toggleRemove = (id) => {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Trip',
      'This trip will be hidden from your active list. You can unarchive it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await tripService.archive(tripId);
              Toast.show({ type: 'success', text1: 'Trip archived', position: 'bottom' });
              navigation.popToTop();
            } catch {
              Toast.show({ type: 'error', text1: 'Could not archive trip', position: 'bottom' });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Trip',
      'This will permanently delete the trip and all its expenses. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await tripService.deleteTrip(tripId);
              Toast.show({ type: 'success', text1: 'Trip deleted', position: 'bottom' });
              navigation.popToTop();
            } catch {
              Toast.show({ type: 'error', text1: 'Could not delete trip', position: 'bottom' });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Trip name is required', position: 'bottom' });
      return;
    }
    setLoading(true);
    try {
      await tripService.update(tripId, name.trim(), currency);
      for (const id of removedIds) {
        await tripService.removeMember(tripId, id);
      }
      for (const memberName of newMembers) {
        await tripService.addMember(tripId, memberName);
      }
      Toast.show({ type: 'success', text1: 'Trip updated!', position: 'bottom' });
      navigation.goBack();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: e.response?.data?.message ?? 'Could not update trip',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>TRIP NAME</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Tokyo Trip 2025"
          placeholderTextColor={C.border}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={styles.label}>TRIP CURRENCY</Text>
        <Text style={styles.hint}>the currency used at the destination</Text>
        <Pressable
          style={styles.selector}
          onPress={() => setShowPicker((v) => !v)}
        >
          <Text style={styles.selectorText}>{currency}</Text>
          <MaterialIcons name={showPicker ? 'expand-less' : 'expand-more'} size={20} color={C.inkLight} />
        </Pressable>
        {showPicker && (
          <ScrollView
            style={styles.pickerList}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {SUPPORTED_CURRENCIES.map((c, index) => (
              <Pressable
                key={c}
                style={[styles.pickerItem, index > 0 && styles.pickerItemBorder, c === currency && styles.pickerItemActive]}
                onPress={() => { setCurrency(c); setShowPicker(false); }}
              >
                <Text style={[styles.pickerText, c === currency && styles.pickerTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>MEMBERS</Text>
        <View style={styles.memberList}>
          {existingMembers.map((m, i) => {
            const removed = removedIds.has(m.id);
            return (
              <View key={m.id} style={[styles.memberRow, i > 0 && styles.memberRowBorder, removed && styles.memberRowRemoved]}>
                <Text style={styles.memberInitial}>{removed ? '–' : m.name.charAt(0).toUpperCase()}</Text>
                <Text style={[styles.memberName, removed && styles.memberNameRemoved]}>{m.name}</Text>
                <Pressable hitSlop={10} onPress={() => toggleRemove(m.id)}>
                  <MaterialIcons
                    name={removed ? 'undo' : 'person-remove'}
                    size={16}
                    color={removed ? C.stamp : C.inkLight}
                  />
                </Pressable>
              </View>
            );
          })}
          {newMembers.map((n, i) => (
            <View
              key={n}
              style={[styles.memberRow, (existingMembers.length > 0 || i > 0) && styles.memberRowBorder, styles.memberRowNew]}
            >
              <Text style={styles.memberInitial}>{n.charAt(0).toUpperCase()}</Text>
              <Text style={styles.memberName}>{n}</Text>
              <Pressable hitSlop={10} onPress={() => setNewMembers((prev) => prev.filter((x) => x !== n))}>
                <MaterialIcons name="close" size={16} color={C.inkLight} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Add a member..."
            placeholderTextColor={C.border}
            autoCapitalize="words"
            value={memberInput}
            onChangeText={setMemberInput}
            onSubmitEditing={addMember}
            returnKeyType="done"
          />
          <Pressable style={styles.addBtn} onPress={addMember}>
            <MaterialIcons name="person-add" size={18} color="#fff" />
          </Pressable>
        </View>

        <Pressable
          style={[styles.primaryBtn, loading && styles.disabledBtn]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>SAVE CHANGES</Text>
          }
        </Pressable>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerLabel}>DANGER ZONE</Text>
          <Pressable
            style={[styles.dangerBtn, loading && styles.disabledBtn]}
            onPress={handleArchive}
            disabled={loading}
          >
            <MaterialIcons name="archive" size={15} color={C.inkMid} />
            <Text style={styles.dangerBtnText}>ARCHIVE TRIP</Text>
          </Pressable>
          <Pressable
            style={[styles.dangerBtn, styles.deleteBtn, loading && styles.disabledBtn]}
            onPress={handleDelete}
            disabled={loading}
          >
            <MaterialIcons name="delete-outline" size={15} color="#fff" />
            <Text style={[styles.dangerBtnText, styles.deleteBtnText]}>DELETE TRIP</Text>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },

  label: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4, marginTop: 22 },
  hint: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, marginBottom: 8, letterSpacing: 0.5 },
  input: {
    borderBottomWidth: 1.5, borderBottomColor: C.border,
    paddingVertical: 10, fontSize: 16, color: C.ink, backgroundColor: 'transparent', marginBottom: 2,
  },

  selector: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1.5, borderBottomColor: C.border, paddingVertical: 10,
  },
  selectorText: { fontFamily: F.mono, fontSize: 15, color: C.ink },

  pickerList: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 4, marginTop: 6, maxHeight: 200,
  },
  pickerItem: { paddingVertical: 10, paddingHorizontal: 16 },
  pickerItemBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  pickerItemActive: { backgroundColor: C.stampSoft },
  pickerText: { fontFamily: F.mono, fontSize: 13, color: C.inkMid },
  pickerTextActive: { color: C.stamp, fontWeight: '700' },

  memberList: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4, marginTop: 8,
  },
  memberRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 11,
  },
  memberRowBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  memberRowRemoved: { opacity: 0.4 },
  memberRowNew: { backgroundColor: C.stampSoft },
  memberInitial: {
    fontFamily: F.serif, fontSize: 14, fontStyle: 'italic', color: C.stamp,
    width: 26, textAlign: 'center',
  },
  memberName: { fontFamily: F.serif, fontSize: 14, fontStyle: 'italic', color: C.ink, flex: 1, marginLeft: 8 },
  memberNameRemoved: { textDecorationLine: 'line-through' },

  addRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', marginTop: 12 },
  addBtn: { backgroundColor: C.stamp, borderRadius: 3, padding: 11, justifyContent: 'center', alignItems: 'center' },

  primaryBtn: {
    backgroundColor: C.stamp, borderRadius: 3, paddingVertical: 16,
    alignItems: 'center', marginTop: 36,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { fontFamily: F.mono, color: '#fff', fontSize: 13, letterSpacing: 2, fontWeight: '700' },

  dangerZone: {
    marginTop: 40, borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 20, gap: 10,
  },
  dangerLabel: {
    fontFamily: F.mono, fontSize: 9, color: C.inkLight, letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 4,
  },
  dangerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingVertical: 13,
    backgroundColor: C.surface,
  },
  dangerBtnText: { fontFamily: F.mono, fontSize: 12, color: C.inkMid, letterSpacing: 1.5 },
  deleteBtn: { backgroundColor: '#c0392b', borderColor: '#c0392b' },
  deleteBtnText: { color: '#fff' },
});
