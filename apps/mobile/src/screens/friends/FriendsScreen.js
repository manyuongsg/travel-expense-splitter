import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { tripService } from '../../services/tripService';
import { useAuth } from '../../context/AuthContext';
import { C, F } from '../../theme/postage';

const STAMP_COLORS = [
  { border: '#3a6186', bg: '#e8f0f8', text: '#3a6186' },
  { border: '#7a3030', bg: '#f8e8e8', text: '#7a3030' },
  { border: '#2d6a4f', bg: '#e8f4ea', text: '#2d6a4f' },
  { border: '#614085', bg: '#f0e8f8', text: '#614085' },
  { border: '#8a6020', bg: '#f8f0e0', text: '#8a6020' },
  { border: '#1a5c6e', bg: '#e0f4f8', text: '#1a5c6e' },
  { border: '#7a4020', bg: '#f8ece0', text: '#7a4020' },
];

function colorFor(name = '') {
  return STAMP_COLORS[name.charCodeAt(0) % STAMP_COLORS.length];
}

export default function FriendsScreen() {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFriends = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const trips = await tripService.getAll();
      const selfName = (user?.displayName ?? '').toLowerCase();
      const friendMap = new Map();
      for (const trip of trips) {
        for (const member of trip.members ?? []) {
          const key = member.name.toLowerCase();
          if (key === selfName) continue;
          const existing = friendMap.get(key);
          if (existing) { existing.tripCount += 1; }
          else { friendMap.set(key, { name: member.name, tripCount: 1 }); }
        }
      }
      setFriends([...friendMap.values()].sort((a, b) => b.tripCount - a.tripCount));
    } catch {
      setFriends([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { fetchFriends(); }, [fetchFriends]));

  const renderFriend = ({ item, index }) => {
    const col = colorFor(item.name);
    return (
      <View style={[styles.card, index > 0 && styles.cardBorder]}>
        <View style={[styles.avatar, { borderColor: col.border, backgroundColor: col.bg }]}>
          <Text style={[styles.avatarText, { color: col.text }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <View style={[styles.badge, { borderColor: col.border }]}>
          <Text style={[styles.badgeText, { color: col.text }]}>
            {item.tripCount} trip{item.tripCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={C.stamp} /></View>;
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[styles.listContent, friends.length === 0 && styles.emptyContainer]}
      data={friends}
      keyExtractor={(item) => item.name}
      renderItem={renderFriend}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchFriends(true)} tintColor={C.stamp} />
      }
      ListHeaderComponent={
        friends.length > 0 ? (
          <Text style={styles.headerLabel}>
            {friends.length} travel mate{friends.length !== 1 ? 's' : ''}
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>✈</Text>
          <Text style={styles.emptyTitle}>No travel mates yet</Text>
          <Text style={styles.emptySub}>Add members to your trips and they'll appear here</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listContent: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg },

  headerLabel: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, letterSpacing: 1.5, marginBottom: 16, textTransform: 'uppercase' },

  card: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  cardBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  avatar: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { fontFamily: F.serif, fontSize: 20, fontStyle: 'italic', fontWeight: '600' },
  name: { fontFamily: F.serif, fontSize: 16, fontStyle: 'italic', color: C.ink, flex: 1 },
  badge: {
    borderWidth: 1, borderRadius: 2,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  badgeText: { fontFamily: F.mono, fontSize: 10, letterSpacing: 0.5 },

  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingHorizontal: 40 },
  emptyIcon: { fontSize: 44, marginBottom: 4 },
  emptyTitle: { fontFamily: F.serif, fontSize: 18, fontStyle: 'italic', color: C.inkMid, marginTop: 10 },
  emptySub: { fontFamily: F.mono, fontSize: 10, color: C.inkLight, textAlign: 'center', marginTop: 8, letterSpacing: 0.4 },
});
