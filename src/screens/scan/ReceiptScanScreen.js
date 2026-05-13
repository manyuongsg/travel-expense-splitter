/**
 * A6 · Receipt — Camera/OCR scan screen.
 * Dark viewfinder with corner brackets, simulated parsing, and a parsed result sheet.
 * Tapping "Log expense" pre-fills AddExpense with the parsed total and description.
 * No expo-camera needed — simulates scanning from a receipt image UI.
 */
import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { C, F } from '../../theme/postage';
import { MonoLabel, SerifHead } from '../../components/PostageElements';

// Mock parsed line items — in a real implementation this comes from an OCR service
const MOCK_RECEIPTS = [
  {
    merchant: 'Som Tam Nua',
    location: 'Siam Center · Bangkok',
    currency: 'THB',
    exchangeRate: 0.028,
    lines: [
      { desc: 'Papaya salad',     amount: 120 },
      { desc: 'Grilled chicken',  amount: 180 },
      { desc: 'Sticky rice ×6',   amount: 120 },
      { desc: 'Leo beer ×4',      amount: 320 },
      { desc: 'Water ×2',         amount:  40 },
    ],
  },
  {
    merchant: 'Night Market',
    location: 'Chiang Mai Old City',
    currency: 'THB',
    exchangeRate: 0.028,
    lines: [
      { desc: 'Khao soi ×2',      amount: 140 },
      { desc: 'Mango sticky rice', amount:  80 },
      { desc: 'Chang beer ×3',    amount: 240 },
    ],
  },
  {
    merchant: 'Pho Thin',
    location: 'Old Quarter · Hanoi',
    currency: 'VND',
    exchangeRate: 0.000039,
    lines: [
      { desc: 'Pho bo ×4',        amount: 240000 },
      { desc: 'Banh mi ×3',       amount:  75000 },
      { desc: 'Ca phe trung ×4',  amount:  80000 },
    ],
  },
];

function fmtCurrency(amount, currency) {
  const sym = currency === 'THB' ? '฿' : currency === 'VND' ? '₫' : '$';
  return `${sym}${amount.toLocaleString()}`;
}

function fmtUSD(amount, rate) {
  return `≈ $${(amount * rate).toFixed(2)} USD`;
}

