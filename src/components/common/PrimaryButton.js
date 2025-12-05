import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const PrimaryButton = ({ title, onPress, disabled, icon }) => (
  <TouchableOpacity
    style={[
      styles.primaryBtn,
      disabled && styles.primaryBtnDisabled
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[styles.primaryBtnText, disabled && styles.primaryBtnTextDisabled]}>
      {title}
    </Text>
    {/* Render icon if passed as a string/emoji */}
    {icon && <Text style={styles.icon}>{icon}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.surfaceHighlight,
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryBtnText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryBtnTextDisabled: {
    color: colors.textSecondary,
  },
  icon: {
    marginLeft: 8,
    fontSize: 18,
    color: colors.textInverse, 
  }
});

export default PrimaryButton;