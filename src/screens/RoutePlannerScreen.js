import React, { useMemo, useEffect, useState, useRef } from 'react';
import { 
    View, StyleSheet, Text, TouchableOpacity, Linking, 
    Animated, Dimensions, Alert, Modal, TextInput, FlatList, Platform
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Stores & Hooks
import { useTripStore } from '../store/useTripStore'; 
import { useMapAnimation } from '../Hooks/useMapAnimation';
import { useRouteLogic } from '../Hooks/useRouteLogic';
import { useStationLogic } from '../Hooks/useStationLogic';

// Components
import RouteMap from '../components/route/RouteMap';
import TripTimelineItem from '../components/route/TripTimelineItem';

const { height } = Dimensions.get('window');

// --- MODALS ---

// 🟢 FIX 1: Modal now accepts 'alternatives' directly (No calculation needed)
const StationSwapModal = ({ visible, onClose, currentStation, alternatives, onSwap }) => {
    if (!currentStation || !visible) return null;

    // Use the list passed from the specific stop
    const dataToShow = alternatives && alternatives.length > 0 ? alternatives : [];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.swapModalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Swap Station</Text>
                        <TouchableOpacity onPress={onClose}><Ionicons name="close-circle" size={28} color="#94a3b8" /></TouchableOpacity>
                    </View>
                    <Text style={styles.modalSub}>Alternatives near {currentStation.name}</Text>
                    
                    {dataToShow.length === 0 ? (
                        <View style={{padding: 20, alignItems: 'center'}}>
                            <Ionicons name="alert-circle-outline" size={40} color="#64748b" />
                            <Text style={{color:'#64748b', marginTop: 10, textAlign:'center'}}>
                                No other stations found within range for this specific stop.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={dataToShow}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.swapItem} onPress={() => onSwap(item)}>
                                    <View style={styles.swapIconBox}>
                                        <Ionicons name="flash" size={20} color={item.powerkw >= 50 ? "#2ECC71" : "#F59E0B"} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.swapName}>{item.name}</Text>
                                        <Text style={styles.swapMeta}>{item.powerkw}kW • {item.connectorTypes?.[0]}</Text>
                                    </View>
                                    <View style={styles.swapSelectBtn}><Text style={styles.swapSelectText}>Select</Text></View>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const VerificationModal = ({ visible, onClose, station, onSubmit }) => {
    const [status, setStatus] = useState('Working');
    const [notes, setNotes] = useState('');
    const [rating, setRating] = useState(5);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Verify Station</Text>
                    <Text style={styles.modalSub}>{station?.name}</Text>
                    <View style={styles.chipRow}>
                        {['Working', 'Broken'].map(s => (
                            <TouchableOpacity key={s} style={[styles.typeChip, status === s && (s === 'Broken' ? styles.chipRed : styles.activeChip)]} onPress={() => setStatus(s)}>
                                <Text style={[styles.chipText, status === s && {color:'#fff'}]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.starRow}>
                         {[1,2,3,4,5].map(r => (
                             <TouchableOpacity key={r} onPress={() => setRating(r)}><Ionicons name={r <= rating ? "star" : "star-outline"} size={32} color="#F59E0B" /></TouchableOpacity>
                         ))}
                    </View>
                    <TextInput style={[styles.modalInput, {height: 60, marginTop: 15}]} value={notes} onChangeText={setNotes} multiline placeholder="Comments..." placeholderTextColor="#64748b" />
                    <TouchableOpacity style={styles.submitBtn} onPress={() => { onSubmit({ stationId: station.id, workingStatus: status === 'Working', comment: notes, rating, timestamp: Date.now() }); onClose(); }}>
                        <Text style={styles.submitText}>SUBMIT REPORT</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// 🟢 MAIN COMPONENT
export default function RoutePlannerScreen() {
    const navigation = useNavigation();
    
    // Stores
    const toggleStrategy = useTripStore(state => state.toggleStrategy);
    const tripResult = useTripStore(state => state.viewData); 
    
    // Data from Store
    const { routePolyline, routePath, selectedStops = [], allCandidates = [], meta, strategy, startName, endName } = tripResult || {};

    // 🟢 FIX 2: Local State to hold alternatives for the *currently selected* stop
    const [currentAlternatives, setCurrentAlternatives] = useState([]);

    const totalDistance = meta?.totalDistance || 0;

    // Hooks
    const { mapHeight, handleScroll } = useMapAnimation();
    const { finalRoutePoints, totalDurationMins, displayDistance } = useRouteLogic(selectedStops, routePath, routePolyline, totalDistance, startName);
    const {
        fetchAmenitiesForStation, lazyAmenities, handleVerificationSubmit,
        verifyModalVisible, setVerifyModalVisible, selectedForVerify,
        swapModalVisible, setSwapModalVisible, stationToSwap,
        handleSwapPress, handleVerifyPress, handleSwapConfirm
    } = useStationLogic();

    const mapRef = useRef(null);

    // Map Sync Logic
    const handleViewableItemsChanged = useRef(({ viewableItems }) => {
        if (viewableItems.length > 0) {
            const item = viewableItems[0].item;
            const station = item.station;
            if (station && (station.lat || station.latitude) && mapRef.current) {
                mapRef.current.animateToRegion({
                    latitude: parseFloat(station.lat || station.latitude),
                    longitude: parseFloat(station.lng || station.longitude),
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05
                }, 500);
            }
        }
    }).current;

    useEffect(() => {
        selectedStops.forEach((stop, i) => {
            if (stop.station?.lat) setTimeout(() => fetchAmenitiesForStation(stop.station), 200 * i);
        });
    }, [selectedStops]);

    const handleStartNavigation = () => {
        if (selectedStops.length < 2) return;
        const origin = selectedStops[0].station;
        const dest = selectedStops[selectedStops.length - 1].station;
        const waypoints = selectedStops.slice(1, -1).map(stop => `${stop.station.lat},${stop.station.lng}`).join('|');
        const url = Platform.select({
            ios: `comgooglemaps://?saddr=${origin.lat},${origin.lng}&daddr=${dest.lat},${dest.lng}&waypoints=${waypoints}&directionsmode=driving`,
            android: `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&waypoints=${waypoints}&travelmode=driving`
        });
        Linking.openURL(url).catch(() => Alert.alert("Error", "Google Maps not installed."));
    };

    // 🟢 FIX 3: Swap Handler Wrapper
    // This intercepts the press, grabs the alternatives from the item, and then calls the hook logic
    const onSwapBtnClick = (stopItem) => {
        if (!stopItem || !stopItem.station) return;
        
        // 1. Set the alternatives specific to this stop (from Backend)
        setCurrentAlternatives(stopItem.alternatives || []);
        
        // 2. Trigger the modal logic (Hook sets the 'stationToSwap' state)
        handleSwapPress(stopItem.station);
    };

    // Safer Math for Header
    const safeDistance = !isNaN(displayDistance) ? Math.round(displayDistance) : 0;
    const safeDuration = !isNaN(totalDurationMins) ? totalDurationMins : 0;
    const hours = Math.floor(safeDuration / 60);
    const mins = Math.round(safeDuration % 60);

    return (
        <View style={styles.container}>
            {/* MAP COMPONENT */}
            <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
                <RouteMap 
                    mapRef={mapRef}
                    finalRoutePoints={finalRoutePoints}
                    selectedStops={selectedStops}
                    allStations={allCandidates} 
                    strategy={strategy}
                />
                <TouchableOpacity style={styles.navFab} onPress={handleStartNavigation}>
                    <Ionicons name="navigate" size={24} color="#fff" />
                    <Text style={styles.navFabText}>Start Navigation</Text>
                </TouchableOpacity>
            </Animated.View>

            <View style={{flex: 1}}>
                <View style={styles.headerBox}>
                    <View style={styles.headerContent}>
                        <View style={{flex: 1, marginRight: 10}}> 
                            <Text style={styles.headerTitle} numberOfLines={1}>{startName} → {endName}</Text>
                            <Text style={styles.headerSub}>
                                {safeDistance} km • {hours}h {mins}m
                            </Text>
                        </View>
                        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('SmartPlanner', { editing: true })}>
                            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.strategyContainer}>
                        <TouchableOpacity style={[styles.stratBtn, strategy === 'FAST' && { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={() => toggleStrategy('FAST')}>
                            <Ionicons name="flash" size={16} color={strategy === 'FAST' ? '#EF4444' : '#94a3b8'} /><Text style={[styles.stratText, strategy === 'FAST' && {color:'#EF4444'}]}>Fastest</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.stratBtn, strategy === 'SLOW' && { backgroundColor: 'rgba(46, 204, 113, 0.2)' }]} onPress={() => toggleStrategy('SLOW')}>
                            <Ionicons name="leaf" size={16} color={strategy === 'SLOW' ? '#2ECC71' : '#94a3b8'} /><Text style={[styles.stratText, strategy === 'SLOW' && {color:'#2ECC71'}]}>Eco / Slow</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* TIMELINE ITEM LIST */}
                <FlatList
                    data={selectedStops}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item, index }) => (
                        <TripTimelineItem 
                            item={{
                                ...item,
                                station: { 
                                    ...item.station, 
                                    name: item.type === 'START' ? startName : item.type === 'DESTINATION' ? endName : item.station.name 
                                }
                            }}
                            index={index}
                            isLast={index === selectedStops.length - 1}
                            amenities={lazyAmenities[item.station.id]}
                            onVerify={() => handleVerifyPress(item.station)}
                            // 🟢 FIX 4: Call our wrapper function, not the hook directly
                            onSwap={() => onSwapBtnClick(item)} 
                        />
                    )}
                    onScroll={handleScroll}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    onViewableItemsChanged={handleViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
                />
            </View>

            <VerificationModal visible={verifyModalVisible} station={selectedForVerify} onClose={() => setVerifyModalVisible(false)} onSubmit={handleVerificationSubmit} />
            
            {/* 🟢 FIX 5: Pass 'currentAlternatives' to modal */}
            <StationSwapModal 
                visible={swapModalVisible} 
                currentStation={stationToSwap} 
                alternatives={currentAlternatives} 
                onClose={() => setSwapModalVisible(false)} 
                onSwap={handleSwapConfirm} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    mapContainer: { width: '100%', overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: '#334155' },
    navFab: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 8, gap: 8 },
    navFabText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    headerBox: { padding: 20, backgroundColor: '#1e293b', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    headerSub: { color: '#94a3b8', fontSize: 13 },
    editBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    strategyContainer: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 4, borderRadius: 12 },
    stratBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    stratText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },
    
    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20 },
    swapModalContent: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    modalSub: { color: '#94a3b8', fontSize: 14, marginBottom: 20 },
    swapItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
    swapIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    swapName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    swapMeta: { color: '#94a3b8', fontSize: 12 },
    swapSelectBtn: { backgroundColor: '#3b82f6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    swapSelectText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    chipRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
    activeChip: { backgroundColor: '#2ECC71', borderColor: '#2ECC71' },
    chipRed: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
    chipText: { color: '#94a3b8', fontSize: 12 },
    starRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
    inputLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
    modalInput: { backgroundColor: '#0f172a', color: '#fff', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#334155', fontSize: 16 },
    submitBtn: { backgroundColor: '#3b82f6', paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 20 },
    submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});