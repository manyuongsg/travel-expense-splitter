import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/tripService';
import { dbService } from '../../services/dbService';
import { formatCurrency } from '../../utils/currency';
import { C, F } from '../../theme/postage';

export default function OverallBalancesScreen({ navigation }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await tripService.getAll();
      setTrips(data);
    } catch {
      const local = await dbService.getAllTrips();
      setTrips(local.map((t) => ({ ...t, baseCurrency: t.base_currency })));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchTrips(); }, [fetchTrips]));

  const renderTrip = ({ item, index }) => (
    <Pressable
      style={[styles.card, index > 0 && styles.cardBorder]}
      onPress={() => navigation.navigate('TripBalances', { tripId: item.id, currency: item.baseCurrency })}
    >
      <View style={styles.stampBadge}>
        <MaterialIcons name="flight" size={16} color={C.stamp} />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.tripName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.tripMeta}>{item.memberCount ?? 0} members · {item.baseCurrency}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.amount}>{formatCurrency(item.totalAmountCents ?? 0, item.baseCurrency)}</Text>
        <Text style={styles.viewLink}>balances →</Text>
      </View>
    </Pressable>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.stamp} /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.listContent, trips.length === 0 && styles.emptyContainer]}
      data={trips}
      keyExtractor={(item) => item.id}
      renderItem={renderTrip}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchTrips(true)} tintColor={C.stamp} />
      }
      ListHeaderComponent={
        trips.length > 0 ? (
          <Text style={styles.headerLabel}>tap a trip to see who owes what</Text>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <MaterialIcons name="account-balance-wallet" size={44} color={C.border} />
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptySub}>Create a trip and log expenses to track balances</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  listContent: { padding: 16 },

  headerLabel: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 1, marginBottom: 16 },

  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  cardBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  stampBadge: {
    width: 34, height: 34, borderWidth: 1.5, borderColor: C.stamp,
    borderRadius: 3, justifyContent: 'center', alignItems: 'center',
    backgroundColor: C.stampBg, marginRight: 12,
  },
  cardInfo: { flex: 1, marginRight: 10 },
  tripName: { fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.ink },
  tripMeta: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, marginTop: 3, letterSpacing: 0.4 },
  cardRight: { alignItems: 'flex-end' },
  amount: { fontFamily: F.mono, fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 2 },
  viewLink: { fontFamily: F.mono, fontSize: 10, color: C.stamp, letterSpacing: 0.8 },

  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: { fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.inkMid, marginTop: 14 },
  emptySub: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, textAlign: 'center', marginTop: 8, letterSpacing: 0.4 },
});
