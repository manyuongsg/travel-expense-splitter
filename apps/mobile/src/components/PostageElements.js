/**
 * Voyage · Direction A — Postage
 * Shared design components reused across all screens.
 */
import React, { useRef } from 'react';
import { View, Text } from 'react-native';
import Svg, {
  Circle, Line, Path, Rect, Text as SvgText, G,
} from 'react-native-svg';
import { C, F, CATS } from '../theme/postage';

// ─── Typography ──────────────────────────────────────────────────────────────

export function MonoLabel({ children, size = 9, color = C.inkLight, tracking = 1.5, style }) {
  return (
    <Text style={[{
      fontFamily: F.mono, fontSize: size, color,
      letterSpacing: tracking, textTransform: 'uppercase',
    }, style]}>{children}</Text>
  );
}

export function SerifHead({ children, size = 28, color = C.ink, italic = false, weight = '600', style }) {
  return (
    <Text style={[{
      fontFamily: F.serif, fontSize: size, color,
      fontStyle: italic ? 'italic' : 'normal', fontWeight: weight,
      letterSpacing: -0.4, lineHeight: size * 1.1,
    }, style]}>{children}</Text>
  );
}

// ─── Postmark SVG ─────────────────────────────────────────────────────────────

export function Postmark({ city, date, size = 78, color = C.stamp, tilt = -8 }) {
  const r = size / 2 - 2;
  return (
    <Svg
      width={size} height={size}
      style={{ transform: [{ rotate: `${tilt}deg` }], opacity: 0.78 }}
    >
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="1.2" fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r - 5} stroke={color} strokeWidth="0.8" fill="none" strokeDasharray="2,2" />
      <SvgText
        x={size / 2} y={size / 2 - 6} textAnchor="middle"
        fontFamily={F.mono} fontSize={7} letterSpacing={1} fill={color}
      >{city.toUpperCase()}</SvgText>
      <Line x1={10} y1={size / 2} x2={size - 10} y2={size / 2} stroke={color} strokeWidth="0.8" />
      <SvgText
        x={size / 2} y={size / 2 + 12} textAnchor="middle"
        fontFamily={F.mono} fontSize={8} letterSpacing={0.5} fill={color} fontWeight="600"
      >{date}</SvgText>
    </Svg>
  );
}

// ─── Stamp Border ─────────────────────────────────────────────────────────────
// Box-in-box with inner margin to simulate stamp teeth + drop shadow.

