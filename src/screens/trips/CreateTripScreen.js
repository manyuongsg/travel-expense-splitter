import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/tripService';
import { SUPPORTED_CURRENCIES, HOME_CURRENCY } from '../../utils/currency';
import Toast from 'react-native-toast-message';
import { C, F } from '../../theme/postage';

export default function CreateTripScreen({ navigation }) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('SGD');
  const [homeCurrency, setHomeCurrency] = useState(HOME_CURRENCY);
  const [memberName, setMemberName] = useState('');
  const [pendingMembers, setPendingMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePicker, setActivePicker] = useState(null); // 'base' | 'home' | null

  const addMember = () => {
    const trimmed = memberName.trim();
    if (!trimmed) {
      Toast.show({ type: 'error', text1: 'Enter a name', position: 'bottom' });
      return;
    }
    if (pendingMembers.some((m) => m.toLowerCase() === trimmed.toLowerCase())) {
      Toast.show({ type: 'error', text1: 'Already added', position: 'bottom' });
      return;
    }
    setPendingMembers((prev) => [...prev, trimmed]);
    setMemberName('');
    Toast.show({ type: 'success', text1: `Added ${trimmed}`, position: 'bottom' });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Trip name is required', position: 'bottom' });
      return;
    }
    setLoading(true);
    try {
      const trip = await tripService.create(name.trim(), currency, homeCurrency);
      for (const mn of pendingMembers) {
        await tripService.addMember(trip.id, mn);
      }
      Toast.show({ type: 'success', text1: 'Trip created!', position: 'bottom' });
      navigation.replace('TripDetail', { tripId: trip.id, tripName: trip.name });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: e.response?.data?.message ?? 'Could not create trip',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (selectedValue, onSelect, key) => (
    <ScrollView
      style={styles.pickerList}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      {SUPPORTED_CURRENCIES.map((c, index) => (
        <Pressable
          key={c}
          style={[styles.pickerItem, index > 0 && styles.pickerItemBorder, c === selectedValue && styles.pickerItemActive]}
          onPress={() => { onSelect(c); setActivePicker(null); }}
        >
          <Text style={[styles.pickerText, c === selectedValue && styles.pickerTextActive]}>{c}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

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
        />

        <Text style={styles.label}>TRIP CURRENCY</Text>
        <Text style={styles.hint}>the currency used at the destination</Text>
        <Pressable
          style={styles.selector}
          onPress={() => setActivePicker(activePicker === 'base' ? null : 'base')}
        >
          <Text style={styles.selectorText}>{currency}</Text>
          <MaterialIcons name={activePicker === 'base' ? 'expand-less' : 'expand-more'} size={20} color={C.inkLight} />
        </Pressable>
        {activePicker === 'base' && renderPicker(currency, setCurrency, 'base')}

        <Text style={styles.label}>HOME CURRENCY</Text>
        <Text style={styles.hint}>your home currency for exchange rate reference</Text>
        <Pressable
          style={styles.selector}
          onPress={() => setActivePicker(activePicker === 'home' ? null : 'home')}
        >
          <Text style={styles.selectorText}>{homeCurrency}</Text>
          <MaterialIcons name={activePicker === 'home' ? 'expand-less' : 'expand-more'} size={20} color={C.inkLight} />
        </Pressable>
        {activePicker === 'home' && renderPicker(homeCurrency, setHomeCurrency, 'home')}

        <Text style={styles.label}>ADD MEMBERS</Text>
        <Text style={styles.hint}>just a name — no account needed</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="e.g. Alice"
            placeholderTextColor={C.border}
            autoCapitalize="words"
            value={memberName}
            onChangeText={setMemberName}
            onSubmitEditing={addMember}
            returnKeyType="done"
          />
          <Pressable style={styles.addBtn} onPress={addMember}>
            <MaterialIcons name="person-add" size={18} color="#fff" />
          </Pressable>
        </View>

        {pendingMembers.length > 0 && (
          <View style={styles.memberList}>
            {pendingMembers.map((m, i) => (
              <View key={m} style={[styles.memberChip, i > 0 && styles.memberChipBorder]}>
                <Text style={styles.memberInitial}>{m.charAt(0).toUpperCase()}</Text>
                <Text style={styles.memberName}>{m}</Text>
                <Pressable
                  hitSlop={10}
                  onPress={() => setPendingMembers((prev) => prev.filter((x) => x !== m))}
                >
                  <MaterialIcons name="close" size={14} color={C.inkLight} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Pressable
          style={[styles.primaryBtn, loading && styles.disabledBtn]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>CREATE TRIP</Text>
          }
        </Pressable>

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

  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  addBtn: { backgroundColor: C.stamp, borderRadius: 3, padding: 11, justifyContent: 'center', alignItems: 'center' },

  memberList: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4, marginTop: 12,
  },
  memberChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  memberChipBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  memberInitial: {
    fontFamily: F.serif, fontSize: 14, fontStyle: 'italic', color: C.stamp,
    width: 26, textAlign: 'center',
  },
  memberName: { fontFamily: F.serif, fontSize: 14, fontStyle: 'italic', color: C.ink, flex: 1, marginLeft: 8 },

  primaryBtn: {
    backgroundColor: C.stamp, borderRadius: 3, paddingVertical: 16,
    alignItems: 'center', marginTop: 36,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { fontFamily: F.mono, color: '#fff', fontSize: 13, letterSpacing: 2, fontWeight: '700' },
});
