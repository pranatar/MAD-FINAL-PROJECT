import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Palette } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface SkillNode {
  id: string;
  title: string;
  icon: string;
  description: string;
  xpRequired: number;
  unlocked: boolean;
  completed: boolean;
  parentId: string | null;
  category: 'coding' | 'math' | 'general';
}

const USER_XP = 750;

const SKILL_NODES: SkillNode[] = [
  // Root
  { id: 'foundations', title: 'Foundations', icon: '🌱', description: 'Mulai perjalanan belajarmu dari sini.', xpRequired: 0, unlocked: true, completed: true, parentId: null, category: 'general' },
  // Coding branch
  { id: 'basic-prog', title: 'Basic Programming', icon: '💻', description: 'Variabel, loop, dan kondisi dasar.', xpRequired: 100, unlocked: true, completed: true, parentId: 'foundations', category: 'coding' },
  { id: 'logic-master', title: 'Logic Master', icon: '🧠', description: 'Problem solving tingkat lanjut.', xpRequired: 300, unlocked: true, completed: false, parentId: 'basic-prog', category: 'coding' },
  { id: 'data-struct', title: 'Data Structures', icon: '🗂️', description: 'Array, stack, queue, dan tree.', xpRequired: 500, unlocked: true, completed: false, parentId: 'logic-master', category: 'coding' },
  { id: 'algorithms', title: 'Algorithm Ninja', icon: '⚡', description: 'Sorting, searching, dan optimasi.', xpRequired: 800, unlocked: false, completed: false, parentId: 'data-struct', category: 'coding' },
  { id: 'oop', title: 'OOP Master', icon: '🏗️', description: 'Object-Oriented Programming.', xpRequired: 600, unlocked: false, completed: false, parentId: 'data-struct', category: 'coding' },
  // Math branch
  { id: 'math-basic', title: 'Math Basics', icon: '➕', description: 'Aritmatika dan aljabar.', xpRequired: 0, unlocked: true, completed: true, parentId: 'foundations', category: 'math' },
  { id: 'calculus', title: 'Kalkulus', icon: '📐', description: 'Turunan dan integral.', xpRequired: 200, unlocked: true, completed: false, parentId: 'math-basic', category: 'math' },
  { id: 'statistics', title: 'Statistika', icon: '📊', description: 'Analisis data dan probabilitas.', xpRequired: 400, unlocked: false, completed: false, parentId: 'calculus', category: 'math' },
];

const BADGES = [
  { id: '1', title: 'Early Bird', icon: '🌅', desc: 'Belajar di pagi hari 3x berturut-turut', earned: true },
  { id: '2', title: '5-Day Streak', icon: '🔥', desc: 'Belajar 5 hari berturut-turut', earned: true },
  { id: '3', title: 'Logic Master', icon: '🧠', desc: 'Selesaikan skill Logic Master', earned: false },
  { id: '4', title: 'Night Owl', icon: '🦉', desc: 'Belajar setelah jam 9 malam 5x', earned: false },
  { id: '5', title: 'Speed Learner', icon: '🚀', desc: 'Selesaikan 5 sesi dalam sehari', earned: false },
  { id: '6', title: 'Century Club', icon: '💯', desc: 'Capai 1000 XP total', earned: false },
];

const CATEGORY_COLOR: Record<string, string> = {
  coding: Palette.primary,
  math: Palette.accent,
  general: Palette.success,
};

const NODE_CARD_SIZE = (width - 56) / 3;