export default function ReceiptScanScreen({ route, navigation }) {
  const { tripId, members = [], currency = 'USD', homeCurrency = 'USD' } = route.params ?? {};
  const insets = useSafeAreaInsets();

  const [scanning, setScanning] = useState(false);
  const [parsed, setParsed]     = useState(null);

  const simulateScan = () => {
    setScanning(true);
    setParsed(null);
    const receipt = MOCK_RECEIPTS[Math.floor(Math.random() * MOCK_RECEIPTS.length)];
    // Simulate OCR delay
    setTimeout(() => {
      setScanning(false);
      setParsed(receipt);
    }, 1600);
  };

  const logExpense = () => {
    if (!parsed) return;
    const totalLocal = parsed.lines.reduce((s, l) => s + l.amount, 0);
    const totalUSD   = Math.round(totalLocal * parsed.exchangeRate * 100); // cents

    navigation.navigate('AddExpense', {
      tripId,
      members,
      currency,
      homeCurrency,
      prefill: {
        description: parsed.merchant,
        amountCents: totalUSD,
        originalCurrency: parsed.currency,
        originalAmount: totalLocal,
        exchangeRate: parsed.exchangeRate,
        category: 'FOOD',
      },
    });
  };

  const total = parsed
    ? parsed.lines.reduce((s, l) => s + l.amount, 0)
    : 0;

  return (
    <View style={styles.container}>
      {/* Dark viewfinder background */}
      <View style={styles.viewfinder}>
        {/* Vignette overlay */}
        <View style={styles.vignette} />

        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: 14 + insets.top }]}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <MaterialIcons name="close" size={24} color={C.bg} />
          </Pressable>
          <MonoLabel size={10} tracking={2} color={C.bg} style={{ opacity: 0.85 }}>
            RECEIPT · SCAN
          </MonoLabel>
          <View style={{ width: 24 }} />
        </View>

        {/* Scan area brackets */}
        {!parsed && (
          <View style={styles.scanFrame}>
            <View style={[styles.bracket, styles.bracketTL]} />
            <View style={[styles.bracket, styles.bracketTR]} />
            <View style={[styles.bracket, styles.bracketBL]} />
            <View style={[styles.bracket, styles.bracketBR]} />

            {/* Mock receipt paper in viewfinder */}
            <View style={styles.receiptMock}>
              <Text style={styles.receiptMockTitle}>SOM TAM NUA</Text>
              <Text style={styles.receiptMockSub}>SIAM CENTER · BANGKOK</Text>
              <View style={styles.receiptDivider} />
              {['PAPAYA SALAD  120', 'GRILLED CHICKEN  180', 'STICKY RICE ×6  120', 'BEER LEO ×4  320'].map((line) => (
                <Text key={line} style={styles.receiptMockLine}>{line}</Text>
              ))}
              <View style={styles.receiptDivider} />
              <Text style={[styles.receiptMockLine, { fontWeight: '700' }]}>TOTAL THB  780</Text>
              <Text style={[styles.receiptMockSub, { marginTop: 4 }]}>ขอบคุณค่ะ</Text>
            </View>

            {scanning && (
              <View style={styles.scanningOverlay}>
                <View style={styles.scanLine} />
                <ActivityIndicator size="small" color={C.bg} style={{ marginTop: 12 }} />
                <MonoLabel size={9} tracking={2} color={C.bg} style={{ marginTop: 6 }}>
                  PARSING…
                </MonoLabel>
              </View>
            )}
          </View>
        )}

        {/* Parsed result sheet */}
        {parsed && (
          <View style={[styles.resultSheet, { paddingBottom: 24 + insets.bottom }]}>
            {/* Header */}
            <View style={styles.resultHeader}>
              <View style={styles.resultHeaderLeft}>
                <SerifHead size={20} italic>
                  {parsed.merchant}
                </SerifHead>
                <MonoLabel size={8.5} tracking={1.5} color={C.inkLight}>
                  {parsed.location.toUpperCase()}
                </MonoLabel>
              </View>
              <View style={styles.ocrBadge}>
                <MonoLabel size={8} color={C.bg} tracking={1.5}>
                  OCR · 96%
                </MonoLabel>
              </View>
            </View>

            {/* Line items */}
            <View style={styles.lineItems}>
              {parsed.lines.map((line, i) => (
                <View key={i} style={styles.lineItem}>
                  <Text style={styles.lineDesc}>{line.desc}</Text>
                  <Text style={styles.lineAmt}>
                    {fmtCurrency(line.amount, parsed.currency)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Total */}
            <View style={styles.totalRow}>
              <SerifHead size={22} weight="600">
                {fmtCurrency(total, parsed.currency)}
              </SerifHead>
              <MonoLabel size={9} tracking={1.5} color={C.inkLight}>
                {fmtUSD(total, parsed.exchangeRate)}
              </MonoLabel>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable style={styles.logBtn} onPress={logExpense}>
                <SerifHead size={18} italic color={C.bg}>
                  Log as expense
                </SerifHead>
                <MonoLabel size={9} tracking={1.8} color={C.bg}>
                  FILE →
                </MonoLabel>
              </Pressable>
              <Pressable style={styles.rescanBtn} onPress={simulateScan}>
                <MonoLabel size={9} tracking={1.5} color={C.ink}>
                  SCAN AGAIN
                </MonoLabel>
              </Pressable>
            </View>
          </View>
        )}

        {/* Shutter row — shown only when no parsed result yet */}
        {!parsed && (
          <View style={[styles.shutterRow, { paddingBottom: 24 + insets.bottom }]}>
            <MonoLabel size={10} tracking={1.5} color={`${C.bg}aa`}>
              FLASH
            </MonoLabel>
            <Pressable
              style={[styles.shutterBtn, scanning && styles.shutterBtnScanning]}
              onPress={simulateScan}
              disabled={scanning}
            >
              <View style={[styles.shutterInner, scanning && styles.shutterInnerScanning]} />
            </Pressable>
            <MonoLabel size={10} tracking={1.5} color={`${C.bg}aa`}>
              FILE →
            </MonoLabel>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e0a07' },

  viewfinder: {
    flex: 1,
    backgroundColor: '#0e0a07',
    alignItems: 'center',
  },

  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // Simulated vignette via borders
    borderWidth: 60,
    borderColor: 'rgba(0,0,0,0.55)',
    pointerEvents: 'none',
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 12,
    zIndex: 10,
  },

  scanFrame: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },

  bracket: {
    position: 'absolute',
    width: 28,
    height: 28,
  },
  bracketTL: { top: 60,  left: 48,  borderTopWidth: 2,    borderLeftWidth: 2,  borderColor: C.bg },
  bracketTR: { top: 60,  right: 48, borderTopWidth: 2,    borderRightWidth: 2, borderColor: C.bg },
  bracketBL: { bottom: 180, left: 48,  borderBottomWidth: 2, borderLeftWidth: 2,  borderColor: C.bg },
  bracketBR: { bottom: 180, right: 48, borderBottomWidth: 2, borderRightWidth: 2, borderColor: C.bg },

  receiptMock: {
    width: 200,
    padding: 14,
    backgroundColor: '#f7eecf',
    transform: [{ rotate: '-3deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  receiptMockTitle: {
    fontFamily: F.mono,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#1f1812',
    textAlign: 'center',
  },
  receiptMockSub: {
    fontFamily: F.mono,
    fontSize: 8,
    color: '#1f1812',
    opacity: 0.7,
    textAlign: 'center',
  },
  receiptDivider: {
    borderTopWidth: 1,
    borderTopColor: '#1f181255',
    borderStyle: 'dashed',
    marginVertical: 5,
  },
  receiptMockLine: {
    fontFamily: F.mono,
    fontSize: 9,
    color: '#1f1812',
    lineHeight: 15,
    letterSpacing: 0.5,
  },

  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scanLine: {
    width: '70%',
    height: 2,
    backgroundColor: C.stamp,
    opacity: 0.8,
  },

  resultSheet: {
    position: 'absolute',
    bottom: 0,
    left: 16,
    right: 16,
    backgroundColor: C.bg,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultHeaderLeft: { flex: 1 },
  ocrBadge: {
    backgroundColor: C.stamp,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    marginTop: 4,
  },

  lineItems: {
    borderTopWidth: 1,
    borderTopColor: `${C.ink}40`,
    borderStyle: 'dashed',
    paddingTop: 8,
    gap: 3,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lineDesc: { fontFamily: F.serif, fontSize: 13, color: C.ink },
  lineAmt:  { fontFamily: F.mono,  fontSize: 10, color: C.ink },

  totalRow: {
    borderTopWidth: 1,
    borderTopColor: C.ink,
    marginTop: 8,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },

  actions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  logBtn: {
    flex: 1.4,
    backgroundColor: C.ink,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rescanBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },

  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    paddingTop: 20,
  },
  shutterBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtnScanning: { borderColor: `${C.bg}55` },
  shutterInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: C.bg,
  },
  shutterInnerScanning: { backgroundColor: `${C.bg}55` },
});
