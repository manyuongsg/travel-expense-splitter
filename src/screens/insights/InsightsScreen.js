/**
 * A5 · An accounting — Insights / Almanac.
 * Donut by category, bars by member (who paid most), daily sparkline.
 * Receives { tripId, expenses, members, currency } via route.params.
 */
import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
} from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { formatCurrency } from '../../utils/currency';
import { C, F, CATS } from '../../theme/postage';
import { MonoLabel, SerifHead, SparkBars, MemberAvatar } from '../../components/PostageElements';

// ─── Donut chart (pure SVG) ───────────────────────────────────────────────────

function DonutChart({ segments, label, sublabel, size = 130, stroke = 20 }) {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;

  let acc = 0;
  const arcs = segments.map((seg, i) => {
    const len = (seg.value / total) * circ;
    const off = circ - acc;
    acc += len;
    return (
      <Circle
        key={i}
        cx={size / 2} cy={size / 2} r={r}
        stroke={seg.color} strokeWidth={stroke} fill="none"
        strokeDasharray={`${len} ${circ - len}`}
        strokeDashoffset={off}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        strokeLinecap="butt"
      />
    );
  });

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size}>
        {/* track */}
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={`${C.ink}15`} strokeWidth={stroke} fill="none"
        />
        {arcs}
      </Svg>
      {/* centre label */}
      <View style={StyleSheet.absoluteFillObject}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.donutLabel}>{label}</Text>
          {sublabel ? <Text style={styles.donutSub}>{sublabel}</Text> : null}
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function InsightsScreen({ route }) {
  const {
    expenses = [],
    members  = [],
    currency = 'USD',
  } = route.params ?? {};

  // By category
  const byCat = useMemo(() => {
    const m = {};
    for (const e of expenses) {
      const k = (e.category ?? 'OTHER').toUpperCase();
      m[k] = (m[k] || 0) + (e.amountCents ?? e.amount_cents ?? 0);
    }
    return m;
  }, [expenses]);

  const donutSegments = useMemo(() =>
    Object.entries(byCat).map(([k, v]) => ({
      value: v,
      color: CATS[k]?.tint ?? CATS.OTHER.tint,
      label: CATS[k]?.label ?? 'Other',
    })), [byCat]);

  // By member (who paid)
  const byMember = useMemo(() => {
    const m = {};
    for (const e of expenses) {
      const id = e.paidBy?.id ?? e.paid_by_member_id;
      if (id) m[id] = (m[id] || 0) + (e.amountCents ?? e.amount_cents ?? 0);
    }
    return m;
  }, [expenses]);

  const maxPaid = Math.max(...Object.values(byMember), 1);

  // Daily totals for sparkline
  const dailyTotals = useMemo(() => {
    const order = [];
    const m = {};
    for (const e of expenses) {
      const d = e.createdAt
        ? new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Unknown';
      if (!(d in m)) { m[d] = 0; order.push(d); }
      m[d] += e.amountCents ?? e.amount_cents ?? 0;
    }
    return order.map((d) => ({ date: d, cents: m[d] }));
  }, [expenses]);

  const peakDay = dailyTotals.length
    ? dailyTotals.reduce((a, b) => (b.cents > a.cents ? b : a), dailyTotals[0])
    : null;

  const totalCents = expenses.reduce((s, e) => s + (e.amountCents ?? e.amount_cents ?? 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header */}
      <View style={styles.header}>
        <MonoLabel size={9} tracking={2} color={C.inkLight}>ALMANAC</MonoLabel>
        <SerifHead size={32} italic weight="500" style={{ marginTop: 4 }}>An accounting</SerifHead>
        <MonoLabel size={9} style={{ marginTop: 2 }}>WHERE THE MONEY WENT</MonoLabel>
      </View>

      {/* Donut + legend */}
      <View style={styles.donutSection}>
        {donutSegments.length > 0 ? (
          <DonutChart
            size={130} stroke={20} segments={donutSegments}
            label={formatCurrency(totalCents, currency)}
            sublabel="TOTAL"
          />
        ) : (
          <View style={styles.donutEmpty}>
            <SerifHead size={14} italic color={C.inkLight}>No data</SerifHead>
          </View>
        )}
        <View style={styles.donutLegend}>
          {Object.entries(byCat)
            .sort((a, b) => b[1] - a[1])
            .map(([k, v]) => (
              <View key={k} style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: CATS[k]?.tint ?? CATS.OTHER.tint }]} />
                <SerifHead size={13} style={{ flex: 1 }}>{CATS[k]?.label ?? k}</SerifHead>
                <MonoLabel size={10} color={C.ink} tracking={0}>
                  {formatCurrency(v, currency)}
                </MonoLabel>
              </View>
            ))}
        </View>
      </View>

      <View style={styles.rule} />

      {/* Bars by member */}
      <View style={styles.section}>
        <MonoLabel size={9} tracking={2}>BY TRAVELLER · PAID</MonoLabel>
        <View style={styles.memberBars}>
          {members.map((m, i) => {
            const v = byMember[m.id] ?? 0;
            const pct = (v / maxPaid) * 100;
            return (
              <View key={m.id} style={styles.memberBarRow}>
                <MemberAvatar
                  initials={(m.name ?? m.displayName ?? '??').slice(0, 2).toUpperCase()}
                  hue={[14, 200, 340, 130, 280, 40][i % 6]}
                  size={20}
                />
                <MonoLabel size={9} tracking={0} style={styles.memberBarName} numberOfLines={1}>
                  {(m.name ?? m.displayName ?? '??').toUpperCase()}
                </MonoLabel>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: ['#c4623a','#3f6d8a','#7a4d8c','#3a6b5c','#d8a86a','#8a6a3a'][i % 6] }]} />
                </View>
                <MonoLabel size={9} tracking={0} style={{ width: 64, textAlign: 'right' }}>
                  {formatCurrency(v, currency)}
                </MonoLabel>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.rule} />

      {/* Daily sparkline */}
      {dailyTotals.length > 1 && (
        <View style={styles.section}>
          <MonoLabel size={9} tracking={2}>DAILY SPEND · {dailyTotals.length} DAYS</MonoLabel>
          <View style={{ marginTop: 12 }}>
            <SparkBars data={dailyTotals} height={56} />
          </View>
          <View style={styles.sparkMeta}>
            <MonoLabel size={8} tracking={1}>{dailyTotals[0]?.date.toUpperCase()}</MonoLabel>
            {peakDay && (
              <MonoLabel size={8} tracking={1}>
                PEAK {formatCurrency(peakDay.cents, currency)} · {peakDay.date.toUpperCase()}
              </MonoLabel>
            )}
            <MonoLabel size={8} tracking={1}>{dailyTotals[dailyTotals.length - 1]?.date.toUpperCase()}</MonoLabel>
          </View>
        </View>
      )}

      {/* Footer editorial note */}
      <View style={styles.footer}>
        <View style={styles.footerRule} />
        <Text style={styles.footerQuote}>
          "Every line in this ledger is a memory. The numbers add up; the experiences don't."
        </Text>
        <MonoLabel size={7.5} tracking={2} style={{ marginTop: 6 }}>— VOYAGE LEDGER NOTE</MonoLabel>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content:   { padding: 22, paddingBottom: 48 },

  header: { marginBottom: 24 },

  donutSection: {
    flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24,
  },
  donutLabel: { fontFamily: F.mono, fontSize: 16, fontWeight: '700', color: C.ink, textAlign: 'center' },
  donutSub:   { fontFamily: F.mono, fontSize: 8, color: C.inkLight, letterSpacing: 1.2, textAlign: 'center', marginTop: 2 },
  donutEmpty: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center' },
  donutLegend: { flex: 1, gap: 6 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 1 },

  rule: { height: 1, backgroundColor: `${C.ink}25`, marginVertical: 20 },

  section: { marginBottom: 8 },
  memberBars: { marginTop: 12, gap: 8 },
  memberBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberBarName: { width: 56 },
  barTrack: { flex: 1, height: 8, backgroundColor: `${C.ink}10` },
  barFill:  { height: '100%', backgroundColor: C.blue },

  sparkMeta: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 6,
  },

  footer: { marginTop: 20 },
  footerRule: { height: 1, backgroundColor: `${C.ink}40`, marginBottom: 10 },
  footerQuote: {
    fontFamily: F.serif, fontStyle: 'italic', fontSize: 13,
    color: C.inkMid, lineHeight: 20, opacity: 0.8,
  },
});
