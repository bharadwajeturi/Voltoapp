import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTrip } from '../context/TripContext';
import { useRoute } from '../Hooks/useRoute';
import { formatDistance, formatBattery } from '../utils/formatters';
import { logScreenNavigation, logInfo, logError } from '../utils/logger';
import BatteryInput from '../components/planner/BatteryInput';
import { CAR_EFFICIENCY, CAR_BATTERY_SIZE } from '../utils/constants';

const TripPlannerScreen = ({ navigation }) => {
  logScreenNavigation('TripPlannerScreen');
  
  const { trip, setCurrentLocation, setDestination, setBattery, setCarModel, setMinArrivalBattery, isValidTrip } = useTrip();
  const { planRoute, loading: routeLoading } = useRoute();

  // Local state with VALID DEFAULTS
  const [startLat, setStartLat] = useState('17.4821523');
  const [startLng, setStartLng] = useState('78.3731848');
  const [endLat, setEndLat] = useState('17.39833');
  const [endLng, setEndLng] = useState('78.29520');
  const [carModel, setCarModelLocal] = useState('Tata Nexon EV');
  const [currentBattery, setCurrentBatteryLocal] = useState('100');
  const [minArrivalBattery, setMinArrivalBatteryLocal] = useState('20');

  // ✅ FIXED: Proper trip analysis
  const calculateTripStats = () => {
  const startLatNum = parseFloat(startLat) || 17.4821523;
  const startLngNum = parseFloat(startLng) || 78.3731848;
  const endLatNum = parseFloat(endLat) || 17.39833;
  const endLngNum = parseFloat(endLng) || 78.29520;
  
  const start = { latitude: startLatNum, longitude: startLngNum };
  const end = { latitude: endLatNum, longitude: endLngNum };
  
  // Haversine distance
  const toRad = (value) => value * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(end.latitude - start.latitude);
  const dLng = toRad(end.longitude - start.longitude);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(start.latitude)) * Math.cos(toRad(end.latitude)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distanceKm = Math.round(R * c * 10) / 10;

  // ✅ FIXED: Multiple fallback car model names
  const possibleModels = [
    carModel.replace(/\s*\(.*?\)$/, ''),  // "Tata Nexon EV"
    carModel.split(' ')[0] + ' ' + carModel.split(' ')[1],  // "Tata Nexon"
    carModel.split(' ')[0]  // "Tata"
  ];

  let efficiency = 16.5;  // ✅ DEFAULT
  let batterySize = 40.5; // ✅ DEFAULT

  for (const model of possibleModels) {
    if (CAR_EFFICIENCY[model]) {
      efficiency = CAR_EFFICIENCY[model];
      batterySize = CAR_BATTERY_SIZE[model] || 40.5;
      break;
    }
  }

  const batteryKwh = Math.max(parseFloat(currentBattery) || 100, 0) / 100 * batterySize;
  const minArrivalKwh = Math.max(parseFloat(minArrivalBattery) || 20, 0) / 100 * batterySize;
  const energyNeeded = distanceKm / efficiency;
  const canComplete = batteryKwh >= energyNeeded + minArrivalKwh;

  logInfo('📊 Trip Stats CALC:', {
    distanceKm,
    model: possibleModels[0],
    efficiency,
    batterySize,
    batteryKwh: batteryKwh.toFixed(1),
    energyNeeded: energyNeeded.toFixed(1),
    canComplete
  });

  return {
    distance: distanceKm,
    batteryNeeded: energyNeeded,
    batteryAvailable: batteryKwh,
    canComplete,
    efficiency,
    batterySize
  };
};


  const tripStats = calculateTripStats();

  const handlePlanRoute = async () => {
    try {
      logInfo('🚗 MANUAL TRIP: Planning route...');
      
      const startLocation = { latitude: parseFloat(startLat), longitude: parseFloat(startLng) };
      const endLocation = { latitude: parseFloat(endLat), longitude: parseFloat(endLng) };
      
      // Sync state
      setCurrentLocation(startLocation);
      setDestination(endLocation);
      setCarModel(carModel.replace(/\s*\(.*?\)$/, ''));
      setBattery(parseFloat(currentBattery));
      setMinArrivalBattery(parseFloat(minArrivalBattery));

      const route = await planRoute({
        start: startLocation,
        end: endLocation,
        carModel: carModel.replace(/\s*\(.*?\)$/, ''),
        currentBattery: parseFloat(currentBattery),
        minArrivalBattery: parseFloat(minArrivalBattery),
        skipVerification: true
      });

      logInfo('✅ Route planned:', {
        plannedStops: route?.plannedStops?.length || 0,
        totalDistance: route?.statistics?.totalDistance || 'N/A'
      });

      navigation.navigate('RouteExplorer', { routeData: route });
    } catch (err) {
      logError('❌ Route planning failed:', err.message);
      Alert.alert('Route Planning Failed', err.message || 'Please check inputs');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>📋 Manual Trip Planner</Text>
        
        {/* START/END LOCATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚩 Start: {startLat}, {startLng}</Text>
          <Text style={styles.sectionTitle}>🎯 End: {endLat}, {endLng}</Text>
        </View>

        {/* CAR & BATTERY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 {carModel}</Text>
          <BatteryInput
            value={parseFloat(currentBattery)}
            onChange={(value) => setCurrentBatteryLocal(value.toString())}
            label="Current Battery (%)"
          />
          <TextInput
            style={styles.input}
            value={minArrivalBattery}
            onChangeText={setMinArrivalBatteryLocal}
            placeholder="Min Arrival Battery (%)"
            keyboardType="decimal-pad"
          />
        </View>

        {/* ✅ FIXED TRIP ANALYSIS */}
        <View style={styles.statsSection}>
          <Text style={styles.statLabel}>📊 Trip Analysis</Text>
          <View style={styles.statRow}>
            <Text>Distance</Text>
            <Text style={styles.statValue}>{formatDistance(tripStats.distance)}km</Text>
          </View>
          <View style={styles.statRow}>
            <Text>Battery Needed</Text>
            <Text style={styles.statValue}>{tripStats.batteryNeeded.toFixed(1)} kWh</Text>
          </View>
          <View style={styles.statRow}>
            <Text>Battery Available</Text>
            <Text style={[styles.statValue, { color: tripStats.canComplete ? '#28a745' : '#dc3545' }]}>
              {tripStats.batteryAvailable.toFixed(1)} kWh
            </Text>
          </View>
          <View style={[styles.statRow, { borderTopWidth: 2, borderTopColor: '#0066cc', paddingTop: 12 }]}>
            <Text style={styles.statLabel}>Can Complete:</Text>
            <Text style={{ 
              color: tripStats.canComplete ? '#28a745' : '#dc3545', 
              fontWeight: 'bold', 
              fontSize: 18 
            }}>
              {tripStats.canComplete ? '✓ YES' : '✗ NO'}
            </Text>
          </View>
        </View>

        {/* BUTTONS */}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, routeLoading && styles.disabledButton]}
          onPress={handlePlanRoute}
          disabled={routeLoading}
        >
          <Text style={styles.buttonText}>
            {routeLoading ? '⏳ Planning...' : '🗺 Plan Route'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonTextSecondary}>← Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ✅ SIMPLIFIED STYLES
const styles = {
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#1a1a1a', textAlign: 'center' },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#0066cc', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
  statsSection: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 24, elevation: 4 },
  statLabel: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  statValue: { fontWeight: '700', color: '#0066cc', fontSize: 16 },
  button: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  primaryButton: { backgroundColor: '#0066cc' },
  secondaryButton: { backgroundColor: '#f8f9fa', borderWidth: 2, borderColor: '#e0e0e0' },
  disabledButton: { backgroundColor: '#6c757d' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  buttonTextSecondary: { color: '#1a1a1a', fontSize: 17, fontWeight: '600' }
};

export default TripPlannerScreen;
