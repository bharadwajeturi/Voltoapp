import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const CUSTOM_MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];

export default function RouteMap({ 
    mapRef, 
    finalRoutePoints, 
    selectedStops, 
    allStations, 
    strategy 
}) {
    const themeColor = strategy === 'FAST' ? '#EF4444' : '#2ECC71';
    const polylineColor = strategy === 'FAST' ? '#EF4444' : '#2ECC71';

    // 🟢 HELPER: Get Dot Color based on Power
    const getDotColor = (power) => {
        const p = parseFloat(power) || 0;
        if (p >= 50) return '#2ECC71'; // Green (Fast)
        if (p >= 15) return '#F59E0B'; // Orange (Medium)
        return '#94a3b8';              // Grey (Slow/Unknown)
    };

    // 🟢 1. COMBINE ALL ALTERNATIVES (Safe Object Implementation)
    const alternativeStations = useMemo(() => {
        const merged = [];
        const seenIds = {}; // Replacement for new Map()

        // A. Add global candidates
        if (Array.isArray(allStations)) {
            allStations.forEach(s => {
                if (s.id && !seenIds[s.id]) {
                    seenIds[s.id] = true;
                    merged.push(s);
                }
            });
        }

        // B. Add specific alternatives from stops
        if (Array.isArray(selectedStops)) {
            selectedStops.forEach(stop => {
                if (stop.alternatives && Array.isArray(stop.alternatives)) {
                    stop.alternatives.forEach(alt => {
                        if (alt.id && !seenIds[alt.id]) {
                            seenIds[alt.id] = true;
                            merged.push(alt);
                        }
                    });
                }
            });
        }

        // C. Remove main planned stops
        const plannedIds = {}; // Replacement for new Set()
        selectedStops.forEach(s => { 
            if(s.station?.id) plannedIds[s.station.id] = true; 
        });
        
        return merged.filter(s => {
            const stationId = s.id;
            const hasCoords = (s.lat || s.latitude) && (s.lng || s.longitude);
            return !plannedIds[stationId] && hasCoords;
        });
    }, [allStations, selectedStops]);

    return (
        <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            customMapStyle={CUSTOM_MAP_STYLE} 
            style={styles.map}
            initialRegion={{
                latitude: finalRoutePoints[0]?.latitude || 20.5937,
                longitude: finalRoutePoints[0]?.longitude || 78.9629,
                latitudeDelta: 5, longitudeDelta: 5,
            }}
        >
            <Polyline 
                coordinates={finalRoutePoints} 
                strokeWidth={5} 
                strokeColor={polylineColor} 
                zIndex={10} 
            />
            
            {/* 🟢 2. DRAW ALTERNATIVE DOTS */}
            {alternativeStations.map((s, i) => {
                const lat = parseFloat(s.lat || s.latitude);
                const lng = parseFloat(s.lng || s.longitude);
                const dotColor = getDotColor(s.powerkw); 

                return (
                    <Marker 
                        key={`alt_${s.id}_${i}`}
                        coordinate={{ latitude: lat, longitude: lng }}
                        zIndex={15} 
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={[styles.mapDotAlt, { backgroundColor: dotColor, borderColor: '#ffffff' }]} />
                    </Marker>
                );
            })}

            {/* 🟢 3. PLANNED STOPS */}
            {selectedStops.map((stop, i) => (
                <Marker 
                    key={`stop_${i}`}
                    coordinate={{ latitude: stop.station.lat, longitude: stop.station.lng }}
                    zIndex={20}
                >
                    {stop.type === 'START' ? <Ionicons name="location" size={32} color="#2ECC71" /> :
                     stop.type === 'DESTINATION' ? <Ionicons name="flag" size={32} color="#E74C3C" /> :
                     <View style={[styles.markerBadge, { backgroundColor: themeColor }]}>
                         <Text style={styles.markerText}>{i}</Text>
                     </View>
                    }
                </Marker>
            ))}
        </MapView>
    );
}

const styles = StyleSheet.create({
    map: { width: '100%', height: '100%' },
    mapDotAlt: { 
        width: 12, 
        height: 12, 
        borderRadius: 6, 
        borderWidth: 2, 
        borderColor: '#fff', 
        opacity: 1 
    },
    markerBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    markerText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});