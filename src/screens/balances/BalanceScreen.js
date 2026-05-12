/**
 * A4 · Clearing the books — Settle up screen.
 * Hero stamp with transfer count, net balance bars, money-order transfer cards.
 */
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
import { MonoLabel, SerifHead, StampBorder, Postmark, MemberAvatar, BalanceBar } from '../../components/PostageElements';

export default function BalanceScreen({ route }) {
  const { tripId, currency = 'SGD', homeCurrency = HOME_CURRENCY } = route.params;
  const [settlements, setSettlements]       = useState([]);
  const [memberBalances, setMemberBalances] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [isOffline, setIsOffline]           = useState(false);
  const [settledKeys, setSettledKeys]       = useState(new Set());
  const [exchangeRate, setExchangeRate]     = useState(null);

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
      if (map[s.toName])   map[s.toName].netCents   -= s.amountCents;
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
            fromName:   s.fromUser?.displayName ?? 'Unknown',
            toName:     s.toUser?.displayName   ?? 'Unknown',
            amountCents: s.amountCents,
          }))
        );
        setMemberBalances(
          (data.memberBalances ?? []).map((b) => ({
            name:     b.user?.displayName ?? 'Unknown',
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

  const maxAbsBalance = Math.max(...(adjustedMemberBalances.map((b) => Math.abs(b.netCents))), 1);
  const unsettledCount = settlements.filter((s) => !settledKeys.has(settlementKey(s))).length;

  const renderSettlement = ({ item, index }) => {
    const settled = settledKeys.has(settlementKey(item));
    const fromInit = item.fromName.slice(0, 2).toUpperCase();
    const toInit   = item.toName.slice(0, 2).toUpperCase();
    return (
      <View style={[styles.moneyOrder, settled && styles.moneyOrderSettled]}>
        <View style={styles.moneyOrderRow}>
          {/* From */}
          <View style={styles.moneyPerson}>
            <MemberAvatar initials={fromInit} hue={14} size={28} />
            <MonoLabel size={9} tracking={1} style={{ marginTop: 4 }}>{item.fromName.toUpperCase()}</MonoLabel>
          </View>

          <View style={styles.moneyArrow}>
            <SerifHead size={17} weight="600">
              {formatCurrency(item.amountCents, currency)}
            </SerifHead>
            {showEquivalent && exchangeRate && !settled && (
              <MonoLabel size={8} tracking={0.5} style={{ marginVertical: 2 }}>
                ≈ {formatCurrency(Math.round(item.amountCents * exchangeRate), homeCurrency)}
              </MonoLabel>
            )}
            <MonoLabel size={10} color={C.stamp} tracking={-1}>- - - →</MonoLabel>
            <MonoLabel size={7.5} style={{ marginTop: 2 }}>VIA WISE / VENMO / CASH</MonoLabel>
          </View>

          {/* To */}
          <View style={styles.moneyPerson}>
            <MemberAvatar initials={toInit} hue={200} size={28} />
            <MonoLabel size={9} tracking={1} style={{ marginTop: 4 }}>{item.toName.toUpperCase()}</MonoLabel>
          </View>
        </View>

        <Pressable style={styles.settleRow} onPress={() => toggleSettled(item)} hitSlop={8}>
          <MaterialIcons
            name={settled ? 'check-circle' : 'radio-button-unchecked'}
            size={16}
            color={settled ? C.positive : C.inkLight}
          />
          <MonoLabel size={9} tracking={1} color={settled ? C.positive : C.inkLight}>
            {settled ? 'SETTLED · RECEIPT FILED' : 'MARK AS SETTLED'}
          </MonoLabel>
          {!settled && (
            <View style={styles.sendBtn}>
              <MonoLabel size={8} tracking={1.5} color={C.bg}>SEND →</MonoLabel>
            </View>
          )}
        </Pressable>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.stamp} /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View>
          {isOffline && (
            <View style={styles.offlineBanner}>
              <MaterialIcons name="wifi-off" size={14} color={C.stamp} />
              <MonoLabel size={11} color={C.stamp} tracking={0.8}>offline — local data only</MonoLabel>
            </View>
          )}

          {/* Header */}
          <View style={styles.pageHeader}>
            <SerifHead size={32} italic weight="500">Clearing the books</SerifHead>
            <MonoLabel size={9} style={{ marginTop: 4 }}>
              {settlements.length} TRANSFERS · {unsettledCount} OUTSTANDING
            </MonoLabel>
          </View>

          {/* Hero: stamp + net position */}
          <View style={styles.heroRow}>
            <StampBorder
              width={88} height={108} tilt={-5} color={C.stamp}
              label="DEBT · CLEARED"
            >
              <SerifHead size={28} italic weight="600" color={C.stamp}>
                {settlements.length}
              </SerifHead>
              <MonoLabel size={7} color={C.stamp} tracking={1.5} style={{ marginTop: 2 }}>
                TRANSFERS
              </MonoLabel>
            </StampBorder>
            <View style={styles.heroRight}>
              <MonoLabel size={9} tracking={1.5}>NET POSITION</MonoLabel>
              <SerifHead size={28} weight="600" style={{ marginTop: 4 }}>
                {formatCurrency(
                  Math.max(...adjustedMemberBalances.map((b) => Math.abs(b.netCents)), 0),
                  currency
                )}
              </SerifHead>
              <MonoLabel size={8.5} tracking={1.2} style={{ marginTop: 4 }}>
                WILL CHANGE HANDS · {memberBalances.length} PEOPLE
              </MonoLabel>
            </View>
          </View>

          {/* Net balances with bars */}
          {adjustedMemberBalances.length > 0 && (
            <View style={styles.balancesSection}>
              <MonoLabel size={9} tracking={2} style={styles.sectionLabel}>NET BALANCES</MonoLabel>
              {adjustedMemberBalances.map((item, i) => (
                <View key={item.name} style={[styles.balanceRow, i > 0 && styles.balanceRowBorder]}>
                  <MemberAvatar
                    initials={item.name.slice(0, 2).toUpperCase()}
                    hue={[14, 200, 340, 130, 280, 40][i % 6]}
                    size={26}
                  />
                  <SerifHead size={15} style={{ flex: 1, marginLeft: 10 }} italic>
                    {item.name}
                  </SerifHead>
                  <BalanceBar netCents={item.netCents} maxCents={maxAbsBalance} width={80} />
                  <Text style={[
                    styles.netAmount,
                    item.netCents > 0 ? styles.positive : item.netCents < 0 ? styles.negative : styles.neutral,
                  ]}>
                    {item.netCents > 0 ? '+' : item.netCents < 0 ? '−' : ''}
                    {formatCurrency(Math.abs(item.netCents), currency)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {settlements.length === 0 ? (
            <View style={styles.allSettled}>
              <View style={styles.settledStamp}>
                <MonoLabel size={18} color={C.positive} tracking={4}>SETTLED</MonoLabel>
              </View>
              <SerifHead size={20} italic color={C.ink} style={{ marginTop: 16 }}>All squared away</SerifHead>
              <MonoLabel size={10} style={{ marginTop: 8, textAlign: 'center' }}>
                No outstanding balances in this trip
              </MonoLabel>
            </View>
          ) : (
            <MonoLabel size={9} tracking={2} style={styles.sectionLabel}>SUGGESTED TRANSFERS</MonoLabel>
          )}
        </View>
      }
      data={settlements}
      keyExtractor={(_, i) => String(i)}
      renderItem={renderSettlement}
    />
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  listContent: { padding: 22, paddingBottom: 48 },

  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.stampSoft, padding: 10, marginBottom: 16,
    borderWidth: 1, borderColor: C.stampSoft,
  },

  pageHeader: { marginBottom: 20 },

  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  heroRight: { flex: 1 },

  balancesSection: { marginBottom: 24 },
  sectionLabel: { marginBottom: 14 },
  balanceRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8,
  },
  balanceRowBorder: { borderTopWidth: 1, borderTopColor: `${C.ink}18` },
  netAmount: { fontFamily: F.mono, fontSize: 12, fontWeight: '700', width: 72, textAlign: 'right' },
  positive: { color: C.blue },
  negative: { color: C.stamp },
  neutral:  { color: C.inkLight },

  moneyOrder: {
    backgroundColor: C.ticketStub,
    borderWidth: 1, borderColor: `${C.ink}50`,
    padding: 14, marginBottom: 10,
  },
  moneyOrderSettled: { opacity: 0.45 },
  moneyOrderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  moneyPerson: { alignItems: 'center', width: 72 },
  moneyArrow: { flex: 1, alignItems: 'center' },

  settleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 10, borderTopWidth: 1, borderTopColor: `${C.ink}30`,
  },
  sendBtn: {
    marginLeft: 'auto',
    backgroundColor: C.ink, paddingHorizontal: 10, paddingVertical: 4,
  },

  allSettled: { alignItems: 'center', paddingVertical: 40 },
  settledStamp: {
    borderWidth: 3, borderColor: C.positive,
    paddingHorizontal: 20, paddingVertical: 10,
    transform: [{ rotate: '-5deg' }],
  },
});
