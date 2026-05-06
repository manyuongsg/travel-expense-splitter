import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { expenseService } from '../../services/expenseService';
import { dbService } from '../../services/dbService';
import { dollarsToCents, formatCurrency, splitEqually, SUPPORTED_CURRENCIES } from '../../utils/currency';
import Toast from 'react-native-toast-message';
import { C, F } from '../../theme/postage';

export default function AddExpenseScreen({ route, navigation }) {
  const { tripId, members = [], currency: tripCurrency = 'USD' } = route.params;

  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState(tripCurrency);
  const [paidById, setPaidById] = useState(members[0]?.id ?? '');
  const [splitType, setSplitType] = useState('EQUAL');
  const [customAmounts, setCustomAmounts] = useState({});
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rateLoading, setRateLoading] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useEffect(() => {
    if (currency === tripCurrency) { setExchangeRate(1.0); return; }
    (async () => {
      setRateLoading(true);
      try {
        const rates = await expenseService.getExchangeRates(currency, [tripCurrency]);
        setExchangeRate(rates[tripCurrency] ?? 1.0);
      } catch {
        setExchangeRate(null);
        Toast.show({ type: 'error', text1: 'Could not fetch exchange rate', position: 'bottom' });
      } finally {
        setRateLoading(false);
      }
    })();
  }, [currency, tripCurrency]);

  const totalCents = dollarsToCents(amountStr);
  const getCustomTotal = () => Object.values(customAmounts).reduce((s, v) => s + dollarsToCents(v || '0'), 0);

  const buildSplits = () => {
    if (splitType === 'EQUAL') {
      const shares = splitEqually(totalCents, members.length);
      return members.map((m, i) => ({ memberId: m.id, amountCents: shares[i] }));
    }
    return members.map((m) => ({ memberId: m.id, amountCents: dollarsToCents(customAmounts[m.id] || '0') }));
  };

  const validate = () => {
    if (!description.trim()) return 'Description is required';
    if (totalCents <= 0) return 'Enter a valid amount';
    if (!paidById) return 'Select who paid';
    if (splitType === 'CUSTOM') {
      const customTotal = getCustomTotal();
      if (customTotal !== totalCents) {
        return `Splits must equal ${formatCurrency(totalCents, currency)} (currently ${formatCurrency(customTotal, currency)})`;
      }
    }
    return null;
  };

  const handleAdd = async () => {
    const error = validate();
    if (error) { Toast.show({ type: 'error', text1: error, position: 'bottom' }); return; }
    setLoading(true);
    const payload = {
      description: description.trim(),
      amountCents: totalCents,
      currency,
      paidByMemberId: paidById,
      splitType,
      customSplits: splitType === 'CUSTOM' ? buildSplits() : undefined,
      exchangeRate: exchangeRate ?? 1.0,
    };
    try {
      await expenseService.create(tripId, payload);
      Toast.show({ type: 'success', text1: 'Expense added!', position: 'bottom' });
      navigation.goBack();
    } catch {
      const localId = `local_${Date.now()}`;
      await dbService.saveExpense({
        id: localId, tripId, description: payload.description,
        amountCents: payload.amountCents, currency: payload.currency,
        exchangeRate: String(payload.exchangeRate),
        paidByMemberId: payload.paidByMemberId, createdAt: Date.now(),
        splits: buildSplits().map((s, i) => ({ id: `split_${localId}_${i}`, ...s, settled: false })),
      });
      await dbService.queueSync(tripId, localId, 'CREATE_EXPENSE', payload);
      Toast.show({ type: 'info', text1: 'Saved offline — will sync when connected', position: 'bottom' });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>DESCRIPTION</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dinner at La Maison"
          placeholderTextColor={C.border}
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>AMOUNT</Text>
        <View style={styles.amountRow}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="0.00"
            placeholderTextColor={C.border}
            keyboardType="decimal-pad"
            value={amountStr}
            onChangeText={setAmountStr}
          />
          <Pressable style={styles.currencyTag} onPress={() => setShowCurrencyPicker((v) => !v)}>
            <Text style={styles.currencyTagText}>{currency}</Text>
          </Pressable>
        </View>

        {showCurrencyPicker && (
          <View style={styles.currencyList}>
            {SUPPORTED_CURRENCIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.currencyItem, c === currency && styles.currencyItemActive]}
                onPress={() => { setCurrency(c); setShowCurrencyPicker(false); }}
              >
                <Text style={[styles.currencyItemText, c === currency && styles.currencyItemTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {currency !== tripCurrency && (
          <Text style={styles.rateHint}>
            {rateLoading
              ? 'fetching rate...'
              : exchangeRate
              ? `≈ ${formatCurrency(Math.round(totalCents * exchangeRate), tripCurrency)} in ${tripCurrency}`
              : 'exchange rate unavailable'}
          </Text>
        )}

        <Text style={styles.label}>PAID BY</Text>
        <View style={styles.chipRow}>
          {members.map((m) => (
            <Pressable
              key={m.id}
              style={[styles.chip, m.id === paidById && styles.chipActive]}
              onPress={() => setPaidById(m.id)}
            >
              <Text style={[styles.chipText, m.id === paidById && styles.chipTextActive]}>{m.name}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>SPLIT</Text>
        <View style={styles.splitToggle}>
          {['EQUAL', 'CUSTOM'].map((type) => (
            <Pressable
              key={type}
              style={[styles.splitBtn, splitType === type && styles.splitBtnActive]}
              onPress={() => setSplitType(type)}
            >
              <Text style={[styles.splitBtnText, splitType === type && styles.splitBtnTextActive]}>
                {type}
              </Text>
            </Pressable>
          ))}
        </View>

        {splitType === 'EQUAL' && totalCents > 0 && members.length > 0 && (
          <View style={styles.splitPreview}>
            {splitEqually(totalCents, members.length).map((cents, i) => (
              <View key={members[i]?.id ?? i} style={[styles.splitRow, i > 0 && styles.splitRowBorder]}>
                <Text style={styles.splitName}>{members[i]?.name}</Text>
                <Text style={styles.splitAmt}>{formatCurrency(cents, currency)}</Text>
              </View>
            ))}
          </View>
        )}

        {splitType === 'CUSTOM' && (
          <View style={styles.splitPreview}>
            {members.map((m, i) => (
              <View key={m.id} style={[styles.splitRow, i > 0 && styles.splitRowBorder]}>
                <Text style={styles.splitName}>{m.name}</Text>
                <TextInput
                  style={styles.customInput}
                  placeholder="0.00"
                  placeholderTextColor={C.border}
                  keyboardType="decimal-pad"
                  value={customAmounts[m.id] ?? ''}
                  onChangeText={(v) => setCustomAmounts((prev) => ({ ...prev, [m.id]: v }))}
                />
              </View>
            ))}
            {totalCents > 0 && (
              <Text style={[styles.rateHint, getCustomTotal() !== totalCents && { color: C.negative }]}>
                total: {formatCurrency(getCustomTotal(), currency)} / {formatCurrency(totalCents, currency)}
              </Text>
            )}
          </View>
        )}

        <Pressable
          style={[styles.primaryBtn, loading && styles.disabledBtn]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>ADD EXPENSE</Text>
          }
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: { padding: 20, paddingBottom: 40 },

  label: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 22 },
  input: {
    borderBottomWidth: 1.5, borderBottomColor: C.border,
    paddingVertical: 10, fontSize: 16, color: C.ink, backgroundColor: 'transparent', marginBottom: 2,
  },

  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  currencyTag: {
    paddingHorizontal: 14, paddingVertical: 10, backgroundColor: C.stamp, borderRadius: 3,
  },
  currencyTagText: { fontFamily: F.mono, color: '#fff', fontWeight: '700', fontSize: 13 },

  currencyList: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border,
    borderRadius: 4, marginTop: 6, maxHeight: 180, overflow: 'hidden',
  },
  currencyItem: { paddingVertical: 10, paddingHorizontal: 16 },
  currencyItemActive: { backgroundColor: C.stampSoft },
  currencyItemText: { fontFamily: F.mono, fontSize: 13, color: C.inkMid },
  currencyItemTextActive: { color: C.stamp, fontWeight: '700' },

  rateHint: { fontFamily: F.mono, fontSize: 11, color: C.inkLight, marginTop: 6, letterSpacing: 0.4 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: C.border, borderRadius: 2, backgroundColor: C.surface,
  },
  chipActive: { backgroundColor: C.stamp, borderColor: C.stamp },
  chipText: { fontFamily: F.mono, fontSize: 12, color: C.inkMid },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  splitToggle: { flexDirection: 'row', borderWidth: 1, borderColor: C.border, borderRadius: 3, overflow: 'hidden' },
  splitBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: C.surface },
  splitBtnActive: { backgroundColor: C.stamp },
  splitBtnText: { fontFamily: F.mono, fontSize: 11, color: C.inkMid, letterSpacing: 1 },
  splitBtnTextActive: { color: '#fff', fontWeight: '700' },

  splitPreview: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 12, marginTop: 10,
  },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  splitRowBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  splitName: { fontFamily: F.serif, fontSize: 14, fontStyle: 'italic', color: C.ink },
  splitAmt: { fontFamily: F.mono, fontSize: 13, color: C.stamp, fontWeight: '700' },
  customInput: {
    borderBottomWidth: 1, borderBottomColor: C.border,
    fontFamily: F.mono, fontSize: 14, color: C.ink,
    width: 90, textAlign: 'right', paddingVertical: 4,
  },

  primaryBtn: {
    backgroundColor: C.stamp, borderRadius: 3, paddingVertical: 16,
    alignItems: 'center', marginTop: 36,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { fontFamily: F.mono, color: '#fff', fontSize: 13, letterSpacing: 2, fontWeight: '700' },
});
