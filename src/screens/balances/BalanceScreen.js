import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/tripService';
import { expenseService } from '../../services/expenseService';
import { dbService } from '../../services/dbService';
import { formatCurrency, HOME_CURRENCY } from '../../utils/currency';
import Toast from 'react-native-toast-message';
import { C, F } from '../../theme/postage';

export default function BalanceScreen({ route }) {
  const { tripId, currency = 'SGD', homeCurrency = HOME_CURRENCY } = route.params;
  const [settlements, setSettlements] = useState([]);
  const [memberBalances, setMemberBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [settledKeys, setSettledKeys] = useState(new Set());
  const [exchangeRate, setExchangeRate] = useState(null);

  const showEquivalent = currency !== homeCurrency;

  useEffect(() => {
    if (!showEquivalent) { setExchangeRate(null); return; }
    expenseService.getExchangeRates(currency, [homeCurrency])
      .then((rates) => setExchangeRate(rates[homeCurrency] ?? null))
      .catch(() => setExchangeRate(null));
  }, [currency, homeCurrency, showEquivalent]);

  const settlementKey = (s) => `${s.fromName}|${s.toName}`;

  const adjustedMemberBalances = useMemo(() => {
    if (!settledKeys.size) return memberBalances;
    const map = Object.fromEntries(memberBalances.map((b) => [b.name, { ...b }]));
    for (const s of settlements) {
      if (!settledKeys.has(settlementKey(s))) continue;
      if (map[s.fromName]) map[s.fromName].netCents += s.amountCents;
      if (map[s.toName]) map[s.toName].netCents -= s.amountCents;
    }
    return Object.values(map);
  }, [memberBalances, settlements, settledKeys]);

  const toggleSettled = useCallback(async (settlement) => {
    const key = settlementKey(settlement);
    const nowSettled = !settledKeys.has(key);
    await dbService.toggleSettlement(tripId, settlement.fromName, settlement.toName, nowSettled);
    setSettledKeys((prev) => {
      const next = new Set(prev);
      if (nowSettled) next.add(key); else next.delete(key);
      return next;
    });
  }, [tripId, settledKeys]);

  useEffect(() => {
    (async () => {
      try {
        const [data, saved] = await Promise.all([
          tripService.getBalances(tripId),
          dbService.getSettledSettlements(tripId),
        ]);
        setSettlements(
          (data.settlements ?? []).map((s) => ({
            fromName: s.fromUser?.displayName ?? 'Unknown',
            toName: s.toUser?.displayName ?? 'Unknown',
            amountCents: s.amountCents,
          }))
        );
        setMemberBalances(
          (data.memberBalances ?? []).map((b) => ({
            name: b.user?.displayName ?? 'Unknown',
            netCents: b.netAmountCents,
          }))
        );
        setSettledKeys(saved);
      } catch {
        const [local, saved] = await Promise.all([
          dbService.computeLocalBalances(tripId),
          dbService.getSettledSettlements(tripId),
        ]);
        setSettlements(local);
        setSettledKeys(saved);
        setIsOffline(true);
        Toast.show({ type: 'info', text1: 'Showing offline balances', position: 'bottom' });
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  const renderSettlement = ({ item, index }) => {
    const settled = settledKeys.has(settlementKey(item));
    return (
      <View style={[styles.settlementCard, index > 0 && styles.settlementBorder, settled && styles.settlementDone]}>
        <View style={styles.settlementRow}>
          <View style={styles.person}>
            <View style={[styles.initial, settled && styles.initialSettled]}>
              <Text style={[styles.initialText, settled && styles.initialTextSettled]}>
                {item.fromName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.personName, settled && styles.personNameSettled]}>{item.fromName}</Text>
          </View>

          <View style={styles.arrowArea}>
            <Text style={[styles.owesAmount, settled && styles.owesAmountSettled]}>
              {formatCurrency(item.amountCents, currency)}
            </Text>
            {showEquivalent && exchangeRate && !settled && (
              <Text style={styles.equivalentHint}>
                ≈ {formatCurrency(Math.round(item.amountCents * exchangeRate), homeCurrency)}
              </Text>
            )}
            <Text style={[styles.arrowLine, settled && styles.arrowLineSettled]}>- - - - →</Text>
          </View>

          <View style={styles.person}>
            <View style={[styles.initial, styles.initialTo, settled && styles.initialSettled]}>
              <Text style={[styles.initialText, styles.initialTextTo, settled && styles.initialTextSettled]}>
                {item.toName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.personName, settled && styles.personNameSettled]}>{item.toName}</Text>
          </View>
        </View>

        <Pressable style={styles.tickRow} onPress={() => toggleSettled(item)} hitSlop={8}>
          <MaterialIcons
            name={settled ? 'check-circle' : 'radio-button-unchecked'}
            size={18}
            color={settled ? C.positive : C.inkLight}
          />
          <Text style={[styles.tickLabel, settled && styles.tickLabelDone]}>
            {settled ? 'Settled' : 'Mark as settled'}
          </Text>
        </Pressable>
      </View>
    );
  };

  const renderMemberBalance = ({ item, index }) => (
    <View style={[styles.balanceRow, index > 0 && styles.balanceRowBorder]}>
      <Text style={styles.memberName}>{item.name}</Text>
      <Text style={[
        styles.netAmount,
        item.netCents > 0 ? styles.positive : item.netCents < 0 ? styles.negative : styles.neutral,
      ]}>
        {item.netCents > 0
          ? `+${formatCurrency(item.netCents, currency)}`
          : item.netCents < 0
          ? `-${formatCurrency(Math.abs(item.netCents), currency)}`
          : 'settled'}
      </Text>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.stamp} /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      ListHeaderComponent={
        <View>
          {isOffline && (
            <View style={styles.offlineBanner}>
              <MaterialIcons name="wifi-off" size={14} color={C.stamp} />
              <Text style={styles.offlineText}>offline — local data only</Text>
            </View>
          )}

          {adjustedMemberBalances.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>NET BALANCES</Text>
              {adjustedMemberBalances.map((item, i) => (
                <View key={item.name}>
                  {renderMemberBalance({ item, index: i })}
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionLabel}>SUGGESTED SETTLEMENTS</Text>

          {settlements.length === 0 && (
            <View style={styles.allSettled}>
              <View style={styles.settledStamp}>
                <Text style={styles.settledStampText}>SETTLED</Text>
              </View>
              <Text style={styles.allSettledText}>All squared away</Text>
              <Text style={styles.allSettledSub}>No outstanding balances in this trip</Text>
            </View>
          )}
        </View>
      }
      data={settlements}
      keyExtractor={(_, i) => String(i)}
      renderItem={renderSettlement}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  listContent: { padding: 16 },

  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.stampSoft, borderRadius: 3, padding: 10, marginBottom: 14,
    borderWidth: 1, borderColor: C.stampSoft,
  },
  offlineText: { fontFamily: F.mono, fontSize: 11, color: C.stamp, letterSpacing: 0.8 },

  section: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 16, marginBottom: 20,
  },
  sectionLabel: { fontFamily: F.mono, fontSize: 9, color: C.inkLight, letterSpacing: 2, marginBottom: 14 },

  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  balanceRowBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  memberName: { fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.ink },
  netAmount: { fontFamily: F.mono, fontSize: 14, fontWeight: '700' },
  positive: { color: C.positive },
  negative: { color: C.negative },
  neutral: { color: C.inkLight },

  settlementCard: { paddingVertical: 18 },
  settlementBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  settlementDone: { opacity: 0.45 },
  settlementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  person: { alignItems: 'center', width: 80 },
  initial: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.surface,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  initialTo: { borderColor: C.positive, backgroundColor: C.positiveBg },
  initialSettled: { borderColor: C.border, backgroundColor: C.surface },
  initialText: { fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.inkMid },
  initialTextTo: { color: C.positive },
  initialTextSettled: { color: C.inkLight },
  personName: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 0.5, textAlign: 'center' },
  personNameSettled: { color: C.inkLight },

  arrowArea: { flex: 1, alignItems: 'center' },
  owesAmount: { fontFamily: F.mono, fontSize: 14, color: C.ink, fontWeight: '700', marginBottom: 2 },
  owesAmountSettled: { color: C.inkLight },
  equivalentHint: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 0.4, marginBottom: 4 },
  arrowLine: { fontFamily: F.mono, fontSize: 12, color: C.stamp, letterSpacing: -1 },
  arrowLineSettled: { color: C.inkLight },

  tickRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.divider,
  },
  tickLabel: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 0.8 },
  tickLabelDone: { color: C.positive },

  allSettled: { alignItems: 'center', paddingVertical: 40 },
  settledStamp: {
    borderWidth: 3, borderColor: C.positive, borderRadius: 4,
    paddingHorizontal: 20, paddingVertical: 10, marginBottom: 20,
    transform: [{ rotate: '-5deg' }],
  },
  settledStampText: { fontFamily: F.mono, fontSize: 20, color: C.positive, letterSpacing: 4, fontWeight: '700' },
  allSettledText: { fontFamily: F.serif, fontSize: 20, fontStyle: 'italic', color: C.ink, marginBottom: 6 },
  allSettledSub: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, textAlign: 'center', letterSpacing: 0.4 },
});
