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
    } catch {
      const local = await dbService.getAllTrips();
      setTrips(local.map((t) => ({ ...t, baseCurrency: t.base_currency })));
      if (!isRefresh) Toast.show({ type: 'info', text1: 'Showing offline data', position: 'bottom' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchTrips(); }, [fetchTrips]));

  const renderTrip = ({ item }) => (
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
          {item.memberCount ?? 0} members · {item.baseCurrency ?? item.base_currency}
        </Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.tripTotal}>
          {formatCurrency(item.totalAmountCents ?? 0, item.baseCurrency ?? item.base_currency)}
        </Text>
        <MaterialIcons name="chevron-right" size={16} color={C.border} />
      </View>
    </Pressable>
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
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  tripTotal: { fontFamily: F.mono, fontSize: 13, color: C.stamp, fontWeight: '700' },

  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.inkMid, marginTop: 14 },
  emptySubText: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, textAlign: 'center', marginTop: 8, letterSpacing: 0.4 },

  fab: {
    position: 'absolute', bottom: 28, right: 24,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: C.stamp, justifyContent: 'center', alignItems: 'center',
    shadowColor: C.ink, shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
  },
});
