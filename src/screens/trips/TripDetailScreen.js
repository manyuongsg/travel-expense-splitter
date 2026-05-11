import React, { useState, useCallback, useLayoutEffect } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/tripService';
import { expenseService } from '../../services/expenseService';
import { dbService } from '../../services/dbService';
import { formatCurrency, HOME_CURRENCY } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';
import { C, F } from '../../theme/postage';

export default function TripDetailScreen({ route, navigation }) {
  const { tripId, tripName } = route.params;
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState('SGD');
  const [homeCurrency, setHomeCurrency] = useState(HOME_CURRENCY);
  const [tripExchangeRate, setTripExchangeRate] = useState(null);
  const [userNetCents, setUserNetCents] = useState(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: tripName,
      headerRight: () => (
        <Pressable
          style={{ marginRight: 16 }}
          onPress={() => navigation.navigate('EditTrip', { tripId, tripName, currency, members })}
        >
          <MaterialIcons name="edit" size={20} color={C.stamp} />
        </Pressable>
      ),
    });
  }, [navigation, tripId, tripName, currency, members]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [trip, serverExpenses, balanceData, settled] = await Promise.all([
        tripService.getById(tripId),
        expenseService.getAll(tripId),
        tripService.getBalances(tripId).catch(() => null),
        dbService.getSettledSettlements(tripId),
      ]);
      const hc = trip.homeCurrency ?? HOME_CURRENCY;
      setCurrency(trip.baseCurrency);
      setHomeCurrency(hc);
      setMembers(trip.members ?? []);
      navigation.setOptions({ title: trip.name });
      setExpenses(serverExpenses);

      if (trip.baseCurrency !== hc) {
        expenseService.getExchangeRates(trip.baseCurrency, [hc])
          .then((rates) => setTripExchangeRate(rates[hc] ?? null))
          .catch(() => setTripExchangeRate(null));
      } else {
        setTripExchangeRate(null);
      }

      if (balanceData && user) {
        const isMe = (u) => u?.linkedUserId ? u.linkedUserId === user.id : u?.displayName === user.displayName;
        const mine = (balanceData.memberBalances ?? []).find((b) => isMe(b.user));
        if (mine) {
          let net = mine.netAmountCents;
          for (const s of (balanceData.settlements ?? [])) {
            const fromName = s.fromUser?.displayName ?? 'Unknown';
            const toName = s.toUser?.displayName ?? 'Unknown';
            if (!settled.has(`${fromName}|${toName}`)) continue;
            if (isMe(s.fromUser)) net += s.amountCents;
            if (isMe(s.toUser)) net -= s.amountCents;
          }
          setUserNetCents(net);
        }
      }

      await dbService.saveTrip({
        id: trip.id, name: trip.name, baseCurrency: trip.baseCurrency,
        homeCurrency: trip.homeCurrency ?? HOME_CURRENCY,
        createdAt: new Date(trip.createdAt).getTime(),
      });
      await dbService.saveTripMembers(tripId, trip.members ?? []);
      for (const exp of serverExpenses) {
        await dbService.saveExpense({
          id: exp.id, tripId,
          description: exp.description,
          amountCents: exp.amountCents,
          currency: exp.currency,
          exchangeRate: exp.exchangeRate,
          paidByMemberId: exp.paidBy?.id,
          createdAt: new Date(exp.createdAt).getTime(),
          splits: exp.splits?.map((s) => ({
            id: s.id, memberId: s.owedById,
            amountCents: s.shareAmountCents, settled: s.settled,
          })),
        });
      }
    } catch {
      const local = await dbService.getExpensesForTrip(tripId);
      const localMembers = await dbService.getTripMembers(tripId);
      setExpenses(local);
      setMembers(localMembers.map((m) => ({ id: m.member_id, name: m.name })));
      Toast.show({ type: 'info', text1: 'Showing offline data', position: 'bottom' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tripId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const totalCents = expenses.reduce((sum, e) => sum + (e.amountCents ?? e.amount_cents ?? 0), 0);

  const renderExpense = ({ item, index }) => {
    const paidByName = item.paidBy?.displayName
      ?? members.find((m) => m.id === item.paid_by_member_id)?.name
      ?? 'Unknown';
    const cents = item.amountCents ?? item.amount_cents ?? 0;
    return (
      <Pressable
        style={[styles.expenseRow, index > 0 && styles.expenseRowBorder]}
        onPress={() => navigation.navigate('EditExpense', { tripId, members, currency, homeCurrency, expense: item })}
      >
        <View style={styles.expenseLeft}>
          <Text style={styles.expenseDesc}>{item.description}</Text>
          <Text style={styles.expensePaid}>paid by {paidByName}</Text>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.expenseAmount}>{formatCurrency(cents, item.currency ?? currency)}</Text>
          <MaterialIcons name="chevron-right" size={14} color={C.border} />
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.stamp} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Ledger header */}
      <View style={styles.ledgerHeader}>
        <View style={styles.ledgerLeft}>
          <Text style={styles.ledgerLabel}>TOTAL SPENT</Text>
          <Text style={styles.ledgerTotal}>{formatCurrency(totalCents, currency)}</Text>
          {userNetCents !== null && userNetCents !== 0 && (
            <View style={styles.userBalanceRow}>
              <Text style={styles.ledgerLabel}>YOUR BALANCE  </Text>
              <Text style={[
                styles.userBalanceAmount,
                userNetCents < 0 ? styles.balanceNegative : styles.balancePositive,
              ]}>
                {userNetCents < 0 ? '-' : '+'}{formatCurrency(Math.abs(userNetCents), currency)}
              </Text>
            </View>
          )}
          {userNetCents === 0 && (
            <Text style={styles.balanceSettled}>YOU'RE SETTLED ✓</Text>
          )}
        </View>
        <View style={styles.ledgerRight}>
          <Text style={styles.ledgerLabel}>{members.length} MEMBERS</Text>
          {tripExchangeRate && (
            <Text style={styles.rateRow}>
              1 {currency} ≈ {homeCurrency} {tripExchangeRate >= 1 ? tripExchangeRate.toFixed(2) : tripExchangeRate.toFixed(4)}
            </Text>
          )}
          <Pressable
            style={styles.settleBtn}
            onPress={() => navigation.navigate('TripBalances', { tripId, currency, homeCurrency })}
          >
            <Text style={styles.settleBtnText}>SETTLE UP →</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        contentContainerStyle={[
          styles.listContent,
          expenses.length === 0 && styles.emptyContainer,
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={C.stamp} />
        }
        ListHeaderComponent={
          expenses.length > 0 ? (
            <View style={styles.ledgerTableHeader}>
              <Text style={styles.ledgerColLabel}>DESCRIPTION</Text>
              <Text style={styles.ledgerColLabel}>AMOUNT</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="receipt-long" size={48} color={C.border} />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptySubText}>Tap + to log the first expense</Text>
          </View>
        }
      />

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense', { tripId, members, currency, homeCurrency })}
      >
        <MaterialIcons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  ledgerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    backgroundColor: C.ink, paddingHorizontal: 20, paddingVertical: 20,
  },
  ledgerLeft: {},
  ledgerRight: { alignItems: 'flex-end' },
  ledgerLabel: { fontFamily: F.mono, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 4 },
  ledgerTotal: { fontFamily: F.mono, fontSize: 30, color: '#fff', fontWeight: '700' },
  userBalanceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  userBalanceAmount: { fontFamily: F.mono, fontSize: 13, fontWeight: '700' },
  balanceNegative: { color: C.negative },
  balancePositive: { color: C.positive },
  balanceSettled: { fontFamily: F.mono, fontSize: 9, color: C.positive, letterSpacing: 2, marginTop: 10 },
  rateRow: { fontFamily: F.mono, fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, marginTop: 6, marginBottom: 2 },
  settleBtn: {
    borderWidth: 1, borderColor: C.stamp, borderRadius: 2,
    paddingHorizontal: 10, paddingVertical: 5, marginTop: 6,
  },
  settleBtnText: { fontFamily: F.mono, fontSize: 10, color: C.stamp, letterSpacing: 1.5 },

  listContent: { padding: 16, paddingTop: 8 },
  ledgerTableHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 4,
    borderBottomWidth: 1.5, borderBottomColor: C.ink,
    marginBottom: 2,
  },
  ledgerColLabel: { fontFamily: F.mono, fontSize: 9, color: C.inkLight, letterSpacing: 2 },

  expenseRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 4,
  },
  expenseRowBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  expenseLeft: { flex: 1, marginRight: 8 },
  expenseRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expenseDesc: { fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.ink },
  expensePaid: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, marginTop: 3, letterSpacing: 0.4 },
  expenseAmount: { fontFamily: F.mono, fontSize: 15, color: C.stamp, fontWeight: '700' },

  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 24 },
  emptyText: { fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.inkMid, marginTop: 14 },
  emptySubText: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, marginTop: 8, textAlign: 'center', letterSpacing: 0.4 },

  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: C.stamp, justifyContent: 'center', alignItems: 'center',
    shadowColor: C.ink, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
  },
});
