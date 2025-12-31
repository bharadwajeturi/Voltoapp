import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ⚠️ IMPORTANT: For Android Emulator use '10.0.2.2'. 
// For physical device, use your laptop's Wi-Fi IP (e.g., '192.168.1.5').
const API_URL = "http://192.168.0.136:3000/api/ai"; 

const AIChatBot = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { id: 'welcome', text: "Hello! I'm your VoltPath Assistant. How can I help you today?", sender: 'bot' }
  ]); 
  const [chips, setChips] = useState([]);       
  const [loading, setLoading] = useState(false);
  
  const scrollViewRef = useRef(); // To auto-scroll to bottom

  // 1. Load Suggested Questions (Chips) on Mount
  useEffect(() => {
    fetch(`${API_URL}/faq-options`)
      .then(res => res.json())
      .then(data => {
        if(data.success) setChips(data.questions.slice(0, 5)); 
      })
      .catch(err => console.error("Failed to load chips", err));
  }, []);

  // 2. Auto-scroll to latest message
  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // 3. Handle Sending a Message
  const handleSend = async (textOverride = null) => {
    const textToSend = textOverride || query;
    if (!textToSend.trim()) return;

    // Add User Message
    const userMsg = { id: Date.now(), text: textToSend, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);
    setTimeout(scrollToBottom, 100);

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend, userId: 'MobileUser' })
      });
      
      const data = await response.json();
      
      // Add Bot Message
      const botMsg = { 
        id: Date.now() + 1, 
        text: data.data.answer, 
        sender: 'bot',
        isAi: data.data.source === 'AI_Assistant' // Check source for Badge
      };
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg = { id: Date.now() + 1, text: "I'm having trouble connecting right now. Please try again.", sender: 'bot' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 100);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* --- CHAT AREA --- */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatArea} 
        contentContainerStyle={{ paddingBottom: 20 }}
        onContentSizeChange={scrollToBottom}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[
            styles.bubble, 
            msg.sender === 'user' ? styles.userBubble : styles.botBubble
          ]}>
            <Text style={msg.sender === 'user' ? styles.userText : styles.botText}>
              {msg.text}
            </Text>
            
            {/* ✨ AI Badge if answer came from Gemini */}
            {msg.isAi && (
              <View style={styles.badgeContainer}>
                <Ionicons name="sparkles" size={10} color="#FFD700" />
                <Text style={styles.aiBadge}> AI Generated</Text>
              </View>
            )}
          </View>
        ))}
        
        {loading && (
          <View style={styles.loadingContainer}>
             <ActivityIndicator size="small" color="#2ECC71" />
             <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* --- SUGGESTION CHIPS --- */}
      {!loading && chips.length > 0 && (
        <View style={styles.chipsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chips.map(chip => (
              <TouchableOpacity 
                key={chip.id} 
                style={styles.chip} 
                onPress={() => handleSend(chip.question)}
              >
                <Text style={styles.chipText}>{chip.question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* --- INPUT AREA --- */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Ask about charging, payments..."
            placeholderTextColor="#94a3b8"
          />
          <TouchableOpacity 
            style={[styles.sendButton, { opacity: query.trim() ? 1 : 0.5 }]} 
            onPress={() => handleSend()}
            disabled={!query.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  chatArea: { flex: 1, padding: 15 },
  
  // Bubbles
  bubble: { padding: 14, borderRadius: 16, marginBottom: 12, maxWidth: '80%' },
  userBubble: { backgroundColor: '#2ECC71', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  botBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  
  // Text
  userText: { color: 'white', fontSize: 15 },
  botText: { color: '#1e293b', fontSize: 15, lineHeight: 22 },
  
  // AI Badge
  badgeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  aiBadge: { fontSize: 11, color: '#64748b', fontWeight: '600' },

  // Chips
  chipsContainer: { height: 50, paddingVertical: 5, backgroundColor: '#f1f5f9' },
  chip: { backgroundColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginHorizontal: 6, justifyContent: 'center' },
  chipText: { color: '#334155', fontSize: 13, fontWeight: '500' },

  // Input
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 24, paddingHorizontal: 16, height: 46, fontSize: 15, color: '#334155', borderWidth: 1, borderColor: '#cbd5e1' },
  sendButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#2ECC71', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  
  // Loading
  loadingContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginBottom: 10 },
  loadingText: { marginLeft: 8, color: '#64748b', fontSize: 12 }
});

export default AIChatBot;