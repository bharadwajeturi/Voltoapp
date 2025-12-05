import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const CircularBatterySlider = ({ value, onChange }) => {
  const levels = [20, 40, 60, 80, 100];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Battery Level</Text>
      <View style={styles.row}>
        {levels.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.segment,
              value >= level && styles.activeSegment,
              value === level && styles.currentSegment
            ]}
            onPress={() => onChange(level)}
          >
            <Text style={[styles.text, value >= level && styles.activeText]}>{level}%</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  label: { color: colors.textSecondary, fontWeight: 'bold', marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface, padding: 4, borderRadius: 12 },
  segment: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 8 },
  activeSegment: { backgroundColor: 'rgba(0, 208, 156, 0.2)' },
  currentSegment: { backgroundColor: colors.primary },
  text: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 12 },
  activeText: { color: '#FFF' }
});

export default CircularBatterySlider;