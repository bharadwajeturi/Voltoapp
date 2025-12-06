import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Inline colors to ensure this component is self-contained and avoids import errors
// In your main app, you can switch this back to: import { colors } from '../../theme/colors';
const colors = {
  primary: '#00D09C',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  surface: '#1E293B',
  surfaceHighlight: '#334155',
  border: '#334155',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
};

const TripStopCard = ({ stop, isLast }) => {
  // Determine color based on battery level
  const getBatteryColor = (level) => {
    if (level > 50) return colors.success;
    if (level > 20) return colors.warning;
    return colors.danger;
  };

  return (
    <View style={styles.container}>
      {/* Left Column: Battery Indicator */}
      <View style={styles.batteryCol}>
        <View style={styles.lineTop} />
        <View style={[styles.batteryBadge, { borderColor: getBatteryColor(stop.arrivalBattery) }]}>
          <Text style={[styles.batteryText, { color: getBatteryColor(stop.arrivalBattery) }]}>
            {stop.arrivalBattery}%
          </Text>
        </View>
        {/* Draw line only if it's not the last stop */}
        {!isLast && <View style={styles.lineBottom} />}
      </View>

      {/* Right Column: Station Details */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.stationName}>{stop.name}</Text>
            <Text style={styles.address}>{stop.address}</Text>
          </View>
          {/* Amenity Icons */}
          <View style={styles.amenityRow}>
            {stop.amenities?.includes('food') && <Text style={styles.icon}>🍔</Text>}
            {stop.amenities?.includes('coffee') && <Text style={styles.icon}>☕</Text>}
            {stop.amenities?.includes('restroom') && <Text style={styles.icon}>🚻</Text>}
          </View>
        </View>

        <View style={styles.infoRow}>
            <View style={styles.tag}>
                <Text style={styles.tagText}>⚡ {stop.type}</Text>
            </View>
            <View style={styles.tag}>
                <Text style={styles.tagText}>🕒 {stop.chargeTime} min stop</Text>
            </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    minHeight: 100,
  },
  batteryCol: {
    alignItems: 'center',
    width: 50,
    marginRight: 12,
  },
  lineTop: {
    width: 2,
    height: 15,
    backgroundColor: colors.border,
  },
  lineBottom: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
  },
  batteryBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    zIndex: 10,
  },
  batteryText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  amenityRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 4,
    borderRadius: 8,
  },
  icon: {
    fontSize: 14,
    marginLeft: 4,
  },
  infoRow: {
      flexDirection: 'row',
  },
  tag: {
      backgroundColor: colors.surfaceHighlight,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      marginRight: 8,
  },
  tagText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '600'
  }
});

export default TripStopCard;