import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tripService } from '../../services/tripService';
import { dbService } from '../../services/dbService';
import { formatCurrency } from '../../utils/currency';
import Toast from 'react-native-toast-message';
import { C, F } from '../../theme/postage';

export default function BalanceScreen({ route }) {
  const { tripId, currency = 'USD' } = route.params;
  const [settlements, setSettlements] = useState([]);
  const [memberBalances, setMemberBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await tripService.getBalances(tripId);
        setSettlements(
          (data.settlements ?? []).map((s) => ({
            fromName: s.fromUser?.displayName ?? 'Unknown',
            toName: s.toUser?.displayName ?? 'Unknown',
            amountCents: s.amountCents,
          }))
        );
        setMemberBalances(
          (data.memberBalances ?? []).map((b) => ({
            name: b.user?.displayName ?? 'Unknown',
            netCents: b.netAmountCents,
          }))
        );
      } catch {
        const local = await dbService.computeLocalBalances(tripId);
        setSettlements(local);
        setIsOffline(true);
        Toast.show({ type: 'info', text1: 'Showing offline balances', position: 'bottom' });
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId]);

  const renderSettlement = ({ item, index }) => (
    <View style={[styles.settlementCard, index > 0 && styles.settlementBorder]}>
      <View style={styles.settlementRow}>
        <View style={styles.person}>
          <View style={styles.initial}>
            <Text style={styles.initialText}>{item.fromName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.personName}>{item.fromName}</Text>
        </View>

        <View style={styles.arrowArea}>
          <Text style={styles.owesAmount}>{formatCurrency(item.amountCents, currency)}</Text>
          <Text style={styles.arrowLine}>- - - - →</Text>
        </View>

        <View style={styles.person}>
          <View style={[styles.initial, styles.initialTo]}>
            <Text style={[styles.initialText, styles.initialTextTo]}>{item.toName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.personName}>{item.toName}</Text>
        </View>
      </View>
    </View>
  );

  const renderMemberBalance = ({ item, index }) => (
    <View style={[styles.balanceRow, index > 0 && styles.balanceRowBorder]}>
      <Text style={styles.memberName}>{item.name}</Text>
      <Text style={[
        styles.netAmount,
        item.netCents > 0 ? styles.positive : item.netCents < 0 ? styles.negative : styles.neutral,
      ]}>
        {item.netCents > 0
          ? `+${formatCurrency(item.netCents, currency)}`
          : item.netCents < 0
          ? `-${formatCurrency(Math.abs(item.netCents), currency)}`
          : 'settled'}
      </Text>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.stamp} /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      ListHeaderComponent={
        <View>
          {isOffline && (
            <View style={styles.offlineBanner}>
              <MaterialIcons name="wifi-off" size={14} color={C.stamp} />
              <Text style={styles.offlineText}>offline — local data only</Text>
            </View>
          )}

          {memberBalances.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>NET BALANCES</Text>
              {memberBalances.map((item, i) => (
                <View key={item.name}>
                  {renderMemberBalance({ item, index: i })}
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionLabel}>SUGGESTED SETTLEMENTS</Text>

          {settlements.length === 0 && (
            <View style={styles.allSettled}>
              <View style={styles.settledStamp}>
                <Text style={styles.settledStampText}>SETTLED</Text>
              </View>
              <Text style={styles.allSettledText}>All squared away</Text>
              <Text style={styles.allSettledSub}>No outstanding balances in this trip</Text>
            </View>
          )}
        </View>
      }
      data={settlements}
      keyExtractor={(_, i) => String(i)}
      renderItem={renderSettlement}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },
  listContent: { padding: 16 },

  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.stampSoft, borderRadius: 3, padding: 10, marginBottom: 14,
    borderWidth: 1, borderColor: C.stampSoft,
  },
  offlineText: { fontFamily: F.mono, fontSize: 11, color: C.stamp, letterSpacing: 0.8 },

  section: {
    backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 4, padding: 16, marginBottom: 20,
  },
  sectionLabel: { fontFamily: F.mono, fontSize: 9, color: C.inkLight, letterSpacing: 2, marginBottom: 14 },

  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  balanceRowBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  memberName: { fontFamily: F.serif, fontSize: 15, fontStyle: 'italic', color: C.ink },
  netAmount: { fontFamily: F.mono, fontSize: 14, fontWeight: '700' },
  positive: { color: C.positive },
  negative: { color: C.negative },
  neutral: { color: C.inkLight },

  settlementCard: { paddingVertical: 18 },
  settlementBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  settlementRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  person: { alignItems: 'center', width: 80 },
  initial: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1.5,
    borderColor: C.border, backgroundColor: C.surface,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  initialTo: { borderColor: C.positive, backgroundColor: C.positiveBg },
  initialText: { fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.inkMid },
  initialTextTo: { color: C.positive },
  personName: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 0.5, textAlign: 'center' },

  arrowArea: { flex: 1, alignItems: 'center' },
  owesAmount: { fontFamily: F.mono, fontSize: 14, color: C.ink, fontWeight: '700', marginBottom: 4 },
  arrowLine: { fontFamily: F.mono, fontSize: 12, color: C.stamp, letterSpacing: -1 },

  allSettled: { alignItems: 'center', paddingVertical: 40 },
  settledStamp: {
    borderWidth: 3, borderColor: C.positive, borderRadius: 4,
    paddingHorizontal: 20, paddingVertical: 10, marginBottom: 20,
    transform: [{ rotate: '-5deg' }],
  },
  settledStampText: { fontFamily: F.mono, fontSize: 20, color: C.positive, letterSpacing: 4, fontWeight: '700' },
  allSettledText: { fontFamily: F.serif, fontSize: 20, fontStyle: 'italic', color: C.ink, marginBottom: 6 },
  allSettledSub: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, textAlign: 'center', letterSpacing: 0.4 },
});
