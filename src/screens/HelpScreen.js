import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, 
    FlatList, LayoutAnimation, Platform, UIManager, Linking, Switch, 
    KeyboardAvoidingView, ActivityIndicator, Image, Modal, Alert 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

// 🟢 1. IMPORT STORE & LIBRARIES
import useTripStore from '../store/useTripStore';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import LottieView from 'lottie-react-native';

// 🟢 2. IMPORT CONFIG
import { API_BASE_URL } from '../config/constants';

// Enable LayoutAnimation
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 🎨 CATEGORY CONFIGURATION
const CATEGORY_MAP = {
    'All': { label: 'All', icon: 'apps', color: '#64748b' },
    'Billing': { label: 'Payment & Billing', icon: 'card', color: '#F59E0B' },
    'Charging': { label: 'Charging Problems', icon: 'power-plug', color: '#EF4444' },
    'Hardware': { label: 'Hardware Issues', icon: 'ev-station', color: '#EF4444' },
    'Safety': { label: 'Emergency / Safety', icon: 'alert-decagram', color: '#E11D48' },
    'App Usage': { label: 'Trip & App Guide', icon: 'map-clock', color: '#3B82F6' },
    'Vehicle Specific': { label: 'Vehicle & Battery', icon: 'car-electric', color: '#10B981' },
    'Battery Care': { label: 'Battery Health', icon: 'battery-heart', color: '#10B981' },
    'Support': { label: 'Station Issues', icon: 'map-marker-alert', color: '#8B5CF6' },
    'Getting Started': { label: 'New EV Owner', icon: 'help-circle', color: '#0EA5E9' },
};

const getCatStyle = (catName) => CATEGORY_MAP[catName] || { label: catName, icon: 'information', color: '#64748b' };

