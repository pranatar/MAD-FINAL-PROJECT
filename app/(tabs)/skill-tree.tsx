import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const USER_ID = "s22310459@student.unklab.ac.id";

interface SkillNode {
  id: string;
  title: string;
  icon: string;
  description: string;
  xpRequired: number;
  unlocked: boolean;
  completed: boolean;
  category: 'coding' | 'math' | 'general';
}

const SKILL_NODES: SkillNode[] = [
  { id: 'foundations',  title: 'Dasar Belajar',      icon: '🌱', description: 'Langkah awal untuk membangun kebiasaan belajar yang efektif.', xpRequired: 0,   unlocked: true,  completed: false, category: 'general' },
  { id: 'basic-prog',   title: 'Dasar Pemrograman',  icon: '💻', description: 'Pahami logika komputer, variabel, dan alur program.',            xpRequired: 0,   unlocked: true,  completed: false, category: 'coding' },
  { id: 'math-basic',   title: 'Matematika Dasar',   icon: '➕', description: 'Asah logika berhitung dan pemecahan masalah angka.',              xpRequired: 50,  unlocked: false, completed: false, category: 'math'   },
  { id: 'logic-master', title: 'Master Logika',      icon: '🧠', description: 'Tingkatkan kemampuan berpikir kritis dan problem solving.',       xpRequired: 100, unlocked: false, completed: false, category: 'coding' },
  { id: 'calculus',     title: 'Kalkulus Seru',      icon: '📐', description: 'Pelajari konsep perubahan melalui limit dan turunan.',            xpRequired: 150, unlocked: false, completed: false, category: 'math'   },
  { id: 'data-struct',  title: 'Struktur Data',      icon: '🗂️', description: 'Cara efisien menyimpan dan mengatur informasi di komputer.',     xpRequired: 200, unlocked: false, completed: false, category: 'coding' },
  { id: 'statistics',   title: 'Ahli Statistika',    icon: '📊', description: 'Analisis tren dan probabilitas dari data dunia nyata.',           xpRequired: 250, unlocked: false, completed: false, category: 'math'   },
  { id: 'algorithms',   title: 'Ninja Algoritma',    icon: '⚡', description: 'Gunakan langkah-langkah jenius untuk solusi tercepat.',           xpRequired: 300, unlocked: false, completed: false, category: 'coding' },
];

const BADGES = [
  { id: '1', title: 'Early Bird', icon: '🌅', desc: 'Belajar sebelum jam 7 pagi', earned: false },
  { id: '2', title: 'Streak 3 Hari', icon: '🔥', desc: 'Belajar 3 hari berturut-turut', earned: false },
  { id: '3', title: 'Logika Oke', icon: '🧠', desc: 'Selesaikan skill Master Logika', earned: false },
  { id: '4', title: 'Century XP', icon: '💯', desc: 'Capai 100 XP pertama', earned: false },
];

const CATEGORY_COLOR: Record<string, string> = {
  coding: Palette.primary,
  math: Palette.accent,
  general: Palette.success,
};

