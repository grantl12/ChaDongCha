import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useCatchStore, CatchRecord } from '@/stores/catchStore';

const CATCH_TYPE_LABEL: Record<string, string> = {
  highway: 'HWY',
  scan360: '360',
  space:   'SPC',
  unknown: '???',
};

function CatchRow({ item }: { item: CatchRecord }) {
  const date = new Date(item.caughtAt);
  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const pct = Math.round(item.confidence * 100);

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.vehicle}>{item.make} {item.model}</Text>
        <Text style={styles.gen}>{item.generation}  ·  {item.color}</Text>
        <Text style={styles.meta}>{dateStr}  ·  {pct}% confidence</Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.badge, item.catchType === 'highway' && styles.badgeHwy]}>
          <Text style={styles.badgeText}>{CATCH_TYPE_LABEL[item.catchType]}</Text>
        </View>
        {!item.synced && <View style={styles.unsyncedDot} />}
      </View>
    </View>
  );
}

export default function GarageScreen() {
  const catches = useCatchStore(s => s.catches);

  if (catches.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>GARAGE</Text>
        <Text style={styles.emptyText}>No catches yet. Hit the road.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>GARAGE</Text>
        <Text style={styles.count}>{catches.length} caught</Text>
      </View>
      <FlatList
        data={catches}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <CatchRow item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#0a0a0a' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  title:       { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  count:       { color: '#555', fontSize: 13 },
  list:        { paddingVertical: 8 },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#111' },
  rowLeft:     { flex: 1 },
  rowRight:    { alignItems: 'flex-end', gap: 6 },
  vehicle:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  gen:         { color: '#888', fontSize: 13, marginTop: 2 },
  meta:        { color: '#444', fontSize: 12, marginTop: 3 },
  badge:       { backgroundColor: '#1a1a1a', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  badgeHwy:    { backgroundColor: '#e6394622' },
  badgeText:   { color: '#e63946', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  unsyncedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555' },
  empty:       { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  emptyTitle:  { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  emptyText:   { color: '#444', marginTop: 12, fontSize: 14 },
});
