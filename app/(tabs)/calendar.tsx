import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';
import { useAction, useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';


// ── Preset options ──────────────────────────────────────────────
const PRESET_SUBJECTS = [
  'Matematika', 'Fisika', 'Kimia', 'Biologi',
  'Bahasa Indonesia', 'Bahasa Inggris', 'Sejarah',
  'Ekonomi', 'Pemrograman', 'Algoritma',
  'Basis Data', 'Jaringan', 'Statistika',
];

const getDeadlinePresets = () => {
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const add = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
  return [
    { label: 'Besok',     value: fmt(add(1)) },
    { label: '3 Hari',   value: fmt(add(3)) },
    { label: '1 Minggu', value: fmt(add(7)) },
    { label: '2 Minggu', value: fmt(add(14)) },
    { label: '1 Bulan',  value: fmt(add(30)) },
  ];
};


const { width } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  deadline: string;
  estimatedMinutes: number;
  completed: boolean;
  priority: number;
}

interface ScheduleBlock {
  id: string;
  title: string;
  subject: string;
  startTime: string;
  endTime: string;
  type: 'study' | 'review' | 'practice';
  completed: boolean;
  durationMinutes?: number;
  description?: string;
  tips?: string;
  priority?: number; // 1-3
  focusTechnique?: string;
}

const DIFFICULTY_COLORS = {
  easy: Palette.success,
  medium: Palette.energy,
  hard: Palette.danger,
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Mudah',
  medium: 'Sedang',
  hard: 'Sulit',
};

const SAMPLE_TASKS: Task[] = [];

const SAMPLE_SCHEDULE: ScheduleBlock[] = [];

const TYPE_EMOJI: Record<string, string> = {
  study: '📖',
  review: '🔁',
  practice: '✏️',
};

const PRIORITY_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: 'Rendah', color: Palette.success },
  2: { label: 'Sedang', color: Palette.energy },
  3: { label: 'Tinggi', color: Palette.danger },
};

const TECHNIQUE_EMOJI: Record<string, string> = {
  'Pomodoro': '🍅',
  'Active Recall': '🧠',
  'Mind Mapping': '🗺️',
  'Spaced Repetition': '🔄',
  'Feynman Technique': '💡',
  'Practice Problems': '📝',
};

const BLOCK_TYPE_COLORS = {
  study: Palette.primary,
  review: Palette.accent,
  practice: Palette.energy,
};

