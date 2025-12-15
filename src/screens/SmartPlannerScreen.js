import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Switch, ScrollView, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker'; 
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';

import { useTheme } from '../theme/ThemeContext';
import useTripStore from '../store/useTripStore';
import { api } from '../services/api';

const CAR_MODELS = [
  { label: 'Select Car Model', value: '' },
  { label: 'Tata Nexon EV Prime (30kWh)', value: 'Tata Nexon EV Prime', range: 250 },
  { label: 'Tata Nexon EV Max (40.5kWh)', value: 'Tata Nexon EV Max', range: 350 },
  { label: 'MG ZS EV (50kWh)', value: 'MG ZS EV', range: 400 },
  { label: 'Hyundai Kona Electric', value: 'Hyundai Kona', range: 450 },
  { label: 'Tata Tiago EV', value: 'Tata Tiago EV', range: 200 },
];

export default function SmartPlannerScreen() {
  const { theme, isPremium, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const { setTripData, setLoading, isLoading } = useTripStore();

  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [selectedCar, setSelectedCar] = useState('');
  const [battery, setBattery] = useState(100);
  const [buffer, setBuffer] = useState(20);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
            let loc = await Location.getCurrentPositionAsync({});
            // Reverse geocode to get initial address text
            const [address] = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude
            });
            if (address) {
                const addrText = `${address.city || ''}, ${address.region || ''}`;
                setStartAddress(addrText.replace(/^, /, '')); // Clean up
            } else {
                setStartAddress(`${loc.coords.latitude}, ${loc.coords.longitude}`);
            }
        } catch (e) {
            console.log("GPS Error", e);
        }
      }
    })();
  }, []);

  const geocodeAddress = async (address) => {
    try {
        const result = await Location.geocodeAsync(address);
        if (result && result.length > 0) {
            return { latitude: result[0].latitude, longitude: result[0].longitude };
        }
    } catch (e) {
        console.error("Geocoding failed for:", address, e);
    }
    return null;
  };

  const handlePlanTrip = async () => {
    if (!endAddress || !selectedCar) {
      Alert.alert("Missing Info", "Please enter a destination and select a car model.");
      return;
    }

    setLoading(true);
    try {
      // 1. Geocode Start (if user changed it) and End
      let startCoords = await geocodeAddress(startAddress);
      let endCoords = await geocodeAddress(endAddress);

      // Fallback if geocoding fails (e.g. invalid name)
      if (!startCoords) {
         // Try getting current location again if start input failed
         let loc = await Location.getCurrentPositionAsync({});
         startCoords = loc.coords;
      }
      if (!endCoords) {
          throw new Error("Could not find destination. Please try a different city name.");
      }

      const carInfo = CAR_MODELS.find(c => c.value === selectedCar);

      const payload = {
        start: startCoords,
        end: endCoords, 
        carModel: selectedCar,
        maxRangeKm: carInfo?.range || 300,
        currentBattery: battery,
        minBuffer: buffer
      };

      const data = await api.planTrip(payload);
      setTripData(data);
      
      navigation.navigate('TripDashboard', { screen: 'RoutePlanner' });

    } catch (error) {
      console.error("Planning Failed:", error);
      Alert.alert("Planning Failed", error.message || "Server might be offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Smart Planner</Text>
          <View style={styles.toggleRow}>
             <Text style={[styles.modeText, {color: theme.textSecondary}]}>{isPremium ? 'Premium' : 'Eco'}</Text>
             <Switch value={isPremium} onValueChange={toggleTheme} trackColor={{ false: '#ccc', true: theme.primary }} />
          </View>
        </View>

        <View style={[styles.card, theme.cardStyle, { backgroundColor: theme.surface }]}>
          <View style={styles.inputContainer}>
            <Ionicons name="navigate" size={20} color={theme.primary} />
            <TextInput 
              style={[styles.input, { color: theme.text }]} value={startAddress} onChangeText={setStartAddress}
              placeholder="Start Location (City)" placeholderTextColor={theme.textSecondary}
            />
          </View>
          <View style={{ marginLeft: 20, height: 20, borderLeftWidth: 1, borderLeftColor: theme.border }} />
          <View style={styles.inputContainer}>
            <Ionicons name="location" size={20} color={theme.accent} />
            <TextInput 
              style={[styles.input, { color: theme.text }]} value={endAddress} onChangeText={setEndAddress}
              placeholder="Enter Destination (City)" placeholderTextColor={theme.textSecondary}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>VEHICLE</Text>
        <View style={[styles.card, theme.cardStyle, { backgroundColor: theme.surface, padding: 0 }]}>
          <Picker selectedValue={selectedCar} onValueChange={(itemValue) => setSelectedCar(itemValue)} style={{ color: theme.text }} dropdownIconColor={theme.text}>
            {CAR_MODELS.map((car) => (<Picker.Item key={car.value} label={car.label} value={car.value} />))}
          </Picker>
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>BATTERY STATUS</Text>
        <View style={[styles.card, theme.cardStyle, { backgroundColor: theme.surface }]}>
          <View style={styles.sliderGroup}>
            <View style={styles.row}>
              <Text style={{ color: theme.text }}>Current Charge</Text>
              <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{Math.round(battery)}%</Text>
            </View>
            <Slider style={{ width: '100%', height: 40 }} minimumValue={10} maximumValue={100} minimumTrackTintColor={theme.primary} thumbTintColor={theme.primary} value={battery} onValueChange={setBattery} />
          </View>
          <View style={styles.sliderGroup}>
            <View style={styles.row}>
              <Text style={{ color: theme.text }}>Min Arrival Buffer</Text>
              <Text style={{ color: theme.accent, fontWeight: 'bold' }}>{Math.round(buffer)}%</Text>
            </View>
            <Slider style={{ width: '100%', height: 40 }} minimumValue={5} maximumValue={50} minimumTrackTintColor={theme.accent} thumbTintColor={theme.accent} value={buffer} onValueChange={setBuffer} />
          </View>
        </View>

        <TouchableOpacity style={[styles.planButton, { backgroundColor: theme.primary, shadowColor: theme.shadow }]} onPress={handlePlanTrip} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>PLAN TRIP ⚡</Text>}
        </TouchableOpacity>
        <View style={{height: 50}} /> 
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginTop: 50, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', alignItems: 'center' },
  modeText: { marginRight: 10, fontSize: 12 },
  card: { padding: 15, marginBottom: 20 },
  inputContainer: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, marginLeft: 10, fontSize: 16, height: 40 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginLeft: 5 },
  sliderGroup: { marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  planButton: { height: 60, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3 },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold', letterSpacing: 1 }
});