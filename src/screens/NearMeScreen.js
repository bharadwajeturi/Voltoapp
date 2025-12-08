// Screens/NearMeScreen.js
// Near me screen with nearby charging stations - FIXED!

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Linking,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';

// ============================================
// HOOKS IMPORTS
// ============================================
import { useStations } from '../Hooks/useStations';
import { useLocationTracking } from '../Hooks/useLocationTracking';
import { useTrip } from '../context/TripContext';  // ✅ ADDED TRIP CONTEXT

// ============================================
// COMPONENTS IMPORTS
// ============================================
import StationCard from '../components/common/StationCard';

// ============================================
// UTILS IMPORTS
// ============================================
import {
  logInfo,
  logError,
  logScreenNavigation,
  logWarn
} from '../utils/logger';
import { formatDistance } from '../utils/formatters';

const NearMeScreen = ({ navigation }) => {
  logScreenNavigation('NearMeScreen');

  // ============================================
  // HOOKS
  // ============================================
  const { location, error: locationError, startTracking } = useLocationTracking();
  const {
    stations,
    loading: stationsLoading,
    error: stationsError,
    fetchNearbyStations,
    stationCount
  } = useStations();

  // ✅ FIXED: Trip context to avoid undefined plannedStops
  const {
    setCurrentLocation,
    setBattery,
    setMinArrivalBattery,
    setCarModel
  } = useTrip();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRadius, setSelectedRadius] = useState(30);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    initializeLocationAndFetchStations();
  }, []);

  // ============================================
  // HANDLERS
  // ============================================
  const initializeLocationAndFetchStations = useCallback(async () => {
    try {
      logInfo('🔴 Starting location tracking for NearMe screen...');
      await startTracking();
      
      if (location) {
        await handleFetchStations();
      }
    } catch (err) {
      logError('Failed to initialize location', err);
      Alert.alert('Location Error', 'Could not access your location');
    }
  }, [location]);

  const handleFetchStations = useCallback(async () => {
    try {
      if (!location) {
        logWarn('⚠ Location not available');
        Alert.alert('Error', 'Unable to determine your location');
        return;
      }

      logInfo(`📍 Fetching stations near ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)} (${selectedRadius}km)`);
      
      await fetchNearbyStations(
        location.latitude,
        location.longitude,
        selectedRadius,
        null
      );

      logInfo(`✓ Found ${stationCount} nearby stations`);
    } catch (err) {
      logError('Error fetching nearby stations', err);
    }
  }, [location, selectedRadius, fetchNearbyStations, stationCount]);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await handleFetchStations();
    } catch (err) {
      logError('Refresh failed', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [handleFetchStations]);

  const handleRadiusChange = useCallback((radius) => {
    logInfo(`Changing search radius to ${radius}km`);
    setSelectedRadius(radius);
  }, []);

  // ✅ FIXED: Safe navigation to SmartPlanner
  const handleSmartPlanner = useCallback(() => {
    try {
      // ✅ Initialize SAFE trip data - NO undefined plannedStops
      if (location) {
        setCurrentLocation(location);
        setBattery(80);  // Default 80%
        setMinArrivalBattery(20);  // Default 20%
        setCarModel('Tata Nexon EV');  // Default car
      }
      
      logInfo('✅ Navigated to SmartPlanner with safe trip data');
      navigation.navigate('SmartPlanner');
    } catch (err) {
      logError('SmartPlanner navigation error:', err);
    }
  }, [location, setCurrentLocation, setBattery, setMinArrivalBattery, setCarModel, navigation]);

  // ============================================
  // GOOGLE MAPS INTEGRATION (Requirement 11)
  // ============================================
  const openLocationInMaps = useCallback((station) => {
    try {
      const googleMapsUrl = `https://www.google.com/maps/search/${station.lat || station.latitude},${station.lng || station.longitude}`;
      logInfo(`🗺️ Opening station in Google Maps: ${station.name}`);
      Linking.openURL(googleMapsUrl).catch((err) => {
        logError('Failed to open Google Maps', err);
        Alert.alert('Error', 'Could not open Google Maps');
      });
    } catch (err) {
      logError('Error opening maps', err);
    }
  }, []);

  const openDirections = useCallback((station) => {
    try {
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.lat || station.latitude},${station.lng || station.longitude}&dir_action=navigate`;
      logInfo(`🧭 Opening directions to ${station.name}`);
      Linking.openURL(directionsUrl).catch((err) => {
        logError('Failed to open directions', err);
        Alert.alert('Error', 'Could not open directions');
      });
    } catch (err) {
      logError('Error opening directions', err);
    }
  }, []);

  // ============================================
  // RENDER HELPERS
  // ============================================
  const renderRadiusSelector = () => {
    const radiusOptions = [10, 20, 30, 50];
    return (
      <View style={styles.radiusSelector}>
        <Text style={styles.radiusSelectorLabel}>Search Radius:</Text>
        <View style={styles.radiusButtonGroup}>
          {radiusOptions.map((radius) => (
            <TouchableOpacity
              key={radius}
              style={[
                styles.radiusButton,
                selectedRadius === radius && styles.radiusButtonActive
              ]}
              onPress={() => {
                handleRadiusChange(radius);
                handleFetchStations();
              }}
            >
              <Text
                style={[
                  styles.radiusButtonText,
                  selectedRadius === radius && styles.radiusButtonTextActive
                ]}
              >
                {radius}km
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderStationItem = ({ item }) => {
    return (
      <View style={styles.stationWrapper}>
        <View style={styles.stationCardContainer}>
          <StationCard station={item} />
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => openLocationInMaps(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.mapButtonText}>🗺️ Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.directionsButton}
            onPress={() => openDirections(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.directionsButtonText}>🧭 Navigate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {
              logInfo(`Selected station: ${item.name}`);
              navigation.navigate('TripPlanner', { selectedStation: item });
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.selectButtonText}>✓ Select</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateIcon}>⚡</Text>
      <Text style={styles.emptyStateTitle}>No Stations Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Try expanding the search radius or moving to a different location
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleFetchStations}>
        <Text style={styles.retryButtonText}>🔄 Retry</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>❌</Text>
      <Text style={styles.errorTitle}>Error Loading Stations</Text>
      <Text style={styles.errorMessage}>
        {stationsError || locationError || 'Unknown error'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleFetchStations}>
        <Text style={styles.retryButtonText}>🔄 Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // ============================================
  // HEADER WITH SMART PLANNER BUTTON
  // ============================================
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>📍 Charging Stations Near Me</Text>
      <Text style={styles.subtitle}>
        {location
          ? `📌 ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
          : 'Getting your location...'}
      </Text>
      
      {/* ✅ SMART PLANNER BUTTON */}
      <TouchableOpacity 
        style={styles.smartPlannerButton}
        onPress={handleSmartPlanner}
        activeOpacity={0.7}
      >
        <Text style={styles.smartPlannerButtonText}>🧭 Plan Trip →</Text>
      </TouchableOpacity>
    </View>
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    <View style={styles.container}>
      {renderHeader()}
      
      {renderRadiusSelector()}
      
      {!stationsLoading && stationCount > 0 && (
        <View style={styles.stationCountBadge}>
          <Text style={styles.stationCountText}>
            ⚡ {stationCount} Stations within {selectedRadius}km
          </Text>
        </View>
      )}

      {(stationsError || locationError) && renderErrorState()}
      
      {stationsLoading && !stationsError ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingText}>Loading nearby stations...</Text>
        </View>
      ) : stationCount === 0 && !stationsLoading ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(item, idx) => item.id?.toString() || idx.toString()}
          renderItem={renderStationItem}
          scrollEnabled={true}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#0066cc"
            />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState()}
        />
      )}
    </View>
  );
};

// ============================================
// STYLES (UNCHANGED)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12
  },
  smartPlannerButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start'
  },
  smartPlannerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  radiusSelector: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  radiusSelectorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  radiusButtonGroup: {
    flexDirection: 'row',
    gap: 8
  },
  radiusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  radiusButtonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc'
  },
  radiusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666'
  },
  radiusButtonTextActive: {
    color: '#fff'
  },
  stationCountBadge: {
    backgroundColor: '#e7f3ff',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc'
  },
  stationCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066cc'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666'
  },
  listContent: {
    padding: 16,
    paddingBottom: 20
  },
  stationWrapper: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee'
  },
  stationCardContainer: {
    padding: 12
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9'
  },
  mapButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1976D2',
    borderRadius: 6,
    alignItems: 'center'
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13
  },
  directionsButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F57C00',
    borderRadius: 6,
    alignItems: 'center'
  },
  directionsButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13
  },
  selectButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#28a745',
    borderRadius: 6,
    alignItems: 'center'
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 16
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center'
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 16
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc3545',
    marginBottom: 8,
    textAlign: 'center'
  },
  errorMessage: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0066cc',
    borderRadius: 8
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  }
});

export default NearMeScreen;
