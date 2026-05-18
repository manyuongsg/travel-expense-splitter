/**
 * A3 · New entry — ticket-stub form.
 * Perforated container, serif amount, category glyphs, "Stamp & file" submit.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { expenseService } from '../../services/expenseService';
import { dbService } from '../../services/dbService';
import { useAuth } from '../../context/AuthContext';
import { dollarsToCents, formatCurrency, splitEqually, HOME_CURRENCY } from '../../utils/currency';
import Toast from 'react-native-toast-message';
import { C, F, CATS } from '../../theme/postage';
import { MonoLabel, SerifHead, MemberAvatar } from '../../components/PostageElements';

const CATEGORY_KEYS = ['FOOD', 'TRANSPORT', 'ACCOMMODATION', 'ACTIVITIES', 'SHOPPING', 'HEALTH', 'OTHER'];

export default function AddExpenseScreen({ route, navigation }) {
  const {
    tripId,
    members = [],
    currency: tripCurrency = 'SGD',
    homeCurrency = HOME_CURRENCY,
    prefill,
  } = route.params;
  const { user } = useAuth();

  const myMemberId = useMemo(() => {
    const linked = members.find((m) => m.linkedUserId === user?.id);
    return linked?.id ?? members[0]?.id ?? '';
  }, [members, user?.id]);

  const prefillAmountStr = prefill?.amountCents
    ? (prefill.amountCents / 100).toFixed(2)
    : '';

  const [description, setDescription] = useState(prefill?.description ?? '');
  const [amountStr, setAmountStr]     = useState(prefillAmountStr);
  const [currency, setCurrency]       = useState(
    prefill?.originalCurrency ?? tripCurrency
  );
  const [category, setCategory]       = useState(prefill?.category ?? 'FOOD');
  const [paidById, setPaidById]       = useState(myMemberId);
  const [splitType, setSplitType]     = useState('EQUAL');
  const [customAmounts, setCustomAmounts] = useState({});
  const [exchangeRate, setExchangeRate]   = useState(null);
  const [loading, setLoading]         = useState(false);
  const [rateLoading, setRateLoading] = useState(false);

  const showToggle   = tripCurrency !== homeCurrency;
  const otherCurrency = currency === tripCurrency ? homeCurrency : tripCurrency;

  useEffect(() => {
    if (!showToggle) { setExchangeRate(1.0); return; }
    (async () => {
      setRateLoading(true);
      try {
        const rates = await expenseService.getExchangeRates(currency, [otherCurrency]);
        setExchangeRate(rates[otherCurrency] ?? 1.0);
      } catch {
        setExchangeRate(null);
      } finally {
        setRateLoading(false);
      }
    })();
  }, [currency, tripCurrency, homeCurrency]);

  const totalCents = dollarsToCents(amountStr);
  const getCustomTotal = () =>
    Object.values(customAmounts).reduce((s, v) => s + dollarsToCents(v || '0'), 0);

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
      const ct = getCustomTotal();
      if (ct !== totalCents) return `Splits must equal ${formatCurrency(totalCents, currency)} (currently ${formatCurrency(ct, currency)})`;
    }
    return null;
  };

  const handleAdd = async () => {
    const error = validate();
    if (error) { Toast.show({ type: 'error', text1: error, position: 'bottom' }); return; }
    setLoading(true);
    const payloadRate = currency === tripCurrency ? 1.0 : (exchangeRate ?? 1.0);
    const payload = {
      description: description.trim(), amountCents: totalCents, currency,
      category, paidByMemberId: paidById, splitType,
      customSplits: splitType === 'CUSTOM' ? buildSplits() : undefined,
      exchangeRate: payloadRate,
    };
    try {
      await expenseService.create(tripId, payload);
      Toast.show({ type: 'success', text1: 'Expense filed!', position: 'bottom' });
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

  const catMeta = CATS[category] ?? CATS.OTHER;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.headerRow}>
          <MonoLabel size={9} tracking={2} color={C.inkLight}>← LEDGER</MonoLabel>
          <MonoLabel size={9} tracking={2} color={C.inkLight}>DRAFT</MonoLabel>
        </View>
        <SerifHead size={32} italic weight="500" style={styles.heading}>New entry</SerifHead>
        <MonoLabel size={9} style={styles.receiptNo}>
          RECEIPT NO. — DRAFT
        </MonoLabel>

        {/* ── Ticket-stub container ── */}
        <View style={styles.stub}>
          {/* Top half: description + amount */}
          <MonoLabel size={8} tracking={1.5}>DESCRIPTION</MonoLabel>
          <TextInput
            style={styles.descInput}
            placeholder="e.g. Dinner at La Maison"
            placeholderTextColor={C.border}
            value={description}
            onChangeText={setDescription}
          />

          <View style={styles.amountRow}>
            <View style={{ flex: 2 }}>
              <MonoLabel size={8} tracking={1.5}>AMOUNT · {currency}</MonoLabel>
              <SerifHead size={38} weight="600" style={styles.amountDisplay}>
                {amountStr ? parseFloat(amountStr).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </SerifHead>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={C.border}
                keyboardType="decimal-pad"
                value={amountStr}
                onChangeText={setAmountStr}
              />
              {showToggle && (
                <MonoLabel size={8.5} color={C.stamp} tracking={1.2} style={{ marginTop: 2 }}>
                  {rateLoading ? 'fetching rate...' : exchangeRate
                    ? `≈ ${formatCurrency(Math.round(totalCents * exchangeRate), otherCurrency)} ${otherCurrency} · FX ${exchangeRate?.toFixed(2)}`
                    : 'rate unavailable'}
                </MonoLabel>
              )}
            </View>
            {/* Currency pills */}
            <View style={styles.currencyPills}>
              {[...new Set([tripCurrency, ...(showToggle ? [homeCurrency] : [])])].map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCurrency(c)}
                  style={[styles.ccyPill, currency === c && styles.ccyPillActive]}
                >
                  <Text style={[styles.ccyPillText, currency === c && styles.ccyPillTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Perforation line */}
          <View style={styles.perfLine}>
            <View style={styles.perfCircleLeft} />
            <View style={styles.perfDash} />
            <View style={styles.perfCircleRight} />
          </View>

          {/* Bottom half: category, paid by, split */}
          <MonoLabel size={8} tracking={1.5} style={{ marginTop: 14 }}>CATEGORY</MonoLabel>
          <View style={styles.catGrid}>
            {CATEGORY_KEYS.map((k) => {
              const meta = CATS[k];
              const active = category === k;
              return (
                <Pressable
                  key={k}
                  onPress={() => setCategory(k)}
                  style={[styles.catChip, active && { backgroundColor: meta.tint, borderColor: meta.tint }]}
                >
                  <Text style={[styles.catGlyph, { color: active ? '#fff' : meta.tint }]}>{meta.glyph}</Text>
                  <Text style={[styles.catLabel, active && { color: '#fff' }]}>{meta.label.toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </View>

          <MonoLabel size={8} tracking={1.5} style={styles.fieldLabel}>PAID BY</MonoLabel>
          <View style={styles.memberRow}>
            {members.map((m, i) => {
              const active = m.id === paidById;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setPaidById(m.id)}
                  style={[styles.memberChip, active && styles.memberChipActive]}
                >
                  <MemberAvatar
                    initials={(m.name ?? m.displayName ?? '??').slice(0, 2).toUpperCase()}
                    hue={[14, 200, 340, 130, 280, 40][i % 6]}
                    size={20}
                  />
                  <Text style={[styles.memberName, active && { color: C.surface }]}>
                    {(m.name ?? m.displayName ?? '??').toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <MonoLabel size={8} tracking={1.5} style={styles.fieldLabel}>SPLIT</MonoLabel>
          <View style={styles.splitRow}>
            {['EQUAL', 'CUSTOM'].map((t) => (
              <Pressable
                key={t}
                onPress={() => setSplitType(t)}
                style={[styles.splitBtn, splitType === t && styles.splitBtnActive]}
              >
                <Text style={[styles.splitBtnText, splitType === t && { color: C.surface }]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {/* Split preview */}
          {totalCents > 0 && members.length > 0 && (
            <View style={styles.splitPreview}>
              {splitType === 'EQUAL'
                ? splitEqually(totalCents, members.length).map((cents, i) => (
                  <View key={members[i]?.id ?? i} style={[styles.splitItem, i > 0 && styles.splitItemBorder]}>
                    <SerifHead size={14} italic>{members[i]?.name ?? members[i]?.displayName ?? '—'}</SerifHead>
                    <Text style={styles.splitAmt}>{formatCurrency(cents, currency)}</Text>
                  </View>
                ))
                : members.map((m, i) => (
                  <View key={m.id} style={[styles.splitItem, i > 0 && styles.splitItemBorder]}>
                    <SerifHead size={14} italic>{m.name ?? m.displayName}</SerifHead>
                    <TextInput
                      style={styles.customInput}
                      placeholder="0.00"
                      placeholderTextColor={C.border}
                      keyboardType="decimal-pad"
                      value={customAmounts[m.id] ?? ''}
                      onChangeText={(v) => setCustomAmounts((prev) => ({ ...prev, [m.id]: v }))}
                    />
                  </View>
                ))
              }
              {splitType === 'CUSTOM' && totalCents > 0 && (
                <MonoLabel
                  size={9}
                  color={getCustomTotal() !== totalCents ? C.stamp : C.positive}
                  style={{ marginTop: 8 }}
                >
                  {formatCurrency(getCustomTotal(), currency)} / {formatCurrency(totalCents, currency)}
                </MonoLabel>
              )}
            </View>
          )}
        </View>

        {/* Stamp & file submit */}
        <Pressable
          style={[styles.submitBtn, loading && styles.disabledBtn]}
          onPress={handleAdd}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={C.bg} />
          ) : (
            <>
              <SerifHead size={18} italic color={C.bg}>Stamp &amp; file</SerifHead>
              <MonoLabel size={11} color={C.bg} tracking={1.5}>FILE →</MonoLabel>
            </>
          )}
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.bg },
  container: { padding: 22, paddingBottom: 48 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  heading:   { marginBottom: 2 },
  receiptNo: { marginBottom: 16, color: C.inkLight },

  stub: {
    backgroundColor: C.ticketStub,
    borderWidth: 1, borderColor: `${C.ink}40`,
    padding: 16, paddingBottom: 18,
    marginBottom: 16,
  },

  descInput: {
    borderBottomWidth: 1, borderBottomColor: `${C.ink}55`,
    fontFamily: F.serif, fontSize: 22, fontStyle: 'italic',
    paddingVertical: 6, color: C.ink, backgroundColor: 'transparent',
    marginBottom: 14,
  },

  amountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  amountDisplay: { lineHeight: 42, marginTop: 2 },
  amountInput: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    opacity: 0, height: 40,
    fontFamily: F.mono, fontSize: 22, color: C.ink,
  },

  currencyPills: { flexDirection: 'column', gap: 6, paddingTop: 20 },
  ccyPill: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: `${C.ink}80`,
  },
  ccyPillActive: { backgroundColor: C.ink, borderColor: C.ink },
  ccyPillText: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.2, color: C.ink },
  ccyPillTextActive: { color: C.bg },

  perfLine: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: -16, marginTop: 20, marginBottom: 0,
  },
  perfCircleLeft: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.bg, borderWidth: 1, borderColor: `${C.ink}40`,
    marginLeft: -8,
  },
  perfCircleRight: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.bg, borderWidth: 1, borderColor: `${C.ink}40`,
    marginRight: -8,
  },
  perfDash: {
    flex: 1, height: 1,
    borderTopWidth: 1, borderTopColor: `${C.ink}50`,
  },

  fieldLabel: { marginTop: 14, marginBottom: 8 },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1, borderColor: `${C.ink}40`,
  },
  catGlyph: { fontFamily: F.serif, fontSize: 13, fontWeight: '600' },
  catLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: C.ink },

  memberRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  memberChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1, borderColor: `${C.ink}50`,
  },
  memberChipActive: { backgroundColor: C.ink },
  memberName: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: C.ink },

  splitRow: { flexDirection: 'row', gap: 6 },
  splitBtn: {
    flex: 1, paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, borderColor: `${C.ink}50`,
  },
  splitBtnActive: { backgroundColor: C.ink },
  splitBtnText: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1, color: C.ink },

  splitPreview: {
    marginTop: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: `${C.ink}40`,
    borderBottomWidth: 1, borderBottomColor: `${C.ink}40`,
    paddingBottom: 10,
  },
  splitItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  splitItemBorder: { borderTopWidth: 1, borderTopColor: `${C.ink}20` },
  splitAmt: { fontFamily: F.mono, fontSize: 12, color: C.ink },
  customInput: {
    borderBottomWidth: 1, borderBottomColor: C.border,
    fontFamily: F.mono, fontSize: 14, color: C.ink,
    width: 90, textAlign: 'right', paddingVertical: 4,
  },

  submitBtn: {
    backgroundColor: C.ink, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  disabledBtn: { opacity: 0.6 },
});
