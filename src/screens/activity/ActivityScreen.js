/**
 * A7 · Activity — Dispatches feed.
 * Timeline of expenses logged, receipts scanned, and settlements made for a trip.
 * Postage aesthetic: dashed spine, avatar dots, serif body text, monospace metadata.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/tripService';
import { expenseService } from '../../services/expenseService';
import { dbService } from '../../services/dbService';
import { formatCurrency } from '../../utils/currency';
import { C, F, CATS } from '../../theme/postage';
import { MonoLabel, SerifHead, MemberAvatar } from '../../components/PostageElements';

function buildActivityEvents(expenses, settlements, members, settledKeys) {
  const events = [];

  for (const exp of expenses) {
    const paidByName =
      exp.paidBy?.displayName ??
      members.find((m) => m.id === exp.paid_by_member_id)?.name ??
      'Someone';
    const cents = exp.amountCents ?? exp.amount_cents ?? 0;
    const cat = (exp.category ?? 'OTHER').toUpperCase();
    const date = exp.createdAt
      ? new Date(exp.createdAt)
      : new Date();
    events.push({
      kind: 'expense',
      ts: date.getTime(),
      label: date
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        .toUpperCase() +
        ' · ' +
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      actor: paidByName,
      text: `paid for ${exp.description}`,
      cents,
      currency: exp.currency,
      cat,
      expenseId: exp.id,
    });
  }

  for (const s of settlements) {
    const key = `${s.fromName ?? s.fromUser?.displayName}|${s.toName ?? s.toUser?.displayName}`;
    if (!settledKeys.has(key)) continue;
    const fromName = s.fromName ?? s.fromUser?.displayName ?? 'Someone';
    const toName = s.toName ?? s.toUser?.displayName ?? 'Someone';
    events.push({
      kind: 'settle',
      ts: Date.now(),
      label: 'SETTLED',
      actor: fromName,
      text: `settled up with ${toName}`,
      cents: s.amountCents,
      currency: s.currency,
    });
  }

  return events.sort((a, b) => b.ts - a.ts);
}

const KIND_META = {
  expense: { icon: 'receipt-long', color: C.stamp,    badge: 'EXPENSE'  },
  settle:  { icon: 'check-circle',  color: C.positive, badge: 'SETTLED'  },
  scan:    { icon: 'document-scanner', color: C.blue,  badge: 'SCAN'     },
  note:    { icon: 'edit-note',      color: C.ochre,   badge: 'NOTE'     },
};

function EventRow({ event, members, currency }) {
  const meta = KIND_META[event.kind] ?? KIND_META.expense;
  const member = members.find(
    (m) =>
      (m.name ?? m.displayName ?? '').toLowerCase() ===
      event.actor?.toLowerCase()
  );
  const initials = event.actor
    ? event.actor.slice(0, 2).toUpperCase()
    : '??';
  const hue = event.actor
    ? Math.abs(
        event.actor
          .split('')
          .reduce((acc, c) => acc + c.charCodeAt(0), 0)
      ) % 360
    : 0;

  return (
    <View style={styles.eventRow}>
      {/* Timeline dot */}
      <View style={styles.dotCol}>
        <View style={[styles.dot, { borderColor: meta.color }]} />
      </View>

      {/* Content */}
      <View style={styles.eventContent}>
        <MonoLabel size={8} tracking={1.5} color={C.inkLight}>
          {event.label}
        </MonoLabel>

        <View style={styles.eventBody}>
          <MemberAvatar initials={initials} hue={hue} size={28} />
          <View style={styles.eventText}>
            <Text style={styles.bodyText} numberOfLines={2}>
              <Text style={styles.actorText}>{event.actor}</Text>
              {' '}
              {event.text}
              {event.cents ? (
                <Text style={styles.amountChip}>
                  {'  '}
                  {formatCurrency(event.cents, event.currency ?? currency)}
                </Text>
              ) : null}
            </Text>

            <View style={styles.kindRow}>
              <View style={[styles.kindBadge, { borderColor: meta.color }]}>
                <MonoLabel size={7.5} color={meta.color} tracking={1.2}>
                  {meta.badge}
                </MonoLabel>
              </View>
              {event.kind === 'expense' && (
                <MonoLabel size={8} tracking={1} color={C.inkLight}>
                  {event.cat ? ` · ${CATS[event.cat]?.label ?? event.cat}` : ''}
                </MonoLabel>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ActivityScreen({ route, navigation }) {
  const { tripId, tripName, currency = 'USD' } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [trip, expenses, balanceData, settledKeys] = await Promise.all([
        tripService.getById(tripId),
        expenseService.getAll(tripId),
        tripService.getBalances(tripId).catch(() => null),
        dbService.getSettledSettlements(tripId),
      ]);
      const tripMembers = trip.members ?? [];
      setMembers(tripMembers);

      const settlements = (balanceData?.settlements ?? []).map((s) => ({
        fromName: s.fromUser?.displayName,
        toName: s.toUser?.displayName,
        amountCents: s.amountCents,
        currency: trip.baseCurrency,
      }));

      setEvents(buildActivityEvents(expenses, settlements, tripMembers, settledKeys));
    } catch {
      try {
        const [localExpenses, localMembers] = await Promise.all([
          dbService.getExpensesForTrip(tripId),
          dbService.getTripMembers(tripId),
        ]);
        setMembers(localMembers.map((m) => ({ id: m.member_id, name: m.name })));
        setEvents(buildActivityEvents(localExpenses, [], localMembers, new Set()));
      } catch (e) {
        console.error('[Activity] offline fallback failed:', e);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tripId]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.stamp} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 16 + insets.top }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={20} color={C.stamp} />
        </Pressable>
        <View style={styles.headerMid}>
          <MonoLabel size={8} tracking={2} color="rgba(255,255,255,0.5)">
            DISPATCHES
          </MonoLabel>
          <SerifHead size={22} italic weight="500" color="#fff">
            Letters home
          </SerifHead>
        </View>
        <View style={styles.headerRight}>
          <MonoLabel size={8} tracking={1.5} color="rgba(255,255,255,0.5)">
            {events.length} EVENTS
          </MonoLabel>
          <MonoLabel size={8} tracking={1.5} color="rgba(255,255,255,0.5)">
            LIVE
          </MonoLabel>
        </View>
      </View>

      {events.length === 0 ? (
        <View style={styles.emptyCenter}>
          <MaterialIcons name="timeline" size={48} color={C.border} />
          <SerifHead size={18} italic color={C.inkMid} style={{ marginTop: 14 }}>
            No dispatches yet
          </SerifHead>
          <MonoLabel size={10} style={{ marginTop: 8, textAlign: 'center' }}>
            Activity appears here as expenses are logged
          </MonoLabel>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.listContent, { paddingBottom: 40 + insets.bottom }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              tintColor={C.stamp}
            />
          }
        >
          {/* Section label */}
          <View style={styles.sectionLabel}>
            <MonoLabel size={9} tracking={2}>RECENT FIRST · {tripName?.toUpperCase() ?? 'TRIP'}</MonoLabel>
          </View>

          {/* Timeline */}
          <View style={styles.timeline}>
            {/* Spine */}
            <View style={styles.spine} />

            {events.map((event, i) => (
              <EventRow key={i} event={event} members={members} currency={currency} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  header: {
    backgroundColor: C.ink,
    paddingHorizontal: 22,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  backBtn: { marginBottom: 2 },
  headerMid: { flex: 1 },
  headerRight: { alignItems: 'flex-end', gap: 2 },

  scroll: { flex: 1 },
  listContent: { paddingHorizontal: 22, paddingTop: 16 },

  sectionLabel: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: `${C.ink}25`,
    marginBottom: 6,
  },

  timeline: {
    paddingLeft: 24,
    position: 'relative',
  },
  spine: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    width: 1,
    borderLeftWidth: 1,
    borderLeftColor: `${C.ink}35`,
    borderStyle: 'dashed',
  },

  eventRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  dotCol: {
    position: 'absolute',
    left: -18,
    top: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    backgroundColor: C.bg,
  },
  eventContent: { flex: 1 },
  eventBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  eventText: { flex: 1 },
  bodyText: {
    fontFamily: F.serif,
    fontSize: 14,
    lineHeight: 20,
    color: C.ink,
  },
  actorText: {
    fontWeight: '600',
    fontFamily: F.serif,
    fontSize: 14,
  },
  amountChip: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.inkMid,
    backgroundColor: `${C.ink}10`,
  },
  kindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  kindBadge: {
    borderWidth: 0.8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },

  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
});
