/**
 * A1 · Cover — Voyage editorial dashboard.
 * Passport-spread style: route map, serif headline, ticket-stub CTAs, recent trips.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/tripService';
import { expenseService } from '../../services/expenseService';
import { dbService } from '../../services/dbService';
import { formatCurrency, HOME_CURRENCY } from '../../utils/currency';
import { useAuth } from '../../context/AuthContext';
import { C, F } from '../../theme/postage';
import {
  MonoLabel, SerifHead, Postmark, StampBorder, RouteMapSVG, MemberAvatar,
} from '../../components/PostageElements';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myBalances, setMyBalances] = useState([]);
  const [balancesLoading, setBalancesLoading] = useState(false);

  const fetchMyBalances = useCallback(async (tripList) => {
    if (!user || tripList.length === 0) { setMyBalances([]); return; }
    setBalancesLoading(true);
    try {
      const results = await Promise.all(
        tripList.map(async (trip) => {
          try {
            const [data, settled] = await Promise.all([
              tripService.getBalances(trip.id),
              dbService.getSettledSettlements(trip.id),
            ]);
            const mine = (data.memberBalances ?? []).find(
              (b) => b.user?.displayName === user.displayName
            );
            if (!mine) return null;
            let netCents = mine.netAmountCents;
            if (settled.size > 0) {
              for (const s of (data.settlements ?? [])) {
                const fromName = s.fromUser?.displayName ?? 'Unknown';
                const toName = s.toUser?.displayName ?? 'Unknown';
                if (!settled.has(`${fromName}|${toName}`)) continue;
                if (fromName === user.displayName) netCents += s.amountCents;
                if (toName === user.displayName) netCents -= s.amountCents;
              }
            }
            if (netCents === 0) return null;
            return { tripId: trip.id, tripName: trip.name, currency: trip.baseCurrency, netCents };
          } catch { return null; }
        })
      );
      setMyBalances(results.filter(Boolean));
    } finally {
      setBalancesLoading(false);
    }
  }, [user]);

  const fetchTrips = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await tripService.getAll();
      setTrips(data);
      fetchMyBalances(data);
    } catch {
      const local = await dbService.getAllTrips();
      const mapped = local.map((t) => ({ ...t, baseCurrency: t.base_currency }));
      setTrips(mapped);
      fetchMyBalances(mapped);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchMyBalances]);

  useFocusEffect(useCallback(() => { fetchTrips(); }, [fetchTrips]));

  const recentTrips = trips.slice(0, 3);
  const totalMembers = new Set(trips.flatMap((t) => (t.members ?? []).map((m) => m.id))).size;
  const activeCount = trips.filter((t) => (t.totalAmountCents ?? 0) > 0).length;

  // Collect member avatars from most recent trip for the travellers strip
  const recentMembers = (trips[0]?.members ?? []).slice(0, 6);

  const year = new Date().getFullYear();

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.stamp} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchTrips(true)} tintColor={C.stamp} />}
    >
      {/* ── Status bar row ── */}
      <View style={styles.statusRow}>
        <Pressable onPress={() => navigation.navigate('Balances')} hitSlop={8}>
          <MonoLabel size={11} color={C.ink} tracking={0.5} style={{ opacity: 0.7 }}>
            {user?.displayName?.split(' ')[0]?.toUpperCase() ?? 'TRAVELLER'}
          </MonoLabel>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Balances')} hitSlop={12}>
          <MonoLabel size={9} color={C.inkLight} tracking={2}>ACCOUNT →</MonoLabel>
        </Pressable>
      </View>

      {/* ── Hand-drawn route across top ── */}
      <View style={styles.routeRow}>
        <RouteMapSVG width={320} height={72} color={C.stamp} bgColor={C.bg} />
      </View>

      {/* ── Title block ── */}
      <View style={styles.titleBlock}>
        <MonoLabel size={9} tracking={2.2} color={C.inkLight}>
          VOL. {String(trips.length).padStart(2, '0')} · NO. {trips.reduce((s, t) => s + (t.expenseCount ?? 0), 0)} · {year}
        </MonoLabel>
        <SerifHead size={44} italic weight="500" style={{ marginTop: 2 }}>
          {user?.displayName?.split(' ')[0] ?? 'Traveller'}
        </SerifHead>
        <MonoLabel size={9} style={{ marginTop: 4 }}>
          {trips.length} trips · {totalMembers} mates · {HOME_CURRENCY}
        </MonoLabel>
        <View style={styles.rule} />
      </View>

      {/* ── Stats + postmark ── */}
      <View style={styles.statsRow}>
        <View>
          <MonoLabel size={9} tracking={2}>TOTAL TRIPS</MonoLabel>
          <SerifHead size={48} weight="600">{trips.length}</SerifHead>
          <MonoLabel size={9}>{activeCount} ACTIVE · {totalMembers} MATES</MonoLabel>
        </View>
        <Postmark city="VOYAGE" date={String(year)} size={72} color={C.stamp} tilt={-12} />
      </View>

      {/* ── Travellers strip ── */}
      {recentMembers.length > 0 && (
        <View style={styles.travellerStrip}>
          <StampBorder width={68} height={82} tilt={-4} color={C.stamp} label={`${recentMembers.length} · ${HOME_CURRENCY}`}>
            <SerifHead size={26} color={C.stamp} italic weight="600">
              {trips[0]?.name?.slice(0, 2).toUpperCase() ?? 'VG'}
            </SerifHead>
          </StampBorder>
          <View style={styles.travellerRight}>
            <MonoLabel size={9}>FELLOW TRAVELLERS</MonoLabel>
            <View style={styles.avatarRow}>
              {recentMembers.map((m, i) => (
                <View key={m.id} style={[styles.avatarWrap, i > 0 && { marginLeft: -8 }]}>
                  <MemberAvatar
                    initials={(m.name ?? m.displayName ?? '??').slice(0, 2).toUpperCase()}
                    hue={[14, 200, 340, 130, 280, 40][i % 6]}
                    size={32}
                  />
                </View>
              ))}
            </View>
            <MonoLabel size={8} tracking={1.2} style={{ marginTop: 4 }}>
              {recentMembers.map((m) => (m.name ?? m.displayName ?? '??').slice(0, 2).toUpperCase()).join(' · ')}
            </MonoLabel>
          </View>
        </View>
      )}

      {/* ── Ticket-stub action buttons ── */}
      <View style={styles.ticketRow}>
        <Pressable
          style={[styles.ticketBtn, styles.ticketBtnDark]}
          onPress={() => navigation.navigate('Trips')}
        >
          <MonoLabel size={8} tracking={1.5} color="rgba(255,255,255,0.6)">+ NEW TRIP</MonoLabel>
          <Text style={styles.ticketBtnLabel}>Plan a trip</Text>
        </Pressable>
        <Pressable
          style={[styles.ticketBtn, styles.ticketBtnLight]}
          onPress={() => navigation.navigate('Trips')}
        >
          <MonoLabel size={8} tracking={1.5} color={C.inkLight}>VIEW ALL</MonoLabel>
          <Text style={[styles.ticketBtnLabel, { color: C.ink }]}>Ledger →</Text>
        </Pressable>
      </View>

      {/* ── Recent trips ── */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <MonoLabel size={9} tracking={2}>RECENT ENTRIES</MonoLabel>
          <Pressable onPress={() => navigation.navigate('Trips')}>
            <MonoLabel size={9} tracking={1.5} color={C.stamp}>SEE LEDGER →</MonoLabel>
          </Pressable>
        </View>

        {recentTrips.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="flight-takeoff" size={36} color={C.border} />
            <SerifHead size={16} italic color={C.inkMid} style={{ marginTop: 10 }}>No trips yet</SerifHead>
            <MonoLabel size={10} style={{ marginTop: 6, textAlign: 'center' }}>
              Tap "Plan a trip" to begin your ledger
            </MonoLabel>
          </View>
        ) : (
          recentTrips.map((trip, idx) => (
            <Pressable
              key={trip.id}
              style={[styles.tripRow, idx > 0 && styles.tripRowBorder]}
              onPress={() => navigation.navigate('TripDetail', { tripId: trip.id, tripName: trip.name })}
            >
              <MonoLabel size={9} tracking={1.5} style={{ width: 32, opacity: 0.6 }}>
                {String(idx + 1).padStart(2, '0')}
              </MonoLabel>
              <View style={styles.catDot}>
                <MaterialIcons name="flight" size={13} color={C.stamp} />
              </View>
              <View style={styles.tripInfo}>
                <SerifHead size={15} italic weight="500">{trip.name}</SerifHead>
                <MonoLabel size={8} tracking={1.2}>
                  {trip.memberCount ?? 0} MEMBERS · {trip.baseCurrency}
                </MonoLabel>
              </View>
              <View style={styles.amountBlock}>
                <MonoLabel size={8} tracking={1.5}>TOTAL</MonoLabel>
                <SerifHead size={17} weight="600">
                  {formatCurrency(trip.totalAmountCents ?? 0, trip.baseCurrency)}
                </SerifHead>
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* ── Outstanding balances ── */}
      <View style={styles.section}>
        <MonoLabel size={9} tracking={2} style={{ marginBottom: 12 }}>OUTSTANDING BALANCES</MonoLabel>

        {balancesLoading ? (
          <ActivityIndicator size="small" color={C.stamp} style={{ marginTop: 8 }} />
        ) : myBalances.length === 0 ? (
          <View style={styles.settledRow}>
            <View style={styles.settledStamp}>
              <MonoLabel size={11} color={C.positive} tracking={3}>SETTLED</MonoLabel>
            </View>
            <SerifHead size={15} italic color={C.inkMid}>All squared away</SerifHead>
          </View>
        ) : (
          myBalances.map((b, i) => (
            <Pressable
              key={b.tripId}
              style={[styles.balanceRow, i > 0 && styles.tripRowBorder]}
              onPress={() => navigation.navigate('TripBalances', { tripId: b.tripId, currency: b.currency })}
            >
              <View style={styles.tripInfo}>
                <SerifHead size={15} italic weight="500">{b.tripName}</SerifHead>
                <MonoLabel size={8} tracking={1}>
                  {b.netCents < 0 ? 'YOU OWE' : 'OWED TO YOU'}
                </MonoLabel>
              </View>
              <SerifHead size={17} weight="600" color={b.netCents < 0 ? C.stamp : C.blue}>
                {b.netCents < 0 ? '−' : '+'}{formatCurrency(Math.abs(b.netCents), b.currency)}
              </SerifHead>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg },
  content:    { paddingBottom: 48 },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 14, paddingBottom: 4,
  },

  routeRow: { paddingLeft: 16, paddingTop: 10 },

  titleBlock: { paddingHorizontal: 22, paddingTop: 4, paddingBottom: 12 },
  rule: { marginTop: 8, height: 1, backgroundColor: C.ink, opacity: 0.5 },

  statsRow: {
    paddingHorizontal: 22, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'flex-end',
  },

  travellerStrip: {
    paddingHorizontal: 22, marginTop: 20,
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  travellerRight: { flex: 1, gap: 6 },
  avatarRow: { flexDirection: 'row' },
  avatarWrap: { borderWidth: 1.5, borderColor: C.bg, borderRadius: 18 },

  ticketRow: { marginHorizontal: 22, marginTop: 20, flexDirection: 'row', gap: 10 },
  ticketBtn: {
    flex: 1, padding: 14,
    borderWidth: 1, borderColor: C.ink,
  },
  ticketBtnDark: {
    backgroundColor: C.ink, flex: 1.4,
    // notch simulation — pure padding effect
  },
  ticketBtnLight: { backgroundColor: 'transparent' },
  ticketBtnLabel: {
    fontFamily: F.serif, fontSize: 19, fontStyle: 'italic', color: C.surface,
    marginTop: 4,
  },

  section: { paddingHorizontal: 22, marginTop: 28 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },

  emptyCard: {
    alignItems: 'center', paddingVertical: 28,
    borderWidth: 1, borderColor: `${C.ink}40`,
  },

  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  tripRowBorder: { borderTopWidth: 1, borderTopColor: `${C.ink}22` },
  catDot: {
    width: 28, height: 28, borderWidth: 1, borderColor: `${C.stamp}50`,
    alignItems: 'center', justifyContent: 'center',
  },
  tripInfo: { flex: 1, minWidth: 0 },
  amountBlock: { alignItems: 'flex-end' },

  settledRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  settledStamp: {
    borderWidth: 2, borderColor: C.positive,
    paddingHorizontal: 8, paddingVertical: 4,
    transform: [{ rotate: '-5deg' }],
  },

  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
});
