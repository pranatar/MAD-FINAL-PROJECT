import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';

const { width } = Dimensions.get('window');

const WEEKLY_DATA = [
  { day: 'Sen', minutes: 45 },
  { day: 'Sel', minutes: 90 },
  { day: 'Rab', minutes: 30 },
  { day: 'Kam', minutes: 120 },
  { day: 'Jum', minutes: 75 },
  { day: 'Sab', minutes: 60 },
  { day: 'Min', minutes: 20 },
];

const SUBJECT_DATA = [
  { subject: 'Struktur Data', minutes: 320, color: Palette.primary },
  { subject: 'Matematika', minutes: 240, color: Palette.accent },
  { subject: 'Kewarganegaraan', minutes: 160, color: Palette.energy },
  { subject: 'Basis Data', minutes: 80, color: Palette.success },
];

const SKILL_PROGRESS = [
  { skill: 'Programming', level: 72, color: Palette.primary },
  { skill: 'Matematika', level: 55, color: Palette.accent },
  { skill: 'Berpikir Kritis', level: 88, color: Palette.success },
  { skill: 'Manajemen Waktu', level: 40, color: Palette.energy },
];

const totalMinutes = WEEKLY_DATA.reduce((s, d) => s + d.minutes, 0);
const maxMinutes = Math.max(...WEEKLY_DATA.map((d) => d.minutes));
const totalSubjectMinutes = SUBJECT_DATA.reduce((s, d) => s + d.minutes, 0);

export default function DashboardScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

  // Exam readiness prediction
  const avgDailyMin = totalMinutes / 7;
  const targetMinPerDay = 90;
  const readinessPct = Math.min(100, Math.round((avgDailyMin / targetMinPerDay) * 100));
  const daysToReady = readinessPct >= 80 ? 0 : Math.ceil(14 * ((100 - readinessPct) / 100));

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
            { label: 'Total Belajar', value: `${Math.round(totalMinutes / 60)}j ${totalMinutes % 60}m`, icon: '⏱️', color: Palette.primary },
            { label: 'Streak', value: '5 hari 🔥', icon: '🔥', color: Palette.energy },
            { label: 'Sesi Selesai', value: '12', icon: '✅', color: Palette.success },
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
            <Text style={styles.readinessPercent}>{readinessPct}%</Text>
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
          <Text style={styles.cardSubtitle}>Total: {Math.round(totalMinutes / 60)} jam {totalMinutes % 60} menit</Text>
          <View style={styles.barChart}>
            {WEEKLY_DATA.map((d, i) => {
              const barHeight = maxMinutes > 0 ? (d.minutes / maxMinutes) * 100 : 0;
              const isMax = d.minutes === maxMinutes;
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
        </View>

        {/* Subject Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sebaran Topik</Text>
          <Text style={styles.cardSubtitle}>Topik yang paling sering kamu pelajari</Text>
          {SUBJECT_DATA.map((s, i) => {
            const pct = Math.round((s.minutes / totalSubjectMinutes) * 100);
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
          })}
        </View>

        {/* Skill Progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Progress Skill</Text>
          <Text style={styles.cardSubtitle}>Level kemampuanmu saat ini</Text>
          {SKILL_PROGRESS.map((s, i) => (
            <View key={i} style={styles.skillRow}>
              <View style={styles.skillLabelRow}>
                <Text style={styles.skillName}>{s.skill}</Text>
                <Text style={[styles.skillLevel, { color: s.color }]}>{s.level}%</Text>
              </View>
              <View style={styles.skillBarBg}>
                <View style={[styles.skillBarFill, { width: `${s.level}%`, backgroundColor: s.color }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Insights */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💡 Insight AI</Text>
          {[
            { icon: '📈', text: 'Kamu paling produktif di hari Kamis. Jadwalkan materi berat di hari itu!' },
            { icon: '⚠️', text: 'Waktu belajar Rabu & Minggu sangat rendah. Coba tambah 30 menit.' },
            { icon: '🌟', text: 'Skill "Berpikir Kritis" sudah mencapai 88%. Hampir master!' },
          ].map((ins, i) => (
            <View key={i} style={styles.insightItem}>
              <Text style={styles.insightIcon}>{ins.icon}</Text>
              <Text style={styles.insightText}>{ins.text}</Text>
            </View>
          ))}
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
  readinessPercent: { fontSize: 22, fontWeight: '900', color: Palette.primary },
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

  subjectRow: { marginBottom: 14 },
  subjectLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  subjectDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  subjectName: { flex: 1, fontSize: 13, color: Palette.dark.text, fontWeight: '600' },
  subjectPct: { fontSize: 13, fontWeight: '700' },
  subjectBarBg: { height: 6, backgroundColor: Palette.dark.border, borderRadius: 3, overflow: 'hidden', marginBottom: 4 },
  subjectBarFill: { height: '100%', borderRadius: 3 },
  subjectMin: { fontSize: 10, color: Palette.dark.textMuted },

  skillRow: { marginBottom: 14 },
  skillLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  skillName: { fontSize: 13, color: Palette.dark.text, fontWeight: '600' },
  skillLevel: { fontSize: 12, fontWeight: '700' },
  skillBarBg: { height: 8, backgroundColor: Palette.dark.border, borderRadius: 4, overflow: 'hidden' },
  skillBarFill: { height: '100%', borderRadius: 4 },

  insightItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  insightIcon: { fontSize: 18 },
  insightText: { flex: 1, fontSize: 13, color: Palette.dark.textMuted, lineHeight: 18 },
});
