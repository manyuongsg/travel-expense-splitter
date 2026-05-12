/**
 * A2 · The Ledger — expenses grouped view with category filter tabs.
 * Postmarks as section headers, ticket-stub expense rows, postage aesthetic.
 */
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
import { C, F, CATS } from '../../theme/postage';
import { MonoLabel, SerifHead, CatChip, MemberAvatar } from '../../components/PostageElements';

const FILTER_TABS = ['ALL', 'FOOD', 'TRANSPORT', 'ACCOMMODATION', 'ACTIVITIES', 'SHOPPING'];

export default function TripDetailScreen({ route, navigation }) {
  const { tripId, tripName } = route.params;
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [homeCurrency, setHomeCurrency] = useState(HOME_CURRENCY);
  const [userNetCents, setUserNetCents] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: tripName,
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Pressable
            style={{ marginRight: 8 }}
            onPress={() => navigation.navigate('TripInsights', { tripId, expenses, members, currency })}
          >
            <MonoLabel size={9} color={C.stamp} tracking={1.5}>ALMANAC</MonoLabel>
          </Pressable>
          <Pressable
            style={{ marginRight: 16 }}
            onPress={() => navigation.navigate('EditTrip', { tripId, tripName, currency, members })}
          >
            <MaterialIcons name="edit" size={20} color={C.stamp} />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, tripId, tripName, currency, members, expenses]);

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

      if (balanceData && user) {
        const isMe = (u) => u?.linkedUserId ? u.linkedUserId === user.id : u?.displayName === user.displayName;
        const mine = (balanceData.memberBalances ?? []).find((b) => isMe(b.user));
        if (mine) {
          let net = mine.netAmountCents;
          for (const s of (balanceData.settlements ?? [])) {
            const fromName = s.fromUser?.displayName ?? 'Unknown';
            const toName   = s.toUser?.displayName ?? 'Unknown';
            if (!settled.has(`${fromName}|${toName}`)) continue;
            if (isMe(s.fromUser)) net += s.amountCents;
            if (isMe(s.toUser))   net -= s.amountCents;
          }
          setUserNetCents(net);
        }
      }

      await dbService.saveTrip({ id: trip.id, name: trip.name, baseCurrency: trip.baseCurrency, homeCurrency: hc, createdAt: new Date(trip.createdAt).getTime() });
      await dbService.saveTripMembers(tripId, trip.members ?? []);
      for (const exp of serverExpenses) {
        await dbService.saveExpense({
          id: exp.id, tripId, description: exp.description,
          amountCents: exp.amountCents, currency: exp.currency,
          exchangeRate: exp.exchangeRate, paidByMemberId: exp.paidBy?.id,
          createdAt: new Date(exp.createdAt).getTime(),
          splits: exp.splits?.map((s) => ({ id: s.id, memberId: s.owedById, amountCents: s.shareAmountCents, settled: s.settled })),
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

  const filtered = activeFilter === 'ALL'
    ? expenses
    : expenses.filter((e) => (e.category ?? 'OTHER').toUpperCase() === activeFilter);

  const renderExpense = ({ item, index }) => {
    const paidByName = item.paidBy?.displayName
      ?? members.find((m) => m.id === item.paid_by_member_id)?.name
      ?? 'Unknown';
    const cents = item.amountCents ?? item.amount_cents ?? 0;
    const splitCount = item.splits?.length ?? members.length;
    const cat = (item.category ?? 'OTHER').toUpperCase();
    const date = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
      : '';

    return (
      <Pressable
        style={[styles.expenseRow, index > 0 && styles.expenseRowBorder]}
        onPress={() => navigation.navigate('EditExpense', { tripId, members, currency, homeCurrency, expense: item })}
      >
        <MonoLabel size={9} tracking={0} color={C.inkLight} style={{ width: 34 }}>
          {date.split(' ')[1] ?? '—'}
        </MonoLabel>
        <CatChip category={cat} size={28} />
        <View style={styles.expenseMiddle}>
          <SerifHead size={15} weight="500" style={{ lineHeight: 18 }} numberOfLines={1}>
            {item.description}
          </SerifHead>
          <MonoLabel size={8} tracking={1} style={{ marginTop: 2 }}>
            {paidByName.toUpperCase()} PAID · SPLIT {splitCount}/{members.length}
          </MonoLabel>
        </View>
        <View style={styles.expenseRight}>
          <SerifHead size={16} weight="600">
            {formatCurrency(cents, item.currency ?? currency)}
          </SerifHead>
          {item.currency && item.currency !== currency && (
            <MonoLabel size={8} tracking={1} color={C.stamp}>
              {item.currency}
            </MonoLabel>
          )}
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MonoLabel size={9} tracking={2} color="rgba(255,255,255,0.45)">
            {filtered.length} ENTRIES
          </MonoLabel>
          <SerifHead size={34} italic weight="500" color="#fff" style={{ marginTop: 2 }}>
            The Ledger
          </SerifHead>
          <MonoLabel size={9} color="rgba(255,255,255,0.45)" style={{ marginTop: 4 }}>
            {formatCurrency(totalCents, currency)}
          </MonoLabel>
        </View>
        <View style={styles.headerRight}>
          {userNetCents !== null && userNetCents !== 0 && (
            <>
              <MonoLabel size={9} color="rgba(255,255,255,0.45)" tracking={2}>YOUR BALANCE</MonoLabel>
              <SerifHead
                size={20} weight="600"
                color={userNetCents < 0 ? '#f4a58a' : '#8fd4b8'}
                style={{ marginTop: 2 }}
              >
                {userNetCents < 0 ? '−' : '+'}{formatCurrency(Math.abs(userNetCents), currency)}
              </SerifHead>
            </>
          )}
          {userNetCents === 0 && (
            <MonoLabel size={9} color={C.positive} tracking={2}>SETTLED ✓</MonoLabel>
          )}
          <Pressable
            style={styles.settleBtn}
            onPress={() => navigation.navigate('TripBalances', { tripId, currency, homeCurrency })}
          >
            <MonoLabel size={9} color={C.stamp} tracking={1.5}>SETTLE UP →</MonoLabel>
          </Pressable>
        </View>
      </View>

      {/* Category filter tabs */}
      <View style={styles.tabs}>
        {FILTER_TABS.map((tab) => {
          const active = activeFilter === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => setActiveFilter(tab)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {tab === 'ALL' ? 'ALL' : (CATS[tab]?.label.toUpperCase() ?? tab)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        contentContainerStyle={[styles.listContent, filtered.length === 0 && styles.emptyContainer]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={C.stamp} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="receipt-long" size={48} color={C.border} />
            <SerifHead size={18} italic color={C.inkMid} style={{ marginTop: 14 }}>
              {activeFilter === 'ALL' ? 'No expenses yet' : `No ${CATS[activeFilter]?.label} expenses`}
            </SerifHead>
            <MonoLabel size={10} style={{ marginTop: 8, textAlign: 'center' }}>
              {activeFilter === 'ALL' ? 'Tap + to log the first expense' : 'Try a different category filter'}
            </MonoLabel>
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
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    backgroundColor: C.ink, paddingHorizontal: 22, paddingVertical: 20,
  },
  headerLeft: {},
  headerRight: { alignItems: 'flex-end', gap: 4 },
  settleBtn: {
    borderWidth: 1, borderColor: C.stamp,
    paddingHorizontal: 10, paddingVertical: 5, marginTop: 8,
  },

  tabs: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: C.surfaceAlt, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  tab: {
    paddingVertical: 5, paddingHorizontal: 10,
    borderWidth: 1, borderColor: `${C.ink}40`,
  },
  tabActive: { backgroundColor: C.ink, borderColor: C.ink },
  tabText: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.inkLight },
  tabTextActive: { color: C.bg },

  listContent: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 100 },

  expenseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12,
  },
  expenseRowBorder: { borderTopWidth: 1, borderTopColor: `${C.ink}18` },
  expenseMiddle: { flex: 1, minWidth: 0 },
  expenseRight: { alignItems: 'flex-end' },

  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40, paddingTop: 24 },

  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: C.stamp, justifyContent: 'center', alignItems: 'center',
    shadowColor: C.ink, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
  },
});
