import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAction, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Palette } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

const CATEGORY_COLOR: Record<string, string> = {
  coding: Palette.primary,
  math: Palette.accent,
  general: Palette.success,
};

// ── Rich Markdown-like Renderer ────────────────────────────────────────────────
function RichContent({ text, catColor }: { text: string; catColor: string }) {
  const lines = text.split('\n');
  const elements: React.ReactElement[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      elements.push(<View key={`space-${i}`} style={{ height: 6 }} />);
      i++; continue;
    }
    if (line.startsWith('## ')) {
      const title = line.replace('## ', '').trim();
      elements.push(
        <View key={`h-${i}`} style={[styles.sectionHeader, { borderLeftColor: catColor }]}>
          <Text style={[styles.sectionHeaderText, { color: catColor }]}>{title}</Text>
        </View>
      );
      i++; continue;
    }
    if (line.startsWith('# ')) {
      elements.push(<Text key={`h1-${i}`} style={styles.h1Text}>{line.replace('# ', '')}</Text>);
      i++; continue;
    }
    if (line.startsWith('- ')) {
      const content = line.substring(2).trim();
      elements.push(
        <View key={`bullet-${i}`} style={styles.bulletRow}>
          <View style={[styles.bulletDot, { backgroundColor: catColor }]} />
          <Text style={styles.bodyText}>{renderInline(content)}</Text>
        </View>
      );
      i++; continue;
    }
    if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)?.[1] ?? '1';
      const content = line.replace(/^\d+\. /, '').trim();
      elements.push(
        <View key={`num-${i}`} style={styles.numberedRow}>
          <View style={[styles.numCircle, { backgroundColor: catColor }]}>
            <Text style={styles.numText}>{num}</Text>
          </View>
          <Text style={styles.bodyText}>{renderInline(content)}</Text>
        </View>
      );
      i++; continue;
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(
        <Text key={`bold-${i}`} style={[styles.boldLine, { color: catColor }]}>{line.slice(2, -2)}</Text>
      );
      i++; continue;
    }
    elements.push(<Text key={`p-${i}`} style={styles.bodyText}>{renderInline(line)}</Text>);
    i++;
  }
  return <View>{elements}</View>;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <Text key={idx} style={styles.boldInline}>{part.slice(2, -2)}</Text>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <Text key={idx} style={styles.italicInline}>{part.slice(1, -1)}</Text>;
    return part;
  });
}