export function StampBorder({ width, height, color = C.ink, children, label, tilt = 0, dark = false }) {
  return (
    <View style={{
      width, height,
      transform: [{ rotate: `${tilt}deg` }],
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18, shadowRadius: 4, elevation: 4,
    }}>
      <View style={{
        flex: 1,
        backgroundColor: dark ? '#1a1310' : '#f8f1de',
        // 8px margin simulates space where teeth would be
      }}>
        <View style={{
          flex: 1, margin: 8,
          borderWidth: 1.5, borderColor: color,
          alignItems: 'center', justifyContent: 'center',
          padding: 6,
        }}>
          {children}
          {label ? (
            <Text style={{
              fontFamily: F.mono, fontSize: 7, letterSpacing: 1.5,
              textTransform: 'uppercase', color, marginTop: 3,
            }}>{label}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

// ─── Voyage Logo ──────────────────────────────────────────────────────────────

export function VoyageLogo({ size = 96, color = C.stamp, tilt = -4, label = 'POSTE · USD', showLabel = true }) {
  const w = size;
  const h = Math.round(size * 1.22);
  const lineW = size * 0.52;
  return (
    <StampBorder width={w} height={h} color={color} label={showLabel ? label : null} tilt={tilt}>
      <Text style={{
        fontFamily: F.serif,
        fontSize: size * 0.58,
        lineHeight: size * 0.62,
        fontStyle: 'italic', fontWeight: '600',
        letterSpacing: -1, color,
      }}>V</Text>
      <Svg width={lineW} height={6} style={{ marginTop: -2 }}>
        <Line x1="0" y1="3" x2={lineW} y2="3" stroke={color} strokeWidth="0.9" strokeDasharray="2,2" />
        <Circle cx="2" cy="3" r="1.4" fill={color} />
        <Circle cx={lineW - 2} cy="3" r="1.4" fill={color} />
      </Svg>
    </StampBorder>
  );
}

// ─── Route Map SVG ────────────────────────────────────────────────────────────

export function RouteMapSVG({ width = 300, height = 70, color = C.stamp, bgColor = C.bg }) {
  const stops = [
    { x: 16,  y: 52, label: 'BKK' },
    { x: 110, y: 22, label: 'CNX' },
    { x: 200, y: 46, label: 'HAN' },
    { x: 284, y: 20, label: 'HOI' },
  ];
  return (
    <Svg width={width} height={height}>
      <Path
        d={`M 16 52 C 60 12, 90 64, 110 22 S 180 52, 200 46 T 284 20`}
        stroke={color} strokeWidth="1.4" fill="none" strokeDasharray="3,4"
      />
      {stops.map((s, i) => (
        <G key={i} transform={`translate(${s.x} ${s.y})`}>
          <Circle r="3.5" fill={bgColor} stroke={C.ink} strokeWidth="1.2" />
          <Circle r="1.4" fill={C.ink} />
        </G>
      ))}
      {stops.map((s, i) => (
        <SvgText
          key={`l${i}`}
          x={s.x} y={s.y + (i % 2 === 0 ? 14 : -7)}
          textAnchor="middle"
          fontFamily={F.mono} fontSize={7} fill={C.ink} opacity={0.7}
        >{s.label}</SvgText>
      ))}
    </Svg>
  );
}

// ─── Member Avatar ────────────────────────────────────────────────────────────
// Passport-style monogram circle. Uses hue → hand-picked palette since
// React Native doesn't support oklch().

const HUE_BG = { 14: '#f4d5c5', 200: '#c5d8f4', 340: '#f4c5dd', 130: '#c8f4c5', 280: '#e2c5f4', 40: '#f4e5c5' };
const HUE_FG = { 14: '#7a2a18', 200: '#163a6e', 340: '#6e163a', 130: '#165a16', 280: '#3a166e', 40: '#5a3a10' };

export function MemberAvatar({ initials, hue = 0, size = 32, square = false }) {
  const bg = HUE_BG[hue] || '#e8e0d8';
  const fg = HUE_FG[hue] || C.ink;
  return (
    <View style={{
      width: size, height: size,
      borderRadius: square ? size * 0.12 : size / 2,
      backgroundColor: bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Text style={{
        fontFamily: F.mono, fontSize: size * 0.36, fontWeight: '600',
        letterSpacing: 0.5, color: fg,
      }}>{initials}</Text>
    </View>
  );
}

// ─── Category Chip ────────────────────────────────────────────────────────────

export function CatChip({ category, size = 28 }) {
  const meta = CATS[(category ?? 'OTHER').toUpperCase()] ?? CATS.OTHER;
  return (
    <View style={{
      width: size, height: size, borderRadius: 6, flexShrink: 0,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: `${meta.tint}22`,
    }}>
      <Text style={{ fontFamily: F.serif, fontSize: size * 0.6, fontWeight: '600', color: meta.tint }}>
        {meta.glyph}
      </Text>
    </View>
  );
}

// ─── Balance Bar ──────────────────────────────────────────────────────────────
// Horizontal bar split at midpoint to show positive/negative balance.

export function BalanceBar({ netCents, maxCents = 30000, width = 80 }) {
  const clamp = Math.min(Math.abs(netCents), maxCents);
  const fraction = clamp / maxCents;
  const pos = netCents >= 0;
  const barW = Math.round(fraction * (width / 2));
  return (
    <View style={{ width, height: 4, backgroundColor: `${C.ink}15`, position: 'relative' }}>
      <View style={{
        position: 'absolute', top: 0, bottom: 0,
        left: pos ? width / 2 : width / 2 - barW,
        width: barW,
        backgroundColor: pos ? C.blue : C.stamp,
      }} />
      <View style={{ position: 'absolute', top: -4, bottom: -4, left: width / 2 - 0.5, width: 1, backgroundColor: `${C.ink}50` }} />
    </View>
  );
}

// ─── Spark Bars ───────────────────────────────────────────────────────────────
// Simple horizontal bar chart for daily spend.

export function SparkBars({ data, height = 38, barColor = `${C.ink}55`, maxColor = C.stamp }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.cents), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height }}>
      {data.map((d, i) => {
        const h = Math.max(2, Math.round((d.cents / max) * height));
        const isMax = d.cents === max;
        return (
          <View
            key={i}
            style={{ flex: 1, height: h, backgroundColor: isMax ? maxColor : barColor, borderRadius: 1 }}
          />
        );
      })}
    </View>
  );
}