export default function SkillTreeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'tree' | 'badges'>('tree');

  const handleSelectNode = (node: SkillNode) => {
    router.push({
      pathname: '/skill-material',
      params: {
        skillTitle: node.title,
        description: node.description,
        icon: node.icon,
        category: node.category,
        xpRequired: String(node.xpRequired),
        status: node.completed ? 'Dikuasai' : 'Aktif',
      },
    });
  };

  const user = useQuery(api.users.getUser, { email: USER_ID });
  const totalXP = user?.totalXP ?? 0;
  const userBadges = user?.badges ?? [];

  const dynamicNodes = SKILL_NODES.map((node) => {
    const isUnlocked = totalXP >= node.xpRequired;
    const isCompleted = totalXP >= node.xpRequired + 100;
    return { ...node, unlocked: isUnlocked, completed: isCompleted };
  });

  const nextUnlock = dynamicNodes.find(n => !n.unlocked);
  const completedCount = dynamicNodes.filter(n => n.completed).length;

  const dynamicBadges = BADGES.map((badge) => {
    let earned = badge.earned;
    if (badge.id === '4' && totalXP >= 100) earned = true;
    if (badge.id === '3' && totalXP >= 300) earned = true;
    return { ...badge, earned };
  });

  userBadges.forEach((bTitle, i) => {
    if (!dynamicBadges.find((b) => b.title === bTitle)) {
      dynamicBadges.push({ id: `user-badge-${i}`, title: bTitle, icon: '🏅', desc: 'Pencapaian Level Up!', earned: true });
    }
  });

  if (user === undefined) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Palette.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={[Palette.dark.surface, Palette.dark.bg]} style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Skill Path 🚀</Text>
          <Text style={styles.headerSub}>{completedCount} Skill Dikuasai · {totalXP} XP</Text>
        </View>
        <View style={styles.xpBadge}>
          <Text style={styles.xpBadgeText}>⭐ {totalXP}</Text>
        </View>
      </LinearGradient>

      {/* Tab Switcher */}
      <View style={styles.tabs}>
        {(['tree', 'badges'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === 'tree' ? 'Peta Skill' : 'Koleksi Badge'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'tree' ? (
          <View style={styles.pathContainer}>
            {/* Progress Summary Card */}
            {nextUnlock && (
              <View style={styles.nextCard}>
                <View style={styles.nextInfo}>
                  <Text style={styles.nextLabel}>TARGET BERIKUTNYA</Text>
                  <Text style={styles.nextSkill}>{nextUnlock.icon} {nextUnlock.title}</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${Math.min(100, (totalXP / nextUnlock.xpRequired) * 100)}%` as any }]} />
                </View>
                <Text style={styles.progressText}>{totalXP} / {nextUnlock.xpRequired} XP</Text>
              </View>
            )}

            {/* Skill Path */}
            {dynamicNodes.map((node, index) => {
              const catColor = CATEGORY_COLOR[node.category];
              const isLocked = !node.unlocked;
              return (
                <View key={node.id} style={styles.nodeWrapper}>
                  {index < dynamicNodes.length - 1 && (
                    <View style={[styles.line, { backgroundColor: node.completed ? catColor : Palette.dark.border }]} />
                  )}
                  <TouchableOpacity
                    style={[styles.nodeCard, isLocked && styles.nodeCardLocked, { borderColor: isLocked ? Palette.dark.border : catColor }]}
                    onPress={() => !isLocked && handleSelectNode(node)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: isLocked ? Palette.dark.border : catColor + '20' }]}>
                      <Text style={[styles.nodeIcon, isLocked && { opacity: 0.3 }]}>{isLocked ? '🔒' : node.icon}</Text>
                    </View>
                    <View style={styles.nodeContent}>
                      <Text style={[styles.nodeTitle, isLocked && { color: Palette.dark.textMuted }]}>{node.title}</Text>
                      <Text style={styles.nodeXP}>{node.xpRequired} XP Dibutuhkan</Text>
                    </View>
                    {node.completed ? (
                      <View style={[styles.statusBadge, { backgroundColor: Palette.success }]}>
                        <Text style={styles.statusText}>✓</Text>
                      </View>
                    ) : node.unlocked ? (
                      <View style={[styles.statusBadge, { backgroundColor: Palette.primary }]}>
                        <Text style={styles.statusText}>●</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.badgeGrid}>
            {dynamicBadges.map((badge) => (
              <View key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeLocked]}>
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDesc}>{badge.desc}</Text>
                {badge.earned ? (
                  <Text style={styles.earnedLabel}>TELAH DIMILIKI</Text>
                ) : (
                  <Text style={styles.lockedLabel}>TERKUNCI</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.dark.bg },
  header: { padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: '900', color: Palette.dark.text },
  headerSub: { fontSize: 14, color: Palette.dark.textMuted, marginTop: 4 },
  xpBadge: { backgroundColor: Palette.primary, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
  xpBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 20, backgroundColor: Palette.dark.surface, borderRadius: 15, padding: 5 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  tabBtnActive: { backgroundColor: Palette.dark.card },
  tabBtnText: { color: Palette.dark.textMuted, fontWeight: '600' },
  tabBtnTextActive: { color: Palette.dark.text },

  scroll: { paddingBottom: 50 },
  pathContainer: { paddingHorizontal: 20 },

  nextCard: { backgroundColor: Palette.dark.surface, borderRadius: 20, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: Palette.primary + '30' },
  nextInfo: { marginBottom: 5 },
  nextLabel: { fontSize: 10, fontWeight: 'bold', color: Palette.primary, letterSpacing: 1, marginBottom: 8 },
  nextSkill: { fontSize: 18, fontWeight: '800', color: Palette.dark.text, marginBottom: 15 },
  progressBarBg: { height: 10, backgroundColor: Palette.dark.border, borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: Palette.primary },
  progressText: { fontSize: 12, color: Palette.dark.textMuted, marginTop: 8, textAlign: 'right' },

  nodeWrapper: { alignItems: 'center', marginBottom: 0 },
  line: { width: 4, height: 40, backgroundColor: Palette.dark.border },
  nodeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.dark.surface, width: '100%', padding: 15, borderRadius: 20, borderWidth: 1.5 },
  nodeCardLocked: { opacity: 0.7, borderStyle: 'dashed' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  nodeIcon: { fontSize: 28 },
  nodeContent: { flex: 1 },
  nodeTitle: { fontSize: 17, fontWeight: '800', color: Palette.dark.text },
  nodeXP: { fontSize: 12, color: Palette.dark.textMuted, marginTop: 2 },
  statusBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, paddingHorizontal: 20 },
  badgeCard: { width: (width - 55) / 2, backgroundColor: Palette.dark.surface, borderRadius: 20, padding: 20, alignItems: 'center' },
  badgeLocked: { opacity: 0.5 },
  badgeIcon: { fontSize: 40, marginBottom: 10 },
  badgeTitle: { fontSize: 15, fontWeight: '800', color: Palette.dark.text, textAlign: 'center' },
  badgeDesc: { fontSize: 11, color: Palette.dark.textMuted, textAlign: 'center', marginTop: 5, marginBottom: 10 },
  earnedLabel: { fontSize: 9, fontWeight: 'bold', color: Palette.success },
  lockedLabel: { fontSize: 9, fontWeight: 'bold', color: Palette.dark.textMuted },

});
