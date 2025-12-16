import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 🟢 Helper to get color based on score
const getScoreColor = (score) => {
  if (score >= 80) return '#2ECC71'; // Green
  if (score >= 50) return '#F1C40F'; // Yellow
  return '#E74C3C'; // Red
};

export default function ClusterCard({ area, onPress }) {
  // 🟢 Guard Clause: Prevent crash if area is undefined
  if (!area) return null;

  const { name, greenScore, stations = [], previewStations = [] } = area;
  const count = stations.length;

  return (
    <TouchableOpacity 
      style={[styles.card, { borderColor: getScoreColor(greenScore) }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
            <Text style={styles.title} numberOfLines={1}>{name}</Text>
            <Text style={styles.subtitle}>{count} Chargers nearby</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(greenScore) }]}>
            <Text style={styles.scoreText}>{greenScore}</Text>
        </View>
      </View>

      {/* Preview List (Top 2 Stations) */}
      <View style={styles.previewList}>
        {previewStations.map((station, index) => (
            <View key={station.id || index} style={styles.stationRow}>
                <Ionicons name="flash" size={14} color="#cbd5e1" />
                <Text style={styles.stationName} numberOfLines={1}>
                    {station.name}
                </Text>
                <Text style={styles.powerText}>
                    {station.powerkw > 0 ? `${station.powerkw}kW` : 'Slow'}
                </Text>
            </View>
        ))}
        {count > 2 && (
            <Text style={styles.moreText}>+ {count - 2} more options</Text>
        )}
      </View>

      {/* Action Hint */}
      <View style={styles.footer}>
         <Text style={styles.tapText}>Tap to view all</Text>
         <Ionicons name="chevron-forward" size={16} color="#64748b" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    // Shadow for depth
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff', width: '80%' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  scoreBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  scoreText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  
  previewList: { backgroundColor: '#0f172a', borderRadius: 8, padding: 10 },
  stationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  stationName: { color: '#e2e8f0', fontSize: 14, marginLeft: 6, flex: 1 },
  powerText: { color: '#2ECC71', fontSize: 12, fontWeight: 'bold' },
  moreText: { color: '#64748b', fontSize: 12, marginTop: 4, fontStyle: 'italic' },

  footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10 },
  tapText: { color: '#64748b', fontSize: 12, marginRight: 4 }
});