import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
    View, Text, FlatList, StyleSheet, TouchableOpacity, Linking, Dimensions, 
    Animated, Alert, Modal, TextInput, ScrollView, Platform 
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import polyline from '@mapbox/polyline';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTripStore } from '../store/useTripStore';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85; // 85% of screen width for carousel
const SPACING = 15;

// 🟢 HELPER: Open Single Station
const openSingleMap = (lat, lng, name) => {
    const label = encodeURIComponent(name || "Station");
    const url = Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${label})`
    });
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open map app."));
};

// 🟢 HELPER: Open Google Search (Name + Address)
const openGoogleSearch = (name, address) => {
    const query = encodeURIComponent(`${name} ${address || ''} EV Charger`);
    Linking.openURL(`https://www.google.com/search?q=${query}`);
};

// 🟢 COMPONENT: Verification Modal
const VerificationModal = ({ visible, onClose, station, onSubmit }) => {
    const [power, setPower] = useState('');
    const [type, setType] = useState('CCS2');
    const [status, setStatus] = useState('Working'); 
    const [price, setPrice] = useState('');
    const [success, setSuccess] = useState(true);
    const [notes, setNotes] = useState('');
    
    useEffect(() => {
        if(station) {
            setPower(station.powerkw?.toString() || '');
            setType(station.connectorTypes?.[0] || 'CCS2');
            setStatus('Working');
            setPrice('');
            setSuccess(true);
            setNotes('');
        }
    }, [station]);

    const handleSubmit = () => {
        onSubmit({ 
            stationId: station.id, power, type, status, price, 
            chargeSuccess: success, amenities: notes, timestamp: Date.now() 
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
                        <TextInput style={styles.modalInput} value={power} onChangeText={setPower} keyboardType="numeric" placeholder="Power (kW)" placeholderTextColor="#64748b" />
                        <TextInput style={styles.modalInput} value={notes} onChangeText={setNotes} placeholder="Notes..." placeholderTextColor="#64748b" />
                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}><Text style={styles.submitText}>SUBMIT</Text></TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// 🟢 Helper: Connector Icons
const ConnectorBadge = ({ type }) => (
    <View style={styles.badge}>
        <MaterialCommunityIcons name="ev-plug-ccs2" size={14} color="#cbd5e1" />
        <Text style={styles.badgeText}>{type || 'CCS2'}</Text>
    </View>
);

export default function TripPlannerScreen() {
    const toggleStrategy = useTripStore(state => state.toggleStrategy);
    const tripResult = useTripStore(state => state.viewData); 
    const { selectedStops = [], allStations = [], routePolyline, strategy, startName, endName } = tripResult || {};

    const [verifyModalVisible, setVerifyModalVisible] = useState(false);
    const [selectedForVerify, setSelectedForVerify] = useState(null);
    const [searchText, setSearchText] = useState(''); // 🟢 Search State
    const [selectedId, setSelectedId] = useState(null); 
    
    const flatListRef = useRef(null);
    const mapRef = useRef(null);

    // Decode Route
    const routePoints = useMemo(() => {
        if (!routePolyline) return [];
        try { return polyline.decode(routePolyline).map(p => ({ latitude: p[0], longitude: p[1] })); } catch (e) { return []; }
    }, [routePolyline]);

    // 🟢 1. UNRESTRICTED ALTERNATIVES
    const allAlternatives = useMemo(() => {
        return allStations.map(s => ({
            ...s,
            lat: parseFloat(s.lat || s.latitude),
            lng: parseFloat(s.lng || s.longitude),
            powerkw: parseFloat(s.powerkw || 0),
            trustscore: parseFloat(s.trustscore || 0)
        })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));
    }, [allStations]);

    // 🟢 2. MERGE LIST (Raw Data)
    const rawDataList = useMemo(() => {
        const plannedIds = new Set(selectedStops.map(s => s.station.id));
        
        const planned = selectedStops.map((s, index) => ({ 
            ...s.station, 
            uniqueId: `plan_${index}`, 
            isPlanned: true, 
            nodeType: s.type, 
            arrivalSOC: s.arrivalSOC,
            targetSOC: s.targetSOC, 
            legDistance: s.legDistance || s.distanceFromLast,
            lat: parseFloat(s.station.lat),
            lng: parseFloat(s.station.lng)
        }));
        
        const alts = allAlternatives
            .filter(s => !plannedIds.has(s.id)) 
            .map((s, index) => ({ 
                ...s, 
                uniqueId: `alt_${index}`,
                isPlanned: false,
                nodeType: 'ALTERNATIVE',
                arrivalSOC: s.arrivalSOC || 0, 
                legDistance: 0 
            }));
        
        return [...planned, ...alts];
    }, [selectedStops, allAlternatives]);

    // 🟢 3. FILTER LOGIC (Search)
    const filteredList = useMemo(() => {
        if (!searchText) return rawDataList;
        const lower = searchText.toLowerCase();
        return rawDataList.filter(item => 
            (item.name && item.name.toLowerCase().includes(lower)) || 
            (item.address && item.address.toLowerCase().includes(lower))
        );
    }, [rawDataList, searchText]);

    // 🟢 4. AUTO-ZOOM TO RESULTS
    useEffect(() => {
        if (filteredList.length > 0 && mapRef.current) {
            const coords = filteredList.map(s => ({ latitude: s.lat, longitude: s.lng }));
            
            // If searching, only zoom to results. If cleared, show whole route.
            if (!searchText && routePoints.length > 0) {
                coords.push(routePoints[0]);
                coords.push(routePoints[routePoints.length - 1]);
            }

            setTimeout(() => {
                mapRef.current?.fitToCoordinates(coords, {
                    edgePadding: { top: 100, right: 50, bottom: 250, left: 50 }, // Bottom padding for carousel
                    animated: true,
                });
            }, 500); 
        }
    }, [filteredList, searchText]);

    const handleVerificationSubmit = async (data) => {
        try {
            const existing = await AsyncStorage.getItem('pending_verifications');
            const parsed = existing ? JSON.parse(existing) : [];
            parsed.push(data);
            await AsyncStorage.setItem('pending_verifications', JSON.stringify(parsed));
            await axios.post('http://192.168.0.136:3000/api/station/verify', data);
            const remaining = parsed.filter(i => i.timestamp !== data.timestamp);
            await AsyncStorage.setItem('pending_verifications', JSON.stringify(remaining));
            Alert.alert("Success", "Station verified! Trust score updated.");
        } catch (e) {
            Alert.alert("Saved Offline", "We'll sync this when you're back online.");
        }
    };

    // 🟢 SYNC: Scroll Carousel -> Map Marker
    const handleViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const item = viewableItems[0].item;
            setSelectedId(item.uniqueId); // Highlight on map
            mapRef.current?.animateToRegion({
                latitude: item.lat,
                longitude: item.lng,
                latitudeDelta: 0.1, 
                longitudeDelta: 0.1
            }, 500);
        }
    }).current;

    // 🟢 SYNC: Click Marker -> Scroll Carousel
    const handleMarkerPress = (index, uniqueId) => {
        setSelectedId(uniqueId);
        flatListRef.current?.scrollToIndex({ index, animated: true });
    };

    const renderCard = ({ item }) => {
        const socColor = (item.arrivalSOC || 0) < 20 ? '#EF4444' : (item.arrivalSOC || 0) < 40 ? '#F59E0B' : '#10B981';
        const isStart = item.nodeType === 'START';
        const isCharger = item.nodeType === 'CHARGER' || item.nodeType === 'ALTERNATIVE';

        let displayName = item.name;
        if (isStart && startName) displayName = startName;
        if (item.nodeType === 'DESTINATION' && endName) displayName = endName;

        let badgeText = "ALTERNATIVE";
        let badgeStyle = styles.altLabel;
        if (isStart) { badgeText = "TRIP START"; badgeStyle = styles.startLabel; }
        else if (item.isPlanned) { badgeText = "PLANNED STOP"; badgeStyle = styles.plannedLabel; }

        return (
            <TouchableOpacity 
                activeOpacity={0.9}
                style={[styles.card, item.isPlanned && styles.plannedCard, isStart && styles.startCard]}
                onPress={() => mapRef.current?.animateToRegion({ latitude: item.lat, longitude: item.lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500)}
            >
                <View style={styles.cardHeader}>
                    <View style={{flex: 1}}>
                        <Text style={badgeStyle}>{badgeText}</Text>
                        <Text style={styles.stationName} numberOfLines={1}>{displayName}</Text>
                    </View>
                    {item.isPlanned && (
                        <View style={{alignItems: 'center'}}>
                            <View style={[styles.batteryCircle, { borderColor: socColor }]}>
                                <Text style={[styles.socText, {color: socColor}]}>{item.arrivalSOC}%</Text>
                            </View>
                        </View>
                    )}
                </View>

                {item.address ? (
                    <View style={styles.addressContainer}>
                        <Ionicons name="location-sharp" size={14} color="#3b82f6" style={{marginTop: 2}} />
                        <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
                    </View>
                ) : null}

                {isCharger && (
                    <View style={styles.specsRow}>
                        {item.connectorTypes?.length > 0 && <ConnectorBadge type={item.connectorTypes[0]} />}
                        {item.powerkw > 0 && (
                            <View style={[styles.badge, { backgroundColor: 'rgba(46, 204, 113, 0.1)' }]}>
                                <Ionicons name="flash" size={14} color="#2ECC71" />
                                <Text style={[styles.badgeText, {color: '#2ECC71'}]}>{item.powerkw} kW</Text>
                            </View>
                        )}
                        {item.trustscore > 0 && (
                            <View style={styles.badge}>
                                <Ionicons name="star" size={14} color="#F1C40F" />
                                <Text style={[styles.badgeText, {color: '#F1C40F'}]}>{(item.trustscore) / 10}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* 🟢 ACTION BUTTONS (Google with Address) */}
                {!isStart && (
                    <View style={styles.actionBar}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openGoogleSearch(item.name, item.address)}>
                            <Ionicons name="logo-google" size={14} color="#94a3b8" />
                            <Text style={styles.actionText}>Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openSingleMap(item.lat, item.lng, item.name)}>
                            <Ionicons name="map" size={14} color="#fff" />
                            <Text style={styles.btnText}>Map</Text>
                        </TouchableOpacity>
                        {isCharger && (
                            <TouchableOpacity style={[styles.actionBtn, styles.verifyBtn]} onPress={() => { setSelectedForVerify(item); setVerifyModalVisible(true); }}>
                                <Ionicons name="shield-checkmark" size={14} color="#000" />
                                <Text style={[styles.btnText, {color:'#000'}]}>Verify</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            
            {/* 🟢 SEARCH BAR (Floating on Map) */}
            <View style={styles.searchWrapper}>
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput 
                    style={styles.searchInput}
                    placeholder="Search Station or Area..."
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

            {/* MAP SECTION */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: routePoints[0]?.latitude || 17.385,
                    longitude: routePoints[0]?.longitude || 78.486,
                    latitudeDelta: 2, longitudeDelta: 2,
                }}
            >
                <Polyline coordinates={routePoints} strokeWidth={4} strokeColor="#3b82f6" zIndex={10} />
                
                {/* 🟢 MARKERS (Dots for Alts, Pins for Planned) */}
                {filteredList.map((item, i) => {
                    const isSelected = selectedId === item.uniqueId;
                    const showLargePin = item.isPlanned || isSelected;

                    return (
                        <Marker 
                            key={`marker_${i}`}
                            coordinate={{ latitude: item.lat, longitude: item.lng }}
                            zIndex={showLargePin ? 20 : 5} 
                            onPress={() => handleMarkerPress(i, item.uniqueId)}
                        >
                            {showLargePin ? (
                                <View style={[styles.mapPinPlanned, isSelected && {transform: [{scale: 1.2}], borderWidth: 3}]}>
                                    {item.nodeType === 'START' ? <Ionicons name="location" size={16} color="#2ECC71" /> :
                                     item.nodeType === 'DESTINATION' ? <Ionicons name="flag" size={16} color="#E74C3C" /> :
                                     <Text style={styles.mapPinText}>{i+1}</Text>
                                    }
                                </View>
                            ) : (
                                <View style={styles.mapDotAlt} />
                            )}
                        </Marker>
                    );
                })}
            </MapView>

            {/* 🟢 HORIZONTAL CAROUSEL */}
            <View style={styles.carouselContainer}>
                <FlatList
                    ref={flatListRef}
                    data={filteredList}
                    renderItem={renderCard}
                    keyExtractor={(item) => item.uniqueId}
                    horizontal
                    pagingEnabled={false} // Snap to interval manually
                    snapToInterval={CARD_WIDTH + SPACING}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: SPACING }}
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
    
    // 🟢 SEARCH STYLE
    searchWrapper: {
        position: 'absolute',
        top: 50, // Safe Area Top
        left: 20,
        right: 20,
        backgroundColor: '#1e293b',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
        zIndex: 100, // Float above Map
        borderWidth: 1,
        borderColor: '#334155',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5
    },
    searchInput: { flex: 1, color: '#fff', fontSize: 16, marginLeft: 10 },

    map: { ...StyleSheet.absoluteFillObject },

    // Markers
    mapPinPlanned: { backgroundColor: '#3b82f6', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    mapPinText: { color: '#fff', fontWeight: 'bold', fontSize: 10 },
    mapDotAlt: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#94a3b8', borderWidth: 1.5, borderColor: '#fff' }, 

    // Carousel
    carouselContainer: { position: 'absolute', bottom: 30, width: '100%', zIndex: 10 },
    
    card: { 
        backgroundColor: '#1e293b', 
        width: CARD_WIDTH, 
        padding: 12, 
        borderRadius: 12, 
        marginRight: SPACING, 
        borderWidth: 1, 
        borderColor: '#334155',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5
    },
    plannedCard: { borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.95)' }, // Slightly transparent for map visibility
    startCard: { borderColor: '#2ECC71', backgroundColor: 'rgba(46, 204, 113, 0.95)' },

    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    plannedLabel: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
    altLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
    startLabel: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },

    stationName: { color: '#fff', fontSize: 16, fontWeight: 'bold', maxWidth: '85%' },

    batteryCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', borderColor:'#fff' },
    socText: { fontSize: 10, fontWeight: 'bold', color: '#fff' },

    addressContainer: { flexDirection: 'row', marginTop: 4, alignItems: 'center', gap: 4 },
    addressText: { color: '#cbd5e1', fontSize: 11, flex: 1 },

    specsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4, borderWidth: 1, borderColor: '#334155' },
    badgeText: { color: '#cbd5e1', fontSize: 10, fontWeight: '600' },

    actionBar: { flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', justifyContent: 'flex-end', gap: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: '#0f172a' },
    verifyBtn: { backgroundColor: '#F59E0B' },
    actionText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
    btnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

    // Modal
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