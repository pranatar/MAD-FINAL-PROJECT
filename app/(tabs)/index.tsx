import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette, MoodColors, Levels } from '@/constants/theme';
import MoodSelector from '@/components/mood-selector';

const { width } = Dimensions.get('window');

const USER = {
  name: 'Dea Rumopa',
  email: 'dea@student.ac.id',
  xp: 750,
  level: 2,
  streak: 5,
  mood: null as string | null,
};

const MOOD_RECOMMENDATIONS: Record<string, { title: string; items: { icon: string; text: string; type: string }[] }> = {
  tired: {
    title: '😴 Mode Santai',
    items: [
      { icon: '📖', text: 'Baca ringkasan • 10 menit', type: 'read' },
      { icon: '🎬', text: 'Video singkat: Konsep OOP', type: 'video' },
      { icon: '💡', text: 'Flashcard: 5 soal mudah', type: 'card' },
    ],
  },
  energetic: {
    title: '⚡ Mode Turbo',
    items: [
      { icon: '🏋️', text: 'Challenge: Algoritma Sorting', type: 'challenge' },
      { icon: '📝', text: '20 Soal Latihan Intensif', type: 'quiz' },
      { icon: '🚀', text: 'Project: Mini Calculator', type: 'project' },
    ],
  },
  bored: {
    title: '😑 Mode Eksplorasi',
    items: [
      { icon: '🎮', text: 'Game: Code Puzzle', type: 'game' },
      { icon: '🌍', text: 'Topik Baru: Machine Learning Intro', type: 'new' },
      { icon: '🎯', text: 'Quiz Cepat 60 detik', type: 'quick' },
    ],
  },
};

