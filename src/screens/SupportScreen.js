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
  Platform, 
  Image, 
  Alert,
  Modal 
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker'; 
import LottieView from 'lottie-react-native'; 
import useTripStore from '../store/useTripStore';
import { API_BASE_URL } from '../config/constants';

// 🟢 NEW: Voice & TTS Imports
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';

const API_URL = `${API_BASE_URL}/ai`;

// 🟢 NEW: Dynamic Limits
const TYPING_LIMIT = 50;
const VOICE_LIMIT = 150; 

const SupportScreen = ({ navigation }) => { 
  const [query, setQuery] = useState('');
  const [chips, setChips] = useState([]);       
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); 

  // 🟢 Voice States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Animation States
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState(null); 

  const scrollViewRef = useRef(); 

  const messages = useTripStore((state) => state.chatHistory);
  const addChatMessage = useTripStore((state) => state.addChatMessage);
  const userProfile = useTripStore((state) => state.userProfile);

  // 🟢 Dynamic Word Count Logic
  const currentWordCount = query.trim() === '' ? 0 : query.trim().split(/\s+/).length;
  const maxLimit = isListening ? VOICE_LIMIT : TYPING_LIMIT;

  // 🟢 1. Initialize Voice & TTS
 // 🟢 1. Initialize Voice & TTS (SAFE MODE)
  useEffect(() => {
    let voiceAvailable = false;
    let ttsAvailable = false;

    const initVoice = async () => {
      try {
        // Check if Voice module is linked
        if (Voice) {
            Voice.onSpeechStart = () => setIsListening(true);
            Voice.onSpeechEnd = () => setIsListening(false);
            Voice.onSpeechResults = (e) => {
                if (e.value && e.value[0]) setQuery(e.value[0]);
            };
            Voice.onSpeechError = (e) => {
                console.error("Voice Error:", e);
                setIsListening(false);
            };
            voiceAvailable = true;
        }
      } catch (e) { console.log("Voice module not ready yet"); }
    };

    const initTts = async () => {
      try {
        // 🛡️ CRITICAL FIX: Prevent crash if TTS is null
        if (Tts) {
            // Add a dummy listener to catch the error safely
            Tts.getInitStatus().then(() => {
                Tts.setDefaultLanguage('en-IN'); 
                Tts.setDefaultRate(0.5);
                Tts.addEventListener('tts-start', () => setIsSpeaking(true));
                Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
                Tts.addEventListener('tts-cancel', () => setIsSpeaking(false));
                ttsAvailable = true;
            }).catch((err) => {
               console.log("TTS Native Module missing (App needs rebuild)");
            });
        }
      } catch (e) { console.log("TTS Setup Failed"); }
    };

    initVoice();
    initTts();

    return () => {
        if (voiceAvailable) Voice.destroy().then(Voice.removeAllListeners);
        if (ttsAvailable) Tts.stop();
    };
  }, []);

  // Fetch History
  useEffect(() => {
    const fetchHistory = async () => {
        try {
            const userId = userProfile.id || 'MobileUser';
            const res = await fetch(`${API_URL}/history/${userId}`);
            const data = await res.json();
            if (data.success && data.history.length > 0 && messages.length === 0) {
                data.history.forEach(msg => addChatMessage(msg));
            }
        } catch (err) { console.log("Failed to load history:", err); }
    };
    fetchHistory();
  }, []); 

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  // 🟢 Voice Functions
  const toggleListening = async () => {
    try {
        if (!Voice) return;
        if (isListening) {
            await Voice.stop();
        } else {
            setQuery(''); // Clear previous text
            await Voice.start('en-US'); // Start listening
        }
    } catch (e) {
        console.error(e);
        Alert.alert("Voice Not Ready", "You need to rebuild the app (npx react-native run-android) to use the Microphone.");    
    }
  };

  const stopSpeaking = () => {
      Tts.stop();
      setIsSpeaking(false);
  };

  // Image Logic
  const handleImageResult = (result) => {
    if (result.assets && result.assets.length > 0) setSelectedImage(result.assets[0]);
  };
  const openCamera = async () => {
    const result = await launchCamera({ mediaType: 'photo', quality: 0.7, includeBase64: false });
    handleImageResult(result);
  };
  const openGallery = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
    handleImageResult(result);
  };

  const handleInputChange = (text) => {
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    // Enforce typing limit (Voice limit is loose)
    if (wordCount <= TYPING_LIMIT || text.length < query.length) {
      setQuery(text);
    }
  };

  const handleFeedback = async (msgId, type) => {
    setFeedbackType(type);
    setShowFeedbackModal(true);
    setTimeout(() => { setShowFeedbackModal(false); setFeedbackType(null); }, 2500);
    try {
        await fetch(`${API_URL}/feedback`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: msgId, type })
        });
    } catch (e) { console.log("Feedback error:", e); }
  };

  const handleAction = (action) => {
      if (!navigation) return;
      if (action === 'NAVIGATE_HISTORY') navigation.navigate('ChargingHistory');
      if (action === 'NAVIGATE_PROFILE') navigation.navigate('Profile');
      if (action === 'NAVIGATE_MAP') navigation.navigate('HomeMap');
  };

  const handleSend = async (textOverride = null) => {
    const textToSend = textOverride || query;
    if (!textToSend.trim() && !selectedImage) return;

    // Stop listening if sending
    if (isListening) await Voice.stop();

    const vehicle = userProfile.vehicle || {};
    const carContext = `Car: ${vehicle.make || 'Generic'} ${vehicle.model}, Battery: ${vehicle.battery}`;

    const userMsg = { 
        id: Date.now(), 
        text: textToSend || (selectedImage ? "[Sent an Image]" : ""), 
        sender: 'user',
        imageUri: selectedImage?.uri 
    };
    addChatMessage(userMsg); 
    setQuery('');
    setLoading(true);

    const formData = new FormData();
    formData.append('query', textToSend);
    formData.append('userId', userProfile.id || 'MobileUser');
    formData.append('carDetails', carContext);

    if (selectedImage) {
        formData.append('image', {
            uri: Platform.OS === 'ios' ? selectedImage.uri.replace('file://', '') : selectedImage.uri,
            type: selectedImage.type || 'image/jpeg',
            name: selectedImage.fileName || 'upload.jpg',
        });
    }

    try {
      const response = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });
      const data = await response.json();
      
      const botMsg = { 
        id: data.data.messageId || Date.now() + 1, 
        text: data.data.answer.replace(/\\n/g, '\n'), 
        sender: 'bot',
        isAi: data.data.source === 'AI_Assistant',
        action: data.data.action,
        feedback: null
      };
      
      addChatMessage(botMsg);
      setSelectedImage(null);

      // 🟢 NEW: Auto-Speak the response
      try {
        if (Tts) Tts.speak(data.data.answer);
      } catch (e) {
        console.log("TTS not available yet");
      }
    } catch (error) {
      const errorMsg = { id: Date.now() + 1, text: "Connection failed.", sender: 'bot' };
      addChatMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    Alert.alert("Clear Chat", "Delete history?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
            try {
                const userId = userProfile.id || 'MobileUser';
                await fetch(`${API_URL}/history/${userId}`, { method: 'DELETE' });
                useTripStore.getState().clearChat(); 
            } catch (e) { console.log("Failed"); }
        }}
    ]);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} 
    >
      <Modal transparent={true} visible={showFeedbackModal} animationType="fade">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <LottieView
                    source={feedbackType === 'up' 
                        ? { uri: 'https://assets9.lottiefiles.com/packages/lf20_5tl1xxnz.json' } 
                        : { uri: 'https://assets2.lottiefiles.com/packages/lf20_k459c7.json' } 
                    }
                    autoPlay loop={false} style={{ width: 150, height: 150 }}
                  />
                  <Text style={styles.modalText}>
                      {feedbackType === 'up' ? "Thanks!" : "We'll improve."}
                  </Text>
              </View>
          </View>
      </Modal>

      <View style={styles.headerRow}>
        {/* 🟢 Stop Speaking Button (Only visible when speaking) */}
        {isSpeaking && (
             <TouchableOpacity onPress={stopSpeaking} style={styles.muteButton}>
                <Text style={{fontSize: 16}}>🔇 Stop Reading</Text>
             </TouchableOpacity>
        )}
        <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Text style={{ fontSize: 20 }}>🗑️</Text> 
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.chatArea}
        ref={scrollViewRef} 
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })} 
      >
        {messages.map(msg => (
          <View key={msg.id} style={[
            styles.bubble, 
            msg.sender === 'user' ? styles.userBubble : styles.botBubble
          ]}>
            {msg.imageUri && (
                <Image source={{ uri: msg.imageUri }} style={styles.chatImage} />
            )}
            <Text style={msg.sender === 'user' ? styles.userText : styles.botText}>
              {msg.text}
            </Text>
            
            {msg.action && (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleAction(msg.action)}>
                    <Text style={styles.actionText}>
                        {msg.action === 'NAVIGATE_HISTORY' ? '📂 Open History' : 
                         msg.action === 'NAVIGATE_PROFILE' ? '👤 Go to Profile' : '🗺️ Open Map'}
                    </Text>
                </TouchableOpacity>
            )}

            {msg.sender === 'bot' && (
                <View style={styles.feedbackRow}>
                    <Text style={styles.aiBadge}>{msg.isAi ? "✨ AI Generated" : "🤖 System"}</Text>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                        {/* 🟢 Read Aloud Button */}
                        <TouchableOpacity onPress={() => Tts.speak(msg.text)} style={styles.thumbBtn}>
                            <Text>🔊</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleFeedback(msg.id, 'up')} style={styles.thumbBtn}>
                            <Text>👍</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleFeedback(msg.id, 'down')} style={styles.thumbBtn}>
                            <Text>👎</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
          </View>
        ))}
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginVertical: 10 }} />}
      </ScrollView>

      <View style={styles.bottomContainer}>
        <View style={styles.inputWrapper}> 
            {selectedImage && (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                    <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeButton}>
                        <Text style={styles.removeText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

          <Text style={[styles.counterText, currentWordCount >= maxLimit ? styles.limitReached : null]}>
            {currentWordCount}/{maxLimit} words {isListening && "(Voice Mode)"}
          </Text>

          <View style={styles.inputContainer}>
            {/* 🟢 NEW: Mic Button */}
            <TouchableOpacity 
                onPress={toggleListening} 
                style={[styles.iconButton, isListening && styles.micActive]} // Change style when listening
            >
                <Text style={styles.iconText}>{isListening ? "🛑" : "🎙️"}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={openCamera} style={styles.iconButton}>
                <Text style={styles.iconText}>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openGallery} style={styles.iconButton}>
                <Text style={styles.iconText}>🖼️</Text>
            </TouchableOpacity>

            <TextInput 
              style={styles.input}
              value={query}
              onChangeText={handleInputChange} 
              placeholder={isListening ? "Listening..." : "Type or speak..."}
              multiline={true} 
            />
            <TouchableOpacity style={styles.sendButton} onPress={() => handleSend()}>
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  headerRow: { flexDirection: 'row', justifyContent: 'flex-end', padding: 10, paddingTop: 40, alignItems: 'center' },
  clearButton: { backgroundColor: 'white', padding: 8, borderRadius: 20, marginLeft: 10 },
  muteButton: { backgroundColor: '#FFEBEE', padding: 8, borderRadius: 20, paddingHorizontal: 15 },
  
  chatArea: { flex: 1, padding: 10 }, 
  bottomContainer: { justifyContent: 'flex-end' }, 

  bubble: { padding: 12, borderRadius: 10, marginBottom: 10, maxWidth: '80%' },
  userBubble: { backgroundColor: '#007AFF', alignSelf: 'flex-end' },
  botBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderColor: '#E0E0E0', borderWidth: 1 },
  userText: { color: 'white' },
  botText: { color: '#333', lineHeight: 20 }, 
  chatImage: { width: 150, height: 100, borderRadius: 10, marginBottom: 5 }, 

  feedbackRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 5 },
  aiBadge: { fontSize: 10, color: '#FF9500', fontWeight: 'bold', marginTop: 5 },
  thumbBtn: { padding: 5, marginLeft: 10 },
  actionButton: { marginTop: 10, backgroundColor: '#E1F5FE', padding: 10, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#0277BD', fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 5 },
  modalText: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: '#333' },

  inputWrapper: { backgroundColor: 'white', borderTopWidth: 1, borderColor: '#EEE', paddingBottom: 5 },
  counterText: { textAlign: 'right', paddingRight: 15, paddingTop: 5, fontSize: 10, color: '#999' },
  limitReached: { color: 'red', fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', padding: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F0F0F0', borderRadius: 20, paddingHorizontal: 15, minHeight: 40, maxHeight: 100 },
  sendButton: { marginLeft: 10, justifyContent: 'center', paddingHorizontal: 10 },
  sendText: { color: '#007AFF', fontWeight: 'bold' },
  
  iconButton: { padding: 8, marginRight: 5 },
  micActive: { backgroundColor: '#FFEBEE', borderRadius: 20 }, // 🔴 Red background when recording
  iconText: { fontSize: 20 },
  
  previewContainer: { padding: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA' },
  previewImage: { width: 60, height: 60, borderRadius: 8, borderWidth: 1, borderColor: '#ddd' },
  removeButton: { marginLeft: 15, padding: 5, backgroundColor: '#FFEBEE', borderRadius: 15, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: 'red', fontWeight: 'bold', fontSize: 14 }
});

export default SupportScreen;