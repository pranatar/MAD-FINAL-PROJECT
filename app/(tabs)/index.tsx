import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Palette } from '@/constants/theme';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const USER_ID = "s22310459@student.unklab.ac.id";

export default function HomeScreen() {
  const router = useRouter();
  const user = useQuery(api.users.getUser, { email: USER_ID });
  const tasks = useQuery(api.tasks.getTasks, { userId: USER_ID });
  const sessions = useQuery(api.sessions.getWeeklyStats, { userId: USER_ID });

  const activeTasks = tasks?.filter(t => !t.completed) || [];
  const urgentTask = activeTasks.sort((a, b) => (a.priority || 0) - (b.priority || 0))[0];
  
  const todayMinutes = sessions?.find(s => s.day === ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()])?.minutes || 0;
  const dailyGoal = 60; // 60 minutes goal

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Profile & Greeting */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greeting}>Halo, {user?.name?.split(' ')[0] || 'Warrior'}! 👋</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>
          <TouchableOpacity style={styles.avatarContainer}>
            <LinearGradient colors={[Palette.primary, Palette.accent]} style={styles.avatarGradient}>
              <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Palette.primary + '20' }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{user?.streakDays || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Palette.accent + '20' }]}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{user?.totalXP || 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Palette.success + '20' }]}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{user?.level || 1}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        {/* Today's Progress Card */}
        <LinearGradient colors={[Palette.dark.surface, Palette.dark.card]} style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Target Belajar Hari Ini</Text>
            <Text style={styles.progressPercent}>{Math.round((todayMinutes / dailyGoal) * 100)}%</Text>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${Math.min(100, (todayMinutes / dailyGoal) * 100)}%` }]} />
          </View>
          <Text style={styles.progressSub}>{todayMinutes} dari {dailyGoal} menit tercapai</Text>
        </LinearGradient>

        {/* Urgent Task Card */}
        <Text style={styles.sectionTitle}>Tugas Mendesak ⚡</Text>
        {urgentTask ? (
          <TouchableOpacity 
            style={styles.urgentCard} 
            onPress={() => router.push('/calendar')}
          >
            <View style={[styles.priorityTag, { backgroundColor: urgentTask.priority >= 4 ? Palette.danger : Palette.energy }]}>
              <Text style={styles.priorityTagText}>P{urgentTask.priority}</Text>
            </View>
            <View style={styles.urgentContent}>
              <Text style={styles.urgentTitle} numberOfLines={1}>{urgentTask.title}</Text>
              <Text style={styles.urgentSubject}>{urgentTask.subject} · {urgentTask.deadline}</Text>
            </View>
            <Text style={styles.urgentIcon}>➡️</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyTaskCard}>
            <Text style={styles.emptyTaskText}>Semua tugas selesai! Santai sejenak. ☕</Text>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Akses Cepat</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/calendar')}>
            <View style={[styles.actionIcon, { backgroundColor: Palette.primary + '30' }]}>
              <Text style={styles.actionEmoji}>📅</Text>
            </View>
            <Text style={styles.actionLabel}>Jadwal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/skill-tree')}>
            <View style={[styles.actionIcon, { backgroundColor: Palette.success + '30' }]}>
              <Text style={styles.actionEmoji}>🌳</Text>
            </View>
            <Text style={styles.actionLabel}>Skills</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/dashboard')}>
            <View style={[styles.actionIcon, { backgroundColor: Palette.accent + '30' }]}>
              <Text style={styles.actionEmoji}>📊</Text>
            </View>
            <Text style={styles.actionLabel}>Statistik</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/chat')}>
            <View style={[styles.actionIcon, { backgroundColor: Palette.energy + '30' }]}>
              <Text style={styles.actionEmoji}>🤖</Text>
            </View>
            <Text style={styles.actionLabel}>AI Chat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.dark.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 10 },
  
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  greeting: { fontSize: 26, fontWeight: '900', color: Palette.dark.text },
  dateText: { fontSize: 14, color: Palette.dark.textMuted, marginTop: 2 },
  avatarContainer: { width: 50, height: 50, borderRadius: 25, overflow: 'hidden' },
  avatarGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  statCard: { flex: 1, padding: 15, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: Palette.dark.border },
  statEmoji: { fontSize: 20, marginBottom: 5 },
  statValue: { fontSize: 18, fontWeight: '800', color: Palette.dark.text },
  statLabel: { fontSize: 11, color: Palette.dark.textMuted, marginTop: 2 },

  progressCard: { padding: 20, borderRadius: 24, marginBottom: 25, borderWidth: 1, borderColor: Palette.dark.border },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  progressTitle: { fontSize: 16, fontWeight: '700', color: Palette.dark.text },
  progressPercent: { fontSize: 18, fontWeight: '800', color: Palette.primaryLight },
  barBg: { height: 12, backgroundColor: Palette.dark.border, borderRadius: 6, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Palette.primary, borderRadius: 6 },
  progressSub: { fontSize: 12, color: Palette.dark.textMuted, marginTop: 10 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: Palette.dark.text, marginBottom: 15, marginTop: 5 },
  
  urgentCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.dark.surface, 
    padding: 16, borderRadius: 20, borderWidth: 1, borderColor: Palette.dark.border, marginBottom: 25 
  },
  priorityTag: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  priorityTagText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  urgentContent: { flex: 1 },
  urgentTitle: { fontSize: 16, fontWeight: '700', color: Palette.dark.text },
  urgentSubject: { fontSize: 12, color: Palette.dark.textMuted, marginTop: 2 },
  urgentIcon: { fontSize: 18, opacity: 0.5 },

  emptyTaskCard: { 
    backgroundColor: Palette.dark.surface, padding: 25, borderRadius: 20, 
    borderStyle: 'dashed', borderWidth: 1, borderColor: Palette.dark.border, alignItems: 'center', marginBottom: 25 
  },
  emptyTaskText: { color: Palette.dark.textMuted, fontSize: 14 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginBottom: 20 },
  actionItem: { width: (width - 55) / 2, backgroundColor: Palette.dark.surface, padding: 15, borderRadius: 22, alignItems: 'center', borderWidth: 1, borderColor: Palette.dark.border },
  actionIcon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 14, fontWeight: '700', color: Palette.dark.text },

  footerSpacer: { height: 40 },
});