import { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

type FeedCatch = {
  id: string;
  caught_at: string;
  catch_type: 'highway' | 'scan360' | 'space' | 'unknown';
  confidence: number;
  color: string | null;
  body_style: string | null;
  players: { username: string } | null;
  generations: {
    common_name: string;
    rarity_tier: string;
    models: { name: string; makes: { name: string } };
  } | null;
};

const RARITY_COLOR: Record<string, string> = {
  common:    '#555',
  uncommon:  '#4a9eff',
  rare:      '#a855f7',
  epic:      '#f59e0b',
  legendary: '#e63946',
};

const CATCH_TYPE_LABEL: Record<string, string> = {
  highway: 'HWY',
  scan360: '360°',
  space:   'SPC',
  unknown: '???',
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)   return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function FeedItem({ item }: { item: FeedCatch }) {
  const gen   = item.generations;
  const make  = gen?.models?.makes?.name ?? '?';
  const model = gen?.models?.name ?? '?';
  const name  = gen?.common_name ?? 'Unknown';
  const rarity = gen?.rarity_tier ?? 'common';
  const rarityColor = RARITY_COLOR[rarity] ?? '#555';

  return (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <View style={[styles.rarityBar, { backgroundColor: rarityColor }]} />
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemMake}>{make}</Text>
        <Text style={styles.itemModel}>{model}</Text>
        <Text style={[styles.itemGen, { color: rarityColor }]}>{name}</Text>
        {item.color ? (
          <Text style={styles.itemMeta}>{item.color}{item.body_style ? `  ·  ${item.body_style}` : ''}</Text>
        ) : null}
      </View>
      <View style={styles.itemRight}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{CATCH_TYPE_LABEL[item.catch_type]}</Text>
        </View>
        <Text style={styles.itemPlayer}>{item.players?.username ?? '—'}</Text>
        <Text style={styles.itemTime}>{timeAgo(item.caught_at)}</Text>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['feed'],
    queryFn: () => apiClient.get('/catches/recent?limit=50') as Promise<FeedCatch[]>,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#e63946" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Could not load feed.</Text>
        <Pressable onPress={() => refetch()} style={styles.retryButton}>
          <Text style={styles.retryText}>RETRY</Text>
        </Pressable>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>FEED</Text>
        <Text style={styles.emptyText}>No catches yet. Be the first.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FEED</Text>
        <Text style={styles.subtitle}>Live catch activity</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <FeedItem item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onRefresh={refetch}
        refreshing={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0a0a0a' },
  center:         { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', gap: 12 },
  header:         { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  title:          { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  subtitle:       { color: '#444', fontSize: 12, marginTop: 2 },
  list:           { paddingVertical: 4 },
  item:           { flexDirection: 'row', paddingVertical: 14, paddingRight: 20, borderBottomWidth: 1, borderBottomColor: '#111' },
  itemLeft:       { width: 20, alignItems: 'center', paddingTop: 4 },
  rarityBar:      { width: 3, height: '100%', borderRadius: 2, minHeight: 40 },
  itemBody:       { flex: 1, paddingLeft: 12, gap: 2 },
  itemMake:       { color: '#555', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  itemModel:      { color: '#fff', fontSize: 17, fontWeight: '700' },
  itemGen:        { fontSize: 12, fontWeight: '600' },
  itemMeta:       { color: '#444', fontSize: 12, marginTop: 2 },
  itemRight:      { alignItems: 'flex-end', gap: 4, justifyContent: 'center' },
  typeBadge:      { backgroundColor: '#1a1a1a', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  typeBadgeText:  { color: '#e63946', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  itemPlayer:     { color: '#555', fontSize: 12 },
  itemTime:       { color: '#333', fontSize: 11 },
  emptyTitle:     { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  emptyText:      { color: '#444', fontSize: 14 },
  errorText:      { color: '#555', fontSize: 14 },
  retryButton:    { borderWidth: 1, borderColor: '#333', borderRadius: 6, paddingHorizontal: 20, paddingVertical: 10 },
  retryText:      { color: '#888', fontSize: 12, letterSpacing: 2, fontWeight: '700' },
});
