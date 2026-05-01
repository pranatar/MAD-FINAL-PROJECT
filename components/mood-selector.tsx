import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { Palette, MoodColors } from '@/constants/theme';

interface MoodSelectorProps {
  visible: boolean;
  onSelect: (mood: 'tired' | 'energetic' | 'bored') => void;
  onClose: () => void;
}

const MOODS = [
  {
    id: 'tired' as const,
    label: 'Capek',
    labelEn: 'Tired',
    emoji: '😴',
    color: MoodColors.tired.accent,
    bg: MoodColors.tired.bg,
    tip: 'Materi ringan + video singkat',
    tipEn: 'Light material + short videos',
  },
  {
    id: 'energetic' as const,
    label: 'Semangat',
    labelEn: 'Energetic',
    emoji: '⚡',
    color: MoodColors.energetic.accent,
    bg: MoodColors.energetic.bg,
    tip: 'Latihan soal & challenge',
    tipEn: 'Practice & challenges',
  },
  {
    id: 'bored' as const,
    label: 'Bosan',
    labelEn: 'Bored',
    emoji: '😑',
    color: MoodColors.bored.accent,
    bg: MoodColors.bored.bg,
    tip: 'Topik baru & mini games',
    tipEn: 'New topics & mini games',
  },
];

export default function MoodSelector({ visible, onSelect, onClose }: MoodSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (id: 'tired' | 'energetic' | 'bored') => {
    setSelected(id);
    setTimeout(() => {
      onSelect(id);
      setSelected(null);
    }, 200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <Text style={styles.title}>Hari ini kamu ngerasa apa?</Text>
          <Text style={styles.subtitle}>Pilih mood untuk menyesuaikan materi belajarmu</Text>

          <View style={styles.moodGrid}>
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodCard,
                  { borderColor: mood.color },
                  selected === mood.id && { backgroundColor: mood.color + '30' },
                ]}
                onPress={() => handleSelect(mood.id)}
                activeOpacity={0.8}>
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[styles.moodLabel, { color: mood.color }]}>{mood.label}</Text>
                <Text style={styles.moodTip}>{mood.tip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
            <Text style={styles.skipText}>Lewati untuk sekarang</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Palette.dark.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Palette.dark.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Palette.dark.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: Palette.dark.textMuted,
    textAlign: 'center',
    marginBottom: 24,
  },
  moodGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  moodCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    backgroundColor: Palette.dark.card,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  moodTip: {
    fontSize: 10,
    color: Palette.dark.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  skipBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipText: {
    color: Palette.dark.textMuted,
    fontSize: 13,
  },
});
