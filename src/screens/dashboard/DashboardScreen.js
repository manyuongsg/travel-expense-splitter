import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/tripService';
import { dbService } from '../../services/dbService';
import { formatCurrency } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { C, F } from '../../theme/postage';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
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

  const recentTrips = trips.slice(0, 3);
  const uniqueMates = new Set(trips.flatMap((t) => (t.members ?? []).map((m) => m.id))).size;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.stamp} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchTrips(true)} tintColor={C.stamp} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.displayName?.split(' ')[0] ?? 'Traveller'}</Text>
        </View>
        <Pressable onPress={logout} hitSlop={12}>
          <MaterialIcons name="logout" size={20} color={C.inkLight} />
        </Pressable>
      </View>

      {/* Stats telegram */}
      <View style={styles.statsCard}>
        <View style={styles.statsInner}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{trips.length}</Text>
            <Text style={styles.statLabel}>TRIPS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{uniqueMates}</Text>
            <Text style={styles.statLabel}>MATES</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {trips.filter((t) => (t.totalAmountCents ?? 0) > 0).length}
            </Text>
            <Text style={styles.statLabel}>ACTIVE</Text>
          </View>
        </View>
      </View>

      {/* New trip CTA */}
      <Pressable style={styles.newTripBtn} onPress={() => navigation.navigate('CreateTrip')}>
        <MaterialIcons name="add" size={18} color="#fff" />
        <Text style={styles.newTripBtnText}>PLAN A NEW TRIP</Text>
      </Pressable>

      {/* Recent trips */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Recent Trips</Text>
          <Pressable onPress={() => navigation.navigate('Trips')}>
            <Text style={styles.seeAll}>See all →</Text>
          </Pressable>
        </View>

        {recentTrips.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="flight-takeoff" size={36} color={C.border} />
            <Text style={styles.emptyTitle}>No trips yet</Text>
            <Text style={styles.emptyBody}>Tap "Plan a New Trip" to get started</Text>
          </View>
        ) : (
          recentTrips.map((trip) => (
            <Pressable
              key={trip.id}
              style={styles.tripCard}
              onPress={() => navigation.navigate('TripDetail', { tripId: trip.id, tripName: trip.name })}
            >
              <View style={styles.stampIcon}>
                <MaterialIcons name="flight" size={16} color={C.stamp} />
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripName} numberOfLines={1}>{trip.name}</Text>
                <Text style={styles.tripMeta}>
                  {trip.memberCount ?? 0} members · {trip.baseCurrency}
                </Text>
              </View>
              <Text style={styles.tripAmount}>
                {formatCurrency(trip.totalAmountCents ?? 0, trip.baseCurrency)}
              </Text>
            </Pressable>
          ))
        )}
      </View>

      {/* Balances shortcut */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Outstanding Balances</Text>
        <Pressable style={styles.balanceCard} onPress={() => navigation.navigate('Balances')}>
          <MaterialIcons name="account-balance-wallet" size={20} color={C.stamp} />
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceTitle}>View what you owe</Text>
            <Text style={styles.balanceSub}>Check settlements across all trips</Text>
          </View>
          <MaterialIcons name="chevron-right" size={18} color={C.border} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18,
    backgroundColor: C.surfaceAlt, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  greeting: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 1.5, textTransform: 'uppercase' },
  userName: { fontFamily: F.serif, fontSize: 26, fontStyle: 'italic', color: C.ink, marginTop: 2 },

  statsCard: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: C.ink, borderRadius: 4, padding: 20,
  },
  statsInner: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: F.mono, fontSize: 28, color: '#fff', fontWeight: '700' },
  statLabel: { fontFamily: F.mono, fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 4, letterSpacing: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 2 },

  newTripBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.stamp, marginHorizontal: 16, marginTop: 12, borderRadius: 3,
    paddingVertical: 14, gap: 8,
  },
  newTripBtnText: { fontFamily: F.mono, color: '#fff', fontSize: 12, letterSpacing: 2, fontWeight: '700' },

  section: { marginHorizontal: 16, marginTop: 28 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  sectionTitle: { fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.ink },
  seeAll: { fontFamily: F.mono, fontSize: 10, color: C.stamp, letterSpacing: 1 },

  emptyCard: {
    alignItems: 'center', backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 28,
  },
  emptyTitle: { fontFamily: F.serif, fontSize: 16, fontStyle: 'italic', color: C.inkMid, marginTop: 10 },
  emptyBody: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, marginTop: 6, textAlign: 'center', letterSpacing: 0.5 },

  tripCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4,
    padding: 14, marginBottom: 8,
  },
  stampIcon: {
    width: 34, height: 34, borderWidth: 1.5, borderColor: C.stamp,
    borderRadius: 3, justifyContent: 'center', alignItems: 'center', marginRight: 12,
    backgroundColor: C.stampBg,
  },
  tripInfo: { flex: 1, marginRight: 10 },
  tripName: { fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.ink },
  tripMeta: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, marginTop: 3, letterSpacing: 0.5 },
  tripAmount: { fontFamily: F.mono, fontSize: 14, color: C.stamp, fontWeight: '700' },

  balanceCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 16, gap: 12,
  },
  balanceInfo: { flex: 1 },
  balanceTitle: { fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.ink },
  balanceSub: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, marginTop: 3, letterSpacing: 0.4 },
});
