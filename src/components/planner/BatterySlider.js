// Components/BatterySlider.js
// Battery slider component with hooks

import React from 'react';
import { View, Text } from 'react-native';
import { useTrip } from '../../Hooks/useTrip'
import { formatBattery } from '../../utils/formatters';  // ✅ Correct case
import { logInfo } from '../../utils/logger';  // ✅ Correct case
import Slider from '@react-native-community/slider';


const BatterySlider = () => {
  const { trip, validateAndSetBattery } = useTrip();

  const handleBatteryChange = (value) => {
    validateAndSetBattery(Math.round(value));
    logInfo(`Battery slider moved to ${Math.round(value)}%`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>🔋 Battery Level</Text>
        <Text style={styles.value}>{formatBattery(trip.currentBattery)}</Text>
      </View>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={trip.currentBattery}
        onValueChange={handleBatteryChange}
        minimumTrackTintColor="#28a745"
        maximumTrackTintColor="#e0e0e0"
        thumbTintColor="#0066cc"
      />

      <View style={styles.footer}>
        <Text style={styles.minLabel}>0%</Text>
        <Text style={styles.maxLabel}>100%</Text>
      </View>
    </View>
  );
};

const styles = {
  container: { paddingVertical: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  label: { fontSize: 14, fontWeight: '600', color: '#000' },
  value: { fontSize: 16, fontWeight: 'bold', color: '#0066cc' },
  slider: { height: 40 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8
  },
  minLabel: { fontSize: 12, color: '#666' },
  maxLabel: { fontSize: 12, color: '#666' }
};

export default BatterySlider;  // ✅ Correct export name
