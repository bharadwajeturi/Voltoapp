import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
// If you are using a theme context, keep it. Otherwise, defaults to dark.
// import { useTheme } from '../../theme/ThemeContext'; 

export default function StationCard({ station, onPress }) {
  // const { theme } = useTheme(); // Uncomment if using theme
  
  // 🟢 Fallback Data Handling
  const name = station.name || "EV Station";
  const power = station.powerkw || 0;
  const connector = station.connectorTypes?.[0] || "CCS2";
  const score = station.trustscore || 0;

  // Score Color Logic
  const scoreColor = score >= 80 ? '#2ECC71' : score >= 50 ? '#F1C40F' : '#E74C3C';

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={styles.card}
    >
      {/* Icon Box */}
      <View style={styles.iconContainer}>
        <Ionicons name="flash" size={24} color="#2ECC71" />
      </View>
      
      {/* Info Section */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        
        <View style={styles.detailsRow}>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{connector}</Text>
            </View>
            <Text style={styles.powerText}>• {power} kW</Text>
        </View>
      </View>
      
      {/* Score Badge */}
      <View style={[styles.scoreBadge, { borderColor: scoreColor }]}>
        <Text style={[styles.scoreText, { color: scoreColor }]}>{score}</Text>
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
    marginBottom: 10,
    backgroundColor: '#1e293b', // Dark Theme Surface
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 3,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  iconContainer: {
    width: 44, height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(46, 204, 113, 0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  
  detailsRow: { flexDirection: 'row', alignItems: 'center' },
  badge: { backgroundColor: '#0f172a', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 6 },
  badgeText: { color: '#cbd5e1', fontSize: 10, fontWeight: 'bold' },
  powerText: { color: '#94a3b8', fontSize: 12 },

  scoreBadge: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
    marginLeft: 10
  },
  scoreText: { fontSize: 10, fontWeight: 'bold' }
});