import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getScoreColor = (score) => {
  if (score >= 80) return '#2ECC71'; 
  if (score >= 50) return '#F1C40F'; 
  return '#E74C3C'; 
};

export default function ClusterCard({ area, onPress }) {
  if (!area) return null;

  const { name, greenScore, stations = [], previewStations = [] } = area;
  const count = stations.length;

  return (
    <TouchableOpacity 
      style={[styles.card, { borderColor: getScoreColor(greenScore) }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{flex:1}}>
            <Text style={styles.title} numberOfLines={1}>{name}</Text>
            <Text style={styles.subtitle}>{count} Chargers nearby</Text>
        </View>
        <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(greenScore) }]}>
            <Text style={styles.scoreText}>{greenScore}</Text>
        </View>
      </View>

      {/* Preview List (Top 2 Stations) */}
      <View style={styles.previewContainer}>
          {previewStations.map((s, i) => (
              <View key={i} style={styles.stationRow}>
                  <Ionicons name="flash" size={12} color="#94a3b8" />
                  <Text style={styles.stationName} numberOfLines={1}>{s.name}</Text>
                  <Text style={styles.stationPower}>{s.powerkw}kW</Text>
              </View>
          ))}
          
          {count > 2 && (
              <View style={styles.moreRow}>
                  <Text style={styles.moreText}>+{count - 2} more options</Text>
              </View>
          )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
         <Text style={styles.tapText}>Tap to view full cluster</Text>
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
    borderWidth: 1, // Color set dynamically
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  
  scoreBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  scoreText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
  
  previewContainer: { backgroundColor: '#0f172a', borderRadius: 10, padding: 10, marginBottom: 10 },
  stationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  stationName: { color: '#cbd5e1', fontSize: 12, marginLeft: 6, flex: 1 },
  stationPower: { color: '#2ECC71', fontSize: 12, fontWeight: 'bold' },
  
  moreRow: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 6, marginTop: 2 },
  moreText: { color: '#64748b', fontSize: 10, fontStyle: 'italic', textAlign: 'center' },

  footer: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  tapText: { color: '#64748b', fontSize: 12, marginRight: 4 }
});