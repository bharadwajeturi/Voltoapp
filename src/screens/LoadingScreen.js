import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTripStore } from '../store/useTripStore';

const { width } = Dimensions.get('window');

// Random facts for entertainment
const FACTS = [
    "EVs convert over 77% of the electrical energy from the grid to power at the wheels.",
    "The first crude electric vehicle was developed around 1832.",
    "Regenerative braking can extend your EV's range by capturing energy.",
    "Charging at night is often cheaper and puts less strain on the grid.",
    "There are now more EV charging stations in some regions than gas stations."
];

export default function LoadingScreen({ navigation, route }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    
    // 🟢 FIX: Use 'fetchTripPlan' instead of 'planTrip' to match SmartPlanner
    const fetchTripPlan = useTripStore(state => state.fetchTripPlan);

    // Params passed from SmartPlanner
    const { targetScreen, serviceType, payload } = route.params || {};

    useEffect(() => {
        // Animation Start
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            })
        ]).start();

        // 🟢 ASYNC TASK HANDLER
        const performTask = async () => {
            if (serviceType === 'TRIP_PLANNING' && payload) {
                try {
                    console.log("[Loading] Starting Trip Plan with Payload:", JSON.stringify(payload));

                    // 🟢 CRITICAL FIX: Pass the ENTIRE payload object.
                    // Previous code passed separate args (start, end...) which dropped vehicle specs!
                    const result = await fetchTripPlan(payload);

                    if (result) {
                        // Success -> Go to Results (TripDashboard)
                        navigation.replace(targetScreen || 'TripDashboard');
                    } else {
                        throw new Error("No route found");
                    }
                } catch (error) {
                    console.error("[Loading] Plan Failed:", error);
                    Alert.alert("Planning Failed", "We couldn't calculate a route. Please check your locations and try again.");
                    navigation.goBack();
                }
            } else {
                // Fallback for demo purposes
                setTimeout(() => {
                    navigation.replace(targetScreen || 'TripDashboard');
                }, 3000);
            }
        };

        // Delay slightly to let animation render, then fetch
        const timer = setTimeout(performTask, 500);

        return () => clearTimeout(timer);
    }, []);

    const randomFact = FACTS[Math.floor(Math.random() * FACTS.length)];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={styles.background}
            />
            
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                
                {/* Spinner Circle */}
                <View style={styles.loaderBox}>
                    <ActivityIndicator size="large" color="#2ECC71" />
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons name="map-marker-path" size={40} color="#2ECC71" />
                    </View>
                </View>

                <Text style={styles.title}>Planning your Adventure...</Text>
                <Text style={styles.subtitle}>Analyzing routes, traffic, and charger availability.</Text>

                {/* Did You Know Box */}
                <View style={styles.factCard}>
                    <View style={styles.factHeader}>
                        <MaterialCommunityIcons name="lightbulb-on" size={20} color="#F59E0B" />
                        <Text style={styles.factTitle}>Did You Know?</Text>
                    </View>
                    <Text style={styles.factText}>{randomFact}</Text>
                </View>

            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    background: { ...StyleSheet.absoluteFillObject },
    content: { width: '85%', alignItems: 'center' },
    
    loaderBox: { 
        width: 100, height: 100, borderRadius: 50, 
        backgroundColor: 'rgba(46, 204, 113, 0.1)', 
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 30, borderWidth: 1, borderColor: 'rgba(46, 204, 113, 0.3)'
    },
    iconContainer: { position: 'absolute' },

    title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 40, lineHeight: 22 },

    factCard: { 
        backgroundColor: 'rgba(30, 41, 59, 0.6)', 
        padding: 20, borderRadius: 16, 
        borderWidth: 1, borderColor: '#334155',
        width: '100%'
    },
    factHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    factTitle: { color: '#F59E0B', fontWeight: 'bold', fontSize: 14 },
    factText: { color: '#cbd5e1', fontSize: 13, lineHeight: 20, fontStyle: 'italic' }
});