export default function SkillTreeScreen() {
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);
  const [activeTab, setActiveTab] = useState<'tree' | 'badges'>('tree');

  const xpToNextUnlock = SKILL_NODES
    .filter((n) => !n.unlocked && n.xpRequired > USER_XP)
    .sort((a, b) => a.xpRequired - b.xpRequired)[0];

  const completedCount = SKILL_NODES.filter((n) => n.completed).length;
  const unlockedCount = SKILL_NODES.filter((n) => n.unlocked).length;

  // Group by rows for display
  const rootNodes = SKILL_NODES.filter((n) => n.parentId === null);
  const level1 = SKILL_NODES.filter((n) => rootNodes.some((r) => r.id === n.parentId));
  const level2 = SKILL_NODES.filter((n) => level1.some((l) => l.id === n.parentId));
  const level3 = SKILL_NODES.filter((n) => level2.some((l) => l.id === n.parentId));

  const rows = [rootNodes, level1, level2, level3];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Skill Tree 🎮</Text>
          <Text style={styles.headerSub}>{completedCount}/{SKILL_NODES.length} skill dikuasai · {USER_XP} XP</Text>
        </View>
        <View style={styles.xpChip}>
          <Text style={styles.xpChipText}>⭐ {USER_XP} XP</Text>
        </View>
      </View>

      {/* Tab Switch */}
      <View style={styles.tabSwitch}>
        {(['tree', 'badges'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab === 'tree' ? '🌳 Skill Tree' : '🏆 Badge'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'tree' ? (
          <>
            {/* XP Progress */}
            {xpToNextUnlock && (
              <View style={styles.nextUnlockCard}>
                <Text style={styles.nextUnlockTitle}>🔓 Berikutnya terbuka:</Text>
                <Text style={styles.nextUnlockSkill}>{xpToNextUnlock.icon} {xpToNextUnlock.title}</Text>
                <View style={styles.nextUnlockBarBg}>
                  <View style={[styles.nextUnlockBarFill, { width: `${Math.min(100, (USER_XP / xpToNextUnlock.xpRequired) * 100)}%` }]} />
                </View>
                <Text style={styles.nextUnlockXP}>{USER_XP} / {xpToNextUnlock.xpRequired} XP</Text>
              </View>
            )}

            {/* Tree Layout */}
            {rows.map((row, rowIdx) => (
              <View key={rowIdx}>
                {/* Connector line */}
                {rowIdx > 0 && (
                  <View style={styles.connectorContainer}>
                    {row.map((_, i) => (
                      <View key={i} style={styles.connectorLine} />
                    ))}
                  </View>
                )}
                <View style={styles.nodeRow}>
                  {row.map((node) => {
                    const catColor = CATEGORY_COLOR[node.category];
                    return (
                      <TouchableOpacity
                        key={node.id}
                        style={[
                          styles.nodeCard,
                          { borderColor: node.unlocked ? catColor : Palette.dark.border },
                          node.completed && { backgroundColor: catColor + '20' },
                          !node.unlocked && styles.nodeCardLocked,
                        ]}
                        onPress={() => node.unlocked && setSelectedNode(node)}
                        activeOpacity={node.unlocked ? 0.8 : 1}>
                        <Text style={[styles.nodeIcon, !node.unlocked && { opacity: 0.3 }]}>
                          {node.unlocked ? node.icon : '🔒'}
                        </Text>
                        <Text style={[styles.nodeTitle, !node.unlocked && styles.nodeTitleLocked]} numberOfLines={2}>
                          {node.title}
                        </Text>
                        {node.completed && (
                          <View style={[styles.completedBadge, { backgroundColor: catColor }]}>
                            <Text style={styles.completedBadgeText}>✓</Text>
                          </View>
                        )}
                        {node.unlocked && !node.completed && (
                          <View style={[styles.activeBadge, { borderColor: catColor }]}>
                            <Text style={[styles.activeBadgeText, { color: catColor }]}>Active</Text>
                          </View>
                        )}
                        {!node.unlocked && (
                          <Text style={styles.xpReqText}>{node.xpRequired} XP</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}

            {/* Legend */}
            <View style={styles.legend}>
              {Object.entries(CATEGORY_COLOR).map(([cat, color]) => (
                <View key={cat} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>
                    {cat === 'coding' ? 'Programming' : cat === 'math' ? 'Matematika' : 'General'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.badgeHeader}>
              {BADGES.filter((b) => b.earned).length}/{BADGES.length} Badge Diperoleh
            </Text>
            <View style={styles.badgeGrid}>
              {BADGES.map((badge) => (
                <View key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
                  <Text style={[styles.badgeIcon, !badge.earned && { opacity: 0.3 }]}>{badge.icon}</Text>
                  <Text style={[styles.badgeTitle, !badge.earned && { color: Palette.dark.textMuted }]}>
                    {badge.title}
                  </Text>
                  <Text style={styles.badgeDesc} numberOfLines={2}>{badge.desc}</Text>
                  {badge.earned ? (
                    <View style={styles.earnedChip}>
                      <Text style={styles.earnedChipText}>✓ Diperoleh</Text>
                    </View>
                  ) : (
                    <View style={styles.lockedChip}>
                      <Text style={styles.lockedChipText}>🔒 Terkunci</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* Node Detail Modal */}
      <Modal visible={!!selectedNode} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setSelectedNode(null)} activeOpacity={1}>
          <View style={styles.nodeModal}>
            <Text style={styles.nodeModalIcon}>{selectedNode?.icon}</Text>
            <Text style={styles.nodeModalTitle}>{selectedNode?.title}</Text>
            <View style={[styles.nodeModalCatBadge, { backgroundColor: CATEGORY_COLOR[selectedNode?.category ?? 'general'] + '30' }]}>
              <Text style={[styles.nodeModalCatText, { color: CATEGORY_COLOR[selectedNode?.category ?? 'general'] }]}>
                {selectedNode?.category === 'coding' ? 'Programming' : selectedNode?.category === 'math' ? 'Matematika' : 'General'}
              </Text>
            </View>
            <Text style={styles.nodeModalDesc}>{selectedNode?.description}</Text>
            <Text style={styles.nodeModalXP}>XP Required: {selectedNode?.xpRequired}</Text>
            {selectedNode?.completed ? (
              <View style={styles.nodeModalCompletedBadge}>
                <Text style={styles.nodeModalCompletedText}>✅ Sudah Dikuasai!</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.nodeModalBtn, { backgroundColor: CATEGORY_COLOR[selectedNode?.category ?? 'general'] }]}
                onPress={() => setSelectedNode(null)}>
                <Text style={styles.nodeModalBtnText}>Mulai Belajar Skill Ini →</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.dark.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Palette.dark.text },
  headerSub: { fontSize: 12, color: Palette.dark.textMuted, marginTop: 2 },
  xpChip: { backgroundColor: Palette.primary + '30', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: Palette.primary },
  xpChipText: { color: Palette.primaryLight, fontWeight: '700', fontSize: 13 },

  tabSwitch: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: Palette.dark.card, borderRadius: 14, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabBtnActive: { backgroundColor: Palette.dark.surface },
  tabBtnText: { fontSize: 13, color: Palette.dark.textMuted, fontWeight: '600' },
  tabBtnTextActive: { color: Palette.dark.text },

  nextUnlockCard: { backgroundColor: Palette.dark.surface, borderRadius: 18, padding: 18, marginBottom: 20, borderWidth: 1, borderColor: Palette.primary + '40' },
  nextUnlockTitle: { fontSize: 12, color: Palette.dark.textMuted, marginBottom: 6 },
  nextUnlockSkill: { fontSize: 16, fontWeight: '700', color: Palette.dark.text, marginBottom: 12 },
  nextUnlockBarBg: { height: 8, backgroundColor: Palette.dark.border, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  nextUnlockBarFill: { height: '100%', backgroundColor: Palette.primary, borderRadius: 4 },
  nextUnlockXP: { fontSize: 11, color: Palette.primary, fontWeight: '600' },

  connectorContainer: { flexDirection: 'row', justifyContent: 'space-around', height: 24, alignItems: 'center', paddingHorizontal: 36 },
  connectorLine: { width: 2, height: 24, backgroundColor: Palette.dark.border, borderRadius: 1 },

  nodeRow: { flexDirection: 'row', justifyContent: 'space-around', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  nodeCard: {
    width: NODE_CARD_SIZE, minHeight: NODE_CARD_SIZE,
    backgroundColor: Palette.dark.card, borderRadius: 18, borderWidth: 2,
    padding: 12, alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  nodeCardLocked: { borderStyle: 'dashed' },
  nodeIcon: { fontSize: 28, marginBottom: 6 },
  nodeTitle: { fontSize: 10, fontWeight: '700', color: Palette.dark.text, textAlign: 'center', lineHeight: 14 },
  nodeTitleLocked: { color: Palette.dark.textMuted },
  completedBadge: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  completedBadgeText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  activeBadge: { marginTop: 6, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  activeBadgeText: { fontSize: 8, fontWeight: '700' },
  xpReqText: { fontSize: 8, color: Palette.dark.textMuted, marginTop: 4 },

  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: Palette.dark.textMuted },

  badgeHeader: { fontSize: 15, fontWeight: '700', color: Palette.dark.text, marginBottom: 16, textAlign: 'center' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  badgeCard: {
    width: (width - 52) / 2, backgroundColor: Palette.dark.card,
    borderRadius: 18, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Palette.dark.border,
  },
  badgeCardLocked: { opacity: 0.6 },
  badgeIcon: { fontSize: 36, marginBottom: 8 },
  badgeTitle: { fontSize: 14, fontWeight: '700', color: Palette.dark.text, textAlign: 'center', marginBottom: 6 },
  badgeDesc: { fontSize: 10, color: Palette.dark.textMuted, textAlign: 'center', lineHeight: 14, marginBottom: 10 },
  earnedChip: { backgroundColor: Palette.success + '30', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  earnedChipText: { color: Palette.success, fontSize: 11, fontWeight: '700' },
  lockedChip: { backgroundColor: Palette.dark.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  lockedChipText: { color: Palette.dark.textMuted, fontSize: 11 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  nodeModal: { backgroundColor: Palette.dark.surface, borderRadius: 24, padding: 28, width: '100%', alignItems: 'center' },
  nodeModalIcon: { fontSize: 52, marginBottom: 12 },
  nodeModalTitle: { fontSize: 22, fontWeight: '800', color: Palette.dark.text, textAlign: 'center', marginBottom: 10 },
  nodeModalCatBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 12, marginBottom: 14 },
  nodeModalCatText: { fontSize: 12, fontWeight: '700' },
  nodeModalDesc: { fontSize: 14, color: Palette.dark.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  nodeModalXP: { fontSize: 13, color: Palette.primary, fontWeight: '600', marginBottom: 20 },
  nodeModalCompletedBadge: { backgroundColor: Palette.success + '30', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  nodeModalCompletedText: { color: Palette.success, fontWeight: '700', fontSize: 15 },
  nodeModalBtn: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  nodeModalBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
