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
import { useQuery, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

const { width } = Dimensions.get('window');
const USER_ID = "s22310459@student.unklab.ac.id";

const DAY_LABELS_ID: Record<string, string> = {
  Sun: 'Min', Mon: 'Sen', Tue: 'Sel', Wed: 'Rab', Thu: 'Kam', Fri: 'Jum', Sat: 'Sab',
};

const SUBJECT_COLORS = [
  Palette.primary, Palette.accent, Palette.energy, Palette.success, Palette.danger,
  '#e879f9', '#38bdf8', '#34d399', '#fb923c', '#a78bfa',
];

export default function DashboardScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // ── Real data from Convex ──────────────────────────────────────
  const user = useQuery(api.users.getUser, { email: USER_ID });
  const weeklyStats = useQuery(api.sessions.getWeeklyStats, { userId: USER_ID });
  const subjectStats = useQuery(api.sessions.getSubjectStats, { userId: USER_ID });
  const allSessions = useQuery(api.sessions.getSessions, { userId: USER_ID });
  const tasks = useQuery(api.tasks.getTasks, { userId: USER_ID });

  // ── AI Insight ─────────────────────────────────────────────────
  const getInsights = useAction(api.ai.getInsights);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const totalMinutes = user?.totalStudyMinutes ?? 0;
  const streakDays = user?.streakDays ?? 0;
  const completedSessions = allSessions?.filter(s => s.completed).length ?? 0;
  const completedTasks = tasks?.filter(t => t.completed).length ?? 0;

  // Weekly chart data
  const weeklyData = weeklyStats?.map(w => ({
    day: DAY_LABELS_ID[w.day] ?? w.day,
    minutes: w.minutes,
  })) ?? [];
  const maxMinutes = Math.max(...weeklyData.map(d => d.minutes), 1);
  const weeklyTotal = weeklyData.reduce((s, d) => s + d.minutes, 0);

  // Subject breakdown with colors
  const subjectData = (subjectStats ?? []).map((s, i) => ({
    ...s,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));
  const totalSubjectMinutes = subjectData.reduce((s, d) => s + d.minutes, 0);

  // Exam readiness
  const avgDailyMin = weeklyTotal / 7;
  const targetMinPerDay = 90;
  const readinessPct = Math.min(100, Math.round((avgDailyMin / targetMinPerDay) * 100));
  const daysToReady = readinessPct >= 80 ? 0 : Math.ceil(14 * ((100 - readinessPct) / 100));

  // Load AI insight
  const loadInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await getInsights({
        totalStudyMinutes: totalMinutes,
        streakDays,
        completedTasksCount: completedTasks,
      });
      setInsight(res);
    } catch {
      setInsight('Gagal memuat insight AI. Pastikan API Key sudah diatur.');
    } finally {
      setInsightLoading(false);
    }
  };

  React.useEffect(() => {
    if (user !== undefined) loadInsight();
  }, [user?.totalStudyMinutes, user?.streakDays]);

  const isLoading = user === undefined || weeklyStats === undefined;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Palette.primary} />
        <Text style={{ color: Palette.dark.textMuted, marginTop: 12 }}>Memuat analytics...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.periodSwitch}>
            {(['week', 'month'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.periodBtn, selectedPeriod === p && styles.periodBtnActive]}
                onPress={() => setSelectedPeriod(p)}>
                <Text style={[styles.periodBtnText, selectedPeriod === p && styles.periodBtnTextActive]}>
                  {p === 'week' ? 'Minggu' : 'Bulan'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* KPI Row */}
        <View style={styles.kpiRow}>
          {[
            {
              label: 'Total Belajar',
              value: `${Math.floor(totalMinutes / 60)}j ${totalMinutes % 60}m`,
              icon: '⏱️',
              color: Palette.primary,
            },
            {
              label: 'Streak',
              value: `${streakDays} hari 🔥`,
              icon: '🔥',
              color: Palette.energy,
            },
            {
              label: 'Sesi Selesai',
              value: `${completedSessions}`,
              icon: '✅',
              color: Palette.success,
            },
          ].map((k, i) => (
            <View key={i} style={[styles.kpiCard, { borderColor: k.color + '40' }]}>
              <Text style={styles.kpiIcon}>{k.icon}</Text>
              <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Exam Readiness */}
        <View style={styles.readinessCard}>
          <View style={styles.readinessHeader}>
            <Text style={styles.readinessTitle}>🎯 Kesiapan Ujian</Text>
            <Text style={[styles.readinessPercent, {
              color: readinessPct >= 80 ? Palette.success : readinessPct >= 50 ? Palette.energy : Palette.danger
            }]}>{readinessPct}%</Text>
          </View>
          <View style={styles.readinessBarBg}>
            <View style={[styles.readinessBarFill, {
              width: `${readinessPct}%`,
              backgroundColor: readinessPct >= 80 ? Palette.success : readinessPct >= 50 ? Palette.energy : Palette.danger
            }]} />
          </View>
          <Text style={styles.readinessPrediction}>
            {daysToReady === 0
              ? '🎉 Kamu sudah siap ujian!'
              : `📅 Prediksi siap dalam ~${daysToReady} hari lagi. Tingkatkan konsistensi!`}
          </Text>
        </View>

        {/* Weekly Bar Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Waktu Belajar Minggu Ini</Text>
          <Text style={styles.cardSubtitle}>
            Total: {Math.floor(weeklyTotal / 60)} jam {weeklyTotal % 60} menit
          </Text>
          <View style={styles.barChart}>
            {weeklyData.map((d, i) => {
              const barHeight = maxMinutes > 0 ? (d.minutes / maxMinutes) * 100 : 0;
              const isMax = d.minutes === maxMinutes && d.minutes > 0;
              return (
                <View key={i} style={styles.barWrapper}>
                  <Text style={styles.barValue}>{d.minutes > 0 ? d.minutes : ''}</Text>
                  <View style={styles.barBg}>
                    <View style={[
                      styles.barFill,
                      { height: `${barHeight}%`, backgroundColor: isMax ? Palette.primary : Palette.primary + '60' }
                    ]} />
                  </View>
                  <Text style={styles.barLabel}>{d.day}</Text>
                </View>
              );
            })}
          </View>
          {weeklyTotal === 0 && (
            <Text style={styles.emptyHint}>
              Belum ada sesi belajar minggu ini. Mulai belajar dari halaman Jadwal! 📚
            </Text>
          )}
        </View>

        {/* Subject Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sebaran Topik</Text>
          <Text style={styles.cardSubtitle}>Topik yang paling sering kamu pelajari</Text>
          {subjectData.length > 0 ? subjectData.map((s, i) => {
            const pct = totalSubjectMinutes > 0 ? Math.round((s.minutes / totalSubjectMinutes) * 100) : 0;
            return (
              <View key={i} style={styles.subjectRow}>
                <View style={styles.subjectLabelRow}>
                  <View style={[styles.subjectDot, { backgroundColor: s.color }]} />
                  <Text style={styles.subjectName}>{s.subject}</Text>
                  <Text style={[styles.subjectPct, { color: s.color }]}>{pct}%</Text>
                </View>
                <View style={styles.subjectBarBg}>
                  <View style={[styles.subjectBarFill, { width: `${pct}%`, backgroundColor: s.color }]} />
                </View>
                <Text style={styles.subjectMin}>{s.minutes} menit</Text>
              </View>
            );
          }) : (
            <Text style={styles.emptyHint}>
              Belum ada data topik. Selesaikan sesi belajar untuk melihat breakdown! 📊
            </Text>
          )}
        </View>

        {/* Task Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📋 Statistik Tugas</Text>
          <View style={styles.taskStatsRow}>
            <View style={styles.taskStatItem}>
              <Text style={[styles.taskStatValue, { color: Palette.primary }]}>
                {tasks?.length ?? 0}
              </Text>
              <Text style={styles.taskStatLabel}>Total</Text>
            </View>
            <View style={styles.taskStatDivider} />
            <View style={styles.taskStatItem}>
              <Text style={[styles.taskStatValue, { color: Palette.success }]}>
                {completedTasks}
              </Text>
              <Text style={styles.taskStatLabel}>Selesai</Text>
            </View>
            <View style={styles.taskStatDivider} />
            <View style={styles.taskStatItem}>
              <Text style={[styles.taskStatValue, { color: Palette.energy }]}>
                {(tasks?.length ?? 0) - completedTasks}
              </Text>
              <Text style={styles.taskStatLabel}>Aktif</Text>
            </View>
            <View style={styles.taskStatDivider} />
            <View style={styles.taskStatItem}>
              <Text style={[styles.taskStatValue, { color: Palette.accent }]}>
                {(tasks?.length ?? 0) > 0
                  ? `${Math.round((completedTasks / (tasks?.length ?? 1)) * 100)}%`
                  : '0%'}
              </Text>
              <Text style={styles.taskStatLabel}>Rate</Text>
            </View>
          </View>
        </View>

        {/* AI Insights */}
        <View style={styles.card}>
          <View style={styles.insightHeader}>
            <Text style={styles.cardTitle}>💡 Insight AI</Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={loadInsight} disabled={insightLoading}>
              <Text style={styles.refreshBtnText}>{insightLoading ? '⏳' : '🔄'}</Text>
            </TouchableOpacity>
          </View>
          {insightLoading ? (
            <View style={styles.insightLoading}>
              <ActivityIndicator size="small" color={Palette.primary} />
              <Text style={styles.insightLoadingText}>AI sedang menganalisis...</Text>
            </View>
          ) : (
            <View style={styles.insightItem}>
              <Text style={styles.insightIcon}>🌟</Text>
              <Text style={styles.insightText}>{insight ?? 'Tekan 🔄 untuk memuat insight.'}</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.dark.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Palette.dark.text },
  periodSwitch: { flexDirection: 'row', backgroundColor: Palette.dark.card, borderRadius: 12, padding: 3 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  periodBtnActive: { backgroundColor: Palette.dark.surface },
  periodBtnText: { fontSize: 12, color: Palette.dark.textMuted, fontWeight: '600' },
  periodBtnTextActive: { color: Palette.dark.text },

  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpiCard: { flex: 1, backgroundColor: Palette.dark.card, borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1 },
  kpiIcon: { fontSize: 20, marginBottom: 6 },
  kpiValue: { fontSize: 14, fontWeight: '800', marginBottom: 4 },
  kpiLabel: { fontSize: 9, color: Palette.dark.textMuted, textAlign: 'center' },

  readinessCard: {
    backgroundColor: Palette.dark.surface, borderRadius: 20, padding: 20,
    marginBottom: 16, borderWidth: 1, borderColor: Palette.dark.border,
  },
  readinessHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  readinessTitle: { fontSize: 16, fontWeight: '700', color: Palette.dark.text },
  readinessPercent: { fontSize: 22, fontWeight: '900' },
  readinessBarBg: { height: 10, backgroundColor: Palette.dark.border, borderRadius: 5, overflow: 'hidden', marginBottom: 10 },
  readinessBarFill: { height: '100%', borderRadius: 5 },
  readinessPrediction: { fontSize: 12, color: Palette.dark.textMuted, lineHeight: 18 },

  card: { backgroundColor: Palette.dark.surface, borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: Palette.dark.border },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Palette.dark.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 12, color: Palette.dark.textMuted, marginBottom: 16 },

  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8 },
  barWrapper: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  barValue: { fontSize: 8, color: Palette.dark.textMuted, marginBottom: 4 },
  barBg: { width: '80%', height: 80, justifyContent: 'flex-end', backgroundColor: Palette.dark.border, borderRadius: 6, overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, color: Palette.dark.textMuted, marginTop: 6, fontWeight: '600' },

  emptyHint: { textAlign: 'center', fontSize: 12, color: Palette.dark.textMuted, marginTop: 12, lineHeight: 18, fontStyle: 'italic' },

  subjectRow: { marginBottom: 14 },
  subjectLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  subjectDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  subjectName: { flex: 1, fontSize: 13, color: Palette.dark.text, fontWeight: '600' },
  subjectPct: { fontSize: 13, fontWeight: '700' },
  subjectBarBg: { height: 6, backgroundColor: Palette.dark.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  subjectBarFill: { height: '100%', borderRadius: 3 },
  subjectMin: { fontSize: 10, color: Palette.dark.textMuted },

  // Task stats
  taskStatsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 12 },
  taskStatItem: { alignItems: 'center', flex: 1 },
  taskStatValue: { fontSize: 24, fontWeight: '900', marginBottom: 4 },
  taskStatLabel: { fontSize: 11, color: Palette.dark.textMuted, fontWeight: '600' },
  taskStatDivider: { width: 1, height: 36, backgroundColor: Palette.dark.border },

  // Insight
  insightHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  refreshBtn: { padding: 8 },
  refreshBtnText: { fontSize: 18 },
  insightLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  insightLoadingText: { fontSize: 13, color: Palette.dark.textMuted },
  insightItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  insightIcon: { fontSize: 18 },
  insightText: { flex: 1, fontSize: 13, color: Palette.dark.textMuted, lineHeight: 20 },
});
