import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import PremiumBadge from './PremiumBadge';

const StationCard = ({ item, onAction, actionLabel = '+', showAmenities = true }) => {
  return (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <View style={styles.infoContainer}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.address}>{item.address || item.distance + ' away'}</Text>
          
          <View style={styles.badgeRow}>
            {/* Show Status Badge */}
            <PremiumBadge text={item.status} />
            
            {/* Show Power Badge (if exists) */}
            {item.power && (
              <PremiumBadge text={item.power} type="premium" />
            )}
          </View>
        </View>

        {/* Action Button (Add to Route OR Navigate) */}
        <TouchableOpacity 
          style={[styles.actionBtn, actionLabel === 'Go' && styles.goBtn]} 
          onPress={() => onAction(item)}
        >
          <Text style={[styles.actionText, actionLabel === 'Go' && styles.goText]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amenities Tags (Optional) */}
      {showAmenities && item.amenities && (
        <View style={styles.amenityRow}>
          {item.amenities.map((a, index) => (
            <Text key={index} style={styles.amenityText}>• {a}</Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityRow: {
    flexDirection: 'row',
    marginTop: 10,
    flexWrap: 'wrap',
  },
  amenityText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
    fontStyle: 'italic',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBtn: {
    width: 'auto',
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  goText: {
    fontSize: 14,
  }
});

export default StationCard;