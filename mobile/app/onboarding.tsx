import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { usePlayerStore } from '@/stores/playerStore';
import { apiClient } from '@/api/client';

type Mode = 'signin' | 'signup';

export default function Onboarding() {
  const { setPlayer, setProfile } = usePlayerStore();

  const [mode, setMode]         = useState<Mode>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [info, setInfo]         = useState<string | null>(null);

  async function handleSubmit() {
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === 'signup') {
        if (!username) { setError('Username is required.'); setLoading(false); return; }
        const signupRes = await apiClient.post('/auth/signup', { email, password, username }) as { message?: string };
        // Supabase may require email confirmation — surface that to the user.
        if (signupRes.message?.toLowerCase().includes('check your email')) {
          setInfo('Account created! Check your email to confirm, then sign in.');
          setMode('signin');
          setLoading(false);
          return;
        }
      }

      // Sign in (also runs after a successful signup that doesn't need confirmation)
      const signinRes = await apiClient.post('/auth/signin', { email, password }) as {
        access_token: string;
        user_id: string;
      };

      // Set token immediately so apiClient's next call is authenticated
      setPlayer({ userId: signinRes.user_id, username: email, accessToken: signinRes.access_token });

      // Fetch real profile (username, xp, level)
      try {
        const profile = await apiClient.get('/auth/me') as { username: string; xp: number; level: number };
        setPlayer({ userId: signinRes.user_id, username: profile.username, accessToken: signinRes.access_token });
        setProfile(profile.xp, profile.level);
      } catch {
        // Profile fetch failed — display name defaults to email prefix for now
        setPlayer({ userId: signinRes.user_id, username: email.split('@')[0], accessToken: signinRes.access_token });
      }

      router.replace('/(tabs)');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      // Surface the most useful part of API error messages
      const match = msg.match(/→ \d+: (.*)/);
      setError(match ? match[1] : msg);
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setError(null);
    setInfo(null);
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>차동차</Text>
        <Text style={styles.subtitle}>CHADONGCHA</Text>
        <Text style={styles.tagline}>Catch every car on the road.</Text>

        <View style={styles.form}>
          {mode === 'signup' && (
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#444"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#444"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#444"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}
          {info  && <Text style={styles.info}>{info}</Text>}

          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>
                  {mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                </Text>
            }
          </Pressable>

          <Pressable onPress={toggleMode} style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0a0a0a' },
  container:     { flexGrow: 1, padding: 32, justifyContent: 'center' },
  title:         { color: '#fff', fontSize: 52, fontWeight: '900', textAlign: 'center' },
  subtitle:      { color: '#e63946', fontSize: 14, letterSpacing: 4, textAlign: 'center', marginTop: 2 },
  tagline:       { color: '#444', fontSize: 13, textAlign: 'center', marginBottom: 52, marginTop: 8 },
  form:          { gap: 12 },
  input:         { backgroundColor: '#141414', color: '#fff', borderRadius: 8, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#222' },
  primaryButton: { backgroundColor: '#e63946', borderRadius: 8, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  buttonDisabled:{ opacity: 0.6 },
  buttonText:    { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 2 },
  switchRow:     { alignItems: 'center', paddingVertical: 8 },
  switchText:    { color: '#555', fontSize: 13 },
  error:         { color: '#e63946', fontSize: 13, textAlign: 'center' },
  info:          { color: '#4ade80', fontSize: 13, textAlign: 'center' },
});
