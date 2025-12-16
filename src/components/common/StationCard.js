import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export default function StationCard({ station, onPress }) {
  const { theme } = useTheme();

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={[styles.card, { backgroundColor: theme.surface, shadowColor: theme.shadow }]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name="flash" size={24} color={theme.primary} />
      </View>
      
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {station.name || "EV Station"}
        </Text>
        <Text style={[styles.details, { color: theme.textSecondary }]}>
          {station.type || "Type 2"} • Available
        </Text>
      </View>
      
      <View style={[styles.actionBtn, { backgroundColor: theme.border }]}>
        <Ionicons name="navigate-outline" size={20} color={theme.text} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginRight: 16,
    width: 260,
    elevation: 3,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  details: { fontSize: 12 },
  actionBtn: { padding: 8, borderRadius: 12 },
});