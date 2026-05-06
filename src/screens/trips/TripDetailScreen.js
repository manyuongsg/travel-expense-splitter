import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/tripService';
import { expenseService } from '../../services/expenseService';
import { dbService } from '../../services/dbService';
import { formatCurrency } from '../../utils/currency';
import Toast from 'react-native-toast-message';
import { C, F } from '../../theme/postage';

export default function TripDetailScreen({ route, navigation }) {
  const { tripId, tripName } = route.params;
  const [expenses, setExpenses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currency, setCurrency] = useState('USD');

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: tripName });
  }, [navigation, tripName]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [trip, serverExpenses] = await Promise.all([
        tripService.getById(tripId),
        expenseService.getAll(tripId),
      ]);
      setCurrency(trip.baseCurrency);
      setMembers(trip.members ?? []);
      setExpenses(serverExpenses);

      await dbService.saveTrip({
        id: trip.id, name: trip.name, baseCurrency: trip.baseCurrency,
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
      <View style={[styles.expenseRow, index > 0 && styles.expenseRowBorder]}>
        <View style={styles.expenseLeft}>
          <Text style={styles.expenseDesc}>{item.description}</Text>
          <Text style={styles.expensePaid}>paid by {paidByName}</Text>
        </View>
        <Text style={styles.expenseAmount}>{formatCurrency(cents, item.currency ?? currency)}</Text>
      </View>
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
        </View>
        <View style={styles.ledgerRight}>
          <Text style={styles.ledgerLabel}>{members.length} MEMBERS</Text>
          <Pressable
            style={styles.settleBtn}
            onPress={() => navigation.navigate('TripBalances', { tripId, currency })}
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
        onPress={() => navigation.navigate('AddExpense', { tripId, members, currency })}
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
  expenseLeft: { flex: 1, marginRight: 16 },
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