// ---------------------------------------------------------
// 🟢 SUB-COMPONENT: FAQ Engine (Free Mode)
// ---------------------------------------------------------
const FAQView = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [expandedId, setExpandedId] = useState(null);
    const [faqData, setFaqData] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => { fetchFAQs(); }, []);

    const fetchFAQs = async () => {
        setLoading(true); setErrorMsg(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/support/faq`, { timeout: 5000 }); 
            if (response.data && response.data.success) {
                setFaqData(response.data.data);
            } else {
                setErrorMsg("Server returned no data.");
            }
        } catch (error) {
            console.error("❌ FAQ Fetch Failed:", error.message);
            setErrorMsg(`Connection Failed: ${error.message}`);
            // Fallback for demo if offline
            setFaqData([{ id: '999', category: 'Billing', question: 'Demo: Payment Failed', answer: 'Check internet connection.' }]);
        } finally {
            setLoading(false);
        }
    };

    const categories = useMemo(() => {
        if (!faqData || faqData.length === 0) return ['All'];
        const cats = ['All', ...new Set(faqData.map(item => item.category))];
        return cats.sort();
    }, [faqData]);

    const filteredData = useMemo(() => {
        let data = faqData;
        if (selectedCategory !== 'All') data = data.filter(item => item.category === selectedCategory);
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            data = data.filter(item => 
                item.question.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query) || 
                (item.keywords && item.keywords.some(k => k.toLowerCase().includes(query)))
            );
        }
        return data;
    }, [searchQuery, selectedCategory, faqData]);

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const renderItem = ({ item }) => {
        const isExpanded = expandedId === item.id;
        const style = getCatStyle(item.category);
        return (
            <View style={styles.cardContainer}>
                <TouchableOpacity style={[styles.questionRow, isExpanded && styles.questionActive]} onPress={() => toggleExpand(item.id)} activeOpacity={0.7}>
                    <View style={styles.qTextContainer}>
                        <View style={[styles.miniCatChip, { backgroundColor: style.color + '20' }]}>
                            <MaterialCommunityIcons name={style.icon} size={10} color={style.color} />
                            <Text style={[styles.categoryLabel, { color: style.color }]}>{style.label.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.questionText}>{item.question}</Text>
                    </View>
                    <Ionicons name={isExpanded ? "chevron-up-circle" : "chevron-down-circle-outline"} size={24} color={isExpanded ? "#3b82f6" : "#64748b"} />
                </TouchableOpacity>
                {isExpanded && (
                    <View style={styles.answerBox}>
                        <Text style={styles.answerText}>{item.answer}</Text>
                        <View style={styles.actionRow}>
                            {item.videoLink && (
                                <TouchableOpacity style={styles.videoBtn} onPress={() => Linking.openURL(item.videoLink)}>
                                    <MaterialCommunityIcons name="youtube" size={20} color="#ff0000" />
                                    <Text style={styles.videoText}>Watch Tutorial</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </View>
        );
    };

    if (loading) return <View style={styles.centerBox}><ActivityIndicator size="large" color="#3b82f6" /></View>;

    return (
        <View style={{flex:1}}>
            {errorMsg && <View style={styles.errorBanner}><Text style={styles.errorText}>⚠️ {errorMsg}</Text><TouchableOpacity onPress={fetchFAQs}><Text style={styles.retryText}>RETRY</Text></TouchableOpacity></View>}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#94a3b8" style={{marginLeft: 12}} />
                <TextInput style={styles.input} placeholder="Search issues..." placeholderTextColor="#64748b" value={searchQuery} onChangeText={setSearchQuery} />
            </View>
            <View style={{height: 50, marginBottom: 10}}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContainer}>
                    {categories.map((cat, index) => {
                        const style = getCatStyle(cat);
                        const isSelected = selectedCategory === cat;
                        return (
                            <TouchableOpacity key={index} style={[styles.tab, isSelected && { backgroundColor: style.color + '20', borderColor: style.color }]} onPress={() => { setSelectedCategory(cat); setSearchQuery(''); }}>
                                <MaterialCommunityIcons name={style.icon} size={16} color={isSelected ? style.color : '#94a3b8'} />
                                <Text style={[styles.tabText, isSelected && { color: style.color }]}>{style.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
            <FlatList data={filteredData} keyExtractor={item => item.id.toString()} renderItem={renderItem} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }} />
        </View>
    );
};

// ---------------------------------------------------------
// 🟢 SUB-COMPONENT: AI Chat (Premium)
// ---------------------------------------------------------
const AIChatView = () => {
    const { userProfile } = useTripStore();
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([{ id: 1, text: "Hello! I am your Premium EV Assistant. How can I help?", sender: 'bot' }]);
    const [selectedImage, setSelectedImage] = useState(null); 
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackType, setFeedbackType] = useState(null); 
    const flatListRef = useRef();

    useEffect(() => {
        let voiceAvailable = false;
        let ttsAvailable = false;
        const initVoice = async () => {
            try {
                if (Voice) {
                    Voice.onSpeechStart = () => setIsListening(true);
                    Voice.onSpeechEnd = () => setIsListening(false);
                    Voice.onSpeechResults = (e) => { if (e.value && e.value[0]) setMsg(e.value[0]); };
                    Voice.onSpeechError = (e) => { console.error("Voice Error:", e); setIsListening(false); };
                    voiceAvailable = true;
                }
            } catch (e) { console.log("Voice Init Failed"); }
        };
        const initTts = async () => {
            try {
                if (Tts) {
                    Tts.getInitStatus().then(() => {
                        Tts.setDefaultLanguage('en-IN'); 
                        Tts.setDefaultRate(0.5);
                        Tts.addEventListener('tts-start', () => setIsSpeaking(true));
                        Tts.addEventListener('tts-finish', () => setIsSpeaking(false));
                        ttsAvailable = true;
                    }).catch(() => console.log("TTS Module missing"));
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

    const toggleListening = async () => {
        try {
            if (isListening) await Voice.stop();
            else { setMsg(''); await Voice.start('en-US'); }
        } catch (e) { Alert.alert("Voice Error", "Microphone not ready."); }
    };

    const handleImageResult = (result) => { if (result.assets && result.assets.length > 0) setSelectedImage(result.assets[0]); };
    const openCamera = async () => { handleImageResult(await launchCamera({ mediaType: 'photo', quality: 0.7 })); };
    const openGallery = async () => { handleImageResult(await launchImageLibrary({ mediaType: 'photo', quality: 0.7 })); };

    const handleFeedback = (type) => {
        setFeedbackType(type); setShowFeedbackModal(true);
        setTimeout(() => { setShowFeedbackModal(false); setFeedbackType(null); }, 2000);
    };

    const handleSend = async () => {
        if (!msg.trim() && !selectedImage) return;
        if (isListening) await Voice.stop();

        const userMsg = { id: Date.now(), text: msg || (selectedImage ? "[Image Sent]" : ""), sender: 'user', imageUri: selectedImage?.uri };
        setHistory(prev => [...prev, userMsg]);
        setMsg('');
        setLoading(true);

        try {
            const realCarName = userProfile?.vehicle ? `${userProfile.vehicle.make} ${userProfile.vehicle.model}` : "Electric Vehicle";
            const formData = new FormData();
            formData.append('query', userMsg.text);
            // Default to 'guest_123' if userProfile is missing (No trip planned)
            formData.append('userId', userProfile?.id || "guest_123");
            formData.append('carDetails', realCarName);

            if (selectedImage) {
                formData.append('image', {
                    uri: Platform.OS === 'ios' ? selectedImage.uri.replace('file://', '') : selectedImage.uri,
                    type: selectedImage.type || 'image/jpeg',
                    name: selectedImage.fileName || 'upload.jpg',
                });
            }

            const response = await fetch(`${API_BASE_URL}/ai/ask`, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                const botMsg = { 
                    id: data.data.messageId || Date.now() + 1, 
                    text: data.data.answer.replace(/\\n/g, '\n'), 
                    sender: 'bot',
                    isAi: data.data.source === 'AI_Assistant'
                };
                setHistory(prev => [...prev, botMsg]);
                setSelectedImage(null);
                if (Tts) { try { Tts.speak(botMsg.text); } catch (e) {} }
            } else { throw new Error(data.message); }

        } catch (error) {
            console.error("❌ AI Chat Error:", error);
            setHistory(prev => [...prev, { id: Date.now() + 1, text: "⚠️ Server connection failed.", sender: 'bot', isError: true }]);
        } finally { setLoading(false); }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex:1}}>
            <Modal transparent visible={showFeedbackModal} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <LottieView
                            source={feedbackType === 'up' ? { uri: 'https://assets9.lottiefiles.com/packages/lf20_5tl1xxnz.json' } : { uri: 'https://assets2.lottiefiles.com/packages/lf20_k459c7.json' }}
                            autoPlay loop={false} style={{ width: 150, height: 150 }}
                        />
                        <Text style={styles.modalText}>{feedbackType === 'up' ? "Thanks!" : "We'll improve."}</Text>
                    </View>
                </View>
            </Modal>
            <FlatList
                ref={flatListRef} data={history} keyExtractor={item => item.id.toString()} contentContainerStyle={{padding: 20, paddingBottom: 100}}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                renderItem={({item}) => (
                    <View style={[styles.chatBubble, item.sender === 'user' ? styles.userBubble : styles.botBubble, item.isError && { borderColor: '#EF4444', borderWidth: 1 }]}>
                        {item.imageUri && <Image source={{ uri: item.imageUri }} style={styles.chatImage} />}
                        <Text style={[styles.chatText, item.sender === 'user' ? {color:'#fff'} : {color:'#333'}]}>{item.text}</Text>
                        {item.sender === 'bot' && !item.isError && (
                            <View style={styles.feedbackRow}>
                                <Text style={styles.aiBadge}>{item.isAi ? "✨ AI Generated" : "🤖 System"}</Text>
                                <View style={{flexDirection: 'row'}}>
                                    <TouchableOpacity onPress={() => { if(Tts) try{Tts.speak(item.text)}catch(e){} }} style={styles.thumbBtn}><Text>🔊</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleFeedback('up')} style={styles.thumbBtn}><Text>👍</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleFeedback('down')} style={styles.thumbBtn}><Text>👎</Text></TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}
            />
            <View style={styles.chatInputContainer}>
                {selectedImage && (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                        <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeButton}><Text style={styles.removeText}>✕</Text></TouchableOpacity>
                    </View>
                )}
                <View style={styles.inputRow}>
                    <TouchableOpacity onPress={toggleListening} style={[styles.iconButton, isListening && styles.micActive]}>
                        <Text style={{fontSize: 20}}>{isListening ? "🛑" : "🎙️"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={openCamera} style={styles.iconButton}><Text style={{fontSize: 20}}>📷</Text></TouchableOpacity>
                    <TouchableOpacity onPress={openGallery} style={styles.iconButton}><Text style={{fontSize: 20}}>🖼️</Text></TouchableOpacity>
                    <TextInput style={styles.chatInput} placeholder={isListening ? "Listening..." : "Ask AI..."} placeholderTextColor="#94a3b8" value={msg} onChangeText={setMsg} editable={!loading} />
                    <TouchableOpacity style={[styles.sendBtn, loading && { backgroundColor: '#64748b' }]} onPress={handleSend} disabled={loading}>
                        {loading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-up" size={20} color="#fff" />}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

// ---------------------------------------------------------
// 🟢 MAIN SCREEN (UNGUARDED)
// ---------------------------------------------------------
export default function HelpScreen() {
    const [isPremium, setIsPremium] = useState(false); 
    
    // ✅ NO GUARDS: This screen is now accessible without a trip.

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>{isPremium ? "Premium Support" : "Help Hub"}</Text>
                    <Text style={styles.headerSub}>{isPremium ? "AI Co-Pilot Active" : "How can we help?"}</Text>
                </View>
                <View style={styles.topButtons}>
                    <View style={[styles.toggleWrapper, isPremium && { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}>
                        <Text style={[styles.toggleLabel, isPremium && {color: '#F59E0B'}]}>{isPremium ? "PRO" : "FREE"}</Text>
                        <Switch value={isPremium} onValueChange={setIsPremium} trackColor={{ false: "#334155", true: "#F59E0B" }} thumbColor={"#fff"} style={{ transform: [{ scaleX: .8 }, { scaleY: .8 }] }} />
                    </View>

                    {/* Profile Button */}
                    <TouchableOpacity 
                        style={styles.profileBtn}
                        onPress={() => Alert.alert("Profile", "User Settings coming soon.")}
                    >
                        <Ionicons name="person" size={16} color="#cbd5e1" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Content (Freely Accessible) */}
            {isPremium ? <AIChatView /> : <FAQView />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    
    // Existing Styles
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#1e293b', borderBottomWidth:1, borderBottomColor:'#334155' },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    headerSub: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
    topButtons: { flexDirection: 'row', alignItems:'center', gap: 10 },
    
    // Profile Button Style
    profileBtn: {
        width: 34, height: 34, borderRadius: 17, 
        backgroundColor: '#1e293b', 
        justifyContent: 'center', alignItems: 'center', 
        borderWidth: 1, borderColor: '#334155'
    },

    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    toggleWrapper: { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:'#1e293b', borderWidth:1, borderColor:'#334155', paddingLeft: 10, paddingRight: 2, borderRadius:20, height:34 },
    toggleLabel: { color:'#94a3b8', fontSize:10, fontWeight:'bold' },
    errorBanner: { flexDirection: 'row', justifyContent:'space-between', backgroundColor:'#7f1d1d', padding:10, margin:16, borderRadius:8 },
    errorText: { color:'#fecaca', fontSize:12, fontWeight:'bold', flex:1 },
    retryText: { color:'#fff', fontWeight:'bold', textDecorationLine:'underline', marginLeft:10 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 16, marginTop: 16, marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: '#334155', height: 48 },
    input: { flex: 1, color: '#fff', padding: 12, fontSize: 15 },
    tabContainer: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
    tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', marginRight: 4 },
    tabText: { color: '#94a3b8', fontWeight: '600', fontSize: 12 },
    cardContainer: { backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#334155' },
    questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    questionActive: { backgroundColor: '#263345' },
    qTextContainer: { flex: 1, marginRight: 10 },
    miniCatChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 6, gap: 4 },
    categoryLabel: { fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },
    questionText: { color: '#f1f5f9', fontSize: 14, fontWeight: '600', lineHeight: 20 },
    answerBox: { padding: 16, backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#334155' },
    answerText: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 },
    actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#1e293b' },
    videoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, gap: 6 },
    videoText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    chatBubble: { padding: 12, borderRadius: 16, marginBottom: 12, maxWidth: '80%' },
    userBubble: { backgroundColor: '#3b82f6', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
    botBubble: { backgroundColor: '#ffffff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#334155' },
    chatText: { fontSize: 15, lineHeight: 22 },
    chatImage: { width: 150, height: 100, borderRadius: 10, marginBottom: 5 },
    chatInputContainer: { backgroundColor: '#1e293b', padding: 10, borderTopWidth: 1, borderTopColor: '#334155' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    chatInput: { flex: 1, backgroundColor: '#0f172a', color: '#fff', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
    sendBtn: { width: 44, height: 44, backgroundColor: '#3b82f6', borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    iconButton: { padding: 4 },
    micActive: { backgroundColor: '#ef4444', borderRadius: 20, padding: 4 },
    previewContainer: { flexDirection: 'row', padding: 10, backgroundColor: '#0f172a', marginBottom: 5, borderRadius: 8, alignItems: 'center' },
    previewImage: { width: 50, height: 50, borderRadius: 6, borderWidth: 1, borderColor: '#3b82f6' },
    removeButton: { marginLeft: 10, padding: 5 },
    removeText: { color: '#ef4444', fontWeight: 'bold' },
    feedbackRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 5 },
    aiBadge: { fontSize: 10, color: '#F59E0B', fontWeight: 'bold', marginTop: 5 },
    thumbBtn: { padding: 5, marginLeft: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 20, alignItems: 'center', elevation: 5 },
    modalText: { marginTop: 10, fontSize: 16, fontWeight: 'bold', color: '#333' }
});