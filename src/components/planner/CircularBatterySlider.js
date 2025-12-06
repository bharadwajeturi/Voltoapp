import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { colors } from '../../theme/colors';

const CircularBatterySlider = ({ value, onChange }) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [sliderX, setSliderX] = useState(0); // Track X position on screen
  
  const percentage = Math.min(100, Math.max(0, value));

  const handlePan = (gestureState) => {
    if (sliderWidth === 0) return;
    
    // We can't easily get the absolute X position of the slider without onLayout measurement relative to screen or using measureInWindow.
    // For a simple robust slider without re-renders, we'll use the delta approach or just assume margins.
    
    // BETTER APPROACH: Use the moveX (absolute touch) minus the estimated left margin/padding of the screen.
    // In SmartPlanner, padding is 24. So slider starts around x=24.
    const sliderStartX = 24; 
    
    const relativeX = gestureState.moveX - sliderStartX;
    const boundedX = Math.min(Math.max(0, relativeX), sliderWidth);
    
    const newPercent = Math.round((boundedX / sliderWidth) * 100);
    onChange(newPercent);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true, // Capture touch to prevent ScrollView from stealing it
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      
      onPanResponderGrant: (evt, gestureState) => {
        // Handle tap/initial touch
        handlePan({ moveX: evt.nativeEvent.pageX }); 
      },
      onPanResponderMove: (evt, gestureState) => handlePan(gestureState),
      onPanResponderRelease: (evt, gestureState) => handlePan(gestureState),
    })
  ).current;

  // Determine color based on level
  const getBarColor = () => {
    if (percentage < 20) return colors.danger;
    if (percentage < 50) return colors.warning;
    return colors.success;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Starting Battery</Text>
        <Text style={[styles.value, { color: getBarColor() }]}>{percentage}%</Text>
      </View>
      
      <View 
        style={styles.track} 
        onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Filled Bar */}
        <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: getBarColor() }]} />
        
        {/* Draggable Knob - Increased hit slop visually (transparent border or just visual knob) */}
        <View style={[styles.knob, { left: `${percentage}%`, marginLeft: -12 }]} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.subLabel}>0%</Text>
        <Text style={styles.subLabel}>50%</Text>
        <Text style={styles.subLabel}>100%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
  label: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 },
  value: { fontSize: 18, fontWeight: 'bold' },
  track: { 
    height: 12, // Slightly taller for easier touch
    backgroundColor: colors.surfaceHighlight, 
    borderRadius: 6, 
    position: 'relative', 
    justifyContent: 'center',
    marginVertical: 10 // Space for knob to not get clipped
  },
  fill: { height: '100%', borderRadius: 6 },
  knob: { 
    position: 'absolute', 
    width: 28, // Bigger knob
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#FFF', 
    borderWidth: 2, 
    borderColor: colors.surfaceHighlight,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    zIndex: 10
  },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  subLabel: { color: colors.textSecondary, fontSize: 12 }
});

export default CircularBatterySlider;