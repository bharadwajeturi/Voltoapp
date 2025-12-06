import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { useTrip } from '../context/TripContext'; // Importing Context
import { CAR_MODELS } from '../constants/carModels';
import StationCard from '../components/common/StationCard';
import CarSelector from '../components/planner/CarSelector';
import PrimaryButton from '../components/common/PrimaryButton';
import { SCREENS } from '../navigation/BottomTabParams';

const ALL_STATIONS = [
  { id: '1', name: 'Tata Power', address: 'Gachibowli', type: 'DC Fast', status: 'Available', distance: '2.5 km' },
  { id: '2', name: 'Zeon Charge', address: 'Hitech City', type: 'DC Fast', status: 'Busy', distance: '4.1 km' },
  { id: '3', name: 'Statiq Hub', address: 'Kondapur', type: 'AC Slow', status: 'Available', distance: '1.8 km' },
  { id: '4', name: 'LionCharge', address: 'Jubilee Hills', type: 'DC Fast', status: 'Available', distance: '6.2 km' },
];

const TripPlannerScreen = ({ navigation }) => {
  const { tripDetails, updateTrip } = useTrip();
  const [selectedStations, setSelectedStations] = useState([]);
  
  // Navigation Guard: If no trip details, redirect to Smart Planner
  useEffect(() => {
      if (!tripDetails.startLocation?.description || !tripDetails.endLocation?.description) {
          Alert.alert(
              "Trip Details Missing",
              "Please start by planning your trip in the Smart AI planner.",
              [{ text: "Go to Smart Planner", onPress: () => navigation.navigate('SmartPlanner') }]
          );
      }
  }, []);

  const handleToggleStation = (station) => {
    const isSelected = selectedStations.find(s => s.id === station.id);
    if (isSelected) {
      setSelectedStations(prev => prev.filter(s => s.id !== station.id));
    } else {
      setSelectedStations(prev => [...prev, station]);
    }
  };

  const handleReviewPlan = () => {
    if (selectedStations.length === 0) {
        Alert.alert("No Stops Selected", "Please select at least one charging station to plan your route.");
        return;
    }
    updateTrip('plannedStops', selectedStations);
    navigation.navigate(SCREENS.ROUTE_EXPLORER);
  };

  // Logic to go back to Smart Planner to edit Start/End details
  const handleEditTripDetails = () => {
      navigation.navigate('SmartPlanner');
  };

  const filteredStations = ALL_STATIONS;
 
  return (
    <View style={styles.container}>
      
      {/* 1. Map Background Layer */}
      <View style={styles.mapLayer}>
        <Text style={{ fontSize: 60, opacity: 0.5 }}>🗺️</Text>
        <Text style={styles.mapText}>Interactive Map View</Text>
        <View style={[styles.pin, { top: '30%', left: '40%' }]}><Text>📍</Text></View>
        <View style={[styles.pin, { top: '50%', left: '70%' }]}><Text>📍</Text></View>
        <View style={[styles.pin, { top: '60%', left: '20%' }]}><Text>📍</Text></View>
      </View>

      {/* 2. Floating Header (Clickable for Edit) */}
      <View style={styles.floatingHeader}>
        {/* Removed large header title as requested to save space */}
        
        {/* Clickable Trip Summary Card */}
        <TouchableOpacity style={styles.tripSummaryCard} onPress={handleEditTripDetails}>
            <View style={styles.tripTextRow}>
                <Text style={styles.tripLabel}>FROM</Text>
                <Text style={styles.tripValue} numberOfLines={1}>
                    {tripDetails.startLocation?.description || "Select Start"}
                </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.tripTextRow}>
                <Text style={styles.tripLabel}>TO</Text>
                <Text style={styles.tripValue} numberOfLines={1}>
                    {tripDetails.endLocation?.description || "Select Dest."}
                </Text>
            </View>
            <View style={styles.editIconContainer}>
                <Text style={styles.editIcon}>✎</Text>
            </View>
        </TouchableOpacity>

        {/* Car Selector Dropdown */}
        <View style={styles.selectorContainer}>
            <CarSelector 
            placeholder="Select EV..."
            value={tripDetails.car}
            options={CAR_MODELS}
            onSelect={(car) => updateTrip('car', car)}
            />
        </View>
      </View>

      {/* 3. Bottom Sheet List */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />
        <View style={styles.sheetHeaderRow}>
            <Text style={styles.sheetTitle}>Nearby Stations</Text>
            {selectedStations.length > 0 && (
                <Text style={styles.selectedCount}>{selectedStations.length} selected</Text>
            )}
        </View>
        
        <FlatList
          data={filteredStations}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => {
            const isSelected = selectedStations.find(s => s.id === item.id);
            return (
                <View style={[styles.cardWrapper, isSelected && styles.selectedCardWrapper]}>
                <StationCard 
                    item={item} 
                    onAction={handleToggleStation} 
                    actionLabel={isSelected ? "✓" : "+"} 
                    showAmenities={false}
                />
                </View>
            );
          }}
        />

        {selectedStations.length > 0 && (
            <View style={styles.fabContainer}>
                <PrimaryButton 
                    title={`Review Plan (${selectedStations.length})`} 
                    icon="➔"
                    onPress={handleReviewPlan}
                />
            </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  
  // Map Layer
  mapLayer: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: '#334155', 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingBottom: '40%' 
  },
  mapText: { color: colors.textSecondary, fontWeight: 'bold', marginTop: 10 },
  pin: { position: 'absolute', transform: [{ scale: 1.5 }] },

  // Floating Header
  floatingHeader: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  // Removed headerTitle style as the text element is removed
  
  // New Trip Summary Card
  tripSummaryCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      borderWidth: 1,
      borderColor: colors.border
  },
  tripTextRow: {
      flex: 1,
  },
  tripLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: 'bold',
      marginBottom: 2
  },
  tripValue: {
      color: colors.textPrimary,
      fontSize: 14,
      fontWeight: '600'
  },
  divider: {
      width: 1,
      height: '80%',
      backgroundColor: colors.border,
      marginHorizontal: 12
  },
  editIconContainer: {
      padding: 8,
      backgroundColor: colors.surfaceHighlight,
      borderRadius: 8,
      marginLeft: 8
  },
  editIcon: {
      color: colors.primary,
      fontWeight: 'bold'
  },

  selectorContainer: {
    marginBottom: 10,
    backgroundColor: colors.surface,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '45%', 
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingTop: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  selectedCount: {
      color: colors.primary,
      fontWeight: 'bold',
  },
  cardWrapper: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCardWrapper: {
      borderColor: colors.primary,
      backgroundColor: 'rgba(0, 208, 156, 0.05)',
  },
  fabContainer: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
  }
});

export default TripPlannerScreen;