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
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';
import { C, F } from '../../theme/postage';

export default function TripListScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tripBalances, setTripBalances] = useState({});
  const [archivedTrips, setArchivedTrips] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [archivedLoading, setArchivedLoading] = useState(false);

  const fetchBalances = useCallback(async (tripList) => {
    if (!user || tripList.length === 0) return;
    const results = await Promise.all(
      tripList.map(async (trip) => {
        try {
          const [data, settled] = await Promise.all([
            tripService.getBalances(trip.id),
            dbService.getSettledSettlements(trip.id),
          ]);
          const isMe = (u) => u?.linkedUserId ? u.linkedUserId === user.id : u?.displayName === user.displayName;
          const mine = (data.memberBalances ?? []).find((b) => isMe(b.user));
          if (!mine) return [trip.id, null];
          let net = mine.netAmountCents;
          for (const s of (data.settlements ?? [])) {
            const fromName = s.fromUser?.displayName ?? 'Unknown';
            const toName = s.toUser?.displayName ?? 'Unknown';
            if (!settled.has(`${fromName}|${toName}`)) continue;
            if (isMe(s.fromUser)) net += s.amountCents;
            if (isMe(s.toUser)) net -= s.amountCents;
          }
          return [trip.id, net];
        } catch {
          return [trip.id, null];
        }
      })
    );
    setTripBalances(Object.fromEntries(results));
  }, [user]);

  const fetchTrips = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const serverTrips = await tripService.getAll();
      for (const t of serverTrips) {
        await dbService.saveTrip({
          id: t.id, name: t.name, baseCurrency: t.baseCurrency,
          createdAt: new Date(t.createdAt).getTime(),
        });
      }
      setTrips(serverTrips);
      fetchBalances(serverTrips);
    } catch {
      const local = await dbService.getAllTrips();
      const mapped = local.map((t) => ({ ...t, baseCurrency: t.base_currency }));
      setTrips(mapped);
      if (!isRefresh) Toast.show({ type: 'info', text1: 'Showing offline data', position: 'bottom' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchBalances]);

  const fetchArchived = useCallback(async () => {
    setArchivedLoading(true);
    try {
      const data = await tripService.getArchived();
      setArchivedTrips(data);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not load archived trips', position: 'bottom' });
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  const handleToggleArchived = () => {
    const next = !showArchived;
    setShowArchived(next);
    if (next && archivedTrips.length === 0) fetchArchived();
  };

  const handleUnarchive = async (tripId) => {
    try {
      await tripService.unarchive(tripId);
      setArchivedTrips((prev) => prev.filter((t) => t.id !== tripId));
      fetchTrips();
      Toast.show({ type: 'success', text1: 'Trip restored', position: 'bottom' });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not unarchive trip', position: 'bottom' });
    }
  };

  useFocusEffect(useCallback(() => {
    fetchTrips();
    if (showArchived) fetchArchived();
  }, [fetchTrips, fetchArchived, showArchived]));

  const renderTrip = ({ item }) => {
    const net = tripBalances[item.id];
    const currency = item.baseCurrency ?? item.base_currency;
    return (
      <Pressable
        style={styles.card}
        onPress={() => navigation.navigate('TripDetail', { tripId: item.id, tripName: item.name })}
      >
        <View style={styles.stampBadge}>
          <MaterialIcons name="flight" size={18} color={C.stamp} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.tripName}>{item.name}</Text>
          <Text style={styles.tripMeta}>
            {item.memberCount ?? 0} members · {currency}
          </Text>
          {net != null && net !== 0 && (
            <Text style={[styles.balancePill, net < 0 ? styles.pillOwe : styles.pillOwed]}>
              {net < 0 ? `you owe ${formatCurrency(Math.abs(net), currency)}` : `owed ${formatCurrency(net, currency)}`}
            </Text>
          )}
          {net === 0 && (
            <Text style={styles.pillSettled}>settled</Text>
          )}
        </View>
        <View style={styles.cardRight}>
          <View style={styles.totalBlock}>
            <Text style={styles.totalLabel}>TOTAL SPENT</Text>
            <Text style={styles.tripTotal}>
              {formatCurrency(item.totalAmountCents ?? 0, currency)}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={16} color={C.border} />
        </View>
      </Pressable>
    );
  };

  const renderArchivedTrip = ({ item }) => {
    const currency = item.baseCurrency ?? item.base_currency;
    return (
      <View style={styles.archivedCard}>
        <View style={styles.archiveIcon}>
          <MaterialIcons name="archive" size={16} color={C.inkLight} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.archivedName}>{item.name}</Text>
          <Text style={styles.tripMeta}>
            {item.memberCount ?? 0} members · {currency}
          </Text>
        </View>
        <Pressable style={styles.unarchiveBtn} onPress={() => handleUnarchive(item.id)}>
          <MaterialIcons name="unarchive" size={16} color={C.stamp} />
          <Text style={styles.unarchiveBtnText}>RESTORE</Text>
        </Pressable>
      </View>
    );
  };

  const ArchivedSection = () => (
    <View style={styles.archivedSection}>
      <Pressable style={styles.archivedToggle} onPress={handleToggleArchived}>
        <MaterialIcons name={showArchived ? 'expand-less' : 'expand-more'} size={16} color={C.inkLight} />
        <Text style={styles.archivedToggleText}>ARCHIVED TRIPS</Text>
      </Pressable>
      {showArchived && (
        archivedLoading
          ? <ActivityIndicator size="small" color={C.stamp} style={{ marginVertical: 16 }} />
          : archivedTrips.length === 0
          ? <Text style={styles.archivedEmpty}>No archived trips</Text>
          : <FlatList
              data={archivedTrips}
              keyExtractor={(item) => item.id}
              renderItem={renderArchivedTrip}
              scrollEnabled={false}
            />
      )}
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.stamp} /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerMono}>Hello, {user?.displayName?.split(' ')[0]}</Text>
          <Text style={styles.headerTitle}>My Trips</Text>
        </View>
        <Pressable onPress={logout} hitSlop={12}>
          <MaterialIcons name="logout" size={20} color={C.inkLight} />
        </Pressable>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        contentContainerStyle={[styles.listContent, trips.length === 0 && styles.emptyContainer]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchTrips(true)} tintColor={C.stamp} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="flight-takeoff" size={48} color={C.border} />
            <Text style={styles.emptyText}>No trips yet</Text>
            <Text style={styles.emptySubText}>Create your first trip to start splitting expenses</Text>
          </View>
        }
        ListFooterComponent={<ArchivedSection />}
      />

      <Pressable style={styles.fab} onPress={() => navigation.navigate('CreateTrip')}>
        <MaterialIcons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18,
    backgroundColor: C.surfaceAlt, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerMono: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 1.5, textTransform: 'uppercase' },
  headerTitle: { fontFamily: F.serif, fontSize: 26, fontStyle: 'italic', color: C.ink, marginTop: 2 },

  listContent: { padding: 16, paddingTop: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4,
    padding: 14, marginBottom: 10,
  },
  stampBadge: {
    width: 36, height: 36, borderWidth: 1.5, borderColor: C.stamp, borderRadius: 3,
    justifyContent: 'center', alignItems: 'center', backgroundColor: C.stampBg, marginRight: 12,
  },
  cardBody: { flex: 1, marginRight: 8 },
  tripName: { fontFamily: F.serif, fontSize: 16, fontStyle: 'italic', color: C.ink },
  tripMeta: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, marginTop: 4, letterSpacing: 0.5 },
  balancePill: { fontFamily: F.mono, fontSize: 9, letterSpacing: 0.6, marginTop: 5 },
  pillOwe: { color: C.negative },
  pillOwed: { color: C.positive },
  pillSettled: { fontFamily: F.mono, fontSize: 9, color: C.positive, letterSpacing: 0.6, marginTop: 5 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  totalBlock: { alignItems: 'flex-end' },
  totalLabel: { fontFamily: F.mono, fontSize: 8, color: C.inkLight, letterSpacing: 1.5, marginBottom: 3 },
  tripTotal: { fontFamily: F.mono, fontSize: 13, color: C.stamp, fontWeight: '700' },

  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.inkMid, marginTop: 14 },
  emptySubText: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, textAlign: 'center', marginTop: 8, letterSpacing: 0.4 },

  archivedSection: { marginTop: 8, marginBottom: 100 },
  archivedToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 4,
    borderTopWidth: 1, borderTopColor: C.divider,
  },
  archivedToggleText: { fontFamily: F.mono, fontSize: 9, color: C.inkLight, letterSpacing: 2 },
  archivedEmpty: { fontFamily: F.mono, fontSize: 11, color: C.inkLight, textAlign: 'center', paddingVertical: 16 },
  archivedCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.divider, borderRadius: 4,
    padding: 12, marginTop: 8, opacity: 0.75,
  },
  archiveIcon: {
    width: 32, height: 32, borderRadius: 3, borderWidth: 1, borderColor: C.divider,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  archivedName: { fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.inkMid },
  unarchiveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 6,
    borderWidth: 1, borderColor: C.stamp, borderRadius: 2,
  },
  unarchiveBtnText: { fontFamily: F.mono, fontSize: 8, color: C.stamp, letterSpacing: 1 },

  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: C.stamp, justifyContent: 'center', alignItems: 'center',
    shadowColor: C.ink, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
  },
});
