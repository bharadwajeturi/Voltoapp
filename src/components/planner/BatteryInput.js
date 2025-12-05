import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const BatteryInput = ({ value, onChange, label }) => {
  // Helpers to increment/decrement safely
  const increase = () => onChange(Math.min(100, value + 5));
  const decrease = () => onChange(Math.max(0, value - 5));

  // Determine bar color based on level
  const getBarColor = () => {
    if (value < 20) return colors.danger;
    if (value < 50) return colors.warning;
    return colors.success;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label || "Current Battery"}</Text>
        <Text style={styles.valueText}>{value}%</Text>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.btn} onPress={decrease}>
          <Text style={styles.btnText}>-</Text>
        </TouchableOpacity>

        <View style={styles.barContainer}>
          <View 
            style={[
              styles.barFill, 
              { width: `${value}%`, backgroundColor: getBarColor() }
            ]} 
          />
        </View>

        <TouchableOpacity style={styles.btn} onPress={increase}>
          <Text style={styles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  valueText: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btn: {
    width: 40,
    height: 40,
    backgroundColor: colors.surface,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: { fontSize: 24, color: colors.textPrimary, lineHeight: 28 },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: colors.surface,
    borderRadius: 6,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
});

export default BatteryInput;