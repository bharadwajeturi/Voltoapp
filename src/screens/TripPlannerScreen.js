import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
    View, StyleSheet, FlatList, TextInput, TouchableOpacity, Dimensions, Text
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import mapboxPolyline from '@mapbox/polyline'; 

// 🟢 Stores & Utils
import { useTripStore } from '../store/useTripStore';
import { useStationLogic } from '../Hooks/useStationLogic';
import { getDistance } from '../utils/distance';

// 🟢 Components
import StationCard from '../components/common/StationCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85; 
const SPACING = 15;

// 🟢 1. DEFINE CLUSTER COLORS
const CLUSTER_COLORS = [
    '#3b82f6', // Blue
    '#eab308', // Yellow
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f97316', // Orange
    '#14b8a6', // Teal
];

// 🟢 2. MUTED DARK MAP STYLE
const CUSTOM_MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] }, 
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
    { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] }, 
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
    { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
    { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }
];

// 🟢 Helper to safely get Lat/Lng (Handles lat/latitude variations)
const getLat = (s) => parseFloat(s?.lat || s?.latitude || 0);
const getLng = (s) => parseFloat(s?.lng || s?.longitude || 0);

// 🟢 INTERNAL: Verification Modal Wrapper
const VerificationModalWrapper = ({ visible, onClose, station, onSubmit }) => {
    if (!visible) return null;
    return (
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Verify {station?.name}</Text>
                <Text style={styles.modalSub}>Is this station working?</Text>
                
                <TouchableOpacity style={styles.submitBtn} onPress={() => onSubmit({ ...station, workingStatus: true, rating: 5 })}>
                    <Text style={styles.submitText}>Yes, Working</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.submitBtn, {backgroundColor:'#EF4444', marginTop:10}]} onPress={onClose}>
                    <Text style={styles.submitText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function TripPlannerScreen() {
    const tripResult = useTripStore(state => state.viewData); 
    
    // 🟢 Extract Data
    const { 
        selectedStops = [], allStations = [], routePolyline, meta 
    } = tripResult || {};

    const startName = meta?.startName || "Start Location";
    const endName = meta?.endName || "Destination";
    
    const [searchText, setSearchText] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const flatListRef = useRef(null);
    const mapRef = useRef(null);

    const { 
        handleVerifyPress, handleVerificationSubmit, 
        verifyModalVisible, setVerifyModalVisible, selectedForVerify 
    } = useStationLogic();

    const routePoints = useMemo(() => {
        if (!routePolyline) return [];
        try { 
            return mapboxPolyline.decode(routePolyline).map(p => ({ latitude: p[0], longitude: p[1] })); 
        } catch (e) { return []; }
    }, [routePolyline]);

    // 🟢 2. SMART COLOR GROUPING & ROBUST DATA PARSING
    const sortedList = useMemo(() => {
        const startNode = selectedStops.find(s => s.type === 'START')?.station || { lat: 0, lng: 0 };

        // A. Process Planned Stops
        const planned = selectedStops.map((s, i) => {
            const clusterColor = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
            
            // Fix Name
            let displayName = s.station.name;
            if (s.type === 'START') displayName = startName;
            if (s.type === 'DESTINATION') displayName = endName;

            return {
                ...s.station,
                name: displayName, 
                lat: getLat(s.station), 
                lng: getLng(s.station),
                uniqueId: `plan_${i}`,
                nodeType: s.type, 
                arrivalSOC: s.arrivalSOC,
                isPlanned: true,
                sortDist: getDistance(startNode, { lat: getLat(s.station), lng: getLng(s.station) }),
                uiColor: clusterColor, 
                stopIndex: i 
            };
        });

        const plannedIds = new Set(planned.map(p => p.id));
        
        // B. Process ALL Stations (Alternatives)
        const alternatives = allStations
            .filter(s => {
                // Handle nested structure: s might be station object OR { station: ... }
                const realId = s.station?.id || s.id;
                return !plannedIds.has(realId);
            })
            .map((s, i) => {
                // 🟢 CRITICAL FIX: Extract actual station data safely
                const actualStation = s.station || s;
                
                const sLat = getLat(actualStation);
                const sLng = getLng(actualStation);

                // Find color of nearest planned stop
                let nearestStop = planned[0] || { uiColor: '#94a3b8' };
                let minDist = 999999;

                if (planned.length > 0) {
                    planned.forEach(p => {
                        const d = getDistance({ lat: sLat, lng: sLng }, p);
                        if (d < minDist) {
                            minDist = d;
                            nearestStop = p;
                        }
                    });
                }

                return {
                    ...actualStation, // Spread actual station properties
                    lat: sLat,
                    lng: sLng,
                    uniqueId: `alt_${i}`,
                    nodeType: 'ALTERNATIVE',
                    isPlanned: false,
                    sortDist: getDistance(startNode, { lat: sLat, lng: sLng }),
                    uiColor: nearestStop.uiColor 
                };
            })
            // 🟢 Ensure we only keep valid coordinates
            .filter(s => s.lat !== 0 && s.lng !== 0);

        // C. Merge & Sort
        return [...planned, ...alternatives].sort((a, b) => a.sortDist - b.sortDist);

    }, [selectedStops, allStations, startName, endName]); 

    const filteredList = useMemo(() => {
        if (!searchText) return sortedList;
        const lower = searchText.toLowerCase();
        return sortedList.filter(item => 
            (item.name && item.name.toLowerCase().includes(lower)) || 
            (item.address && item.address.toLowerCase().includes(lower))
        );
    }, [sortedList, searchText]);

    // Map Sync Logic
    const handleViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const item = viewableItems[0].item;
            setSelectedId(item.uniqueId);
            mapRef.current?.animateToRegion({
                latitude: item.lat,
                longitude: item.lng,
                latitudeDelta: 0.1, 
                longitudeDelta: 0.1
            }, 500);
        }
    }).current;

    const handleMarkerPress = (index, uniqueId) => {
        setSelectedId(uniqueId);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    const renderCard = ({ item }) => {
        const isStart = item.nodeType === 'START';
        
        const InfoComponent = item.isPlanned && !isStart ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="battery-charging" size={16} color={item.arrivalSOC < 20 ? '#EF4444' : '#2ECC71'} />
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{item.arrivalSOC}%</Text>
            </View>
        ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="navigate-circle" size={16} color="#94a3b8" />
                <Text style={{ color: '#94a3b8', fontSize: 12 }}>{Math.round(item.sortDist)} km</Text>
            </View>
        );

        return (
            <StationCard
                station={item}
                isSelected={selectedId === item.uniqueId}
                style={{ width: CARD_WIDTH, marginRight: SPACING }}
                onVerifyPress={() => handleVerifyPress(item)}
                InfoComponent={InfoComponent}
            />
        );
    };

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchWrapper}>
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput 
                    style={styles.searchInput}
                    placeholder="Search along route..."
                    placeholderTextColor="#64748b"
                    value={searchText}
                    onChangeText={setSearchText}
                />
                {searchText.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchText('')}>
                        <Ionicons name="close-circle" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Map */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: routePoints[0]?.latitude || 17.385,
                    longitude: routePoints[0]?.longitude || 78.486,
                    latitudeDelta: 2, longitudeDelta: 2,
                }}
                customMapStyle={CUSTOM_MAP_STYLE} 
            >
                <Polyline coordinates={routePoints} strokeWidth={4} strokeColor="#94a3b8" zIndex={10} />
                
                {filteredList.map((item, i) => {
                    const isSelected = selectedId === item.uniqueId;
                    
                    let PinContent;
                    
                    if (item.nodeType === 'START') {
                        PinContent = <Ionicons name="location" size={36} color="#2ECC71" />;
                    } else if (item.nodeType === 'DESTINATION') {
                        PinContent = <Ionicons name="flag" size={36} color="#E74C3C" />;
                    } else if (item.isPlanned) {
                        PinContent = (
                            <View style={[styles.plannedPin, { backgroundColor: item.uiColor, borderColor: '#fff' }, isSelected && styles.selectedScale]}>
                                <Text style={styles.pinText}>{item.stopIndex}</Text>
                            </View>
                        );
                    } else {
                        PinContent = (
                            <View style={[
                                styles.altPin, 
                                { backgroundColor: item.uiColor }, 
                                isSelected && { borderWidth: 2, borderColor: '#fff', transform: [{scale:1.3}] }
                            ]}>
                                <View style={styles.altInnerDot} /> 
                            </View>
                        );
                    }

                    return (
                        <Marker 
                            key={item.uniqueId}
                            coordinate={{ latitude: item.lat, longitude: item.lng }}
                            zIndex={isSelected || item.isPlanned ? 20 : 5} 
                            onPress={() => handleMarkerPress(i, item.uniqueId)}
                        >
                            {PinContent}
                        </Marker>
                    );
                })}
            </MapView>

            <View style={styles.carouselContainer}>
                <FlatList
                    ref={flatListRef}
                    data={filteredList}
                    renderItem={renderCard}
                    keyExtractor={(item) => item.uniqueId}
                    horizontal
                    pagingEnabled={false}
                    snapToInterval={CARD_WIDTH + SPACING}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: SPACING }}
                    onViewableItemsChanged={handleViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                />
            </View>

            <VerificationModalWrapper 
                visible={verifyModalVisible} 
                onClose={() => setVerifyModalVisible(false)}
                station={selectedForVerify}
                onSubmit={handleVerificationSubmit}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    
    searchWrapper: {
        position: 'absolute', top: 50, left: 20, right: 20,
        backgroundColor: '#1e293b', borderRadius: 12,
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15,
        height: 50, zIndex: 100, borderWidth: 1, borderColor: '#334155',
        shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 4, elevation: 5
    },
    searchInput: { flex: 1, color: '#fff', fontSize: 16, marginLeft: 10 },

    map: { ...StyleSheet.absoluteFillObject },
    
    plannedPin: { 
        width: 32, height: 32, borderRadius: 16, 
        justifyContent: 'center', alignItems: 'center', 
        borderWidth: 2, shadowColor: "#000", shadowOpacity: 0.4, shadowOffset: {width:0, height:2}
    },
    selectedScale: { transform: [{scale: 1.25}], borderWidth: 3 },
    pinText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    
    altPin: { 
        width: 16, height: 16, borderRadius: 8, 
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)'
    },
    altInnerDot: {
        width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)'
    },

    carouselContainer: { position: 'absolute', bottom: 30, width: '100%', zIndex: 10 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems:'center' },
    modalContent: { width:'80%', backgroundColor: '#1e293b', padding: 20, borderRadius: 12, borderWidth:1, borderColor:'#334155' },
    modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    modalSub: { color: '#94a3b8', fontSize: 14, marginBottom: 20 },
    submitBtn: { backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center' },
    submitText: { color: '#fff', fontWeight: 'bold' }
});