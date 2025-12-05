import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const PremiumBadge = ({ text, type = 'default' }) => {
  // Determine color based on type
  let bg = colors.surfaceHighlight;
  let fg = colors.textSecondary;

  if (type === 'success' || text === 'Available') {
    bg = 'rgba(16, 185, 129, 0.15)'; // Low opacity green
    fg = colors.success;
  } else if (type === 'warning' || text === 'Busy' || text === 'In Use') {
    bg = 'rgba(245, 158, 11, 0.15)'; // Low opacity orange
    fg = colors.warning;
  } else if (type === 'premium') {
    bg = 'rgba(0, 208, 156, 0.15)'; // Low opacity primary
    fg = colors.primary;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginRight: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default PremiumBadge;