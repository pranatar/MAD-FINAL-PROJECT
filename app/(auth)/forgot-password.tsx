import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleResetRequest = () => {
    if (!email.trim()) {
      Alert.alert("Email Kosong", "Masukkan email Anda untuk menerima instruksi reset.");
      return;
    }

    const subject = "Reset Password Request - " + email;
    const body = "Halo, saya ingin melakukan reset password untuk akun saya.";
    const mailUrl = `mailto:support@myapp.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailUrl).catch(() => {
      Alert.alert("Gagal", "Tidak dapat membuka aplikasi email.");
    });
  };

  return (
    <View style={styles.mainContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.glowCircle, styles.glowBottomRight]} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="white" />
      </TouchableOpacity>

      <View style={styles.scrollContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.greetingText}>Reset Password</Text>
          <Text style={[styles.subGreetingText, { textAlign: 'center' }]}>
            Enter your email to receive a password reset link
          </Text>
        </View>

        <View style={styles.glassFormContainer}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
            <TextInput style={styles.textInput} placeholder="Email Address" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} keyboardType="email-address" />
          </View>

          <TouchableOpacity style={styles.signInButton} onPress={handleResetRequest}>
            <LinearGradient colors={['#a855f7', '#7e22ce']} style={styles.gradientButton}>
              <Text style={styles.signInButtonText}>Send Reset Link</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#0f172a', paddingHorizontal: 24 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40, paddingTop: 60 },
  glowCircle: { position: 'absolute', borderRadius: 1000, opacity: 0.15 },
  glowTopLeft: { width: 300, height: 300, backgroundColor: '#c084fc', top: -50, left: -100 },
  glowBottomRight: { width: 400, height: 400, backgroundColor: '#38bdf8', bottom: -100, right: -150 },
  headerSection: { marginBottom: 40, alignItems: 'center' },
  greetingText: { fontSize: 32, fontWeight: '800', color: 'white', marginBottom: 8 },
  subGreetingText: { fontSize: 16, color: '#94a3b8', textAlign: 'center' },
  glassFormContainer: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', marginBottom: 16, paddingHorizontal: 16, height: 56 },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, color: 'white', fontSize: 16 },
  signInButton: { height: 56, borderRadius: 16, overflow: 'hidden', elevation: 8, marginTop: 10 },
  gradientButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  signInButtonText: { color: 'white', fontSize: 18, fontWeight: '700' },
  socialSection: { alignItems: 'center', marginVertical: 30 },
  orText: { color: '#64748b', marginBottom: 20 },
  socialIconRow: { flexDirection: 'row', gap: 20 },
  socialNetCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255, 255, 255, 0.03)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', justifyContent: 'center', alignItems: 'center' },
  footerSection: { flexDirection: 'row', justifyContent: 'center' },
  signUpLinkText: { color: '#a855f7', fontWeight: '600' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 }
});