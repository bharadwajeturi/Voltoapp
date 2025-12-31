import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Dimensions, 
    FlatList, 
    Linking, 
    Keyboard, 
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    Platform,
    ScrollView
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'; 
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location'; 
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🟢 IMPORT CONFIG
import { API_BASE_URL, CONFIG } from '../config/constants';

const { width, height } = Dimensions.get('window');

// 🟢 1. MODERN DARK MAP STYLE (Missing Variable Added)
const CUSTOM_MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
    { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
    { "featureType": "poi", "elementType": "labels", "stylers": [{ "visibility": "off" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
    { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
    { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

// 🟢 HELPER: Convert Degrees to Radians
const deg2rad = (deg) => deg * (Math.PI/180);

// 🟢 HELPER: Calculate Distance
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; 
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
};

// 🟢 HELPER: Score Color
const getScoreColor = (score) => {
    if (score >= 80) return '#2ECC71'; 
    if (score >= 50) return '#F1C40F'; 
    return '#E74C3C'; 
};

// 🟢 COMPONENT: Amenity Chip
const AmenityChip = ({ type }) => {
    let icon = 'star', label = type, color = '#94a3b8', bg = '#1e293b';
    const t = (typeof type === 'string' ? type : '').toLowerCase();
    
    if (t.includes('restroom') || t.includes('toilet')) { icon = 'toilet'; label="Restroom"; color='#38bdf8'; bg='rgba(56, 189, 248, 0.1)'; }
    else if (t.includes('coffee') || t.includes('cafe')) { icon = 'coffee'; label="Cafe"; color='#eab308'; bg='rgba(234, 179, 8, 0.1)'; }
    else if (t.includes('food') || t.includes('restaurant')) { icon = 'silverware-fork-knife'; label="Food"; color='#f97316'; bg='rgba(249, 115, 22, 0.1)'; }
    else if (t.includes('shopping') || t.includes('mall')) { icon = 'shopping'; label="Shop"; color='#a855f7'; bg='rgba(168, 85, 247, 0.1)'; }
    else if (t.includes('wifi')) { icon = 'wifi'; label="WiFi"; color='#22c55e'; bg='rgba(34, 197, 94, 0.1)'; }
    else if (t.includes('hotel') || t.includes('lodging')) { icon = 'bed'; label="Stay"; color='#ec4899'; bg='rgba(236, 72, 153, 0.1)'; }

    return (
        <View style={[styles.amenityChip, { backgroundColor: bg, borderColor: color }]}>
            <MaterialCommunityIcons name={icon} size={10} color={color} />
            <Text style={[styles.amenityChipText, { color: color }]}>{label}</Text>
        </View>
    );
};

// 🟢 COMPONENT: Verification Modal
const VerificationModal = ({ visible, onClose, station, onSubmit }) => {
    const [power, setPower] = useState('');
    const [status, setStatus] = useState('Working'); 
    const [price, setPrice] = useState('');
    const [success, setSuccess] = useState(true);
    const [notes, setNotes] = useState('');
    
    useEffect(() => {
        if(station) {
            setPower(station.powerkw?.toString() || '');
            setStatus('Working');
            setPrice('');
            setSuccess(true);
            setNotes('');
        }
    }, [station]);

    const handleSubmit = () => {
        onSubmit({ 
            stationId: station.id, power, type: station.connectorTypes?.[0] || 'CCS2', 
            status, price, chargeSuccess: success, amenities: notes, timestamp: Date.now() 
        });
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Verify Station</Text>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#94a3b8" /></TouchableOpacity>
                    </View>
                    <Text style={styles.modalSub}>{station?.name}</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.chipRow}>
                            {['Working', 'Busy', 'Broken'].map(s => (
                                <TouchableOpacity key={s} style={[styles.typeChip, status === s && (s === 'Broken' ? styles.chipRed : styles.activeChip)]} onPress={() => setStatus(s)}>
                                    <Text style={[styles.chipText, status === s && (s === 'Broken' ? {color:'#fff'} : {color:'#000'})]}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity style={[styles.toggleRow, success ? styles.successBorder : styles.failBorder]} onPress={() => setSuccess(!success)}>
                            <View><Text style={styles.toggleTitle}>Charge Successful?</Text><Text style={styles.toggleSub}>{success ? "Yes" : "No"}</Text></View>
                            <Ionicons name={success ? "checkmark-circle" : "close-circle"} size={28} color={success ? "#2ECC71" : "#EF4444"} />
                        </TouchableOpacity>
                        <View style={styles.rowInputs}>
                            <View style={{flex:1}}><Text style={styles.inputLabel}>Power (kW)</Text><TextInput style={styles.modalInput} value={power} onChangeText={setPower} keyboardType="numeric" placeholder="30" placeholderTextColor="#64748b" /></View>
                            <View style={{width: 10}} />
                            <View style={{flex:1}}><Text style={styles.inputLabel}>Price (₹)</Text><TextInput style={styles.modalInput} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="18" placeholderTextColor="#64748b" /></View>
                        </View>
                        <Text style={styles.inputLabel}>Notes</Text>
                        <TextInput style={[styles.modalInput, {height: 60}]} value={notes} onChangeText={setNotes} multiline placeholder="Amenities..." placeholderTextColor="#64748b" />
                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}><Text style={styles.submitText}>SUBMIT</Text></TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default function NearMeScreen() {
    const mapRef = useRef(null);
    const flatListRef = useRef(null);
    const searchRef = useRef(null); 
    
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [range, setRange] = useState(5); 
    
    const [verifyModalVisible, setVerifyModalVisible] = useState(false);
    const [selectedForVerify, setSelectedForVerify] = useState(null);

    const [region, setRegion] = useState({
        latitude: 17.3850,
        longitude: 78.4867,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05
    });

    const calculateZoomDelta = (rangeKm) => {
        return (rangeKm * 2) / (111 * 0.6); 
    };

    const fetchStations = async (lat, lng, radiusKm) => {
        setLoading(true);
        try {
            // 🟢 USE CONFIG URL
            const res = await axios.get(`${API_BASE_URL}/nearby`, {
                params: { lat, lng, r: radiusKm }
            });
            
            const parsedData = res.data.map(s => ({
                ...s,
                lat: parseFloat(s.lat),
                lng: parseFloat(s.lng),
                powerkw: parseFloat(s.powerkw || 0),
                trustscore: parseFloat(s.trustscore || 0),
                amenities: s.amenities || []
            })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));
            
            setStations(parsedData);

            // Auto-Expand if few results
            if (parsedData.length < 5 && radiusKm < 20) {
                const nextTier = radiusKm === 5 ? 10 : 20;
                setRange(nextTier);
                fetchStations(lat, lng, nextTier); 
            }

        } catch (e) {
            console.error("Fetch failed:", e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Allow location access to find stations near you.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            
            const zoom = calculateZoomDelta(range);
            const newRegion = { latitude, longitude, latitudeDelta: zoom, longitudeDelta: zoom };
            
            setRegion(newRegion);
            mapRef.current?.animateToRegion(newRegion, 1000);
            fetchStations(latitude, longitude, range);
        })();
    }, []);

    const handleVerificationSubmit = async (data) => {
        try {
            const existing = await AsyncStorage.getItem('pending_verifications');
            const parsed = existing ? JSON.parse(existing) : [];
            parsed.push(data);
            await AsyncStorage.setItem('pending_verifications', JSON.stringify(parsed));
            
            // 🟢 USE CONFIG URL
            await axios.post(`${API_BASE_URL}/verify`, data);
            
            const remaining = parsed.filter(i => i.timestamp !== data.timestamp);
            await AsyncStorage.setItem('pending_verifications', JSON.stringify(remaining));
            Alert.alert("Success", "Station verified! Trust score updated.");
        } catch (e) {
            Alert.alert("Saved Offline", "We'll sync this when you're back online.");
        }
    };

    const handlePlaceSelect = (data, details = null) => {
        if (!details) return;
        const { lat, lng } = details.geometry.location;
        if (searchRef.current) searchRef.current.setAddressText(data.description);

        const zoomDelta = calculateZoomDelta(range);
        const newRegion = { latitude: lat, longitude: lng, latitudeDelta: zoomDelta, longitudeDelta: zoomDelta };

        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
        fetchStations(lat, lng, range); 
        Keyboard.dismiss();
    };

    const handleRangeChange = (newRange) => {
        setRange(newRange);
        const zoomDelta = calculateZoomDelta(newRange);
        const newRegion = { ...region, latitudeDelta: zoomDelta, longitudeDelta: zoomDelta };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
        fetchStations(region.latitude, region.longitude, newRange);
    };

    const handleViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const item = viewableItems[0].item;
            setSelectedId(item.id);
            mapRef.current?.animateToRegion({
                latitude: item.lat,
                longitude: item.lng,
                latitudeDelta: calculateZoomDelta(range) / 2, 
                longitudeDelta: calculateZoomDelta(range) / 2
            }, 500);
        }
    }).current;

    const handleMarkerPress = (station, index) => {
        setSelectedId(station.id);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    const renderCard = ({ item }) => {
        const distanceKm = getDistanceFromLatLonInKm(region.latitude, region.longitude, item.lat, item.lng).toFixed(1);
        
        // Handle Amenities Array
        const ams = Array.isArray(item.amenities) ? item.amenities : [];

        // 🟢 FIX: Safe Connector Display
        const connector = (item.connectorTypes && item.connectorTypes.length > 0) 
            ? item.connectorTypes[0] 
            : 'CCS2';

        return (
            <TouchableOpacity 
                activeOpacity={0.9} 
                style={[styles.card, selectedId === item.id && styles.activeCard]}
                onPress={() => handleMarkerPress(item, stations.indexOf(item))}
            >
                <View style={styles.cardHeader}>
                    <View style={{flex: 1}}>
                        <Text style={styles.stationName} numberOfLines={1}>{item.name}</Text>
                        <View style={styles.distRow}>
                            <Ionicons name="navigate-circle" size={14} color="#3b82f6" />
                            <Text style={styles.distText}>{distanceKm} km away</Text>
                        </View>
                        <Text style={styles.addressText} numberOfLines={1}>{item.address || "Address unavailable"}</Text>
                    </View>
                    <View style={[styles.scoreBadge, {backgroundColor: getScoreColor(item.trustscore || 0)}]}>
                        <Text style={styles.scoreText}>{item.trustscore || '?'}</Text>
                    </View>
                </View>
                
                {/* Tech Specs */}
                <View style={styles.techRow}>
                    <View style={styles.pill}>
                        <MaterialCommunityIcons name="ev-plug-ccs2" size={14} color="#cbd5e1" />
                        <Text style={styles.pillText}>{connector}</Text>
                    </View>
                    <View style={[styles.pill, {borderColor: '#064e3b', backgroundColor: 'rgba(16, 185, 129, 0.1)'}]}>
                        <Ionicons name="flash" size={14} color="#2ECC71" />
                        <Text style={[styles.pillText, {color: '#2ECC71'}]}>{item.powerkw} kW</Text>
                    </View>
                </View>

                {/* 🟢 AMENITIES (If Available) */}
                {ams.length > 0 && (
                    <View style={styles.amenityRow}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {ams.map((am, i) => <AmenityChip key={i} type={am} />)}
                        </ScrollView>
                    </View>
                )}

                {/* 🟢 ACTION BUTTONS (Google, Map, Verify) */}
                <View style={styles.btnRow}>
                    <TouchableOpacity style={styles.navBtn} onPress={() => Linking.openURL(`geo:${item.lat},${item.lng}`)}>
                        <Ionicons name="navigate" size={16} color="#fff" />
                        <Text style={styles.btnText}>Map</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.iconBtn} onPress={() => Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(item.name)}`)}>
                        <Ionicons name="logo-google" size={18} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.iconBtn, {borderColor: '#F59E0B'}]} onPress={() => { setSelectedForVerify(item); setVerifyModalVisible(true); }}>
                        <Ionicons name="shield-checkmark" size={18} color="#F59E0B" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            
            <View style={styles.searchWrapper}>
                <GooglePlacesAutocomplete
                    ref={searchRef}
                    placeholder='Search Location...'
                    onPress={handlePlaceSelect}
                    query={{
                        key: CONFIG.GOOGLE_MAPS_API_KEY, 
                        language: 'en',
                        types: 'geocode',
                    }}
                    fetchDetails={true}
                    enablePoweredByContainer={false}
                    styles={{
                        container: { flex: 1 },
                        textInputContainer: styles.placesContainer,
                        textInput: styles.placesInput,
                        listView: styles.placesList,
                        row: { backgroundColor: '#1e293b', padding: 13 },
                        description: { color: '#cbd5e1' },
                    }}
                    renderLeftButton={() => <Ionicons name="search" size={20} color="#2ECC71" style={{marginLeft: 15, alignSelf:'center'}} />}
                />
            </View>

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={region}
                onRegionChangeComplete={(r) => setRegion(r)}
                customMapStyle={CUSTOM_MAP_STYLE} // 🟢 Apply Dark Mode
            >
                <Circle 
                    center={{latitude: region.latitude, longitude: region.longitude}} 
                    radius={range * 1000} 
                    fillColor="rgba(239, 68, 68, 0.05)" // Red tint
                    strokeColor="rgba(239, 68, 68, 0.5)" // Red border
                    strokeWidth={2}
                />

                {stations.map((s, i) => {
                    const isSelected = selectedId === s.id;
                    const color = getScoreColor(s.trustscore || 0);
                    
                    if (isSelected) {
                        return (
                            <Marker 
                                key={s.id} 
                                coordinate={{ latitude: s.lat, longitude: s.lng }} 
                                zIndex={10}
                                onPress={() => handleMarkerPress(s, i)}
                            >
                                <View style={{alignItems: 'center'}}>
                                    <View style={[styles.customMarker, styles.selectedMarker, { backgroundColor: color }]}>
                                        <MaterialCommunityIcons name="ev-station" size={20} color="#000" />
                                    </View>
                                </View>
                            </Marker>
                        );
                    } else {
                        return (
                            <Marker 
                                key={s.id} 
                                coordinate={{ latitude: s.lat, longitude: s.lng }} 
                                zIndex={1}
                                onPress={() => handleMarkerPress(s, i)}
                            >
                                <View style={styles.mapDotAlt} />
                            </Marker>
                        );
                    }
                })}
            </MapView>

            <View style={styles.rangeContainer}>
                {[2, 5, 10, 20].map(r => (
                    <TouchableOpacity 
                        key={r} 
                        style={[styles.chip, range === r && styles.activeChip]} 
                        onPress={() => handleRangeChange(r)}
                    >
                        <Text style={[styles.chipText, range === r && {color:'#0f172a'}]}>{r} km</Text>
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
                    contentContainerStyle={{ paddingHorizontal: 15 }}
                    snapToInterval={295} 
                    decelerationRate="fast"
                    onViewableItemsChanged={handleViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                />
            </View>

            <VerificationModal 
                visible={verifyModalVisible} 
                station={selectedForVerify} 
                onClose={() => setVerifyModalVisible(false)}
                onSubmit={handleVerificationSubmit}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    map: { flex: 1 },

    searchWrapper: { position: 'absolute', top: 50, left: 15, right: 15, zIndex: 100 },
    placesContainer: { backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', height: 50 },
    placesInput: { height: 50, color: '#fff', fontSize: 16, backgroundColor: 'transparent', borderRadius: 12 },
    placesList: { backgroundColor: '#1e293b', borderRadius: 10, marginTop: 5, borderWidth: 1, borderColor: '#334155' },

    customMarker: { padding: 8, borderRadius: 20, elevation: 4, borderWidth: 2, borderColor: '#fff' },
    selectedMarker: { padding: 12, borderWidth: 3 }, 
    
    mapDotAlt: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#64748b', borderWidth: 1.5, borderColor: '#fff' }, 

    rangeContainer: { position: 'absolute', top: 110, left: 20, flexDirection: 'row', alignItems:'center', gap: 8, zIndex: 1 },
    chip: { backgroundColor: 'rgba(30, 41, 59, 0.9)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
    activeChip: { backgroundColor: '#2ECC71', borderColor: '#2ECC71' },
    chipText: { color: '#fff', fontWeight: '700', fontSize: 12 },

    carouselContainer: { position: 'absolute', bottom: 30, width: '100%', zIndex: 1 },
    // 🟢 FIX: minHeight ensures expansion if amenities wrap
    card: { backgroundColor: '#1e293b', width: 280, padding: 15, borderRadius: 16, marginRight: 15, borderWidth: 1, borderColor: '#334155', minHeight: 210, justifyContent: 'space-between' }, 
    activeCard: { borderColor: '#2ECC71', borderWidth: 2 },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    stationName: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
    addressText: { color: '#94a3b8', fontSize: 11, marginBottom: 2 },
    
    distRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    distText: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },

    scoreBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    scoreText: { color: '#000', fontWeight: 'bold', fontSize: 10 },

    techRow: { flexDirection: 'row', gap: 8 },
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
    pillText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },

    amenityRow: { flexDirection: 'row', marginTop: 5, marginBottom: 2 },
    amenityChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10, marginRight: 6, borderWidth: 1, gap: 3 },
    amenityChipText: { fontSize: 9, fontWeight: '600' },

    btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    navBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#3b82f6', borderRadius: 8, paddingVertical: 8 },
    btnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    iconBtn: { width: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#334155', borderRadius: 8, borderWidth: 1, borderColor: '#475569' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    modalSub: { color: '#94a3b8', fontSize: 14, marginBottom: 20 },
    submitBtn: { backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    inputLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold', marginBottom: 8, marginTop: 10 },
    modalInput: { backgroundColor: '#0f172a', color: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#334155', fontSize: 16 },
    chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    typeChip: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#334155' },
    activeChip: { backgroundColor: '#2ECC71', borderColor: '#2ECC71' },
    chipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
    chipRed: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 15, backgroundColor: '#0f172a' },
    successBorder: { borderColor: 'rgba(46, 204, 113, 0.5)' },
    failBorder: { borderColor: 'rgba(239, 68, 68, 0.5)' },
    toggleTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
    toggleSub: { color: '#94a3b8', fontSize: 12 },
    rowInputs: { flexDirection: 'row', justifyContent: 'space-between' }
});