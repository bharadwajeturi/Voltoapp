import React, { useMemo, useCallback, useEffect, useState } from 'react';
import { 
    View, StyleSheet, Text, TouchableOpacity, Linking, ScrollView, 
    Animated, Dimensions, Alert, Modal, TextInput, Platform, FlatList 
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTripStore } from '../store/useTripStore'; 

// 🟢 Import Hooks
import { useMapAnimation } from '../Hooks/useMapAnimation';
import { useRouteLogic } from '../Hooks/useRouteLogic';
import { useStationLogic } from '../Hooks/useStationLogic';

const { height } = Dimensions.get('window');

// 🟢 1. MAP STYLE & HELPERS (Kept for UI reference)
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

const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
};

const formatDuration = (mins) => {
    if (!mins) return "0m";
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}min`;
};

const openGoogleSearch = (name, address) => {
    const query = encodeURIComponent(`${name} ${address || ''} EV Charger`);
    Linking.openURL(`https://www.google.com/search?q=${query}`);
};

const openMapApp = (lat, lng, name) => {
    const label = encodeURIComponent(name || "Station");
    const url = Platform.select({
        ios: `maps:0,0?q=${label}@${lat},${lng}`,
        android: `geo:0,0?q=${lat},${lng}(${label})`
    });
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open map app."));
};

// 🟢 SUB-COMPONENTS
const AmenityChip = React.memo(({ type }) => {
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
            <MaterialCommunityIcons name={icon} size={12} color={color} />
            <Text style={[styles.amenityText, { color: color }]}>{label}</Text>
        </View>
    );
});

const SwapItem = React.memo(({ item, currentStation, onSwap }) => {
    const dist = getDistance(currentStation.lat, currentStation.lng, item.lat, item.lng).toFixed(1);
    
    let connector = 'CCS2';
    if (Array.isArray(item.connectorTypes) && item.connectorTypes.length > 0) {
        connector = item.connectorTypes[0];
    } else if (typeof item.connectorTypes === 'string') {
        connector = item.connectorTypes.replace(/[{}"\\]/g, ''); 
    }

    return (
        <TouchableOpacity style={styles.swapItem} onPress={() => onSwap(item)}>
            <View style={styles.swapIconBox}>
                <Ionicons name="flash" size={20} color={item.powerkw >= 50 ? "#2ECC71" : "#F59E0B"} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.swapName}>{item.name}</Text>
                <Text style={styles.swapMeta}>{item.powerkw}kW • {connector}</Text>
                <Text style={styles.swapDist}>+{dist} km detour</Text>
            </View>
            <View style={styles.swapSelectBtn}>
                <Text style={styles.swapSelectText}>Select</Text>
            </View>
        </TouchableOpacity>
    );
});

const StationSwapModal = ({ visible, onClose, currentStation, allCandidates, onSwap }) => {
    if (!currentStation || !visible) return null;

    const alternatives = useMemo(() => {
        if (!allCandidates) return [];
        return allCandidates.filter(c => {
            const dist = getDistance(currentStation.lat, currentStation.lng, c.lat, c.lng);
            return c.id !== currentStation.id && dist < 50; 
        }).sort((a, b) => (parseFloat(b.powerkw) || 0) - (parseFloat(a.powerkw) || 0)); 
    }, [currentStation, allCandidates]);

    const renderItem = useCallback(({ item }) => (
        <SwapItem item={item} currentStation={currentStation} onSwap={onSwap} />
    ), [currentStation, onSwap]);

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.swapModalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Alternative Stations</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={28} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.modalSub}>Within 50km of {currentStation.name}</Text>
                    
                    <FlatList
                        data={alternatives}
                        keyExtractor={item => item.id.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        ListEmptyComponent={
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: '#64748b' }}>No alternatives found nearby.</Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </Modal>
    );
};

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
            if (Array.isArray(station.connectorTypes) && station.connectorTypes.length > 0) {
                setType(station.connectorTypes[0]);
            } else {
                setType('CCS2');
            }
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

