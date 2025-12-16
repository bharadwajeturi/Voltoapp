import React, { useMemo, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import polyline from '@mapbox/polyline'; 
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '../store/useTripStore'; 

// 🟢 HELPER: Open Full Route in Google Maps
const openEntireTripInMaps = (stops, start, end) => {
    if (!start || !end) return;
    const origin = `${start.latitude},${start.longitude}`;
    const destination = `${end.latitude},${end.longitude}`;
    const waypoints = stops.map(s => `${s.lat},${s.lng}`).join('|');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}&travelmode=driving`;
    Linking.openURL(url);
};

// 🟢 COMPONENT: Distance Badge (Left Side)
const DistanceBadge = ({ km }) => (
    <View style={styles.distanceBadge}>
        <Text style={styles.distanceText}>{km}</Text>
        <Text style={styles.unitText}>km</Text>
    </View>
);

// 🟢 COMPONENT: Plan Step Item (List Row)
const PlanStepItem = ({ stop, index, isLast, onPress }) => (
    <TouchableOpacity style={styles.stepItem} onPress={onPress}>
        
        {/* LEFT COLUMN: Distance + Timeline */}
        <View style={styles.leftColumn}>
            <DistanceBadge km={stop.legDistance || 0} />
            
            <View style={styles.timelineContainer}>
                {/* Battery % inside the dot */}
                <View style={[styles.timelineDot, { 
                    backgroundColor: stop.arrivalSOC < 20 ? '#E74C3C' : '#2ECC71' 
                }]}>
                    <Text style={styles.socText}>{stop.arrivalSOC}%</Text>
                </View>
                {!isLast && <View style={styles.timelineLine} />}
            </View>
        </View>

        {/* RIGHT COLUMN: Station Details */}
        <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
                <Text style={styles.stepTitle} numberOfLines={1}>{stop.name}</Text>
                {parseFloat(stop.powerkw) > 50 && (
                    <View style={styles.badge}><Text style={styles.badgeText}>FAST</Text></View>
                )}
            </View>
            
            {/* Amenities Preview */}
            <View style={styles.amenityRow}>
                {stop.amenities && stop.amenities.length > 0 ? (
                    stop.amenities.slice(0, 3).map((a, i) => (
                        <View key={i} style={styles.amenityTag}>
                             <Ionicons name={a.includes('food') ? 'fast-food' : 'cafe'} size={10} color="#cbd5e1"/>
                             <Text style={styles.amenityText}>{a}</Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noAmenityText}>No amenities data</Text>
                )}
            </View>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Ionicons name="flash" size={14} color="#2ECC71" />
                    <Text style={styles.statText}>Charge to 80%</Text>
                </View>
                <View style={styles.stat}>
                    <Ionicons name="time" size={14} color="#F1C40F" />
                    <Text style={styles.statText}>~{stop.chargeTime || 40} min</Text>
                </View>
            </View>
        </View>
    </TouchableOpacity>
);

export default function RoutePlannerScreen() {
  const navigation = useNavigation();
  const { selectedStops = [], routePolyline, startPoint, endPoint } = useTripStore();
  const mapRef = useRef(null);

  // 1. Decode Route
  const routeCoordinates = useMemo(() => {
    if (routePolyline) {
        try {
            return polyline.decode(routePolyline).map(pt => ({ latitude: pt[0], longitude: pt[1] }));
        } catch (e) { return []; }
    }
    return [];
  }, [routePolyline]);

  // 2. Smart Zoom Logic
  useEffect(() => {
    if (!mapRef.current || routeCoordinates.length === 0) return;

    const pointsToFit = [
        ...routeCoordinates,
        ...(startPoint ? [startPoint] : []),
        ...(endPoint ? [endPoint] : []),
        ...selectedStops.map(s => ({ latitude: parseFloat(s.lat), longitude: parseFloat(s.lng) }))
    ];

    setTimeout(() => {
        mapRef.current.fitToCoordinates(pointsToFit, {
            edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
            animated: true
        });
    }, 500);
  }, [routeCoordinates, selectedStops]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={vibrantNightStyle}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Polyline coordinates={routeCoordinates} strokeWidth={6} strokeColor="#00F0FF" zIndex={1} />
        
        {startPoint && (
            <Marker coordinate={startPoint} title="Start" zIndex={2}>
                 <View style={styles.markerCircle}><Ionicons name="location" size={20} color="#fff" /></View>
            </Marker>
        )}

        {endPoint && (
            <Marker coordinate={endPoint} title="Destination" zIndex={2}>
                <View style={[styles.markerCircle, {backgroundColor:'#E74C3C'}]}><Ionicons name="flag" size={20} color="#fff" /></View>
            </Marker>
        )}

        {selectedStops.map((s, i) => (
            <Marker 
                key={`stop-${s.id}-${i}`}
                coordinate={{ latitude: parseFloat(s.lat), longitude: parseFloat(s.lng) }}
                title={`Stop ${i+1}`}
                zIndex={3}
            >
                <View style={styles.stopPin}><Text style={styles.stopPinText}>{i+1}</Text></View>
            </Marker>
        ))}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('SmartPlanner')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerBox}>
            <Text style={styles.headerTitle}>Trip Plan</Text>
            <Text style={styles.subHeader}>
                {selectedStops.length} Stops • {selectedStops.reduce((acc, s) => acc + (parseFloat(s.legDistance)||0), 0).toFixed(0)} km
            </Text>
        </View>
        <TouchableOpacity 
            style={styles.mapsButton} 
            onPress={() => openEntireTripInMaps(selectedStops, startPoint, endPoint)}
        >
            <Ionicons name="map" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet 
        index={1} 
        snapPoints={['15%', '45%', '90%']} 
        backgroundStyle={{ backgroundColor: '#0f172a' }} 
        handleIndicatorStyle={{ backgroundColor: '#fff' }}
      >
        <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Charging Schedule</Text></View>
        <BottomSheetFlatList
            data={selectedStops}
            keyExtractor={(item, index) => `${item.id}_${index}`}
            renderItem={({ item, index }) => (
                <PlanStepItem 
                    stop={item} 
                    index={index} 
                    isLast={index === selectedStops.length - 1} 
                    onPress={() => {
                        mapRef.current?.animateToRegion({
                            latitude: parseFloat(item.lat),
                            longitude: parseFloat(item.lng),
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05
                        }, 1000);
                    }} 
                />
            )}
            contentContainerStyle={styles.listContent}
        />
      </BottomSheet>
    </View>
  );
}

// 🟢 STYLES (Cleaned & Merged)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  map: { width: '100%', height: '100%' },
  
  // Custom Map Markers
  markerCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2ECC71', justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'#fff' },
  stopPin: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#F1C40F', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#000', elevation: 5 },
  stopPinText: { color: '#000', fontWeight: '900', fontSize: 14 },

  // Header Overlay
  header: { position: 'absolute', top: 50, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent:'space-between' },
  backButton: { backgroundColor: 'rgba(15, 23, 42, 0.9)', padding: 12, borderRadius: 12, borderWidth:1, borderColor: '#334155' },
  headerBox: { flex: 1, marginHorizontal: 10, backgroundColor: 'rgba(15, 23, 42, 0.9)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth:1, borderColor: '#334155' },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  subHeader: { color: '#F1C40F', fontSize: 12, fontWeight: 'bold' },
  mapsButton: { backgroundColor: '#2563eb', padding: 12, borderRadius: 12, borderWidth:1, borderColor: '#60a5fa' },

  // Bottom Sheet
  sheetHeader: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  sheetTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  listContent: { padding: 20 },
  
  // 🟢 List Item Styles (Left Column + Right Card)
  stepItem: { flexDirection: 'row', marginBottom: 0, paddingHorizontal: 10 },
  
  leftColumn: { alignItems: 'center', width: 50, marginRight: 10 },
  distanceBadge: { marginBottom: 6, alignItems: 'center' },
  distanceText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  unitText: { color: '#64748b', fontSize: 10 },

  timelineContainer: { alignItems: 'center', flex: 1 },
  timelineDot: { width: 34, height: 34, borderRadius: 17, alignItems:'center', justifyContent:'center', marginBottom: 4 },
  socText: { color: '#000', fontSize: 10, fontWeight: '900' },
  timelineLine: { flex: 1, width: 2, backgroundColor: '#334155' },

  stepContent: { flex: 1, backgroundColor: '#1e293b', padding: 12, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stepTitle: { color: '#fff', fontWeight: 'bold', fontSize: 15, flex: 1 },
  badge: { backgroundColor: 'rgba(46, 204, 113, 0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  badgeText: { color: '#2ECC71', fontSize: 10, fontWeight: '800' },

  amenityRow: { flexDirection: 'row', marginBottom: 10, flexWrap: 'wrap' },
  amenityTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, marginRight: 6, marginBottom: 4 },
  amenityText: { color: '#94a3b8', fontSize: 10, marginLeft: 4, textTransform: 'capitalize' },
  noAmenityText: { color: '#64748b', fontSize: 11, fontStyle: 'italic' },

  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 8 },
  stat: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  statText: { color: '#cbd5e1', fontSize: 12, marginLeft: 6, fontWeight: '500' }
});

const vibrantNightStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#151922" }] }, 
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#8ec3b9" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#1a3646" }] },
  { "featureType": "administrative.country", "elementType": "geometry.stroke", "stylers": [{ "color": "#4b6878" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry.stroke", "stylers": [{ "color": "#334e87" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#283d6a" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#6f9ba5" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#304a7d" }] }, 
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#98a5be" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#2c6675" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#255763" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0B0E14" }] }, 
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d85c6" }] }
];