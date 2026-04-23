import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Palette } from '@/constants/theme';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function HomeScreen() {
  const email = "s22310459@student.unklab.ac.id";
  const user = useQuery(api.users.getUser, { email });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Halo, {user?.name?.split(' ')[0] || 'Pengguna'} 👋</Text>
          <Text style={styles.subtitle}>Selamat datang di beranda belajar Anda.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Siap belajar hari ini?</Text>
          <Text style={styles.cardDesc}>Cek kalender Anda untuk melihat tugas, atau lihat progres di dashboard Analytics.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.dark.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 20 },
  header: { marginBottom: 30 },
  greeting: { fontSize: 28, fontWeight: '800', color: Palette.dark.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Palette.dark.textMuted },
  card: { backgroundColor: Palette.dark.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: Palette.dark.border },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Palette.dark.text, marginBottom: 8 },
  cardDesc: { fontSize: 14, color: Palette.dark.textMuted, lineHeight: 22 },
});