import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

// HOOKS
import { useTrip } from '../context/TripContext';
import { useLocationTracking } from '../Hooks/useLocationTracking';
import { useStations } from '../Hooks/useStations';
import { useRoute } from '../Hooks/useRoute';  // ✅ CORRECT HOOK ONLY

// UTILS
import {
  validateBatteryPercentage,
  validateCarModel
} from '../utils/validators';
import {
  formatDistance,
  formatBattery,
  formatTime
} from '../utils/formatters';
import {
  CAR_EFFICIENCY,
  CAR_BATTERY_SIZE
} from '../utils/constants';
import {
  logInfo,
  logError,
  logScreenNavigation
} from '../utils/logger';
import BatteryInput from '../components/planner/BatteryInput';

const SmartPlannerScreen = ({ navigation }) => {
  logScreenNavigation('SmartPlannerScreen');

  // HOOKS ✅ CORRECT USAGE
  const {
    trip,
    setCurrentLocation,
    setDestination,
    setBattery,
    setCarModel,
    setMinArrivalBattery,
    isValidTrip,
    getTripDistance
  } = useTrip();

  const {
    location,
    error: locationError,
    isTracking,
    startTracking,
    stopTracking
  } = useLocationTracking((newLocation) => {
    logInfo(`📍 Location changed: ${newLocation.latitude}, ${newLocation.longitude}`);
    setCurrentLocation(newLocation);
  });

  const {
    stations,
    loading: stationsLoading,
    error: stationsError,
    fetchNearbyStations,
    stationCount
  } = useStations();

  const { planRoute, loading: routeLoading, error: routeError } = useRoute();  // ✅ useRoute ONLY

  // LOCAL STATE
  const [destinationInput, setDestinationInput] = useState('');
  const [selectedCarModel, setSelectedCarModel] = useState('Tata Nexon EV');
  const [minBattery, setMinBattery] = useState('20');
  const [autoTrack, setAutoTrack] = useState(false);

  // ✅ FIXED: Safe tripStats calculation
  const calculateTripStats = useCallback(() => {
    const distance = getTripDistance() || 0;
    
    // ✅ SAFE CAR MODEL LOOKUP
    const cleanModel = selectedCarModel.replace(/\s*\(.*?\)$/, '');
    const possibleModels = [cleanModel, cleanModel.split(' ')[0], 'Tata Nexon EV'];
    
    let efficiency = CAR_EFFICIENCY[cleanModel] || CAR_EFFICIENCY['Tata Nexon EV'] || 16.5;
    let batterySize = CAR_BATTERY_SIZE[cleanModel] || CAR_BATTERY_SIZE['Tata Nexon EV'] || 40.5;
    
    const batteryKwh = (trip.currentBattery || 100) / 100 * batterySize;
    const energyNeeded = distance / efficiency;
    const canComplete = batteryKwh >= energyNeeded + 5; // 5kWh minimum reserve

    logInfo('📊 SmartPlanner Stats:', {
      distance,
      cleanModel,
      efficiency,
      batteryKwh: batteryKwh.toFixed(1),
      energyNeeded: energyNeeded.toFixed(1),
      canComplete
    });

    return {
      distance,
      batteryNeeded: energyNeeded,
      batteryAvailable: batteryKwh,
      canComplete
    };
  }, [trip.currentBattery, selectedCarModel, getTripDistance]);

  const tripStats = calculateTripStats();

  // EFFECTS
  useEffect(() => {
    if (!isTracking && !trip.currentLocation) {
      handleStartTracking();
    }
  }, []);

  useEffect(() => {
    if (trip.currentLocation) {
      fetchNearbyStations(
        trip.currentLocation.latitude,
        trip.currentLocation.longitude,
        50,
        null
      );
    }
  }, [trip.currentLocation]);

  // HANDLERS
  const handleStartTracking = useCallback(async () => {
    try {
      logInfo('Starting location tracking...');
      await startTracking();
      setAutoTrack(true);
    } catch (err) {
      logError('Failed to start tracking', err);
      Alert.alert('Location Error', 'Could not access your location');
    }
  }, [startTracking]);

  const handleStopTracking = useCallback(() => {
    stopTracking();
    setAutoTrack(false);
    logInfo('Location tracking stopped');
  }, [stopTracking]);

  const handleCarModelChange = useCallback((model) => {
    const cleanModel = model.replace(/\s*\(.*?\)$/, '');
    setSelectedCarModel(model);
    setCarModel(cleanModel);
    logInfo('🚗 Car model changed:', cleanModel);
  }, [setCarModel]);

  const handleMinBatteryChange = useCallback((value) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setMinBattery(value);
      setMinArrivalBattery(numValue);
    }
  }, [setMinBattery, setMinArrivalBattery]);

  // ✅ FIXED: SAFE planRoute with validation
  const handlePlanRoute = useCallback(async () => {
    try {
      // ✅ VALIDATION FIRST
      if (!trip.currentLocation) {
        Alert.alert('Error', 'Current location not available');
        return;
      }
      if (!trip.destination) {
        Alert.alert('Error', 'Please set a destination first');
        return;
      }

      logInfo('🚗 PLAN ROUTE:', { 
        carModel: selectedCarModel,
        start: trip.currentLocation,
        end: trip.destination 
      });
      
      const route = await planRoute({
        start: trip.currentLocation,
        end: trip.destination,
        currentBattery: trip.currentBattery,
        minArrivalBattery: trip.minArrivalBattery,
        carModel: selectedCarModel.replace(/\s*\(.*?\)$/, ''),
        skipVerification: true
      });

      // ✅ SAFE ROUTE LOGGING
      logInfo('✅ Route planned:', {
        hasRoute: !!route,
        plannedStops: route?.plannedStops?.length || 0,
        totalDistance: route?.statistics?.totalDistance || 0,
        finalSOC: route?.finalSOC || 'N/A'
      });

      navigation.navigate('RouteExplorer', { routeData: route });
    } catch (err) {
      logError('Route planning failed:', err);
      Alert.alert('Route Planning Failed', err.message || 'Please try again');
    }
  }, [trip.currentLocation, trip.destination, trip.currentBattery, trip.minArrivalBattery, selectedCarModel, planRoute, navigation]);

  const handleSetDestination = useCallback(async () => {
    try {
      if (!destinationInput.trim()) {
        Alert.alert('Invalid Input', 'Please enter a destination');
        return;
      }
      if (!trip.currentLocation) {
        Alert.alert('Error', 'Current location not available. Enable location first.');
        return;
      }

      // Mock destination for demo (real app would geocode)
      const mockDestination = {
        latitude: trip.currentLocation.latitude + (Math.random() - 0.5) * 0.5,
        longitude: trip.currentLocation.longitude + (Math.random() - 0.5) * 0.5,
        address: destinationInput
      };

      const success = setDestination(mockDestination);
      if (success) {
        logInfo(`✅ Destination set: ${destinationInput}`);
        setDestinationInput('');
      }
    } catch (err) {
      logError('Error setting destination', err);
    }
  }, [destinationInput, trip.currentLocation, setDestination]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* HEADER */}
        <Text style={styles.headerTitle}>🧭 Smart Trip Planner</Text>
        <Text style={styles.headerSubtitle}>Plan your EV journey intelligently</Text>

        {/* ERRORS */}
        {locationError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ Location: {locationError}</Text>
          </View>
        )}
        {stationsError && !stationsError.includes('Demo') && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ Stations: {stationsError}</Text>
          </View>
        )}
        {routeError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ Route: {routeError}</Text>
          </View>
        )}

        {/* LOCATION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📍 Current Location</Text>
            <Switch
              value={autoTrack}
              onValueChange={(val) => val ? handleStartTracking() : handleStopTracking()}
            />
          </View>
          {trip.currentLocation ? (
            <View style={styles.locationBox}>
              <Text style={styles.locationText}>
                📌 {trip.currentLocation.latitude.toFixed(4)}, {trip.currentLocation.longitude.toFixed(4)}
              </Text>
              <Text style={styles.accuracyText}>
                Accuracy: ±{Math.round(location?.accuracy || 0)}m
              </Text>
              <Text style={[styles.statusText, { color: isTracking ? '#dc3545' : '#999' }]}>
                {isTracking ? '🔴 Live Tracking' : '⚪ Not Tracking'}
              </Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#0066cc" />
          )}
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: isTracking ? '#dc3545' : '#0066cc' }]}
            onPress={isTracking ? handleStopTracking : handleStartTracking}
          >
            <Text style={styles.buttonText}>
              {isTracking ? '⏹ Stop Tracking' : '▶ Start Tracking'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* DESTINATION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Destination</Text>
          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Enter destination address or coordinates"
              value={destinationInput}
              onChangeText={setDestinationInput}
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.inputButton} onPress={handleSetDestination}>
              <Text style={styles.inputButtonText}>Set</Text>
            </TouchableOpacity>
          </View>
          {trip.destination && (
            <View style={styles.destinationBox}>
              <Text style={styles.destinationText}>
                ✓ {trip.destination.address || 'Set'}
              </Text>
              <Text style={styles.distanceText}>
                Distance: {formatDistance(getTripDistance() || 0)}
              </Text>
            </View>
          )}
        </View>

        {/* CAR MODEL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚗 Car Model</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedCarModel}
              onValueChange={handleCarModelChange}
              style={styles.picker}
            >
              <Picker.Item label="Tata Nexon EV (437km)" value="Tata Nexon EV" />
              <Picker.Item label="MG ZS EV (461km)" value="MG ZS EV" />
              <Picker.Item label="Hyundai Kona Electric (452km)" value="Hyundai Kona Electric" />
              <Picker.Item label="Mahindra XUV400 (456km)" value="Mahindra XUV400" />
              <Picker.Item label="BMW i4 (590km)" value="BMW i4" />
            </Picker>
          </View>
          <Text style={styles.infoText}>
            Efficiency: {CAR_EFFICIENCY[selectedCarModel] || 16.5} km/kWh | Battery: {CAR_BATTERY_SIZE[selectedCarModel] || 40.5} kWh
          </Text>
        </View>

        {/* BATTERY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔋 Current Battery</Text>
          <BatteryInput
            value={trip.currentBattery}
            onChange={setBattery}
            label="Current Battery Level"
          />
        </View>

        {/* MIN ARRIVAL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛑 Min Arrival Battery</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum battery at destination (%)"
            value={minBattery}
            onChangeText={handleMinBatteryChange}
            keyboardType="decimal-pad"
            placeholderTextColor="#999"
          />
        </View>

        {/* STATIONS */}
        {stationCount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚡ Nearby Stations ({stationCount})</Text>
            {stations.slice(0, 3).map((station, idx) => (
              <View key={idx} style={styles.stationItem}>
                <Text style={styles.stationName}>{station.name}</Text>
                <Text style={styles.stationDistance}>
                  {formatDistance(station.distance)} away
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* STATS */}
        <View style={styles.statsSection}>
          <Text style={styles.statLabel}>📊 Trip Analysis</Text>
          <View style={styles.statRow}>
            <Text>Distance</Text>
            <Text style={styles.statValue}>{formatDistance(tripStats.distance)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text>Battery Needed</Text>
            <Text style={styles.statValue}>
              {tripStats.batteryNeeded.toFixed(1)} kWh
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text>Battery Available</Text>
            <Text style={styles.statValue}>
              {tripStats.batteryAvailable.toFixed(1)} kWh
            </Text>
          </View>
          <View style={[styles.statRow, { borderTopWidth: 2, borderTopColor: '#0066cc', paddingTop: 12 }]}>
            <Text style={styles.statLabel}>Can Complete</Text>
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
          style={[
            styles.button, 
            styles.primaryButton, 
            (routeLoading || !isValidTrip()) && styles.disabledButton
          ]}
          onPress={handlePlanRoute}
          disabled={routeLoading || !isValidTrip()}
        >
          <Text style={[
            styles.buttonText,
            (routeLoading || !isValidTrip()) && { color: '#ccc' }
          ]}>
            {routeLoading ? '⏳ Planning...' : '🗺 Plan Route'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('TripPlanner')}
        >
          <Text style={styles.buttonTextSecondary}>📋 Manual Trip Planner</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = {
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { padding: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 4, color: '#000' },
  headerSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  errorBox: {
    backgroundColor: '#fee', padding: 12, borderRadius: 8, marginBottom: 12,
    borderLeftWidth: 4, borderLeftColor: '#dc3545'
  },
  errorText: { color: '#c00', fontSize: 13 },
  section: {
    backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12,
    borderWidth: 1, borderColor: '#eee'
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 12 },
  locationBox: { backgroundColor: '#f0f8ff', padding: 12, borderRadius: 6, marginBottom: 12 },
  locationText: { fontSize: 14, fontWeight: '500', color: '#0066cc', marginBottom: 4 },
  accuracyText: { fontSize: 12, color: '#666', marginBottom: 4 },
  statusText: { fontSize: 13, fontWeight: '500' },
  inputGroup: { flexDirection: 'row', marginBottom: 12 },
  input: {
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 6,
    paddingHorizontal: 12, 
    paddingVertical: 10, 
    fontSize: 14, 
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  inputButton: {
    backgroundColor: '#0066cc', 
    paddingHorizontal: 16, 
    paddingVertical: 10,
    borderRadius: 6, 
    marginLeft: 8, 
    justifyContent: 'center'
  },
  inputButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  destinationBox: { backgroundColor: '#f0f8ff', padding: 12, borderRadius: 6 },
  destinationText: { fontSize: 14, fontWeight: '500', color: '#0066cc', marginBottom: 4 },
  distanceText: { fontSize: 13, color: '#666' },
  pickerContainer: {
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 6, 
    overflow: 'hidden', 
    marginBottom: 12
  },
  picker: { height: 50 },
  infoText: { fontSize: 12, color: '#666', fontStyle: 'italic' },
  stationItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  stationName: { fontSize: 14, fontWeight: '500', color: '#000' },
  stationDistance: { fontSize: 12, color: '#666' },
  statsSection: {
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 8, 
    marginBottom: 12,
    borderWidth: 1, 
    borderColor: '#eee'
  },
  statLabel: { fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#000' },
  statRow: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 8,
    borderBottomWidth: 1, 
    borderBottomColor: '#eee'
  },
  statValue: { fontWeight: '600', color: '#0066cc' },
  button: { padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 12 },
  primaryButton: { backgroundColor: '#0066cc' },
  secondaryButton: { backgroundColor: '#e0e0e0' },
  disabledButton: { backgroundColor: '#6c757d' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: '#000', fontSize: 16, fontWeight: '600' }
};

export default SmartPlannerScreen;
