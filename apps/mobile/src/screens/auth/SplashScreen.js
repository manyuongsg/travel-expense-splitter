/**
 * A0 · Splash — Voyage branding screen shown while auth state loads.
 * Cream paper, "V" stamp logo, route dots, loading meter.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, G, Line } from 'react-native-svg';
import { C, F } from '../../theme/postage';
import { StampBorder, Postmark, VoyageLogo } from '../../components/PostageElements';

const SG_RED = '#c8102e';
const ORCHID  = '#7a5ba8';

export default function SplashScreen({ onContinue }) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start();
  }, []);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      {/* Top-right postmark */}
      <View style={[styles.postmarkPos, { top: 38 + insets.top }]}>
        <Postmark city="SINGAPORE" date="MAR 2026" size={68} color={C.stamp} tilt={12} />
      </View>

      {/* Address lines (left edge flourish) */}
      <View style={[styles.addrLines, { top: 80 + insets.top }]}>
        <View style={[styles.addrLine, { width: 80, opacity: 0.5 }]} />
        <View style={[styles.addrLine, { width: 60, opacity: 0.35 }]} />
        <View style={[styles.addrLine, { width: 70, opacity: 0.35 }]} />
      </View>

      {/* Decorative route SVG */}
      <Svg viewBox="0 0 300 60" width={280} height={70} style={styles.routeSvg}>
        <Path
          d="M 8 40 C 60 8, 100 56, 150 24 S 240 50, 292 18"
          stroke={C.stamp} strokeWidth="1.2" fill="none" strokeDasharray="3,4"
        />
        {[{ x: 8, y: 40 }, { x: 150, y: 24 }, { x: 292, y: 18 }].map((p, i) => (
          <G key={i} transform={`translate(${p.x} ${p.y})`}>
            <Circle r="3" fill={C.bg} stroke={C.ink} strokeWidth="1.1" />
            <Circle r="1.2" fill={C.ink} />
          </G>
        ))}
      </Svg>

      {/* Center logo lockup */}
      <View style={styles.logoLockup}>
        <VoyageLogo size={120} color={C.stamp} tilt={-5} label="POSTE · SGD" />
        <View style={styles.wordmarkBlock}>
          <Text style={styles.voyageTitle}>Voyage</Text>
          <Text style={styles.tagline}>A LEDGER FOR TRAVELLERS</Text>
        </View>
      </View>

      {/* Singapore stamps */}
      <View style={styles.twinStamps}>
        {/* SG lion-fish stamp */}
        <StampBorder width={58} height={78} color={SG_RED} label="SG" tilt={-8}>
          <Svg viewBox="0 0 20 28" width={24} height={28}>
            {/* Water spout */}
            <Path d="M 8.5 3 Q 4 0 6 0" stroke={SG_RED} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
            <Path d="M 9.5 2.5 Q 7 0 8 0" stroke={SG_RED} strokeWidth="0.7" fill="none" strokeLinecap="round" opacity={0.5}/>
            {/* Lion head */}
            <Circle cx="10" cy="7" r="5" fill={SG_RED}/>
            {/* Eyes */}
            <Circle cx="8.2" cy="6.3" r="0.9" fill={C.bg}/>
            <Circle cx="11.8" cy="6.3" r="0.9" fill={C.bg}/>
            {/* Fish body */}
            <Path d="M 6 12 L 5 21 L 15 21 L 14 12 Q 10 14 6 12 Z" fill={SG_RED} opacity={0.9}/>
            {/* Scale arcs */}
            <Path d="M 6.5 14 Q 10 13 13.5 14" stroke={C.bg} strokeWidth="0.6" fill="none"/>
            <Path d="M 6 17 Q 10 16 14 17" stroke={C.bg} strokeWidth="0.6" fill="none"/>
            <Path d="M 6 20 Q 10 19 14 20" stroke={C.bg} strokeWidth="0.6" fill="none"/>
            {/* Tail fin */}
            <Path d="M 5 21 Q 1 26 3 28 Q 7 23 10 25 Q 13 23 17 28 Q 19 26 15 21 Z" fill={SG_RED} opacity={0.85}/>
          </Svg>
        </StampBorder>

        {/* SG national orchid stamp */}
        <StampBorder width={58} height={78} color={ORCHID} label="50¢" tilt={5}>
          <Svg viewBox="0 0 20 20" width={22} height={22}>
            {[0, 72, 144, 216, 288].map((deg, i) => (
              <G key={i} transform={`rotate(${deg} 10 10)`}>
                <Path d="M 10 10 Q 7.5 6 10 3 Q 12.5 6 10 10" fill={ORCHID} opacity={0.85}/>
              </G>
            ))}
            <Circle cx="10" cy="10" r="2.5" fill={C.bg}/>
            <Circle cx="10" cy="10" r="1.5" fill={ORCHID}/>
          </Svg>
        </StampBorder>
      </View>

      {/* Loading meter */}
      <View style={styles.meter}>
        <View style={styles.meterRow}>
          <Text style={styles.meterLabel}>SORTING POST</Text>
          <Text style={styles.meterLabel}>READY</Text>
        </View>
        <View style={styles.meterTrack}>
          <Animated.View style={[styles.meterBar, { width: barWidth }]} />
        </View>
      </View>

      {/* Depart button */}
      <TouchableOpacity style={styles.departBtn} onPress={onContinue} activeOpacity={0.7}>
        <Text style={styles.departLabel}>DEPART  →</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>VOL. 03 · ED. III</Text>
        <Text style={styles.footerText}>SPLIT &amp; SHARE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  postmarkPos: { position: 'absolute', top: 38, right: 22 },

  addrLines: { position: 'absolute', top: 80, left: 22, gap: 6 },
  addrLine: { height: 1, backgroundColor: C.ink },

  routeSvg: { position: 'absolute', top: '25%', alignSelf: 'center', opacity: 0.85 },

  logoLockup: {
    position: 'absolute', top: '42%', left: 0, right: 0,
    transform: [{ translateY: -100 }],
    alignItems: 'center', gap: 18,
  },
  wordmarkBlock: { alignItems: 'center' },
  voyageTitle: {
    fontFamily: F.serif, fontSize: 64, fontStyle: 'italic', fontWeight: '500',
    letterSpacing: -1.6, lineHeight: 64, color: C.ink,
  },
  tagline: {
    marginTop: 8, fontFamily: F.mono, fontSize: 9, letterSpacing: 2.4,
    color: C.ink, opacity: 0.7,
  },

  twinStamps: { position: 'absolute', bottom: 130, left: 18, flexDirection: 'row', gap: 6 },
  stampGlyph: { fontFamily: F.serif, fontSize: 14, fontStyle: 'italic', fontWeight: '600' },

  meter: { position: 'absolute', bottom: 110, left: 22, right: 22 },
  meterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  meterLabel: { fontFamily: F.mono, fontSize: 8.5, color: C.ink, letterSpacing: 1.8 },
  meterTrack: { height: 2, backgroundColor: `${C.ink}25` },
  meterBar: { height: '100%', backgroundColor: C.ink },

  departBtn: {
    position: 'absolute', bottom: 62, left: 22, right: 22,
    borderWidth: 1, borderColor: C.ink,
    paddingVertical: 10, alignItems: 'center',
  },
  departLabel: {
    fontFamily: F.mono, fontSize: 11, letterSpacing: 3.5, color: C.ink,
  },

  footer: {
    position: 'absolute', bottom: 28, left: 22, right: 22,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  footerText: { fontFamily: F.mono, fontSize: 8, color: C.ink, letterSpacing: 1.8 },
});
