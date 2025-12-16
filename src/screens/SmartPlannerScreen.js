import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, 
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTripStore } from '../store/useTripStore';
import { searchPlaces, fetchPlaceDetails } from '../services/api'; 

export default function SmartPlannerScreen() {
  const navigation = useNavigation();
  const setTripData = useTripStore((state) => state.setTripData);

  // --- Form State ---
  const [start, setStart] = useState(null); 
  const [end, setEnd] = useState(null);
  const [queryStart, setQueryStart] = useState('');
  const [queryEnd, setQueryEnd] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  
  // Battery & Car Details
  const [battery, setBattery] = useState('80');       
  const [arrivalBuffer, setArrivalBuffer] = useState('15'); 
  const [maxRange, setMaxRange] = useState('300'); 

  // Time State
  const [startTime, setStartTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Search Logic ---
  const handleSearch = async (text, field) => {
    if (field === 'start') setQueryStart(text);
    else setQueryEnd(text);
    setActiveField(field);

    if (text.length > 2) {
      const results = await searchPlaces(text);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const selectLocation = async (place) => {
    setLoading(true);
    try {
        const coords = await fetchPlaceDetails(place.place_id);
        if (!coords) {
            alert("Could not fetch location details.");
            return;
        }
        const locationData = { name: place.description, lat: coords.lat, lng: coords.lng };

        if (activeField === 'start') {
            setStart(locationData);
            setQueryStart(locationData.name);
        } else {
            setEnd(locationData);
            setQueryEnd(locationData.name);
        }
        setSuggestions([]);
        setActiveField(null);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handlePlanTrip = () => {
    // 1. Validation
    if (!start || !end) {
        alert("Please select start and end locations");
        return;
    }

    // 2. Construct Payload
    // 🟢 This logic is now INSIDE the function (Safe)
    const payload = {
        start: { latitude: start.lat, longitude: start.lng },
        end: { latitude: end.lat, longitude: end.lng },
        carModel: "Tata Nexon EV", 
        currentBattery: parseInt(battery) || 80,
        preferences: { 
            minBuffer: parseInt(arrivalBuffer) || 15,
            maxRangeKm: parseInt(maxRange) || 300
        },
        startTime: startTime.toISOString()
    };
    
    // 3. Navigate to Loading Screen
    navigation.navigate('LoadingScreen', { 
        payload,
        startName: queryStart.split(',')[0], 
        endName: queryEnd.split(',')[0]
    });
  }; // 🟢 Function correctly closes here

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1, justifyContent: 'center', padding: 20 }}
      >
          <Text style={styles.header}>⚡ VoltPath Planner</Text>

          {/* Start Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color="#2ECC71" />
            <TextInput 
              style={styles.input} 
              placeholder="Start Location" 
              placeholderTextColor="#64748b"
              value={queryStart}
              onChangeText={(t) => handleSearch(t, 'start')}
            />
          </View>

          {/* End Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="flag" size={20} color="#E74C3C" />
            <TextInput 
              style={styles.input} 
              placeholder="Destination" 
              placeholderTextColor="#64748b"
              value={queryEnd}
              onChangeText={(t) => handleSearch(t, 'end')}
            />
          </View>

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsBox}>
              <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 200 }}>
                {suggestions.map((item) => (
                  <TouchableOpacity 
                    key={item.place_id} 
                    style={styles.suggestionItem} 
                    onPress={() => selectLocation(item)}
                  >
                    <Text style={styles.suggestionText}>{item.description}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Car Range Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="speedometer" size={20} color="#8E44AD" />
            <View style={{flex: 1}}>
                <Text style={styles.label}>Total Range (at 100%)</Text>
                <TextInput 
                    style={[styles.input, { height: 30, padding: 0 }]} 
                    placeholder="300" 
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    maxLength={4}
                    value={maxRange}
                    onChangeText={setMaxRange}
                />
            </View>
            <Text style={styles.unitText}>km</Text>
          </View>

          {/* Battery Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.inputContainer, styles.halfInput, { marginRight: 10 }]}>
                <Ionicons name="battery-charging" size={20} color="#3b82f6" />
                <View style={{flex: 1}}>
                    <Text style={styles.label}>Start SOC</Text>
                    <TextInput 
                        style={styles.miniInput} 
                        placeholder="80" 
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        maxLength={3}
                        value={battery}
                        onChangeText={setBattery}
                    />
                </View>
                <Text style={styles.unitText}>%</Text>
            </View>

            <View style={[styles.inputContainer, styles.halfInput]}>
                <Ionicons name="shield-checkmark" size={20} color="#F1C40F" />
                <View style={{flex: 1}}>
                    <Text style={styles.label}>End SOC</Text>
                    <TextInput 
                        style={styles.miniInput} 
                        placeholder="15" 
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        maxLength={2}
                        value={arrivalBuffer}
                        onChangeText={setArrivalBuffer}
                    />
                </View>
                <Text style={styles.unitText}>%</Text>
            </View>
          </View>

          {/* Time Picker */}
          <TouchableOpacity style={styles.inputContainer} onPress={() => setShowTimePicker(true)}>
            <Ionicons name="time" size={20} color="#94a3b8" />
            <Text style={[styles.input, { marginTop: 4 }]}>
                Departure: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) setStartTime(selectedDate);
              }}
            />
          )}

          {/* Plan Button */}
          <TouchableOpacity style={styles.planButton} onPress={handlePlanTrip} disabled={loading}>
            {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.btnText}>Plan Route</Text>}
          </TouchableOpacity>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 20, textAlign: 'center' },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', 
    borderRadius: 12, paddingHorizontal: 15, marginBottom: 15, height: 60, zIndex: 1
  },
  rowContainer: { flexDirection: 'row', justifyContent: 'space-between', zIndex: 0 },
  halfInput: { flex: 1 },
  input: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },
  miniInput: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10, height: 24, padding: 0 },
  label: { color: '#64748b', fontSize: 10, marginLeft: 10, textTransform: 'uppercase', fontWeight: 'bold' },
  unitText: { color: '#64748b', fontWeight: 'bold' },
  suggestionsBox: { 
    position: 'absolute', top: 180, left: 20, right: 20, zIndex: 100,
    backgroundColor: '#1e293b', borderRadius: 10, 
    borderWidth: 1, borderColor: '#334155', elevation: 10 
  },
  suggestionItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#334155' },
  suggestionText: { color: '#fff' },
  planButton: { backgroundColor: '#2ECC71', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#0f172a', fontWeight: 'bold', fontSize: 18 }
});