import React, { useState, useRef, useEffect } from 'react';
import { 
    View, StyleSheet, TouchableOpacity, Dimensions, 
    FlatList, Keyboard, ActivityIndicator, Text, TextInput, Platform 
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location'; 
import axios from 'axios';

// 🟢 Stores & Config
import { API_BASE_URL, CONFIG } from '../config/constants';
import { useStationLogic } from '../Hooks/useStationLogic';
import { getDistance } from '../utils/distance';

// 🟢 Components
import StationCard from '../components/common/StationCard';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85; 
const SPACING = 15;

const CUSTOM_MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
    { "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] }
];

export default function NearMeScreen() {
    const mapRef = useRef(null);
    const flatListRef = useRef(null);
    
    // 🟢 NEW: Custom Search State (Replaces Library)
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [range, setRange] = useState(5); 
    const [apiKey, setApiKey] = useState(CONFIG.GOOGLE_MAPS_API_KEY);

    const { handleVerifyPress, fetchAmenitiesForStation } = useStationLogic();

    const [region, setRegion] = useState({
        latitude: 17.3850,
        longitude: 78.4867,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
    });

    useEffect(() => {
        if (CONFIG.GOOGLE_MAPS_API_KEY) setApiKey(CONFIG.GOOGLE_MAPS_API_KEY);
    }, []);

    const getDeltaFromRange = (rangeKm) => {
        return (rangeKm * 2) / 111 * 1.2; 
    };

    // 🟢 1. FETCH STATIONS
    const fetchStations = async (lat, lng, radiusKm) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/nearby`, {
                params: { lat, lng, r: radiusKm }
            });
            const parsedData = res.data.map(s => ({
                ...s, lat: parseFloat(s.lat), lng: parseFloat(s.lng),
                powerkw: parseFloat(s.powerkw || 0), trustscore: parseFloat(s.trustscore || 0),
                amenities: s.amenities || []
            })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));
            setStations(parsedData);
            parsedData.slice(0, 3).forEach(s => fetchAmenitiesForStation(s));
        } catch (e) { console.error("Fetch failed:", e.message); } 
        finally { setLoading(false); }
    };

    // 🟢 2. INIT LOCATION
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            const zoom = getDeltaFromRange(range);
            const newRegion = { latitude, longitude, latitudeDelta: zoom, longitudeDelta: zoom };
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
            fetchStations(latitude, longitude, range);
        })();
    }, []);

    // 🟢 3. HANDLE SEARCH TEXT CHANGE (Google Autocomplete API)
    const handleSearch = async (text) => {
        setSearchQuery(text);
        if (text.length > 2) {
            try {
                const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${apiKey}&types=geocode&language=en`;
                const response = await axios.get(url);
                if (response.data.status === 'OK') {
                    setSuggestions(response.data.predictions);
                } else {
                    setSuggestions([]);
                }
            } catch (error) {
                console.warn("Autocomplete Error", error);
            }
        } else {
            setSuggestions([]);
        }
    };

    // 🟢 4. HANDLE SELECTION (Google Details API)
    const handleSelectPlace = async (place) => {
        Keyboard.dismiss();
        setSearchQuery(place.description);
        setSuggestions([]); // 🟢 Forces Dropdown to Disappear Immediately

        try {
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=geometry&key=${apiKey}`;
            const response = await axios.get(url);
            
            if (response.data.result) {
                const { lat, lng } = response.data.result.geometry.location;
                const newDelta = getDeltaFromRange(range);
                const newRegion = { latitude: lat, longitude: lng, latitudeDelta: newDelta, longitudeDelta: newDelta };

                setRegion(newRegion);
                mapRef.current?.animateToRegion(newRegion, 1000);
                fetchStations(lat, lng, range);
            }
        } catch (error) {
            console.error("Place Details Error", error);
        }
    };

    const handleRangeChange = (newRange) => {
        setRange(newRange);
        const newDelta = getDeltaFromRange(newRange);
        setRegion(prev => {
            const updated = { ...prev, latitudeDelta: newDelta, longitudeDelta: newDelta };
            mapRef.current?.animateToRegion(updated, 500);
            return updated;
        });
        fetchStations(region.latitude, region.longitude, newRange);
    };

    const handleMarkerPress = (station, index) => {
        setSelectedId(station.id);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    const renderCard = ({ item }) => {
        const dist = getDistance(region, item);
        const DistanceInfo = (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="location" size={16} color="#3b82f6" />
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{dist} km</Text>
            </View>
        );

        return (
            <StationCard
                station={item}
                isSelected={selectedId === item.id}
                style={{ width: CARD_WIDTH, marginRight: SPACING }} 
                onVerifyPress={() => handleVerifyPress(item)}
                InfoComponent={DistanceInfo}
            />
        );
    };

    return (
        <View style={styles.container}>
            
            {/* 🟢 CUSTOM SEARCH BAR */}
            <View style={styles.searchContainer}>
                <View style={styles.inputBox}>
                    <Ionicons name="search" size={20} color="#2ECC71" style={{marginLeft: 15}} />
                    <TextInput 
                        style={styles.inputText}
                        placeholder="Search Location..."
                        placeholderTextColor="#64748b"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); setSuggestions([]); }}>
                            <Ionicons name="close-circle" size={18} color="#64748b" style={{marginRight: 10}} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* 🟢 CUSTOM SUGGESTIONS LIST */}
                {suggestions.length > 0 && (
                    <View style={styles.suggestionsBox}>
                        {suggestions.map((item) => (
                            <TouchableOpacity 
                                key={item.place_id} 
                                style={styles.suggestionItem} 
                                onPress={() => handleSelectPlace(item)}
                            >
                                <Ionicons name="location-outline" size={16} color="#94a3b8" />
                                <Text style={styles.suggestionText} numberOfLines={1}>{item.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={region}
                onRegionChangeComplete={(r) => setRegion(r)}
                customMapStyle={CUSTOM_MAP_STYLE} 
            >
                <Circle 
                    center={{latitude: region.latitude, longitude: region.longitude}} 
                    radius={range * 1000} 
                    fillColor="rgba(59, 130, 246, 0.05)"
                    strokeColor="rgba(59, 130, 246, 0.3)" 
                    strokeWidth={1}
                />
                {stations.map((s, i) => {
                    const isSelected = selectedId === s.id;
                    const color = s.trustscore >= 80 ? '#2ECC71' : s.trustscore >= 50 ? '#F1C40F' : '#E74C3C';
                    return (
                        <Marker 
                            key={s.id} 
                            coordinate={{ latitude: s.lat, longitude: s.lng }} 
                            zIndex={isSelected ? 10 : 1}
                            onPress={() => handleMarkerPress(s, i)}
                        >
                            <View style={[styles.pinContainer, isSelected && { transform: [{scale: 1.2}] }]}>
                                <View style={[styles.pinHead, { backgroundColor: color, borderColor: isSelected ? '#fff' : color }]}>
                                    <MaterialCommunityIcons name="lightning-bolt" size={14} color="#000" />
                                </View>
                                <View style={[styles.pinArrow, { borderTopColor: color }]} />
                            </View>
                        </Marker>
                    );
                })}
            </MapView>

            <View style={styles.rangeContainer}>
                {[2, 5, 10, 20].map(r => (
                    <TouchableOpacity key={r} style={[styles.rangeChip, range === r && styles.rangeActive]} onPress={() => handleRangeChange(r)}>
                        <Text style={[styles.rangeText, range === r && {color:'#fff'}]}>{r} km</Text>
                    </TouchableOpacity>
                ))}
                {loading && <ActivityIndicator size="small" color="#2ECC71" style={{marginLeft: 10}} />}
            </View>

            <View style={styles.carouselContainer}>
                <FlatList 
                    ref={flatListRef}
                    data={stations}
                    horizontal
                    renderItem={renderCard}
                    keyExtractor={item => item.id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: SPACING }}
                    snapToInterval={CARD_WIDTH + SPACING} 
                    decelerationRate="fast"
                    pagingEnabled={false}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    map: { flex: 1 },

    // 🟢 NEW SEARCH STYLES
    searchContainer: {
        position: 'absolute', top: 50, left: 20, right: 20, zIndex: 999, elevation: 10,
    },
    inputBox: {
        backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155',
        height: 50, flexDirection: 'row', alignItems: 'center',
    },
    inputText: {
        flex: 1, color: '#fff', fontSize: 16, height: '100%', marginLeft: 10
    },
    
    // 🟢 CUSTOM SUGGESTIONS LIST
    suggestionsBox: {
        backgroundColor: '#1e293b', borderRadius: 12, marginTop: 5, 
        borderWidth: 1, borderColor: '#334155', elevation: 5, maxHeight: 200, overflow: 'hidden'
    },
    suggestionItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
        borderBottomWidth: 1, borderBottomColor: '#334155'
    },
    suggestionText: { color: '#cbd5e1', fontSize: 14 },

    pinContainer: { alignItems: 'center', justifyContent: 'center' },
    pinHead: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, elevation: 3, shadowOpacity: 0.3 },
    pinArrow: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginTop: -1 },
    rangeContainer: { position: 'absolute', top: 110, left: 20, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 1 },
    rangeChip: { backgroundColor: 'rgba(30, 41, 59, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
    rangeActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
    rangeText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 12 },
    carouselContainer: { position: 'absolute', bottom: 30, width: '100%', zIndex: 1 }
});