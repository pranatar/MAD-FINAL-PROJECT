import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Alert, 
  Linking 
} from 'react-native';
import { Stack, useRouter, Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Data Tidak Lengkap", "Mohon isi Username, Email, dan Password Anda.");
      return;
    }
    
    // Simulasi pendaftaran berhasil
    Alert.alert("Berhasil", "Akun Anda telah terdaftar!");
    router.replace('/(tabs)/dashboard');
  };

  const handleSocialAction = async (platform: string) => {
    let url = platform === 'google' ? 'https://accounts.google.com' : 
              platform === 'apple' ? 'https://appleid.apple.com' : 'https://facebook.com';
    await Linking.openURL(url);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.glowCircle, styles.glowTopLeft]} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="white" />
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <Text style={styles.greetingText}>Create Account</Text>
            <Text style={styles.subGreetingText}>Start your aesthetic journey here</Text>
          </View>

          <View style={styles.glassFormContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput style={styles.textInput} placeholder="Username" placeholderTextColor="#64748b" value={username} onChangeText={setUsername} />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput style={styles.textInput} placeholder="Email Address" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} keyboardType="email-address" />
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput style={styles.textInput} placeholder="Password" placeholderTextColor="#64748b" secureTextEntry value={password} onChangeText={setPassword} />
            </View>

            <TouchableOpacity style={styles.signInButton} onPress={handleRegister}>
              <LinearGradient colors={['#a855f7', '#7e22ce']} style={styles.gradientButton}>
                <Text style={styles.signInButtonText}>Sign Up</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.socialSection}>
            <Text style={styles.orText}>or sign up with</Text>
            <View style={styles.socialIconRow}>
              <TouchableOpacity onPress={() => handleSocialAction('google')} style={styles.socialNetCircle}><FontAwesome5 name="google" size={20} color="#ef4444" /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleSocialAction('apple')} style={styles.socialNetCircle}><FontAwesome5 name="apple" size={22} color="white" /></TouchableOpacity>
              <TouchableOpacity onPress={() => handleSocialAction('facebook')} style={styles.socialNetCircle}><FontAwesome5 name="facebook-f" size={20} color="#3b82f6" /></TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.lightText}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity><Text style={styles.signUpLinkText}>Sign In</Text></TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  lightText: { color: '#94a3b8' },
  signUpLinkText: { color: '#a855f7', fontWeight: '600' },
  backButton: { position: 'absolute', top: 50, left: 20, zIndex: 10 }
});