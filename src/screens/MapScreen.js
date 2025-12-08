// Screens/MapScreen.js
// Interactive map screen for navigation

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

// ============================================
// HOOKS IMPORTS
// ============================================
import { useTrip } from '../Hooks/useTrip';
import { useLocationTracking } from '../Hooks/useLocationTracking';
import { useStations } from '../Hooks/useStations';

// ============================================
// UTILS IMPORTS
// ============================================
import {
  logInfo,
  logError,
  logScreenNavigation
} from '../utils/logger';
import { formatDistance } from '../utils/formatters';

const MapScreen = ({ navigation, route: { params } }) => {
  logScreenNavigation('MapScreen');

  // ============================================
  // HOOKS
  // ============================================

  const { trip, validateAndSetLocation } = useTrip();
  const { location, startTracking } = useLocationTracking();
  const { stations, fetchNearbyStations } = useStations();

  // ============================================
  // LOCAL STATE
  // ============================================

  const [mapRegion, setMapRegion] = useState({
    latitude: 17.3850,
    longitude: 78.4867,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5
  });

  const [selectedMarker, setSelectedMarker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRoute, setShowRoute] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    // Initialize map with current location
    initializeMap();
  }, []);

  useEffect(() => {
    // Fetch nearby stations when map region changes
    if (mapRegion.latitude && mapRegion.longitude) {
      fetchNearbyStations(mapRegion.latitude, mapRegion.longitude, 30);
    }
  }, [mapRegion.latitude, mapRegion.longitude]);

  // ============================================
  // HANDLERS
  // ============================================

  const initializeMap = async () => {
    try {
      setLoading(true);
      logInfo('Initializing map...');
      
      await startTracking();
      
      if (location) {
        const newRegion = {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        };
        setMapRegion(newRegion);
        validateAndSetLocation(location);
        logInfo('✓ Map initialized with current location');
      }
    } catch (err) {
      logError('Failed to initialize map', err);
      Alert.alert('Error', 'Could not initialize map');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    logInfo(`Map tapped at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    
    const newLocation = { latitude, longitude };
    validateAndSetLocation(newLocation);
  };

  const handleMarkerPress = (station) => {
    setSelectedMarker(station);
    logInfo(`Marker selected: ${station.name}`);
  };

  const handleSetAsDestination = () => {
    if (!selectedMarker) {
      Alert.alert('Error', 'Select a station first');
      return;
    }

    logInfo(`Setting ${selectedMarker.name} as destination`);
    navigation.navigate('TripPlanner');
  };

  const handleRegionChange = (region) => {
    setMapRegion(region);
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* MAP */}
      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={handleRegionChange}
        onPress={handleMapPress}
      >
        {/* CURRENT LOCATION MARKER */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude
            }}
            title="📍 Current Location"
            pinColor="blue"
          />
        )}

        {/* DESTINATION MARKER */}
        {trip.destination && (
          <Marker
            coordinate={{
              latitude: trip.destination.latitude,
              longitude: trip.destination.longitude
            }}
            title="🎯 Destination"
            pinColor="red"
          />
        )}

        {/* STATION MARKERS */}
        {stations.map((station, idx) => (
          <Marker
            key={idx}
            coordinate={{
              latitude: station.latitude,
              longitude: station.longitude
            }}
            title={station.name}
            description={`${station.powerkw} kW - ${station.operator}`}
            pinColor={selectedMarker?.id === station.id ? 'green' : 'orange'}
            onPress={() => handleMarkerPress(station)}
          />
        ))}

        {/* ROUTE POLYLINE */}
        {showRoute && trip.currentLocation && trip.destination && (
          <Polyline
            coordinates={[
              {
                latitude: trip.currentLocation.latitude,
                longitude: trip.currentLocation.longitude
              },
              {
                latitude: trip.destination.latitude,
                longitude: trip.destination.longitude
              }
            ]}
            strokeColor="rgba(0, 102, 204, 0.5)"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* BOTTOM SHEET - SELECTED MARKER INFO */}
      {selectedMarker && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{selectedMarker.name}</Text>
            <TouchableOpacity onPress={() => setSelectedMarker(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sheetContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Operator:</Text>
              <Text style={styles.detailValue}>{selectedMarker.operator}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Power:</Text>
              <Text style={styles.detailValue}>{selectedMarker.powerkw} kW</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Distance:</Text>
              <Text style={styles.detailValue}>
                {formatDistance(selectedMarker.distance)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSetAsDestination}
          >
            <Text style={styles.actionButtonText}>Set as Destination</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FLOATING ACTION BUTTONS */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowRoute(!showRoute)}
        >
          <Text style={styles.fabText}>{showRoute ? '🗺️' : '📍'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.fabText}>←</Text>
        </TouchableOpacity>
      </View>

      {/* TOP STATUS BAR */}
      <View style={styles.topBar}>
        <Text style={styles.stationCountText}>
          ⚡ {stations.length} Stations nearby
        </Text>
      </View>
    </View>
  );
};

// ============================================
// STYLES
// ============================================

const styles = {
  container: { flex: 1 },
  map: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  topBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 3
  },
  stationCountText: { fontSize: 14, fontWeight: '600', color: '#0066cc' },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    elevation: 5
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sheetTitle: { fontSize: 18, fontWeight: '600', color: '#000', flex: 1 },
  closeButton: { fontSize: 24, color: '#999' },
  sheetContent: { marginBottom: 16 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  detailLabel: { fontWeight: '500', color: '#666' },
  detailValue: { fontWeight: '600', color: '#0066cc' },
  actionButton: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  fabContainer: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    gap: 12
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3
  },
  fabText: { fontSize: 24 }
};

export default MapScreen;
