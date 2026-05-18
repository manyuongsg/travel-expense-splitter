import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { C, F, CATS } from '../theme/postage';

const CATEGORY_META = Object.fromEntries(
  Object.entries(CATS).map(([k, v]) => [k, { label: v.label, color: v.tint }])
);

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, outerR, innerR, startDeg, endDeg) {
  const s = polarToCartesian(cx, cy, outerR, startDeg);
  const e = polarToCartesian(cx, cy, outerR, endDeg);
  const si = polarToCartesian(cx, cy, innerR, endDeg);
  const ei = polarToCartesian(cx, cy, innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${e.x} ${e.y}`,
    `L ${si.x} ${si.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${ei.x} ${ei.y}`,
    'Z',
  ].join(' ');
}

export default function CategoryPieChart({ expenses }) {
  const slices = useMemo(() => {
    const totals = {};
    let grand = 0;
    for (const e of expenses) {
      const cat = (e.category ?? 'OTHER').toUpperCase();
      const cents = e.amountCents ?? e.amount_cents ?? 0;
      totals[cat] = (totals[cat] ?? 0) + cents;
      grand += cents;
    }
    if (grand === 0) return [];
    return Object.entries(totals)
      .map(([cat, cents]) => ({
        cat,
        pct: cents / grand,
        color: CATEGORY_META[cat]?.color ?? CATEGORY_META.OTHER.color,
        label: CATEGORY_META[cat]?.label ?? 'Other',
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [expenses]);

  if (slices.length === 0) return null;

  const SIZE = 144;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const outerR = SIZE / 2 - 2;
  const innerR = outerR * 0.54;

  let cursor = 0;
  const paths = slices.map((s) => {
    const start = cursor;
    // Clamp to avoid degenerate full-circle arc (100% single slice)
    const sweep = s.pct >= 1 ? 359.99 : s.pct * 360;
    const end = start + sweep;
    cursor += s.pct * 360;
    return { ...s, d: arcPath(cx, cy, outerR, innerR, start, end) };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SPENDING BY CATEGORY</Text>
      <View style={styles.body}>
        <Svg width={SIZE} height={SIZE}>
          {paths.map((s) => (
            <Path key={s.cat} d={s.d} fill={s.color} stroke={C.bg} strokeWidth={1.5} />
          ))}
          <Circle cx={cx} cy={cy} r={innerR} fill={C.surface} />
        </Svg>
        <View style={styles.legend}>
          {slices.map((s) => (
            <View key={s.cat} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={styles.legendLabel} numberOfLines={1}>{s.label}</Text>
              <Text style={styles.legendPct}>{Math.round(s.pct * 100)}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    padding: 14,
    marginBottom: 10,
  },
  title: {
    fontFamily: F.mono,
    fontSize: 9,
    color: C.inkLight,
    letterSpacing: 2,
    marginBottom: 12,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  legend: {
    flex: 1,
    gap: 7,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendLabel: {
    flex: 1,
    fontFamily: F.mono,
    fontSize: 10,
    color: C.inkMid,
    letterSpacing: 0.2,
  },
  legendPct: {
    fontFamily: F.mono,
    fontSize: 11,
    color: C.ink,
    fontWeight: '700',
    minWidth: 34,
    textAlign: 'right',
  },
});
