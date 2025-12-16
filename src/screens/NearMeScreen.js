import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { fetchNearbyStations } from '../services/api';

const CURRENT_LAT = 17.3850; // Default Hyd
const CURRENT_LNG = 78.4867;

export default function NearMeScreen() {
  const mapRef = useRef(null);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rangeKm, setRangeKm] = useState(10); 

  useEffect(() => {
    loadStations();
  }, [rangeKm]);

  const loadStations = async () => {
    setLoading(true);
    try {
        const data = await fetchNearbyStations(CURRENT_LAT, CURRENT_LNG, rangeKm);
        setStations(data || []); // 🟢 SAFE DEFAULT
        
        mapRef.current?.animateToRegion({
            latitude: CURRENT_LAT,
            longitude: CURRENT_LNG,
            latitudeDelta: (rangeKm * 2) / 111,
            longitudeDelta: (rangeKm * 2) / 111,
        }, 1000);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: CURRENT_LAT,
          longitude: CURRENT_LNG,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        customMapStyle={darkMapStyle}
      >
        <Marker coordinate={{ latitude: CURRENT_LAT, longitude: CURRENT_LNG }}>
            <View style={styles.userDot} />
        </Marker>

        <Circle 
            center={{ latitude: CURRENT_LAT, longitude: CURRENT_LNG }}
            radius={rangeKm * 1000}
            strokeWidth={2}
            strokeColor="rgba(46, 204, 113, 0.5)"
            fillColor="rgba(46, 204, 113, 0.1)"
        />

        {stations.map((s, i) => (
            <Marker 
                key={`nm-${s.id || i}`}
                coordinate={{ latitude: parseFloat(s.lat), longitude: parseFloat(s.lng) }}
                title={s.name}
            >
                <Ionicons name="location" size={30} color="#E74C3C" />
            </Marker>
        ))}
      </MapView>

      <View style={styles.headerOverlay}>
        <Text style={styles.title}>Chargers Near Me</Text>
        <Text style={styles.subtitle}>{stations.length} found within {rangeKm} km</Text>
      </View>

      <View style={styles.rangeSelector}>
        {[5, 10, 20].map((km) => (
            <TouchableOpacity 
                key={km} 
                style={[styles.rangeBtn, rangeKm === km && styles.activeRange]}
                onPress={() => setRangeKm(km)}
            >
                <Text style={[styles.rangeText, rangeKm === km && styles.activeRangeText]}>
                    {km} km
                </Text>
            </TouchableOpacity>
        ))}
      </View>

      {loading && (
        <View style={styles.loader}>
            <ActivityIndicator size="large" color="#2ECC71" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  map: { flex: 1 },
  userDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#3b82f6', borderWidth: 2, borderColor: '#fff' },
  headerOverlay: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 15, borderRadius: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#94a3b8', fontSize: 12 },
  rangeSelector: { position: 'absolute', bottom: 30, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#1e293b', padding: 10, borderRadius: 20 },
  rangeBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 15 },
  activeRange: { backgroundColor: '#2ECC71' },
  rangeText: { color: '#94a3b8', fontWeight: 'bold' },
  activeRangeText: { color: '#0f172a' },
  loader: { position: 'absolute', top: '50%', left: '45%' }
});

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];