export default function HomeScreen() {
  const [moodModalVisible, setMoodModalVisible] = useState(false);
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Selamat pagi');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat pagi');
    else if (hour < 17) setGreeting('Selamat siang');
    else setGreeting('Selamat malam');

    // Show mood selector after 1 second
    const timer = setTimeout(() => setMoodModalVisible(true), 800);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    return () => clearTimeout(timer);
  }, []);

  const handleMoodSelect = (mood: 'tired' | 'energetic' | 'bored') => {
    setCurrentMood(mood);
    setMoodModalVisible(false);
  };

  const currentLevel = Levels.find((l) => USER.level === l.level) || Levels[0];
  const nextLevel = Levels.find((l) => l.level === USER.level + 1);
  const xpProgress = nextLevel
    ? ((USER.xp - currentLevel.xpNeeded) / (nextLevel.xpNeeded - currentLevel.xpNeeded)) * 100
    : 100;

  const recommendations = currentMood ? MOOD_RECOMMENDATIONS[currentMood] : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.dark.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.userName}>{USER.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.moodBadge}
            onPress={() => setMoodModalVisible(true)}>
            <Text style={styles.moodBadgeText}>
              {currentMood ? MoodColors[currentMood as keyof typeof MoodColors].emoji : '❓'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* XP / Level Card */}
        <Animated.View style={[styles.levelCard, { opacity: fadeAnim }]}>
          <View style={styles.levelCardTop}>
            <View>
              <Text style={styles.levelTitle}>Level {USER.level} — {currentLevel.title}</Text>
              <Text style={styles.levelXP}>{USER.xp} XP · {USER.streak} 🔥 hari streak</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>⭐ {USER.level}</Text>
            </View>
          </View>
          <View style={styles.xpBarBg}>
            <Animated.View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={styles.xpBarLabel}>
            {nextLevel ? `${nextLevel.xpNeeded - USER.xp} XP menuju ${nextLevel.title}` : 'MAX LEVEL!'}
          </Text>
        </Animated.View>

        {/* Today's Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Belajar Hari Ini', value: '45 min', icon: '⏱️' },
            { label: 'Tugas Aktif', value: '3', icon: '📋' },
            { label: 'Skill Unlocked', value: '4', icon: '🔓' },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Mood Recommendations */}
        {recommendations ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{recommendations.title}</Text>
            <Text style={styles.sectionSubtitle}>Rekomendasi untukmu sekarang</Text>
            {recommendations.items.map((item, i) => (
              <TouchableOpacity key={i} style={styles.recommendCard} activeOpacity={0.8}>
                <Text style={styles.recommendIcon}>{item.icon}</Text>
                <Text style={styles.recommendText}>{item.text}</Text>
                <Text style={styles.recommendArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity style={styles.moodPromptCard} onPress={() => setMoodModalVisible(true)}>
            <Text style={styles.moodPromptEmoji}>🎯</Text>
            <View>
              <Text style={styles.moodPromptTitle}>Pilih mood kamu!</Text>
              <Text style={styles.moodPromptSub}>Dapatkan rekomendasi belajar personal</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          <View style={styles.quickGrid}>
            {[
              { icon: '📅', label: 'Lihat Jadwal', color: Palette.primary },
              { icon: '📊', label: 'Dashboard', color: Palette.accent },
              { icon: '🎮', label: 'Skill Tree', color: Palette.energy },
              { icon: '⏱️', label: 'Mulai Sesi', color: Palette.success },
            ].map((action, i) => (
              <TouchableOpacity key={i} style={[styles.quickAction, { borderColor: action.color + '50' }]} activeOpacity={0.8}>
                <Text style={styles.quickIcon}>{action.icon}</Text>
                <Text style={[styles.quickLabel, { color: action.color }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Badge Terbaru 🏆</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeRow}>
            {['🌟 Early Bird', '🔥 5-Day Streak', '💻 Coder', '🧠 Logic Master'].map((badge, i) => (
              <View key={i} style={styles.badgeChip}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

      </ScrollView>

      <MoodSelector
        visible={moodModalVisible}
        onSelect={handleMoodSelect}
        onClose={() => setMoodModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.dark.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 13, color: Palette.dark.textMuted, fontWeight: '500' },
  userName: { fontSize: 22, fontWeight: '800', color: Palette.dark.text, marginTop: 2 },

  moodBadge: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Palette.dark.card, borderWidth: 1.5,
    borderColor: Palette.primary + '60',
    justifyContent: 'center', alignItems: 'center',
  },
  moodBadgeText: { fontSize: 22 },

  levelCard: {
    backgroundColor: Palette.dark.surface, borderRadius: 20,
    padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: Palette.primary + '40',
  },
  levelCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  levelTitle: { fontSize: 16, fontWeight: '700', color: Palette.dark.text },
  levelXP: { fontSize: 12, color: Palette.primary, marginTop: 4, fontWeight: '600' },
  levelBadge: {
    backgroundColor: Palette.primary + '30', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Palette.primary,
  },
  levelBadgeText: { color: Palette.primaryLight, fontWeight: '700', fontSize: 13 },

  xpBarBg: { height: 8, backgroundColor: Palette.dark.border, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: Palette.primary, borderRadius: 4 },
  xpBarLabel: { fontSize: 11, color: Palette.dark.textMuted, marginTop: 6 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: Palette.dark.card, borderRadius: 16,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Palette.dark.border,
  },
  statIcon: { fontSize: 20, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800', color: Palette.dark.text },
  statLabel: { fontSize: 10, color: Palette.dark.textMuted, textAlign: 'center', marginTop: 2 },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Palette.dark.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: Palette.dark.textMuted, marginBottom: 12 },

  recommendCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.dark.card,
    borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: Palette.dark.border,
  },
  recommendIcon: { fontSize: 22, marginRight: 14 },
  recommendText: { flex: 1, fontSize: 14, color: Palette.dark.text, fontWeight: '500' },
  recommendArrow: { fontSize: 22, color: Palette.dark.textMuted },

  moodPromptCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: Palette.primary + '20', borderRadius: 18,
    padding: 20, borderWidth: 1.5, borderColor: Palette.primary + '40', marginBottom: 24,
  },
  moodPromptEmoji: { fontSize: 36 },
  moodPromptTitle: { fontSize: 16, fontWeight: '700', color: Palette.dark.text },
  moodPromptSub: { fontSize: 12, color: Palette.dark.textMuted, marginTop: 2 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: {
    width: (width - 50) / 2, backgroundColor: Palette.dark.card,
    borderRadius: 16, padding: 18, borderWidth: 1.5, alignItems: 'center',
  },
  quickIcon: { fontSize: 28, marginBottom: 8 },
  quickLabel: { fontSize: 13, fontWeight: '600' },

  badgeRow: { marginTop: 4 },
  badgeChip: {
    backgroundColor: Palette.dark.card, borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, marginRight: 10, borderWidth: 1, borderColor: Palette.primary + '40',
  },
  badgeText: { color: Palette.primaryLight, fontSize: 13, fontWeight: '600' },
});
