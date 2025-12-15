import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import polyline from '@mapbox/polyline'; 

import { useTheme } from '../theme/ThemeContext';
import useTripStore from '../store/useTripStore';

const { width, height } = Dimensions.get('window');

export default function RoutePlannerScreen() {
  const { theme, isPremium } = useTheme();
  const navigation = useNavigation();
  const { tripResult, tripRequest } = useTripStore();
  const mapRef = useRef(null);

  // Decode Polyline from backend string if necessary
  const routeCoordinates = useMemo(() => {
    if (tripResult && tripResult.routePolyline) {
        // Backend sends encoded polyline string
        try {
            return polyline.decode(tripResult.routePolyline).map(point => ({
                latitude: point[0],
                longitude: point[1]
            }));
        } catch (e) {
            console.error("Polyline decode error:", e);
            return [];
        }
    }
    // Fallback
    if (tripRequest && tripRequest.start && tripRequest.end) {
        return [
           tripRequest.start,
           tripRequest.end
        ];
    }
    return [];
  }, [tripResult, tripRequest]);

  // Bottom Sheet Snap Points
  const snapPoints = useMemo(() => ['15%', '40%', '85%'], []);

  // Fit Map to Route
  useEffect(() => {
    if (mapRef.current && routeCoordinates.length > 1) {
      mapRef.current.fitToCoordinates(routeCoordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  }, [routeCoordinates]);

  const renderHeader = () => (
    <View style={[styles.topBar, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => navigation.navigate('SmartPlanner')}>
            <View>
                <Text style={[styles.routeText, { color: theme.text }]} numberOfLines={1}>
                    {tripRequest?.start?.name || 'Start'} ➔ {tripRequest?.end?.name || 'Destination'}
                </Text>
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '600' }}>Tap to Edit Plan</Text>
            </View>
        </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {renderHeader()}

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={isPremium ? darkMapStyle : []}
        initialRegion={{
          latitude: 17.4065,
          longitude: 78.4772,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        <Polyline
          coordinates={routeCoordinates}
          strokeWidth={4}
          strokeColor={isPremium ? '#00F0FF' : '#2ECC71'}
        />

        {routeCoordinates.length > 0 && (
            <Marker coordinate={routeCoordinates[0]} title="Start" pinColor="green" />
        )}
        {routeCoordinates.length > 1 && (
            <Marker coordinate={routeCoordinates[routeCoordinates.length - 1]} title="Destination" pinColor="red" />
        )}

        {tripResult?.allStations?.map((station) => (
          <Marker
            key={station.id}
            coordinate={{ latitude: parseFloat(station.lat), longitude: parseFloat(station.lng) }}
            title={station.name}
            description={`Score: ${station.greenScore || 0}/100`}
          >
            <View style={[
              styles.markerBubble, 
              { backgroundColor: station.scoreColor || (station.greenScore > 80 ? '#2ECC71' : '#F1C40F') }
            ]}>
              {parseFloat(station.powerkw) > 50 && <Ionicons name="flash" size={10} color="#fff" />}
            </View>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity 
        style={[styles.floatingBtn, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}
        onPress={() => navigation.navigate('TripPlanner')}
      >
        <Ionicons name="list" size={24} color={theme.text} />
        <Text style={[styles.btnText, { color: theme.text }]}>List View</Text>
      </TouchableOpacity>

      <BottomSheet
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: theme.surface }}
        handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
      >
        <View style={styles.sheetContent}>
          <Text style={[styles.sheetTitle, { color: theme.text }]}>Trip Summary</Text>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.primary }]}>{tripResult?.totalDistance || 0} km</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Distance</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.primary }]}>{tripResult?.allStations?.length || 0}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Chargers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                 {tripResult?.totalDistance ? `${Math.round(tripResult.totalDistance / 60)}h` : '--'}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Est. Time</Text>
            </View>
          </View>
          
          <Text style={[styles.subTitle, { color: theme.text, marginTop: 20 }]}>Next Recommended Stop</Text>
          {tripResult?.allStations?.length > 0 ? (
              <View style={[styles.nextStopCard, { backgroundColor: theme.background }]}>
                  <Text style={{color: theme.text, fontWeight: 'bold'}}>{tripResult.allStations[0].name}</Text>
                  <Text style={{color: theme.textSecondary}}>{tripResult.allStations[0].powerkw} kW • {tripResult.allStations[0].operator}</Text>
              </View>
          ) : (
              <Text style={{color: theme.textSecondary, marginTop: 5}}>No stops planned yet.</Text>
          )}
        </View>
      </BottomSheet>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  topBar: {
    position: 'absolute', top: 50, left: 20, right: 20,
    padding: 15, borderRadius: 12, zIndex: 10, elevation: 5,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2
  },
  routeText: { fontWeight: 'bold', fontSize: 16 },
  markerBubble: {
    width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#fff',
    justifyContent: 'center', alignItems: 'center'
  },
  floatingBtn: {
    position: 'absolute', bottom: 120, right: 20, flexDirection: 'row', alignItems: 'center', 
    padding: 12, borderRadius: 25, elevation: 5, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, zIndex: 5
  },
  btnText: { marginLeft: 5, fontWeight: '600' },
  sheetContent: { padding: 20 },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 12 },
  subTitle: { fontSize: 16, fontWeight: '600' },
  nextStopCard: { padding: 15, borderRadius: 10, marginTop: 10 }
});

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];