// ── Main Screen ─────────────────────────────────────────────────────────────────
export default function SkillMaterialScreen() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const params = useLocalSearchParams<{
    skillTitle: string;
    description: string;
    icon: string;
    category: string;
    xpRequired: string;
    status: string;
  }>();

  const USER_ID = authUser?.email || "";

  const [material, setMaterial] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  const getMaterialAction = useAction(api.ai.getSkillMaterial);
  const createTask = useMutation(api.tasks.createTask);
  const addXP = useMutation(api.users.addXP);
  const catColor = CATEGORY_COLOR[params.category] ?? Palette.primary;

  useEffect(() => {
    async function load() {
      try {
        const result = await getMaterialAction({
          skillTitle: params.skillTitle,
          description: params.description,
        });
        setMaterial(result);
      } catch {
        setMaterial('Gagal memuat materi. Silakan coba lagi.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleSchedule = async () => {
    setIsScheduling(true);
    try {
      // Create a 7-day deadline from today
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 7);
      const deadlineStr = deadline.toISOString().split('T')[0];

      await createTask({
        userId: USER_ID,
        title: `Pelajari: ${params.skillTitle}`,
        subject: params.skillTitle,
        difficulty: 'medium',
        deadline: deadlineStr,
        estimatedMinutes: 60,
      });

      Alert.alert(
        '✅ Tugas Ditambahkan!',
        `"Pelajari: ${params.skillTitle}" berhasil masuk ke daftar tugas. Sekarang generate jadwal AI untuk mengatur sesinya!`,
        [{ text: 'Lihat Jadwal', onPress: () => router.replace('/(tabs)/calendar') }]
      );
    } catch (e) {
      Alert.alert('Error', 'Gagal menambahkan tugas. Coba lagi.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClaimXP = async () => {
    if (hasClaimed) return;
    setIsClaiming(true);
    try {
      await addXP({ userId: USER_ID, xp: 50 });
      setHasClaimed(true);
      Alert.alert(
        '🎉 Selamat!',
        `Anda berhasil mendapatkan 50 XP untuk materi "${params.skillTitle}". XP ini akan membantu membuka materi selanjutnya!`,
        [{ text: 'Mantap!' }]
      );
    } catch (e) {
      console.error(e);
      Alert.alert('Gagal', 'Gagal mengklaim XP. Coba lagi.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Palette.dark.bg} />

      {/* ── SLIM TOP BAR ── */}
      <View style={[styles.topBar, { borderBottomColor: catColor }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          <Text style={styles.topBarIcon}>{params.icon}</Text>
          <Text style={styles.topBarTitle} numberOfLines={1}>{params.skillTitle}</Text>
        </View>
        <View style={[styles.catChip, { backgroundColor: catColor + '25' }]}>
          <Text style={[styles.catChipText, { color: catColor }]}>
            {(params.category ?? '').toUpperCase()}
          </Text>
        </View>
      </View>

      {/* ── CONTENT ── */}
      {isLoading ? (
        <View style={styles.loadingFull}>
          <Text style={styles.loadingIcon}>📖</Text>
          <ActivityIndicator size="large" color={catColor} style={{ marginBottom: 16 }} />
          <Text style={styles.loadingText}>AI sedang menyiapkan materi...</Text>
          <Text style={styles.loadingSubText}>Tunggu 3–5 detik ya 😊</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {material ? (
            <RichContent text={material} catColor={catColor} />
          ) : null}
          <View style={{ height: 110 }} />
        </ScrollView>
      )}

      {/* ── PINNED FOOTER ── */}
      {!isLoading && (
        <View style={styles.footer}>
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={[styles.claimBtn, { opacity: (isClaiming || hasClaimed) ? 0.6 : 1 }]}
              onPress={handleClaimXP}
              disabled={isClaiming || hasClaimed}
            >
              {isClaiming ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.claimBtnText}>
                  {hasClaimed ? '✅ XP Diklaim' : '🎁 Klaim 50 XP'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.scheduleBtn, { backgroundColor: catColor, opacity: isScheduling ? 0.7 : 1 }]}
              onPress={handleSchedule}
              disabled={isScheduling}
            >
              {isScheduling ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.scheduleBtnText}>📅 Jadwalkan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Palette.dark.bg },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 54,
    paddingBottom: 14,
    borderBottomWidth: 2,
    gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Palette.dark.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontSize: 18, color: Palette.dark.text, fontWeight: '700' },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarIcon: { fontSize: 22 },
  topBarTitle: { fontSize: 17, fontWeight: '800', color: Palette.dark.text, flex: 1 },
  catChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  catChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

  loadingFull: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 80,
  },
  loadingIcon: { fontSize: 64, marginBottom: 10 },
  loadingText: { fontSize: 16, color: Palette.dark.text, fontWeight: '700', textAlign: 'center' },
  loadingSubText: { fontSize: 13, color: Palette.dark.textMuted },

  scrollArea: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 24 },

  // Rich content styles
  h1Text: { fontSize: 22, fontWeight: '900', color: Palette.dark.text, marginBottom: 10 },
  sectionHeader: {
    borderLeftWidth: 4, paddingLeft: 14, paddingVertical: 8,
    marginTop: 22, marginBottom: 10,
    backgroundColor: Palette.dark.surface, borderRadius: 8,
  },
  sectionHeaderText: { fontSize: 16, fontWeight: '800', lineHeight: 22 },

  bodyText: {
    fontSize: 15, color: Palette.dark.text, lineHeight: 26,
    flexShrink: 1, marginBottom: 4,
  },
  boldInline: { fontWeight: '800', color: Palette.dark.text },
  italicInline: { fontStyle: 'italic', color: Palette.dark.textMuted },
  boldLine: { fontSize: 14, fontWeight: '800', marginVertical: 8 },

  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, gap: 12 },
  bulletDot: { width: 8, height: 8, borderRadius: 4, marginTop: 9 },

  numberedRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 12 },
  numCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 14,
    backgroundColor: Palette.dark.bg,
    borderTopWidth: 1, borderTopColor: Palette.dark.border,
  },
  footerActions: { flexDirection: 'row', gap: 12 },
  claimBtn: { 
    flex: 1.2, 
    backgroundColor: '#7e22ce', 
    borderRadius: 16, 
    paddingVertical: 17, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  scheduleBtn: { 
    flex: 1, 
    borderRadius: 16, 
    paddingVertical: 17, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
