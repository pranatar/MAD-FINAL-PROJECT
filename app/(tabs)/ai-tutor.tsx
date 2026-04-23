import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Palette } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import MoodSelector from '@/components/mood-selector';

interface Message {
  id: string;
  role: 'user' | 'tutor';
  text: string;
}

export default function AITutorScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'tutor', text: 'Halo! Aku Aivora, Tutor AI kamu. Ada materi yang mau dibahas atau ingin latihan soal?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState<'tired' | 'energetic' | 'bored' | null>(null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chatTutor = useAction(api.ai.chatTutor);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    const newUserMsg: Message = { id: Date.now().toString(), role: 'user', text: userMessage };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setLoading(true);

    try {
      // Map to the shape convex expects
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const reply = await chatTutor({ 
        message: userMessage, 
        mood: currentMood || undefined,
        history 
      });

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'tutor', text: 'Maaf, server AI sedang sibuk. Coba lagi nanti ya!' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async () => {
    setInputText('Tolong buatkan aku 3 soal kuis pilihan ganda dari topik bebas, atau topik yang baru kita bahas.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🤖</Text>
          </View>
          <View>
            <Text style={styles.title}>Aivora</Text>
            <Text style={styles.subtitle}>
              {loading ? 'Sedang mengetik...' : currentMood ? `Mode: ${currentMood}` : 'Siap membantu!'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moodBtn} onPress={() => setShowMoodSelector(true)}>
          <Ionicons name="happy-outline" size={20} color={Palette.primary} />
          <Text style={styles.moodBtnText}>Mood</Text>
        </TouchableOpacity>
      </View>

      <MoodSelector
        visible={showMoodSelector}
        onClose={() => setShowMoodSelector(false)}
        onSelect={(mood) => {
          setCurrentMood(mood);
          setShowMoodSelector(false);
        }}
      />

      {/* Chat Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.tutorBubble]}>
            <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.tutorText]}>
              {item.text}
            </Text>
          </View>
        )}
      />

      {/* Quick Actions */}
      {messages.length < 3 && (
        <View style={styles.suggestions}>
          <TouchableOpacity style={styles.suggestionBadge} onPress={handleCreateQuiz}>
            <Text style={styles.suggestionText}>📝 Buat Kuis</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.suggestionBadge} onPress={() => setInputText('Jelaskan materi Kalkulus dengan cara gampang')}>
            <Text style={styles.suggestionText}>📐 Belajar Kalkulus</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Tanya soal, materi, atau minta kuis..."
            placeholderTextColor={Palette.dark.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Palette.dark.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Palette.dark.border },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Palette.primary + '20', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 24 },
  title: { fontSize: 16, fontWeight: '700', color: Palette.dark.text },
  subtitle: { fontSize: 12, color: Palette.dark.textMuted, marginTop: 2 },
  moodBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Palette.dark.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: Palette.dark.border },
  moodBtnText: { color: Palette.primary, fontSize: 13, fontWeight: '600' },
  
  chatContainer: { padding: 16, paddingBottom: 20 },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 20, marginBottom: 12 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: Palette.primary, borderBottomRightRadius: 4 },
  tutorBubble: { alignSelf: 'flex-start', backgroundColor: Palette.dark.card, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Palette.dark.border },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  tutorText: { color: Palette.dark.text },

  suggestions: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 10 },
  suggestionBadge: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Palette.dark.surface, borderRadius: 20, borderWidth: 1, borderColor: Palette.dark.border },
  suggestionText: { color: Palette.dark.text, fontSize: 13, fontWeight: '500' },

  inputRow: { flexDirection: 'row', padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, backgroundColor: Palette.dark.surface, borderTopWidth: 1, borderTopColor: Palette.dark.border, alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: Palette.dark.bg, minHeight: 48, maxHeight: 120, borderRadius: 24, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, color: Palette.dark.text, fontSize: 15, borderWidth: 1, borderColor: Palette.dark.border },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Palette.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  sendBtnDisabled: { opacity: 0.5 },
});