const StationCard = React.memo(({ item, index, chargerIndex, handleSwapPress, handleVerifyPress, openGoogleSearch, openMapApp, lazyAmenities, fetchAmenitiesForStation, socColor, currentAmenities, showCharging, themeColor }) => {
    const isStart = item.type === 'START';
    const isEnd = item.type === 'DESTINATION';
    const isCharger = item.type === 'CHARGER';
    
    let displayName = item.station.name;
    let connectorInfo = 'CCS2';
    if (item.station.connectorTypes) {
        if (Array.isArray(item.station.connectorTypes) && item.station.connectorTypes.length > 0) {
            connectorInfo = item.station.connectorTypes[0];
        } else if (typeof item.station.connectorTypes === 'string') {
            connectorInfo = item.station.connectorTypes.replace(/[{}"\\]/g, ''); 
        }
    }

    const displayAmenities = useMemo(() => {
        const dbAmenities = Array.isArray(item.station.amenities) ? item.station.amenities : [];
        const liveAmenities = Array.isArray(currentAmenities) ? currentAmenities : [];
        
        const normalizedDB = dbAmenities.map(a => ({ type: typeof a === 'string' ? a : a.type }));
        const normalizedLive = liveAmenities.map(a => ({ type: a.type || a.amenity_type }));
        
        const combined = [...normalizedDB, ...normalizedLive];
        const unique = [];
        const seen = new Set();
        
        for (const a of combined) {
            if (a.type && !seen.has(a.type)) {
                seen.add(a.type);
                unique.push(a);
            }
        }
        return unique.slice(0, 5);
    }, [item.station.amenities, currentAmenities]);

    return (
        <View style={[styles.stationCard, isStart && {borderColor:'#2ECC71'}, isEnd && {borderColor:'#E74C3C'}]}>
            <View style={styles.cardHeader}>
                <View style={[styles.seqBadge, isStart ? {backgroundColor:'#2ECC71'} : isEnd ? {backgroundColor:'#E74C3C'} : {backgroundColor: themeColor}]}>
                    <Text style={styles.seqText}>{isStart ? "START" : isEnd ? "END" : `#${chargerIndex + 1}`}</Text>
                </View>
                {showCharging && (
                    <View style={[styles.powerBadge, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                        <Ionicons name="flash" size={12} color="#2ECC71" />
                        <Text style={[styles.powerText, { color: '#2ECC71' }]}>{item.station.powerkw || 7.2} kW • {connectorInfo}</Text>
                    </View>
                )}
            </View>

            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <View style={{flex:1}}>
                    <Text style={styles.stationName}>{displayName}</Text>
                    <Text style={styles.addressText} numberOfLines={1}>{item.station.address || "Address unavailable"}</Text>
                    
                    {isCharger && (
                        <View style={styles.amenityContainer}>
                            {displayAmenities.length === 0 ? (
                                <Text style={{color: '#64748b', fontSize: 10}}>Scanning amenities...</Text>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0}}>
                                    {displayAmenities.map((a, i) => (
                                        <AmenityChip key={i} type={a.type} />
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}
                </View>
                
                <View style={{alignItems: 'center', justifyContent: 'center'}}>
                    <View style={[styles.miniBattery, {borderColor: socColor}]}>
                        <Text style={[styles.miniSoc, {color: socColor}]}>{item.arrivalSOC}%</Text>
                    </View>
                    
                    {showCharging && (
                        <View style={styles.chargeArrowContainer}>
                            <Ionicons name="arrow-down" size={12} color="#94a3b8" />
                            <View style={[styles.miniBattery, {borderColor: '#2ECC71', marginTop: 2}]}>
                                <Text style={[styles.miniSoc, {color: '#2ECC71'}]}>{item.targetSOC}%</Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            {showCharging ? (
                <>
                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <MaterialCommunityIcons name="clock-outline" size={16} color="#94a3b8" />
                            <Text style={styles.infoText}>+ {item.chargeTime} min charge</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <MaterialCommunityIcons name="map-marker-distance" size={16} color="#94a3b8" />
                            <Text style={styles.infoText}>{Math.round(item.distanceFromLast)} km leg</Text>
                        </View>
                    </View>

                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openGoogleSearch(item.station.name, item.station.address)}>
                            <Ionicons name="logo-google" size={14} color="#fff" />
                            <Text style={styles.btnText}>Google</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.actionBtn} onPress={() => openMapApp(item.station.lat, item.station.lng, item.station.name)}>
                            <Ionicons name="map" size={14} color="#fff" />
                            <Text style={styles.btnText}>Map</Text>
                        </TouchableOpacity>

                        {isCharger && (
                            <>
                                <TouchableOpacity style={[styles.actionBtn, styles.swapBtn]} onPress={() => handleSwapPress(item.station)}>
                                    <MaterialCommunityIcons name="swap-horizontal" size={14} color="#fff" />
                                    <Text style={styles.btnText}>Swap</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtn, styles.verifyBtn]} onPress={() => handleVerifyPress(item.station)}>
                                    <MaterialCommunityIcons name="check-decagram" size={14} color="#000" />
                                    <Text style={[styles.btnText, {color:'#000'}]}>Verify</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </>
            ) : (
                <View style={styles.infoGrid}>
                     <View style={styles.infoItem}>
                        <MaterialCommunityIcons name="flag-checkered" size={16} color="#94a3b8" />
                        <Text style={styles.infoText}>Trip Leg: {Math.round(item.distanceFromLast)} km</Text>
                    </View>
                </View>
            )}
        </View>
    );
});

// 🟢 MAIN SCREEN COMPONENT
export default function RoutePlannerScreen() {
    const navigation = useNavigation();
    
    // Global State
    const toggleStrategy = useTripStore(state => state.toggleStrategy);
    const swapStation = useTripStore(state => state.swapStation);
    const tripResult = useTripStore(state => state.viewData); 
    
    const { routePolyline, routePath, selectedStops = [], allStations = [], totalDistance = 0, startName, endName, strategy } = tripResult || {};
    
    // 🟢 Hooks
    const { mapHeight, handleScroll } = useMapAnimation();
    
    const { 
        finalRoutePoints, totalDurationMins, etaTime, displayDistance, displayStartName 
    } = useRouteLogic(selectedStops, routePath, routePolyline, totalDistance, startName);

    const {
        lazyAmenities, fetchAmenitiesForStation, handleVerificationSubmit,
        verifyModalVisible, setVerifyModalVisible, selectedForVerify,
        swapModalVisible, setSwapModalVisible, stationToSwap,
        handleSwapPress, handleVerifyPress, handleSwapConfirm
    } = useStationLogic();

    const themeColor = strategy === 'FAST' ? '#EF4444' : '#2ECC71'; 
    const polylineColor = strategy === 'FAST' ? '#EF4444' : '#2ECC71';
    
    const chargerStops = useMemo(() => selectedStops.filter(s => s.type === 'CHARGER'), [selectedStops]);
    const plannedIds = useMemo(() => new Set(selectedStops.map(s => s.station.id)), [selectedStops]);

    // 🟢 Effect: Fetch Amenities for Planned Stops (Lazy Loading)
    useEffect(() => {
        if (selectedStops.length > 0) {
            selectedStops.forEach((stop, i) => {
                if (stop.station?.lat) setTimeout(() => fetchAmenitiesForStation(stop.station), 100 * i);
            });
        }
    }, [selectedStops]);

    const handleOpenFullTrip = () => {
        if (selectedStops.length < 2) return;
        const origin = selectedStops[0].station;
        const dest = selectedStops[selectedStops.length - 1].station;
        const waypoints = selectedStops.slice(1, -1)
            .map(stop => `${stop.station.lat},${stop.station.lng}`)
            .join('|');
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&waypoints=${waypoints}&travelmode=driving`;
        Linking.openURL(url).catch(err => Alert.alert("Error", "Could not open Google Maps"));
    };

    const renderCardItem = useCallback(({ item, index }) => {
        const isCharger = item.type === 'CHARGER';
        const showCharging = isCharger || (item.type === 'DESTINATION' && item.targetSOC > item.arrivalSOC);
        const socColor = item.arrivalSOC < 20 ? '#EF4444' : item.arrivalSOC < 40 ? '#F59E0B' : '#10B981';
        
        let chargerIndex = -1;
        if (isCharger) {
            chargerIndex = chargerStops.indexOf(item);
        }

        return (
            <View style={styles.timelineContainer}>
                {index !== selectedStops.length - 1 && <View style={styles.timelineLine} />}
                <StationCard 
                    item={item} 
                    index={index}
                    chargerIndex={chargerIndex}
                    handleSwapPress={handleSwapPress}
                    handleVerifyPress={handleVerifyPress}
                    openGoogleSearch={openGoogleSearch}
                    openMapApp={openMapApp}
                    lazyAmenities={lazyAmenities}
                    fetchAmenitiesForStation={fetchAmenitiesForStation}
                    socColor={socColor}
                    currentAmenities={lazyAmenities[item.station.id] || item.station.amenities || []}
                    showCharging={showCharging}
                    themeColor={themeColor}
                />
            </View>
        );
    }, [selectedStops, lazyAmenities, handleSwapPress, handleVerifyPress, themeColor]);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.mapContainer, { height: mapHeight }]}>
                <MapView
                    provider={PROVIDER_GOOGLE}
                    customMapStyle={CUSTOM_MAP_STYLE} 
                    style={styles.map}
                    initialRegion={{
                        latitude: finalRoutePoints[0]?.latitude || 20.5937,
                        longitude: finalRoutePoints[0]?.longitude || 78.9629,
                        latitudeDelta: 5, longitudeDelta: 5,
                    }}
                >
                    <Polyline coordinates={finalRoutePoints} strokeWidth={5} strokeColor={polylineColor} zIndex={10} />
                    {allStations.map((s, i) => {
                        if (plannedIds.has(s.id)) return null; 
                        return (
                            <Marker 
                                key={`alt_${i}`}
                                coordinate={{ latitude: parseFloat(s.lat), longitude: parseFloat(s.lng) }}
                                zIndex={1}
                                tracksViewChanges={false} 
                            >
                                <View style={styles.mapDotAlt} />
                            </Marker>
                        )
                    })}
                    {selectedStops.map((stop, i) => {
                        const isCharger = stop.type === 'CHARGER';
                        return (
                            <Marker 
                                key={`marker_group_${i}`}
                                coordinate={{ latitude: stop.station.lat, longitude: stop.station.lng }}
                                zIndex={isCharger ? 15 : 20}
                            >
                                {stop.type === 'START' ? <Ionicons name="location" size={32} color="#2ECC71" /> :
                                 stop.type === 'DESTINATION' ? <Ionicons name="flag" size={32} color="#E74C3C" /> :
                                 <View style={[styles.markerBadge, { borderColor: themeColor, backgroundColor: themeColor }]}>
                                     <Text style={styles.markerText}>{chargerStops.indexOf(stop) + 1}</Text>
                                 </View>
                                }
                            </Marker>
                        );
                    })}
                </MapView>
                
                <TouchableOpacity style={styles.navFab} onPress={handleOpenFullTrip}>
                    <Ionicons name="navigate" size={24} color="#fff" />
                    <Text style={styles.navFabText}>Start Navigation</Text>
                </TouchableOpacity>
            </Animated.View>

            <View style={{flex: 1}}>
                <View style={styles.headerBox}>
                    <TouchableOpacity style={styles.routeHeader} onPress={() => navigation.navigate('SmartPlanner')}>
                        <View style={{flex: 1}}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                                <Text style={styles.headerTitle} numberOfLines={1}>{displayStartName} to {endName}</Text>
                                <View style={styles.editBtn}>
                                    <MaterialCommunityIcons name="pencil" size={16} color="#94a3b8" />
                                </View>
                            </View>
                            
                            <View style={styles.etaRow}>
                                <Text style={styles.headerSub}>
                                    {Math.round(displayDistance)} km • {formatDuration(totalDurationMins)}
                                </Text>
                                <View style={styles.etaBadge}>
                                    <Text style={styles.etaText}>ETA {etaTime}</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.strategyContainer}>
                        <TouchableOpacity 
                            style={[styles.stratBtn, strategy === 'FAST' && { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} 
                            onPress={() => toggleStrategy('FAST')}
                        >
                            <Ionicons name="flash" size={16} color={strategy === 'FAST' ? '#EF4444' : '#94a3b8'} />
                            <Text style={[styles.stratText, strategy === 'FAST' && {color:'#EF4444'}]}>Fastest</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.stratBtn, strategy === 'SLOW' && { backgroundColor: 'rgba(46, 204, 113, 0.2)' }]} 
                            onPress={() => toggleStrategy('SLOW')}
                        >
                            <Ionicons name="leaf" size={16} color={strategy === 'SLOW' ? '#2ECC71' : '#94a3b8'} />
                            <Text style={[styles.stratText, strategy === 'SLOW' && {color:'#2ECC71'}]}>Eco / Slow</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <FlatList
                    data={selectedStops}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderCardItem}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={5}
                />
            </View>

            <VerificationModal 
                visible={verifyModalVisible} 
                station={selectedForVerify} 
                onClose={() => setVerifyModalVisible(false)}
                onSubmit={handleVerificationSubmit}
            />

            <StationSwapModal 
                visible={swapModalVisible}
                currentStation={stationToSwap}
                allCandidates={allStations}
                onClose={() => setSwapModalVisible(false)}
                onSwap={handleSwapConfirm}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    
    mapContainer: { width: '100%', overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: '#334155' },
    map: { width: '100%', height: '100%' },
    markerBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    markerText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    mapAmenityIcon: { backgroundColor: '#fff', padding: 2, borderRadius: 4, elevation: 2 },
    
    mapDotAlt: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#64748b', borderWidth: 1.5, borderColor: '#fff' }, 

    navFab: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 30, elevation: 8, gap: 8 },
    navFabText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

    headerBox: { padding: 20, backgroundColor: '#1e293b', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 0 },
    routeHeader: { marginBottom: 15 },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4, flex: 1 },
    etaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerSub: { color: '#94a3b8', fontSize: 13 },
    etaBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    etaText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
    editBtn: { marginLeft: 8, padding: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },

    strategyContainer: { flexDirection: 'row', backgroundColor: '#0f172a', padding: 4, borderRadius: 12 },
    stratBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    stratText: { color: '#94a3b8', fontWeight: '600', fontSize: 13 },

    timelineContainer: { paddingHorizontal: 0 },
    timelineLine: { position: 'absolute', left: 15, top: 40, bottom: -20, width: 2, backgroundColor: '#334155', zIndex: -1 },
    stationCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    seqBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    seqText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    powerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    powerText: { fontSize: 12, fontWeight: 'bold' },
    stationName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    addressText: { color: '#94a3b8', fontSize: 12, marginBottom: 10 },
    
    amenityContainer: { flexDirection: 'row', marginTop: 5, marginBottom: 10 },
    amenityChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 6, borderWidth: 1, gap: 4 },
    amenityText: { fontSize: 10, fontWeight: '600' },

    miniBattery: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, justifyContent: 'center', alignItems: 'center' },
    miniSoc: { fontSize: 12, fontWeight: 'bold' },
    chargeArrowContainer: { alignItems: 'center', marginTop: 2 },

    infoGrid: { flexDirection: 'row', gap: 15, marginBottom: 15, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#334155' },
    infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { color: '#cbd5e1', fontSize: 13 },

    actionRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#334155', paddingVertical: 10, borderRadius: 8, gap: 6, minWidth: '30%' },
    verifyBtn: { backgroundColor: '#fbbf24' }, 
    swapBtn: { backgroundColor: '#F59E0B' }, // Orange for Swap
    btnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
    
    modalContent: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20 },
    
    swapModalContent: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, maxHeight: '80%', width: '100%' },
    swapItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
    swapIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    swapName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    swapMeta: { color: '#94a3b8', fontSize: 12 },
    swapDist: { color: '#F59E0B', fontSize: 11, marginTop: 2, fontStyle: 'italic' },
    swapSelectBtn: { backgroundColor: '#3b82f6', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
    swapSelectText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

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