import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { usePlayerStore } from '@/stores/playerStore';

type LeaderboardPlayer = {
  id: string;
  username: string;
  xp: number;
  level: number;
};

const LEVEL_TITLE: [number, string][] = [
  [51, 'Legend of the Road'],
  [36, 'Apex Collector'],
  [21, 'Road King'],
  [11, 'Highway Hunter'],
  [6,  'Lane Changer'],
  [1,  'Street Spotter'],
];

function levelTitle(level: number): string {
  for (const [min, title] of LEVEL_TITLE) {
    if (level >= min) return title;
  }
  return 'Street Spotter';
}

function PlayerRow({ item, rank, myId }: { item: LeaderboardPlayer; rank: number; myId: string | null }) {
  const isMe = item.id === myId;
  return (
    <View style={[styles.row, isMe && styles.rowMe]}>
      <Text style={[styles.rank, rank <= 3 && styles.rankTop]}>{rank}</Text>
      <View style={styles.rowBody}>
        <Text style={[styles.username, isMe && styles.usernameMe]}>{item.username}{isMe ? '  ←' : ''}</Text>
        <Text style={styles.titleText}>{levelTitle(item.level)}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.xp}>{item.xp.toLocaleString()}</Text>
        <Text style={styles.xpLabel}>XP</Text>
      </View>
    </View>
  );
}

type Tab = 'global' | 'city';

export default function LeaderboardScreen() {
  const [tab, setTab] = useState<Tab>('global');
  const userId   = usePlayerStore(s => s.userId);
  const username = usePlayerStore(s => s.username);

  const globalQ = useQuery({
    queryKey: ['leaderboard', 'global'],
    queryFn:  () => apiClient.get('/leaderboard/global') as Promise<LeaderboardPlayer[]>,
    staleTime: 60_000,
  });

  // City leaderboard — we don't store home_city on the player client-side yet,
  // so we use username as a stand-in city label. This is a placeholder until
  // the home city onboarding step is wired up.
  const cityQ = useQuery({
    queryKey: ['leaderboard', 'city', 'seoul'],
    queryFn:  () => apiClient.get('/leaderboard/city/seoul') as Promise<LeaderboardPlayer[]>,
    staleTime: 60_000,
    enabled: tab === 'city',
  });

  const activeQ  = tab === 'global' ? globalQ : cityQ;
  const data     = activeQ.data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RANKS</Text>
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tabButton, tab === 'global' && styles.tabActive]}
            onPress={() => setTab('global')}
          >
            <Text style={[styles.tabText, tab === 'global' && styles.tabTextActive]}>GLOBAL</Text>
          </Pressable>
          <Pressable
            style={[styles.tabButton, tab === 'city' && styles.tabActive]}
            onPress={() => setTab('city')}
          >
            <Text style={[styles.tabText, tab === 'city' && styles.tabTextActive]}>CITY</Text>
          </Pressable>
        </View>
      </View>

      {activeQ.isLoading ? (
        <View style={styles.center}><ActivityIndicator color="#e63946" /></View>
      ) : activeQ.isError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Could not load leaderboard.</Text>
          <Pressable onPress={() => activeQ.refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>RETRY</Text>
          </Pressable>
        </View>
      ) : data.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No players yet. Hit the road.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <PlayerRow item={item} rank={index + 1} myId={userId} />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={activeQ.refetch}
          refreshing={activeQ.isLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0a0a0a' },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header:         { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  title:          { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 3, marginBottom: 16 },
  tabs:           { flexDirection: 'row', gap: 4, marginBottom: -1 },
  tabButton:      { paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:      { borderBottomColor: '#e63946' },
  tabText:        { color: '#444', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  tabTextActive:  { color: '#e63946' },
  list:           { paddingVertical: 4 },
  row:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#111' },
  rowMe:          { backgroundColor: '#e6394608' },
  rank:           { width: 32, color: '#333', fontSize: 15, fontWeight: '700' },
  rankTop:        { color: '#e63946' },
  rowBody:        { flex: 1, gap: 2 },
  username:       { color: '#fff', fontSize: 15, fontWeight: '700' },
  usernameMe:     { color: '#e63946' },
  titleText:      { color: '#444', fontSize: 12 },
  rowRight:       { alignItems: 'flex-end' },
  xp:             { color: '#fff', fontSize: 16, fontWeight: '800' },
  xpLabel:        { color: '#444', fontSize: 11, letterSpacing: 1 },
  emptyText:      { color: '#444', fontSize: 14 },
  errorText:      { color: '#555', fontSize: 14 },
  retryButton:    { borderWidth: 1, borderColor: '#333', borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10 },
  retryText:      { color: '#888', fontSize: 12, letterSpacing: 2, fontWeight: '700' },
});
