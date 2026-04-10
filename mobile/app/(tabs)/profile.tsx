import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { usePlayerStore } from '@/stores/playerStore';
import { useCatchStore } from '@/stores/catchStore';

const XP_PER_LEVEL = 1000;

export default function ProfileScreen() {
  const { xp, level, username, clearSession } = usePlayerStore();
  const catchCount = useCatchStore(s => s.catches.length);

  const xpIntoLevel  = xp % XP_PER_LEVEL;
  const xpProgress   = xpIntoLevel / XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - xpIntoLevel;

  function handleSignOut() {
    clearSession();
    router.replace('/onboarding');
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.username}>{username ?? 'Driver'}</Text>
        <Text style={styles.level}>LEVEL {level}</Text>

        {/* XP bar */}
        <View style={styles.xpRow}>
          <Text style={styles.xpLabel}>{xp.toLocaleString()} XP</Text>
          <Text style={styles.xpNext}>{xpToNextLevel} to next level</Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${Math.round(xpProgress * 100)}%` }]} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{catchCount}</Text>
            <Text style={styles.statLabel}>CAUGHT</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{level}</Text>
            <Text style={styles.statLabel}>LEVEL</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{xp.toLocaleString()}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>SIGN OUT</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#0a0a0a', padding: 24, justifyContent: 'space-between', paddingTop: 80, paddingBottom: 40 },
  card:           { backgroundColor: '#111', borderRadius: 16, padding: 24, gap: 8 },
  username:       { color: '#fff', fontSize: 28, fontWeight: '900' },
  level:          { color: '#e63946', fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  xpRow:          { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  xpLabel:        { color: '#888', fontSize: 13 },
  xpNext:         { color: '#444', fontSize: 13 },
  barTrack:       { height: 4, backgroundColor: '#222', borderRadius: 2, overflow: 'hidden' },
  barFill:        { height: 4, backgroundColor: '#e63946', borderRadius: 2 },
  statsRow:       { flexDirection: 'row', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  stat:           { flex: 1, alignItems: 'center' },
  statValue:      { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel:      { color: '#555', fontSize: 11, letterSpacing: 2, marginTop: 2 },
  statDivider:    { width: 1, backgroundColor: '#1a1a1a' },
  signOutButton:  { borderWidth: 1, borderColor: '#222', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  signOutText:    { color: '#555', fontSize: 13, letterSpacing: 2, fontWeight: '700' },
});
