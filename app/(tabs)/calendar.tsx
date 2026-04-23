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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

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

const BLOCK_TYPE_COLORS = {
  study: Palette.primary,
  review: Palette.accent,
  practice: Palette.energy,
};

export default function CalendarScreen() {
  const [tasks, setTasks] = useState<Task[]>(SAMPLE_TASKS);
  const [schedule, setSchedule] = useState<ScheduleBlock[]>(SAMPLE_SCHEDULE);
  const [activeTab, setActiveTab] = useState<'schedule' | 'tasks'>('schedule');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateScheduleAction = useAction(api.ai.generateSchedule);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    deadline: '',
    estimatedMinutes: '60',
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

  const addTask = () => {
    if (!newTask.title || !newTask.subject || !newTask.deadline) {
      Alert.alert('Lengkapi data', 'Mohon isi semua kolom yang diperlukan.');
      return;
    }
    const daysLeft = Math.max(1, Math.ceil((new Date(newTask.deadline).getTime() - Date.now()) / 86400000));
    const diffScore = newTask.difficulty === 'hard' ? 3 : newTask.difficulty === 'medium' ? 2 : 1;
    const priority = Math.min(5, Math.round((5 / daysLeft) * diffScore));

    setTasks((prev) => [
      ...prev,
      { id: Date.now().toString(), ...newTask, estimatedMinutes: parseInt(newTask.estimatedMinutes, 10), completed: false, priority },
    ]);
    setNewTask({ title: '', subject: '', difficulty: 'medium', deadline: '', estimatedMinutes: '60' });
    setShowAddTask(false);
  };

  const toggleComplete = (id: string) => {
    setSchedule((prev) => prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b)));
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
          estimatedMinutes: t.estimatedMinutes,
          difficulty: t.difficulty
        }))
      });
      if (result && result.length > 0) {
        setSchedule(result.map((r: any, i: number) => ({
          ...r,
          id: `ai-${Date.now()}-${i}`,
          completed: false
        })));
        setActiveTab('schedule');
      } else {
        Alert.alert('Gagal', 'AI mengekstrak jadwal kosong. Coba lagi.');
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal memanggil AI. Pastikan GEMINI_API_KEY valid di Convex.');
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
                <TouchableOpacity
                  key={block.id}
                  style={[styles.blockCard, block.completed && styles.blockCardDone]}
                  onPress={() => toggleComplete(block.id)}
                  activeOpacity={0.8}>
                  <View style={[styles.blockAccent, { backgroundColor: BLOCK_TYPE_COLORS[block.type] }]} />
                  <View style={styles.blockBody}>
                    <Text style={[styles.blockTime, block.completed && styles.textDone]}>
                      {block.startTime} – {block.endTime}
                    </Text>
                    <Text style={[styles.blockTitle, block.completed && styles.textDone]}>{block.title}</Text>
                    {block.subject ? (
                      <Text style={styles.blockSubject}>{block.subject}</Text>
                    ) : null}
                  </View>
                  <View style={[styles.blockTypeBadge, { backgroundColor: BLOCK_TYPE_COLORS[block.type] + '22' }]}>
                    <Text style={[styles.blockTypeText, { color: BLOCK_TYPE_COLORS[block.type] }]}>
                      {block.type.toUpperCase()}
                    </Text>
                  </View>
                  {block.completed && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
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
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={[styles.priorityBadge, { backgroundColor: task.priority >= 4 ? Palette.danger + '30' : Palette.energy + '30' }]}>
                      <Text style={[styles.priorityText, { color: task.priority >= 4 ? Palette.danger : Palette.energy }]}>
                        P{task.priority}
                      </Text>
                    </View>
                    <Text style={styles.taskDeadline}>Deadline: {task.deadline}</Text>
                  </View>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskSubject}>{task.subject}</Text>
                  <View style={styles.taskFooter}>
                    <View style={[styles.diffBadge, { backgroundColor: DIFFICULTY_COLORS[task.difficulty] + '30' }]}>
                      <Text style={[styles.diffText, { color: DIFFICULTY_COLORS[task.difficulty] }]}>
                        {DIFFICULTY_LABEL[task.difficulty]}
                      </Text>
                    </View>
                    <Text style={styles.taskTime}>⏱️ ~{task.estimatedMinutes} menit</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Task Modal */}
      <Modal visible={showAddTask} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Tambah Tugas Baru</Text>

            {[
              { key: 'title', label: 'Judul Tugas', placeholder: 'Contoh: Tugas Algoritma' },
              { key: 'subject', label: 'Mata Kuliah', placeholder: 'Contoh: Struktur Data' },
              { key: 'deadline', label: 'Deadline (YYYY-MM-DD)', placeholder: '2026-04-25' },
              { key: 'estimatedMinutes', label: 'Estimasi Waktu (menit)', placeholder: '60', keyboardType: 'numeric' },
            ].map((field) => (
              <View key={field.key} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  placeholderTextColor={Palette.dark.textMuted}
                  value={(newTask as any)[field.key]}
                  onChangeText={(v) => setNewTask((prev) => ({ ...prev, [field.key]: v }))}
                  keyboardType={(field as any).keyboardType || 'default'}
                />
              </View>
            ))}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kesulitan</Text>
              <View style={styles.diffRow}>
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.diffBtn, newTask.difficulty === d && { backgroundColor: DIFFICULTY_COLORS[d] }]}
                    onPress={() => setNewTask((prev) => ({ ...prev, difficulty: d }))}>
                    <Text style={[styles.diffBtnText, newTask.difficulty === d && { color: '#fff' }]}>
                      {DIFFICULTY_LABEL[d]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddTask(false)}>
                <Text style={styles.cancelBtnText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={addTask}>
                <Text style={styles.saveBtnText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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

  blockCard: { flexDirection: 'row', backgroundColor: Palette.dark.card, borderRadius: 16, marginBottom: 12, overflow: 'hidden', alignItems: 'center', borderWidth: 1, borderColor: Palette.dark.border },
  blockCardDone: { opacity: 0.5 },
  blockAccent: { width: 4, alignSelf: 'stretch' },
  blockBody: { flex: 1, padding: 14 },
  blockTime: { fontSize: 11, color: Palette.dark.textMuted, fontWeight: '600', marginBottom: 4 },
  blockTitle: { fontSize: 14, fontWeight: '700', color: Palette.dark.text, marginBottom: 2 },
  blockSubject: { fontSize: 11, color: Palette.dark.textMuted },
  blockTypeBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 12 },
  blockTypeText: { fontSize: 9, fontWeight: '800' },
  checkmark: { fontSize: 18, color: Palette.success, marginRight: 14 },
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
  modalSheet: { backgroundColor: Palette.dark.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: Palette.dark.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Palette.dark.text, marginBottom: 20 },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 12, color: Palette.dark.textMuted, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: Palette.dark.card, borderRadius: 12, padding: 14, color: Palette.dark.text, borderWidth: 1, borderColor: Palette.dark.border, fontSize: 14 },
  diffRow: { flexDirection: 'row', gap: 10 },
  diffBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: Palette.dark.card, borderWidth: 1, borderColor: Palette.dark.border },
  diffBtnText: { fontSize: 13, fontWeight: '600', color: Palette.dark.textMuted },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: Palette.dark.card },
  cancelBtnText: { color: Palette.dark.textMuted, fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: Palette.primary },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});
