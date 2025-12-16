import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTripStore } from '../store/useTripStore';
import { planTrip } from '../services/api';

const { width } = Dimensions.get('window');

export default function LoadingScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const setTripData = useTripStore((state) => state.setTripData);
  
  // Payload passed from SmartPlanner
  const { payload, startName, endName } = route.params; 

  // Animation Values
  const carProgress = useSharedValue(0);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // 1. Start Animation Loop (Car moves from 10% to 90%)
    carProgress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1, // Infinite repeat
      false
    );
    
    // Pulse Effect for Text
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.ease }), 
      -1, 
      true
    );

    // 2. Trigger Backend API
    const fetchRoute = async () => {
        try {
            // Artificial delay (optional) to let animation play at least once if API is too fast
            const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
            
            const [result] = await Promise.all([
                planTrip(payload),
                minDelay
            ]);
            
            setTripData(result, payload);
            
            // Success: Navigate to Map
            navigation.replace('MainApp'); 

        } catch (error) {
            console.error(error);
            alert("Planning failed: " + error.message);
            navigation.goBack(); // Return to planner on fail
        }
    };

    fetchRoute();
  }, []);

  // Animated Styles
  const carStyle = useAnimatedStyle(() => {
    // Interpolate 0-1 to X position (Start to End of line)
    const translateX = -50 + (carProgress.value * (width - 100)); 
    return {
        transform: [{ translateX }]
    };
  });
  
  const textStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={styles.container}>
      
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.cityText}>{startName}</Text>
        <Ionicons name="arrow-forward" size={20} color="#64748b" />
        <Text style={styles.cityText}>{endName}</Text>
      </View>

      {/* Animation Area */}
      <View style={styles.animationBox}>
        {/* The Road Line */}
        <Svg height="100" width={width} style={styles.svg}>
            {/* Dashed Line */}
            <Line 
                x1="40" y1="50" 
                x2={width - 40} y2="50" 
                stroke="#334155" 
                strokeWidth="4" 
                strokeDasharray="10, 10"
            />
            {/* Start Dot */}
            <Circle cx="40" cy="50" r="8" fill="#2ECC71" />
            {/* End Dot */}
            <Circle cx={width - 40} cy="50" r="8" fill="#E74C3C" />
        </Svg>

        {/* The Moving Car */}
        <Animated.View style={[styles.carContainer, carStyle]}>
             <Ionicons name="car-sport" size={40} color="#00F0FF" />
        </Animated.View>
      </View>

      {/* Loading Status */}
      <Animated.Text style={[styles.statusText, textStyle]}>
        Calculating optimal route...
      </Animated.Text>
      
      <Text style={styles.subText}>Checking battery physics & charger availability</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 60, gap: 15 },
  cityText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },

  animationBox: { width: width, height: 100, justifyContent: 'center' },
  svg: { position: 'absolute', top: 0 },
  
  carContainer: { 
      position: 'absolute', 
      left: 40, // Starting offset
      top: 30,  // Center vertically relative to line
      shadowColor: "#00F0FF", shadowOpacity: 0.8, shadowRadius: 10, elevation: 10 
  },

  statusText: { color: '#2ECC71', fontSize: 18, fontWeight: 'bold', marginTop: 40 },
  subText: { color: '#64748b', fontSize: 12, marginTop: 10 }
});