import React, { useState, useRef, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, 
    KeyboardAvoidingView, Platform, ScrollView, Animated, Dimensions, StatusBar, Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import { useTripStore } from '../store/useTripStore';
import { searchPlaces, fetchPlaceDetails } from '../services/api'; 
import VehicleSelector from '../components/VehicleSelector'; 

const { width } = Dimensions.get('window');

// 🟢 Custom Component: Blinking Error Border
const ErrorWrapper = ({ hasError, children }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (hasError) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
                    Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: false })
                ])
            ).start();
        } else {
            fadeAnim.setValue(0); // Reset
        }
    }, [hasError]);

    const borderColor = fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(239, 68, 68, 0)', 'rgba(239, 68, 68, 1)'] // Transparent to Red
    });

    return (
        <Animated.View style={[styles.errorBox, hasError && { borderColor, borderWidth: 1.5 }]}>
            {children}
        </Animated.View>
    );
};

export default function SmartPlannerScreen() {
    const navigation = useNavigation();
    const setUserProfile = useTripStore((state) => state.setUserProfile);
    const fetchTripPlan = useTripStore((state) => state.fetchTripPlan);

    // --- Locations State ---
    const [start, setStart] = useState(null); 
    const [end, setEnd] = useState(null);
    // Waypoints now track specific charging capability
    const [waypoints, setWaypoints] = useState([]); 

    const [queryStart, setQueryStart] = useState('');
    const [queryEnd, setQueryEnd] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [activeField, setActiveField] = useState(null); 

    // 🟢 Requirement 5: Destination Toggle (Specific to End location)
    const [destChargingAvailable, setDestChargingAvailable] = useState(false);

    // --- Vehicle State ---
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    // --- Physics Inputs ---
    const [batteryKwh, setBatteryKwh] = useState('40');
    const [realRange, setRealRange] = useState('300');
    const [maxChargeKw, setMaxChargeKw] = useState('30');
    
    // --- Sliders & Time ---
    const [currentSOC, setCurrentSOC] = useState(80);
    const [minBuffer, setMinBuffer] = useState(20); // 🟢 Default increased
    const [departureTime, setDepartureTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    // --- Validation State ---
    const [errors, setErrors] = useState({ start: false, end: false, vehicle: false });
    
    const scaleValue = useRef(new Animated.Value(1)).current;
    const [loading, setLoading] = useState(false);

    // --- Search Logic ---
    const handleSearch = async (text, field) => {
        if (field === 'start') setQueryStart(text);
        else if (field === 'end') setQueryEnd(text);
        else {
            const newWaypoints = [...waypoints];
            newWaypoints[field].query = text;
            setWaypoints(newWaypoints);
        }
        setActiveField(field);
        
        if (text.length > 2) {
            const results = await searchPlaces(text);
            setSuggestions(results || []);
        } else {
            setSuggestions([]);
        }
    };

    const selectLocation = async (item) => {
        try {
            const details = await fetchPlaceDetails(item.place_id);
            if (details) {
                const loc = { name: item.structured_formatting.main_text, lat: details.lat, lng: details.lng };
                if (activeField === 'start') {
                    setStart(loc);
                    setQueryStart(loc.name);
                    setErrors(prev => ({...prev, start: false}));
                } else if (activeField === 'end') {
                    setEnd(loc);
                    setQueryEnd(loc.name);
                    setErrors(prev => ({...prev, end: false}));
                } else {
                    const newWaypoints = [...waypoints];
                    newWaypoints[activeField] = { 
                        ...newWaypoints[activeField], 
                        location: loc, 
                        query: loc.name 
                    };
                    setWaypoints(newWaypoints);
                }
                setSuggestions([]);
                setActiveField(null);
            }
        } catch (e) { console.warn(e); }
    };

    const addStop = () => {
        if (waypoints.length < 3) {
            // 🟢 Requirement 5: Waypoints have individual charge toggles
            setWaypoints([...waypoints, { query: '', location: null, canCharge: true }]);
        } else alert("Max 3 stops allowed.");
    };

    const toggleWaypointCharge = (index) => {
        const newWaypoints = [...waypoints];
        newWaypoints[index].canCharge = !newWaypoints[index].canCharge;
        setWaypoints(newWaypoints);
    };

    const removeStop = (index) => {
        const newWaypoints = [...waypoints];
        newWaypoints.splice(index, 1);
        setWaypoints(newWaypoints);
    };

    // --- Vehicle Logic ---
    const handleVehicleSelect = (vehicle) => {
        setSelectedVehicle(vehicle);
        setBatteryKwh(vehicle.batteryKwh.toString());
        setRealRange(vehicle.realRange.toString());
        setMaxChargeKw(vehicle.maxChargeKw.toString());
        setErrors(prev => ({...prev, vehicle: false})); // Clear error
    };

    // --- Validation & Submit ---
    const handlePlanTrip = async () => {
        // 🟢 Requirement 1: Red Blinking Validation
        let newErrors = {
            start: !start,
            end: !end,
            vehicle: !selectedVehicle
        };

        if (newErrors.start || newErrors.end || newErrors.vehicle) {
            setErrors(newErrors);
            Alert.alert("Missing Details", "Please fill in the blinking red fields.");
            return;
        }

        // 🟢 Requirement 3: Range check
        if (parseFloat(realRange) <= 0) {
            Alert.alert("Invalid Range", "Real range cannot be zero.");
            return;
        }

        // Animation
        Animated.sequence([
            Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true })
        ]).start();

        // 🟢 1. Sync User Profile to Store (Context for AI)
        setUserProfile({
            id: 'User_' + Date.now(),
            name: 'Active Driver',
            vehicle: {
                make: selectedVehicle.make,
                model: selectedVehicle.model,
                battery: `${batteryKwh}kWh`,
                connector: 'CCS2' // could be dynamic later
            }
        });

        // 🟢 2. Prepare Payload
        const payload = {
            start, 
            end,
            // Only include waypoints that have a location selected
            waypoints: waypoints.filter(w => w.location).map(w => ({
                ...w.location,
                canCharge: w.canCharge // Pass charge preference
            })),
            batteryKwh: parseFloat(batteryKwh),
            realRange: parseFloat(realRange),
            maxChargeKw: parseFloat(maxChargeKw),
            currentSOC: currentSOC,
            minBufferSOC: minBuffer,
            departureTime: departureTime, // 🟢 Requirement 4: Time Input
            isDestinationChargerAvailable: destChargingAvailable,
            strategy: 'FAST'
        };

        // 🟢 3. Navigate to Loading Screen (Pass Payload)
        // 🟢 CRITICAL FIX: Target 'TripDashboard' because it exists in the Root Stack.
        navigation.navigate('Loading', {
            targetScreen: 'TripDashboard', // 🟢 Fixed Name
            serviceType: 'TRIP_PLANNING', 
            payload: payload              
        });
    };

    const navigateToHelp = () => {
        navigation.navigate('HelpHub');
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                
                {/* Header with Help Button */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.headerTitle}>Plan Your Journey</Text>
                        <Text style={styles.headerSub}>Smart EV Routing</Text>
                    </View>
                    <TouchableOpacity style={styles.helpButton} onPress={navigateToHelp}>
                        <MaterialCommunityIcons name="help-circle-outline" size={28} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* --- Route Section --- */}
                <View style={styles.card}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionLabel}>ROUTE</Text>
                        <TouchableOpacity onPress={addStop} style={styles.addStopBtn}>
                            <Ionicons name="add-circle" size={16} color="#2ECC71" />
                            <Text style={styles.addStopText}>Add Stop</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {/* Start Input with Error Wrapper */}
                    <ErrorWrapper hasError={errors.start}>
                        <View style={styles.inputContainer}>
                            <View style={[styles.iconBox, {backgroundColor: 'rgba(46, 204, 113, 0.15)'}]}>
                                <Ionicons name="navigate" size={18} color="#2ECC71" />
                            </View>
                            <TextInput 
                                style={styles.input} placeholder="Start Location" placeholderTextColor="#64748b"
                                value={queryStart} onChangeText={t => handleSearch(t, 'start')}
                            />
                            {start && <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />}
                        </View>
                    </ErrorWrapper>

                    <View style={styles.connectorLine} />

                    {/* Waypoints with Toggle */}
                    {waypoints.map((wp, index) => (
                        <View key={index} style={{marginBottom: 10}}>
                            <View style={styles.waypointRow}>
                                <View style={[styles.inputContainer, {flex: 1}]}>
                                    <View style={[styles.iconBox, {backgroundColor: 'rgba(241, 196, 15, 0.15)'}]}>
                                        <Ionicons name="flag" size={16} color="#F1C40F" />
                                    </View>
                                    <TextInput 
                                        style={styles.input} placeholder={`Stop #${index + 1}`} placeholderTextColor="#64748b"
                                        value={wp.query} onChangeText={t => handleSearch(t, index)}
                                    />
                                    <TouchableOpacity onPress={() => removeStop(index)}>
                                        <Ionicons name="close-circle" size={18} color="#64748b" />
                                    </TouchableOpacity>
                                </View>
                                
                                {/* 🟢 Requirement 5: Waypoint Toggle */}
                                <TouchableOpacity 
                                    style={[styles.miniToggle, wp.canCharge && styles.miniToggleActive]}
                                    onPress={() => toggleWaypointCharge(index)}
                                >
                                    <MaterialCommunityIcons name="lightning-bolt" size={16} color={wp.canCharge ? "#fff" : "#64748b"} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.connectorLine} />
                        </View>
                    ))}

                    {/* End Input with Toggle */}
                    <ErrorWrapper hasError={errors.end}>
                        <View style={styles.destinationRow}>
                            <View style={[styles.inputContainer, {flex: 1}]}>
                                <View style={[styles.iconBox, {backgroundColor: 'rgba(231, 76, 60, 0.15)'}]}>
                                    <Ionicons name="location" size={18} color="#E74C3C" />
                                </View>
                                <TextInput 
                                    style={styles.input} placeholder="Destination" placeholderTextColor="#64748b"
                                    value={queryEnd} onChangeText={t => handleSearch(t, 'end')}
                                />
                                {end && <Ionicons name="checkmark-circle" size={18} color="#2ECC71" />}
                            </View>

                            {/* 🟢 Requirement 5: Destination Toggle */}
                            <TouchableOpacity 
                                style={[styles.miniToggle, destChargingAvailable && styles.miniToggleActive]}
                                onPress={() => setDestChargingAvailable(!destChargingAvailable)}
                            >
                                <MaterialCommunityIcons name="lightning-bolt" size={20} color={destChargingAvailable ? "#fff" : "#64748b"} />
                            </TouchableOpacity>
                        </View>
                    </ErrorWrapper>
                    
                    {/* Helper text for toggle */}
                    <Text style={styles.toggleHelperText}>
                        Tap <MaterialCommunityIcons name="lightning-bolt" size={12} color="#64748b"/> if you can charge at this stop.
                    </Text>
                </View>

                {/* Suggestions List */}
                {suggestions.length > 0 && (
                    <View style={styles.suggestionsBox}>
                        {suggestions.map(s => (
                            <TouchableOpacity key={s.place_id} style={styles.suggestionItem} onPress={() => selectLocation(s)}>
                                <Ionicons name="location-outline" size={16} color="#94a3b8" />
                                <Text style={styles.suggestionText}>{s.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* --- Vehicle Section --- */}
                <Text style={styles.sectionHeader}>VEHICLE PROFILE</Text>
                
                <ErrorWrapper hasError={errors.vehicle}>
                    <VehicleSelector selectedVehicle={selectedVehicle} onSelect={handleVehicleSelect} />
                </ErrorWrapper>

                <View style={styles.specsRow}>
                    {/* 🟢 Requirement 2: Editability based on selection */}
                    <View style={[styles.specCard, !selectedVehicle && styles.disabledCard]}>
                        <Text style={styles.specLabel}>Battery</Text>
                        <View style={styles.specInputRow}>
                            <TextInput 
                                style={[styles.specInput, !selectedVehicle && {color: '#64748b'}]} 
                                value={batteryKwh} 
                                onChangeText={setBatteryKwh} 
                                keyboardType="numeric" maxLength={4} 
                                editable={!!selectedVehicle} // Locked if no vehicle
                            />
                            <Text style={styles.specUnit}>kWh</Text>
                        </View>
                    </View>
                    <View style={[styles.specCard, !selectedVehicle && styles.disabledCard]}>
                        <Text style={styles.specLabel}>Real Range</Text>
                        <View style={styles.specInputRow}>
                            <TextInput 
                                style={[styles.specInput, !selectedVehicle && {color: '#64748b'}]} 
                                value={realRange} 
                                onChangeText={setRealRange} 
                                keyboardType="numeric" maxLength={4} 
                                editable={!!selectedVehicle}
                            />
                            <Text style={styles.specUnit}>km</Text>
                        </View>
                    </View>
                    <View style={[styles.specCard, !selectedVehicle && styles.disabledCard]}>
                        <Text style={styles.specLabel}>Max Charge</Text>
                        <View style={styles.specInputRow}>
                            <TextInput 
                                style={[styles.specInput, !selectedVehicle && {color: '#64748b'}]} 
                                value={maxChargeKw} 
                                onChangeText={setMaxChargeKw} 
                                keyboardType="numeric" maxLength={4} 
                                editable={!!selectedVehicle}
                            />
                            <Text style={styles.specUnit}>kW</Text>
                        </View>
                    </View>
                </View>

                {/* --- Parameters Section --- */}
                <View style={styles.card}>
                    <Text style={styles.sectionLabel}>TRIP PARAMETERS</Text>
                    
                    {/* 🟢 Requirement 4: Departure Time */}
                    <View style={styles.timeRow}>
                        <Text style={styles.sliderTitle}>Departure Time</Text>
                        <TextInput 
                            style={styles.timeInput} 
                            value={departureTime} 
                            onChangeText={setDepartureTime}
                            placeholder="08:00 AM" 
                            placeholderTextColor="#64748b" 
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.sliderHeader}>
                        <Text style={styles.sliderTitle}>Starting Charge</Text>
                        <Text style={[styles.sliderVal, {color: '#2ECC71'}]}>{Math.round(currentSOC)}%</Text>
                    </View>
                    <Slider style={{width: '100%', height: 40}} minimumValue={10} maximumValue={100} step={5} value={currentSOC} onValueChange={setCurrentSOC} minimumTrackTintColor="#2ECC71" maximumTrackTintColor="#334155" thumbTintColor="#fff" />
                    
                    <View style={styles.divider} />

                    <View style={styles.sliderHeader}>
                        <Text style={styles.sliderTitle}>Min Arrival Buffer</Text>
                        <Text style={[styles.sliderVal, {color: '#F1C40F'}]}>{minBuffer}%</Text>
                    </View>
                    {/* 🟢 Requirement 3: Max buffer increased to 70% */}
                    <Slider style={{width: '100%', height: 40}} minimumValue={5} maximumValue={70} step={5} value={minBuffer} onValueChange={setMinBuffer} minimumTrackTintColor="#F1C40F" maximumTrackTintColor="#334155" thumbTintColor="#fff" />
                </View>

                {/* Submit Button (Always Enabled visually, validation happens on press) */}
                <Animated.View style={{ transform: [{ scale: scaleValue }], marginTop: 25, marginBottom: 50 }}>
                    <TouchableOpacity style={styles.mainBtn} onPress={handlePlanTrip} disabled={loading}>
                        {loading ? <ActivityIndicator color="#000" /> : (
                            <><Text style={styles.btnText}>START ADVENTURE</Text><Ionicons name="rocket-outline" size={24} color="#000" /></>
                        )}
                    </TouchableOpacity>
                </Animated.View>

            </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    scrollContent: { padding: 20 },
    
    // Header
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 25 },
    headerTitle: { fontSize: 32, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
    headerSub: { fontSize: 16, color: '#94a3b8', marginTop: 4 },
    helpButton: { backgroundColor: '#334155', padding: 8, borderRadius: 20 },

    card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#334155' },
    sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
    sectionLabel: { color: '#64748b', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
    addStopBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    addStopText: { color: '#2ECC71', fontSize: 12, fontWeight: 'bold' },
    
    // Inputs
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 12, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: '#334155' },
    iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    input: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '500' },
    connectorLine: { height: 15, borderLeftWidth: 1, borderLeftColor: '#334155', marginLeft: 24, marginVertical: 4 },
    
    // Waypoint & Dest Row
    waypointRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    destinationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    miniToggle: { width: 40, height: 50, borderRadius: 12, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
    miniToggleActive: { backgroundColor: '#2ECC71', borderColor: '#2ECC71' },
    toggleHelperText: { color: '#64748b', fontSize: 10, marginTop: 8, fontStyle: 'italic', textAlign: 'right' },

    // Suggestions
    suggestionsBox: { backgroundColor: '#1e293b', borderRadius: 12, marginTop: -15, marginBottom: 20, padding: 5, borderWidth: 1, borderColor: '#334155', elevation: 5, zIndex: 10 },
    suggestionItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
    suggestionText: { color: '#cbd5e1', fontSize: 14 },
    
    sectionHeader: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    
    // Specs
    specsRow: { flexDirection: 'row', gap: 12, marginBottom: 25 },
    specCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155' },
    disabledCard: { opacity: 0.5, backgroundColor: '#162032' },
    specLabel: { color: '#94a3b8', fontSize: 11, marginBottom: 6, fontWeight: '600' },
    specInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
    specInput: { color: '#fff', fontSize: 20, fontWeight: 'bold', padding: 0, minWidth: 30 },
    specUnit: { color: '#64748b', fontSize: 12, fontWeight: 'bold', marginBottom: 3 },
    
    // Sliders
    sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    sliderTitle: { color: '#cbd5e1', fontWeight: '600', fontSize: 14 },
    sliderVal: { fontSize: 16, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: '#334155', marginVertical: 15 },
    
    // Time
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    timeInput: { color: '#fff', fontSize: 16, fontWeight: 'bold', backgroundColor: '#0f172a', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155', minWidth: 100, textAlign: 'center' },

    // Button
    mainBtn: { backgroundColor: '#2ECC71', borderRadius: 16, height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12, shadowColor: '#2ECC71', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    btnText: { color: '#000', fontWeight: '900', fontSize: 18, letterSpacing: 1 },

    // Validation
    errorBox: { borderRadius: 12, marginBottom: 0 } // Wrapper style
});