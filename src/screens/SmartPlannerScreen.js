import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, StatusBar, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { useTrip } from '../context/TripContext'; 
import { CAR_MODELS } from '../constants/carModels';
import { SCREENS } from '../navigation/BottomTabParams';

import PrimaryButton from '../components/common/PrimaryButton';
import CarSelector from '../components/planner/CarSelector';
import CircularBatterySlider from '../components/planner/CircularBatterySlider';

// Mock function to simulate generating stops based on inputs
const generateSmartRoute = (details) => {
    return [
        { id: 'smart1', name: 'ChargeZone Hub', address: 'Midway Point', type: '120kW DC', arrivalBattery: 45, chargeTime: 25, amenities: ['food', 'restroom'] },
        { id: 'smart2', name: 'Tata Power', address: 'Destination City Entry', type: '30kW DC', arrivalBattery: 20, chargeTime: 40, amenities: ['coffee'] }
    ];
};

const SmartPlannerScreen = ({ navigation }) => {
  const { tripDetails, updateTrip, isValidTrip } = useTrip(); 
  const [loading, setLoading] = useState(false);

  const handleSimulate = () => {
    // 1. Validation: Destination is mandatory
    if (!tripDetails.endLocation?.description) {
        Alert.alert("Missing Destination", "Please enter a destination to plan your trip.", [{ text: "OK" }]);
        return;
    }

    // 2. Validation: General check
    if (!isValidTrip()) {
        Alert.alert("Missing Details", "Please ensure you have selected a vehicle and entered both start and destination locations.");
        return;
    }

    setLoading(true);
    
    // 3. Simulate AI Calculation
    setTimeout(() => {
      setLoading(false);
      
      // GENERATE ROUTE DATA
      // In a real app, this comes from an API. Here we mock it.
      const smartStops = generateSmartRoute(tripDetails);
      
      // SAVE TO CONTEXT
      // This is crucial for the "Smart AI" tab logic to work later
      updateTrip('plannedStops', smartStops);

      // 4. Navigate to Result Page
      navigation.navigate(SCREENS.ROUTE_EXPLORER); 
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Smart AI Planner 🧠</Text>
        <Text style={styles.subtitle}>Let AI optimize your charging stops.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Vehicle Selection */}
        <View style={styles.section}>
            <CarSelector 
            label="Your Vehicle"
            placeholder="Select EV..."
            value={tripDetails.car}
            options={CAR_MODELS}
            onSelect={(car) => updateTrip('car', car)}
            />
        </View>

        {/* Battery Slider */}
        <CircularBatterySlider 
          value={tripDetails.currentBattery}
          onChange={(val) => updateTrip('currentBattery', val)}
        />

        {/* Location Inputs */}
        <View style={styles.locationCard}>
          <View style={styles.inputRow}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Text style={{ color: colors.success }}>●</Text>
            </View>
            <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Start Location</Text>
                <TextInput 
                style={styles.input} 
                placeholder="Enter start point"
                placeholderTextColor={colors.textSecondary}
                value={tripDetails.startLocation?.description}
                onChangeText={(text) => updateTrip('startLocation', { description: text })}
                />
            </View>
          </View>
          
          <View style={styles.connectorLine} />

          <View style={styles.inputRow}>
            <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                <Text style={{ color: colors.danger }}>●</Text>
            </View>
            <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Destination</Text>
                <TextInput 
                style={styles.input} 
                placeholder="Enter destination"
                placeholderTextColor={colors.textSecondary}
                value={tripDetails.endLocation?.description}
                onChangeText={(text) => updateTrip('endLocation', { description: text })}
                />
            </View>
          </View>
        </View>

        <PrimaryButton 
          title={loading ? "Optimizing Route..." : "Simulate Trip"} 
          icon={loading ? null : "✨"}
          disabled={loading}
          onPress={handleSimulate}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 60, paddingBottom: 10 },
  title: { fontSize: 32, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.5 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
  content: { padding: 24 },
  section: { marginBottom: 24 },
  
  locationCard: { 
    backgroundColor: colors.surface, 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  iconContainer: {
      width: 32, height: 32, borderRadius: 16, 
      alignItems: 'center', justifyContent: 'center',
      marginRight: 16
  },
  inputWrapper: { flex: 1 },
  inputLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 4 },
  input: { 
      color: colors.textPrimary, 
      fontSize: 16, 
      fontWeight: '500', 
      padding: 0,
      height: 24 
  },
  connectorLine: {
      width: 2,
      height: 24,
      backgroundColor: colors.border,
      marginLeft: 15,
      marginVertical: 4
  }
});

export default SmartPlannerScreen;