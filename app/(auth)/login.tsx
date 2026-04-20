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

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isRemembered, setIsRemembered] = useState(false);

  const handleSignIn = () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert(
        "Autentikasi Gagal",
        "Silakan masukkan username/email dan password Anda untuk melanjutkan.",
        [{ text: "OK" }]
      );
      return;
    }

    // Simulasi proses login
    router.replace('/(tabs)/dashboard');
  };

  const handleSocialLogin = async (platform: string) => {
    let url = '';
    switch (platform) {
      case 'google': url = 'https://accounts.google.com'; break;
      case 'apple': url = 'https://appleid.apple.com'; break;
      case 'facebook': url = 'https://facebook.com'; break;
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Tidak dapat membuka tautan sistem.");
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.glowCircle, styles.glowTopLeft]} />
      <View style={[styles.glowCircle, styles.glowBottomRight]} />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <Text style={styles.greetingText}>Welcome Back!</Text>
            <Text style={styles.subGreetingText}>Sign in to continue your journey</Text>
          </View>

          <View style={styles.glassFormContainer}>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput} 
                placeholder="Username or Email" 
                placeholderTextColor="#64748b" 
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none" 
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
              <TextInput 
                style={styles.textInput} 
                placeholder="Password" 
                placeholderTextColor="#64748b" 
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity 
                onPress={() => setPasswordVisible(!passwordVisible)} 
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={passwordVisible ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#94a3b8" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.rowWrapper}>
              <TouchableOpacity 
                style={styles.rememberMeWrapper} 
                onPress={() => setIsRemembered(!isRemembered)}
              >
                <View style={[styles.customCheckbox, isRemembered && styles.checkboxActive]}>
                  {isRemembered && <Ionicons name="checkmark" size={12} color="white" />}
                </View>
                <Text style={styles.lightText}>Remember me</Text>
              </TouchableOpacity>
              
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <LinearGradient 
                colors={['#a855f7', '#7e22ce']} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }} 
                style={styles.gradientButton}
              >
                <Text style={styles.signInButtonText}>Sign In</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.socialSection}>
            <Text style={styles.orText}>or sign in with</Text>
            <View style={styles.socialIconRow}>
              <TouchableOpacity 
                style={styles.socialNetCircle} 
                onPress={() => handleSocialLogin('google')}
              >
                <FontAwesome5 name="google" size={20} color="#ef4444" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialNetCircle} 
                onPress={() => handleSocialLogin('apple')}
              >
                <FontAwesome5 name="apple" size={22} color="white" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialNetCircle} 
                onPress={() => handleSocialLogin('facebook')}
              >
                <FontAwesome5 name="facebook-f" size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerSection}>
            <Text style={styles.lightText}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.signUpLinkText}>Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { 
    flex: 1, 
    backgroundColor: '#0f172a', 
    paddingHorizontal: 24 
  },
  scrollContainer: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingBottom: 40, 
    paddingTop: 60 
  },
  glowCircle: { 
    position: 'absolute', 
    borderRadius: 1000, 
    opacity: 0.15 
  },
  glowTopLeft: { 
    width: 300, 
    height: 300, 
    backgroundColor: '#c084fc', 
    top: -50, 
    left: -100 
  },
  glowBottomRight: { 
    width: 400, 
    height: 400, 
    backgroundColor: '#38bdf8', 
    bottom: -100, 
    right: -150 
  },
  headerSection: { 
    marginBottom: 40, 
    alignItems: 'center' 
  },
  greetingText: { 
    fontSize: 32, 
    fontWeight: '800', 
    color: 'white', 
    marginBottom: 8 
  },
  subGreetingText: { 
    fontSize: 16, 
    color: '#94a3b8' 
  },
  glassFormContainer: { 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    borderRadius: 24, 
    padding: 24, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)' 
  },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)', 
    marginBottom: 16, 
    paddingHorizontal: 16, 
    height: 56 
  },
  inputIcon: { 
    marginRight: 12 
  },
  textInput: { 
    flex: 1, 
    color: 'white', 
    fontSize: 16 
  },
  eyeIcon: { 
    padding: 4 
  },
  rowWrapper: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24 
  },
  rememberMeWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  customCheckbox: { 
    width: 20, 
    height: 20, 
    borderRadius: 6, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.2)', 
    marginRight: 8, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkboxActive: { 
    backgroundColor: '#a855f7', 
    borderColor: '#a855f7' 
  },
  lightText: { 
    color: '#94a3b8', 
    fontSize: 14 
  },
  forgotPasswordText: { 
    color: '#a855f7', 
    fontSize: 14, 
    fontWeight: '500' 
  },
  signInButton: { 
    height: 56, 
    borderRadius: 16, 
    overflow: 'hidden', 
    elevation: 8 
  },
  gradientButton: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  signInButtonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: '700' 
  },
  socialSection: { 
    alignItems: 'center', 
    marginVertical: 30 
  },
  orText: { 
    color: '#64748b', 
    marginBottom: 20 
  },
  socialIconRow: { 
    flexDirection: 'row', 
    gap: 20 
  },
  socialNetCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: 'rgba(255, 255, 255, 0.03)', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.08)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  footerSection: { 
    flexDirection: 'row', 
    justifyContent: 'center' 
  },
  signUpLinkText: { 
    color: '#a855f7', 
    fontWeight: '600' 
  }
});