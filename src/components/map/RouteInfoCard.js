import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const RouteInfoCard = ({ batteryEstimate, distance }) => {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.icon}>⚡</Text>
        <View>
          <Text style={styles.label}>Est. Arrival Battery</Text>
          <Text style={styles.value}>{batteryEstimate}% ⚠️</Text>
        </View>
      </View>
      
      {distance && (
        <View style={styles.row}>
          <View style={styles.divider} />
          <View>
            <Text style={styles.label}>Distance</Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>{distance} km</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 10,
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.warning,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: 15,
  }
});

export default RouteInfoCard;