export default function CalendarScreen() {
  const { user: authUser } = useAuth();
  const USER_ID = authUser?.email || "";
  // Use real data from Convex for tasks and schedule
  const dbTasks = useQuery(api.tasks.getTasks, { userId: USER_ID });
  const dbSchedule = useQuery(api.tasks.getScheduleBlocks, { userId: USER_ID });
  
  const tasks = dbTasks || [];
  const schedule = dbSchedule || [];
  
  const createTaskAction = useMutation(api.tasks.createTask);
  const completeTaskAction = useMutation(api.tasks.completeTask);
  const logSessionAction = useMutation(api.sessions.logSession);
  const saveAIScheduleAction = useMutation(api.tasks.saveAISchedule);
  const toggleBlockCompleteAction = useMutation(api.tasks.toggleBlockComplete);
  const deleteTaskAction = useMutation(api.tasks.deleteTask);
  const deleteScheduleBlockAction = useMutation(api.tasks.deleteScheduleBlock);

  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks'>('schedule');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateScheduleAction = useAction(api.ai.generateSchedule);
  const predictDurationAction = useAction(api.ai.predictTaskDuration);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    deadline: '',
  });

  const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(today === 0 ? 6 : today - 1);

  const getDaysWithDates = () =>
    DAYS.map((day, i) => {
      const d = new Date();
      const offset = i - (today === 0 ? 6 : today - 1);
      d.setDate(d.getDate() + offset);
      return { name: day.slice(0, 3), date: d.getDate() };
    });

  const addTask = async () => {
    if (!newTask.title || !newTask.subject || !newTask.deadline) {
      Alert.alert('Lengkapi data', 'Mohon isi semua kolom yang diperlukan.');
      return;
    }
    setIsSaving(true);
    let finalEstimatedMinutes = 60;
    try {
      // AI auto-predicts duration
      finalEstimatedMinutes = await predictDurationAction({
        title: newTask.title,
        subject: newTask.subject,
        difficulty: newTask.difficulty,
      });
    } catch {
      finalEstimatedMinutes = newTask.difficulty === 'hard' ? 150 : newTask.difficulty === 'medium' ? 90 : 45;
    }

    try {
      await createTaskAction({
        userId: USER_ID,
        title: newTask.title,
        subject: newTask.subject,
        difficulty: newTask.difficulty,
        deadline: newTask.deadline,
        estimatedMinutes: finalEstimatedMinutes,
      });
      setNewTask({ title: '', subject: '', difficulty: 'medium', deadline: '' });
      setShowAddTask(false);
    } catch (e) {
      Alert.alert('Gagal', 'Gagal menyimpan tugas ke database.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleComplete = async (block: any) => {
    const newStatus = !block.completed;
    
    // 1. Update DB status
    await toggleBlockCompleteAction({ 
      blockId: block._id, 
      completed: newStatus 
    });

    // 2. If marking as done, log to analytics
    if (newStatus) {
      try {
        await logSessionAction({
          userId: USER_ID,
          subject: block.subject,
          durationMinutes: block.durationMinutes || 45,
        });
      } catch (e) {
        console.error('Failed to log session', e);
      }
    }
  };

  const toggleTaskComplete = async (taskId: string, currentCompleted: boolean) => {
    if (!currentCompleted) {
      await completeTaskAction({ taskId: taskId as any });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm("Apakah Anda yakin ingin menghapus tugas ini secara permanen?")) {
        try {
          await deleteTaskAction({ taskId: taskId as any });
        } catch (e) {
          Alert.alert('Gagal', 'Tidak dapat menghapus tugas.');
        }
      }
      return;
    }

    Alert.alert(
      "Hapus Tugas",
      "Apakah Anda yakin ingin menghapus tugas ini secara permanen?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteTaskAction({ taskId: taskId as any });
            } catch (e) {
              Alert.alert('Gagal', 'Tidak dapat menghapus tugas.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteScheduleBlock = async (blockId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm("Apakah Anda yakin ingin menghapus jadwal ini secara permanen?")) {
        try {
          await deleteScheduleBlockAction({ blockId: blockId as any });
        } catch (e) {
          Alert.alert('Gagal', 'Tidak dapat menghapus jadwal.');
        }
      }
      return;
    }

    Alert.alert(
      "Hapus Jadwal",
      "Apakah Anda yakin ingin menghapus jadwal ini secara permanen?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteScheduleBlockAction({ blockId: blockId as any });
            } catch (e) {
              Alert.alert('Gagal', 'Tidak dapat menghapus jadwal.');
            }
          }
        }
      ]
    );
  };

  const handleGenerateSchedule = async () => {
    const activeTasks = tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) {
      Alert.alert('Tidak ada tugas aktif', 'Silakan tambah tugas terlebih dahulu di tab Tugas.');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateScheduleAction({
        tasks: activeTasks.map(t => ({
          title: t.title,
          subject: t.subject,
          estimatedMinutes: t.estimatedMinutes || 60,
          difficulty: t.difficulty
        }))
      });
      if (result && result.length > 0) {
        // Save to DB for persistence
        await saveAIScheduleAction({
          userId: USER_ID,
          blocks: result.map((r: any) => ({
            title: r.title,
            subject: r.subject,
            startTime: r.startTime,
            endTime: r.endTime,
            type: (['study', 'review', 'practice'].includes(r.type) ? r.type : 'study') as any,
            durationMinutes: r.durationMinutes,
            description: r.description,
            tips: r.tips,
            priority: r.priority,
            focusTechnique: r.focusTechnique,
          }))
        });
        setActiveTab('schedule');
      } else {
        Alert.alert('Gagal', 'AI mengekstrak jadwal kosong. Coba lagi.');
      }
    } catch (e: any) {
      console.error('Failed to generate schedule', e);
      Alert.alert('Error AI', e.message || 'Gagal memanggil AI. Pastikan GEMINI_API_KEY valid di Convex.');
    } finally {
      setIsGenerating(false);
    }
  };

  const activeCount = tasks.filter((t) => !t.completed).length;
  const daysOfWeek = getDaysWithDates();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Jadwal Belajar</Text>
            <Text style={styles.headerSub}>{activeCount} tugas aktif</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddTask(true)}>
            <Text style={styles.addBtnText}>+ Tugas</Text>
          </TouchableOpacity>
        </View>

        {/* Week Strip */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekStrip}>
          {daysOfWeek.map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.dayChip, selectedDay === i && styles.dayChipActive]}
              onPress={() => setSelectedDay(i)}>
              <Text style={[styles.dayName, selectedDay === i && styles.dayNameActive]}>{d.name}</Text>
              <Text style={[styles.dayDate, selectedDay === i && styles.dayDateActive]}>{d.date}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Switch */}
        <View style={styles.tabSwitch}>
          {(['schedule', 'tasks'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === 'schedule' ? '📅 Jadwal' : '📋 Tugas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'schedule' ? (
            <>
              {schedule.map((block) => (
                <View
                  key={block._id}
                  style={[styles.blockCard, block.completed && styles.blockCardDone]}>

                  {/* Left accent bar */}
                  <View style={[styles.blockAccent, { backgroundColor: BLOCK_TYPE_COLORS[block.type] }]} />

                  <View style={styles.blockBody}>

                    {/* Row 1: time + priority + technique */}
                    <View style={styles.blockRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.blockTime, block.completed && styles.textDone]}>
                          🕐 {block.startTime} – {block.endTime}
                        </Text>
                        {block.durationMinutes && (
                          <Text style={styles.blockDuration}>⏱ {block.durationMinutes} mnt</Text>
                        )}
                      </View>
                      <TouchableOpacity 
                        onPress={() => handleDeleteScheduleBlock(block._id)} 
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        style={{ padding: 4, zIndex: 10, position: 'relative' }}
                      >
                        <Ionicons name="trash-outline" size={18} color={Palette.danger} />
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={() => toggleComplete(block)} activeOpacity={0.85}>
                    {/* Row 2: title */}
                    <Text style={[styles.blockTitle, block.completed && styles.textDone]}>
                      {TYPE_EMOJI[block.type]} {block.title}
                    </Text>

                    {/* Row 3: subject + type badge */}
                    <View style={styles.blockRow}>
                      {block.subject ? (
                        <Text style={styles.blockSubject}>📚 {block.subject}</Text>
                      ) : null}
                      <View style={[styles.blockTypeBadge, { backgroundColor: BLOCK_TYPE_COLORS[block.type] + '22' }]}>
                        <Text style={[styles.blockTypeText, { color: BLOCK_TYPE_COLORS[block.type] }]}>
                          {block.type.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    {block.description ? (
                      <Text style={styles.blockDesc}>{block.description}</Text>
                    ) : null}

                    {/* Divider */}
                    {(block.tips || block.focusTechnique || block.priority) ? (
                      <View style={styles.blockDivider} />
                    ) : null}

                    {/* Footer row: tips + priority + technique */}
                    <View style={styles.blockFooter}>
                      {block.focusTechnique ? (
                        <View style={styles.techniqueChip}>
                          <Text style={styles.techniqueText}>
                            {TECHNIQUE_EMOJI[block.focusTechnique] ?? '🎯'} {block.focusTechnique}
                          </Text>
                        </View>
                      ) : null}
                      {block.priority ? (
                        <View style={[styles.priorityChip, { backgroundColor: (PRIORITY_LABEL[block.priority]?.color ?? Palette.energy) + '22' }]}>
                          <Text style={[styles.priorityChipText, { color: PRIORITY_LABEL[block.priority]?.color ?? Palette.energy }]}>
                            Prioritas {PRIORITY_LABEL[block.priority]?.label}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Tips box */}
                    {block.tips ? (
                      <View style={styles.tipsBox}>
                        <Text style={styles.tipsText}>💡 {block.tips}</Text>
                      </View>
                    ) : null}
                    </TouchableOpacity>

                  </View>

                  {/* Checkmark */}
                  {block.completed && <Text style={styles.checkmark}>✓</Text>}

                </View>
              ))}

              <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateSchedule} disabled={isGenerating}>
                <Text style={styles.generateBtnIcon}>🤖</Text>
                <View>
                  <Text style={styles.generateBtnTitle}>{isGenerating ? 'AI Sedang Menyusun...' : 'Auto-Generate Jadwal'}</Text>
                  <Text style={styles.generateBtnSub}>AI akan menyusun jadwal optimal dari tugas aktif</Text>
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {tasks.sort((a, b) => b.priority - a.priority).map((task) => (
                <View 
                  key={task._id} 
                  style={[styles.taskCard, task.completed && { opacity: 0.5 }]}>
                  <View style={styles.taskHeader}>
                    <View style={[styles.priorityBadge, { backgroundColor: task.priority >= 4 ? Palette.danger + '30' : Palette.energy + '30' }]}>
                      <Text style={[styles.priorityText, { color: task.priority >= 4 ? Palette.danger : Palette.energy }]}>
                        P{task.priority}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <Text style={styles.taskDeadline}>Deadline: {task.deadline}</Text>
                      <TouchableOpacity 
                        onPress={() => handleDeleteTask(task._id)}
                        hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        style={{ padding: 4, zIndex: 10, position: 'relative' }}
                      >
                        <Ionicons name="trash-outline" size={18} color={Palette.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => toggleTaskComplete(task._id, task.completed)}
                    activeOpacity={0.8}>
                    <Text style={[styles.taskTitle, task.completed && { textDecorationLine: 'line-through' }]}>
                      {task.completed ? '✅ ' : ''}{task.title}
                    </Text>
                  <Text style={styles.taskSubject}>{task.subject}</Text>
                  <View style={styles.taskFooter}>
                    <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[task.difficulty] + '30' }]}>
                      <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[task.difficulty] }]}>
                        {DIFFICULTY_LABEL[task.difficulty]}
                      </Text>
                    </View>
                    <Text style={styles.taskTime}>⏱️ ~{task.estimatedMinutes} menit</Text>
                  </View>
                </TouchableOpacity>
              </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={showAddTask} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Tambah Tugas Baru</Text>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

                {/* ── Judul ── */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>📝 Judul Tugas</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Tugas Algoritma"
                    placeholderTextColor={Palette.dark.textMuted}
                    value={newTask.title}
                    onChangeText={(v) => setNewTask((p) => ({ ...p, title: v }))}
                  />
                </View>

                {/* ── Mata Kuliah ── */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>📚 Mata Kuliah</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {PRESET_SUBJECTS.map((s) => (
                      <TouchableOpacity
                        key={s}
                        style={[
                          styles.chip,
                          newTask.subject === s && styles.chipActive,
                        ]}
                        onPress={() => setNewTask((p) => ({ ...p, subject: p.subject === s ? '' : s }))}>
                        <Text style={[styles.chipText, newTask.subject === s && styles.chipTextActive]}>
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    placeholder="Atau ketik nama mata kuliah..."
                    placeholderTextColor={Palette.dark.textMuted}
                    value={newTask.subject}
                    onChangeText={(v) => setNewTask((p) => ({ ...p, subject: v }))}
                  />
                </View>

                {/* ── Deadline ── */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>📅 Deadline</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {getDeadlinePresets().map((dp) => (
                      <TouchableOpacity
                        key={dp.label}
                        style={[
                          styles.chip,
                          newTask.deadline === dp.value && styles.chipActive,
                        ]}
                        onPress={() => setNewTask((p) => ({ ...p, deadline: p.deadline === dp.value ? '' : dp.value }))}>
                        <Text style={[styles.chipText, newTask.deadline === dp.value && styles.chipTextActive]}>
                          {dp.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    placeholder="Atau ketik tanggal: YYYY-MM-DD"
                    placeholderTextColor={Palette.dark.textMuted}
                    value={newTask.deadline}
                    onChangeText={(v) => setNewTask((p) => ({ ...p, deadline: v }))}
                  />
                </View>


                {/* ── Tingkat Kesulitan ── */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>🎯 Tingkat Kesulitan</Text>
                  <View style={styles.diffRow}>
                    {(['easy', 'medium', 'hard'] as const).map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.diffBtn, newTask.difficulty === d && { backgroundColor: DIFFICULTY_COLORS[d] }]}
                        onPress={() => setNewTask((p) => ({ ...p, difficulty: d }))}>
                        <Text style={styles.diffBtnEmoji}>
                          {d === 'easy' ? '😊' : d === 'medium' ? '😤' : '🔥'}
                        </Text>
                        <Text style={[styles.diffBtnText, newTask.difficulty === d && { color: '#fff' }]}>
                          {DIFFICULTY_LABEL[d]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddTask(false)}>
                  <Text style={styles.cancelBtnText}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.6 }]} onPress={addTask} disabled={isSaving}>
                  <Text style={styles.saveBtnText}>{isSaving ? '🤖 AI Memproses...' : '✓ Simpan'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Palette.dark.text },
  headerSub: { fontSize: 12, color: Palette.dark.textMuted, marginTop: 2 },
  addBtn: { backgroundColor: Palette.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  weekStrip: { paddingHorizontal: 16, marginBottom: 16 },
  dayChip: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginRight: 8 },
  dayChipActive: { backgroundColor: Palette.primary },
  dayName: { fontSize: 11, color: Palette.dark.textMuted, marginBottom: 4, fontWeight: '600' },
  dayNameActive: { color: '#fff' },
  dayDate: { fontSize: 16, fontWeight: '700', color: Palette.dark.text },
  dayDateActive: { color: '#fff' },

  tabSwitch: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: Palette.dark.card, borderRadius: 14, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Palette.dark.surface },
  tabBtnText: { fontSize: 13, color: Palette.dark.textMuted, fontWeight: '600' },
  tabBtnTextActive: { color: Palette.dark.text },

  content: { paddingHorizontal: 20, paddingBottom: 30 },

  blockCard: { flexDirection: 'row', backgroundColor: Palette.dark.card, borderRadius: 16, marginBottom: 14, overflow: 'hidden', alignItems: 'flex-start', borderWidth: 1, borderColor: Palette.dark.border },
  blockCardDone: { opacity: 0.45 },
  blockAccent: { width: 5, alignSelf: 'stretch', minHeight: 80 },
  blockBody: { flex: 1, padding: 14, paddingRight: 12 },
  blockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  blockTime: { fontSize: 11, color: Palette.dark.textMuted, fontWeight: '600' },
  blockDuration: { fontSize: 11, color: Palette.accent, fontWeight: '700', backgroundColor: Palette.accent + '18', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  blockTitle: { fontSize: 15, fontWeight: '800', color: Palette.dark.text, marginBottom: 6, lineHeight: 20 },
  blockSubject: { fontSize: 12, color: Palette.dark.textMuted, flex: 1, marginRight: 6 },
  blockTypeBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  blockTypeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  blockDesc: { fontSize: 12, color: Palette.dark.textSecondary ?? Palette.dark.textMuted, lineHeight: 18, marginTop: 8, marginBottom: 4 },
  blockDivider: { height: 1, backgroundColor: Palette.dark.border, marginVertical: 10 },
  blockFooter: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  techniqueChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.primary + '18', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  techniqueText: { fontSize: 11, color: Palette.primaryLight, fontWeight: '600' },
  priorityChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  priorityChipText: { fontSize: 11, fontWeight: '700' },
  tipsBox: { backgroundColor: Palette.energy + '12', borderLeftWidth: 3, borderLeftColor: Palette.energy, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 4 },
  tipsText: { fontSize: 12, color: Palette.energy, lineHeight: 18, fontWeight: '500' },
  checkmark: { fontSize: 22, color: Palette.success, marginRight: 14, marginTop: 14 },
  textDone: { textDecorationLine: 'line-through', color: Palette.dark.textMuted },

  generateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.primary + '20', borderRadius: 18, padding: 18, borderWidth: 1.5, borderColor: Palette.primary + '40', gap: 14, marginTop: 8 },
  generateBtnIcon: { fontSize: 30 },
  generateBtnTitle: { fontSize: 15, fontWeight: '700', color: Palette.primaryLight },
  generateBtnSub: { fontSize: 11, color: Palette.dark.textMuted, marginTop: 2 },

  taskCard: { backgroundColor: Palette.dark.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Palette.dark.border },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '800' },
  taskDeadline: { fontSize: 11, color: Palette.dark.textMuted },
  taskTitle: { fontSize: 15, fontWeight: '700', color: Palette.dark.text, marginBottom: 4 },
  taskSubject: { fontSize: 12, color: Palette.dark.textMuted, marginBottom: 12 },
  taskFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  diffBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  diffText: { fontSize: 11, fontWeight: '700' },
  taskTime: { fontSize: 12, color: Palette.dark.textMuted },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: Palette.dark.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, maxHeight: '92%' },
  modalHandle: { width: 40, height: 4, backgroundColor: Palette.dark.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Palette.dark.text, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: Palette.dark.textMuted, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: Palette.dark.card, borderRadius: 12, padding: 14, color: Palette.dark.text, borderWidth: 1, borderColor: Palette.dark.border, fontSize: 14 },
  // Chip presets
  chipRow: { flexDirection: 'row' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Palette.dark.card, borderWidth: 1, borderColor: Palette.dark.border, marginRight: 8 },
  chipActive: { backgroundColor: Palette.primary, borderColor: Palette.primary },
  chipText: { fontSize: 12, color: Palette.dark.textMuted, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  // Difficulty
  diffRow: { flexDirection: 'row', gap: 10 },
  diffBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: Palette.dark.card, borderWidth: 1, borderColor: Palette.dark.border },
  diffBtnEmoji: { fontSize: 18, marginBottom: 2 },
  diffBtnText: { fontSize: 12, fontWeight: '600', color: Palette.dark.textMuted },
  // Modal actions
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: Palette.dark.card },
  cancelBtnText: { color: Palette.dark.textMuted, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: Palette.primary },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
