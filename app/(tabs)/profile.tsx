import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Palette } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user: authUser, signOut } = useAuth();
  const resetUserData = useMutation(api.users.resetUserData);
  const email = authUser?.email || "";
  const user = useQuery(api.users.getUser, { email });

  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);

  const handleMenuPress = (title: string) => {
    if (title === 'Progress Report') {
      router.push('/(tabs)/dashboard');
    } else {
      setActiveModal(title);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };
  
  const handleResetData = () => {
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        "Hapus Semua Data?",
        "Tindakan ini akan menghapus semua tugas, riwayat belajar, dan XP Anda secara permanen. Anda akan mulai dari nol.",
        [
          { text: "Batal", style: "cancel" },
          { 
            text: "Ya, Hapus", 
            style: "destructive",
            onPress: async () => {
              try {
                await resetUserData({ userId: email });
                setActiveModal(null);
                Alert.alert("Berhasil", "Data Anda telah dikosongkan.");
              } catch (e) {
                Alert.alert("Gagal", "Terjadi kesalahan saat menghapus data.");
              }
            }
          }
        ]
      );
    });
  };

  const renderModalContent = () => {
    switch (activeModal) {
      case 'Settings':
        return (
          <View style={styles.modalBody}>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Push Notifications</Text>
              <Switch 
                value={notificationsEnabled} 
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Palette.dark.border, true: Palette.primary }}
              />
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>Sound Effects</Text>
              <Switch 
                value={soundsEnabled} 
                onValueChange={setSoundsEnabled}
                trackColor={{ false: Palette.dark.border, true: Palette.primary }}
              />
            </View>
            <TouchableOpacity style={styles.deleteAccBtn} onPress={handleResetData}>
              <Text style={styles.deleteAccText}>Delete Account Data</Text>
            </TouchableOpacity>
          </View>
        );
      case 'Study History':
        return (
          <View style={styles.modalBody}>
            {[
              { id: 1, date: 'Hari ini', subject: 'Struktur Data', time: '45 menit' },
              { id: 2, date: 'Kemarin', subject: 'Matematika', time: '60 menit' },
              { id: 3, date: '2 hari lalu', subject: 'Kewarganegaraan', time: '30 menit' },
            ].map(history => (
              <View key={history.id} style={styles.historyCard}>
                <View style={styles.historyIcon}><Ionicons name="book" size={20} color={Palette.primary} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historySubject}>{history.subject}</Text>
                  <Text style={styles.historyDate}>{history.date}</Text>
                </View>
                <Text style={styles.historyTime}>{history.time}</Text>
              </View>
            ))}
          </View>
        );
      case 'Notifications':
        return (
          <View style={styles.modalBody}>
            <View style={styles.notifCard}>
              <Text style={styles.notifTitle}>Sistem Updated</Text>
              <Text style={styles.notifDesc}>Selamat datang kembali di aplikasi! Semangat belajar.</Text>
              <Text style={styles.notifTime}>Baru saja</Text>
            </View>
          </View>
        );
      case 'Help & Support':
        return (
          <View style={styles.modalBody}>
            <Text style={styles.helpText}>Punya kendala atau pertanyaan seputar fitur?</Text>
            <TouchableOpacity style={styles.contactBtn}>
              <Ionicons name="mail" size={20} color="white" style={{ marginRight: 8 }} />
              <Text style={styles.contactBtnText}>Hubungi Bantuan</Text>
            </TouchableOpacity>
            <Text style={styles.helpEmail}>cs@unklab.ac.id</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => setActiveModal('Settings')}>
            <Ionicons name="settings-outline" size={24} color={Palette.dark.text} />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.picture ? (
              <Image source={{ uri: user.picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color={Palette.dark.textMuted} />
              </View>
            )}
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lvl {user?.level || 1}</Text>
            </View>
          </View>
          
          <Text style={styles.userName}>{user?.name || 'Loading...'}</Text>
          <Text style={styles.userEmail}>{user?.email || email}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.totalXP ?? 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user?.streakDays ?? 0}</Text>
            <Text style={styles.statLabel}>Streak 🔥</Text>
          </View>
          <View style={styles.statSeparator} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {Math.floor(Number(user?.totalStudyMinutes || 0) / 60)}h
            </Text>
            <Text style={styles.statLabel}>Study Time</Text>
          </View>
        </View>

        {/* Badges Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Badges & Achievements</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/skill-tree')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>
          
          {user?.badges && user.badges.length > 0 ? (
            <View style={styles.badgesWrapper}>
              {user.badges.map((badge: string, i: number) => (
                <View key={i} style={styles.badgeItem}>
                  <Text style={styles.badgeIcon}>🏅</Text>
                  <Text style={styles.badgeName}>{badge}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No badges yet. Start studying to earn some!</Text>
            </View>
          )}
        </View>
        
        {/* Settings Menu */}
        <View style={styles.menuSection}>
          {[
            { icon: 'time-outline', title: 'Study History' },
            { icon: 'bar-chart-outline', title: 'Progress Report' },
            { icon: 'notifications-outline', title: 'Notifications' },
            { icon: 'help-buoy-outline', title: 'Help & Support' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={styles.menuItem} onPress={() => handleMenuPress(item.title)}>
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon as any} size={22} color={Palette.dark.text} />
                <Text style={styles.menuItemTitle}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Palette.dark.textMuted} />
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={22} color={Palette.danger} />
              <Text style={[styles.menuItemTitle, { color: Palette.danger }]}>Log Out</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Unified Modal */}
      <Modal visible={!!activeModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActiveModal(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{activeModal}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setActiveModal(null)}>
              <Ionicons name="close" size={24} color={Palette.dark.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            {renderModalContent()}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.dark.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: Palette.dark.text },
  settingsBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.dark.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Palette.dark.border },
  
  profileSection: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: Palette.primary },
  avatarPlaceholder: { backgroundColor: Palette.dark.surface, justifyContent: 'center', alignItems: 'center', borderColor: Palette.dark.border },
  levelBadge: { position: 'absolute', bottom: -5, alignSelf: 'center', backgroundColor: Palette.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 2, borderColor: Palette.dark.bg },
  levelText: { color: 'white', fontSize: 12, fontWeight: '700' },
  userName: { fontSize: 22, fontWeight: '700', color: Palette.dark.text, marginBottom: 4 },
  userEmail: { fontSize: 14, color: Palette.dark.textMuted },
  
  statsRow: { flexDirection: 'row', backgroundColor: Palette.dark.card, borderRadius: 20, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: Palette.dark.border, justifyContent: 'space-between', alignItems: 'center' },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 20, fontWeight: '900', color: Palette.dark.text },
  statLabel: { fontSize: 11, color: Palette.dark.textMuted, fontWeight: '600' },
  statSeparator: { width: 1.5, height: 24, backgroundColor: Palette.dark.border },

  
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Palette.dark.text },
  seeAllText: { fontSize: 14, color: Palette.primary, fontWeight: '600' },
  
  badgesWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeItem: { backgroundColor: Palette.dark.surface, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: Palette.dark.border, alignItems: 'center', flexDirection: 'row', gap: 8 },
  badgeIcon: { fontSize: 18 },
  badgeName: { fontSize: 14, color: Palette.dark.text, fontWeight: '600' },
  emptyState: { padding: 20, backgroundColor: Palette.dark.surface, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: Palette.dark.border },
  emptyStateText: { color: Palette.dark.textMuted, fontSize: 14 },
  
  menuSection: { gap: 8 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Palette.dark.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Palette.dark.border },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuItemTitle: { fontSize: 16, color: Palette.dark.text, fontWeight: '500' },
  logoutItem: { borderColor: Palette.danger + '40', backgroundColor: Palette.danger + '10', marginTop: 10 },

  // Modal styles
  modalContainer: { flex: 1, backgroundColor: Palette.dark.bg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Palette.dark.border },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Palette.dark.text },
  modalCloseBtn: { padding: 4 },
  modalScroll: { padding: 20 },
  modalBody: { flex: 1 },

  // Settings
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Palette.dark.border },
  settingsLabel: { fontSize: 16, color: Palette.dark.text, fontWeight: '500' },
  deleteAccBtn: { marginTop: 30, paddingVertical: 14, borderRadius: 12, backgroundColor: Palette.danger + '15', alignItems: 'center', borderWidth: 1, borderColor: Palette.danger + '40' },
  deleteAccText: { color: Palette.danger, fontWeight: '600', fontSize: 15 },

  // History
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Palette.dark.surface, padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: Palette.dark.border },
  historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  historySubject: { fontSize: 16, fontWeight: '700', color: Palette.dark.text, marginBottom: 4 },
  historyDate: { fontSize: 12, color: Palette.dark.textMuted },
  historyTime: { fontSize: 14, fontWeight: '800', color: Palette.primary },

  // Notifications
  notifCard: { backgroundColor: Palette.dark.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: Palette.dark.border, marginBottom: 12 },
  notifTitle: { fontSize: 16, fontWeight: '700', color: Palette.dark.text, marginBottom: 6 },
  notifDesc: { fontSize: 14, color: Palette.dark.textMuted, lineHeight: 20, marginBottom: 10 },
  notifTime: { fontSize: 11, color: Palette.primary, fontWeight: '600' },

  // Help
  helpText: { fontSize: 16, color: Palette.dark.text, lineHeight: 24, textAlign: 'center', marginTop: 20, marginBottom: 24 },
  contactBtn: { flexDirection: 'row', backgroundColor: Palette.primary, paddingVertical: 14, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  contactBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  helpEmail: { textAlign: 'center', color: Palette.dark.textMuted, fontSize: 14 }
});
