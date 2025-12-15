import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import GreenScoreBadge from './GreenScoreBadge';

export default function ClusterCard({ item, onAdd }) {
  const { theme } = useTheme();
  const bestStation = item.previewStations?.[0] || {};

  return (
    <View style={[styles.card, theme.cardStyle, { backgroundColor: theme.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>{item.areaName}</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {item.distanceFromStartKm} km • {item.totalStationsInArea} chargers
          </Text>
        </View>
        <GreenScoreBadge score={bestStation.greenScore} />
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* Best Pick Row */}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.stationName, { color: theme.text }]} numberOfLines={1}>
            🏆 {bestStation.name || 'Unknown Station'}
          </Text>
          <Text style={[styles.details, { color: theme.textSecondary }]}>
            {bestStation.powerkw} kW • {bestStation.operator}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
          onPress={() => onAdd(bestStation)}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 16, fontWeight: 'bold' },
  subtitle: { fontSize: 12, marginTop: 4 },
  divider: { height: 1, marginVertical: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  stationName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  details: { fontSize: 12 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowOpacity: 0.2, shadowOffset: { width: 0, height: 2 }, elevation: 3
  }
});