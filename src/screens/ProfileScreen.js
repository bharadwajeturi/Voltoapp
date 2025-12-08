import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

const PAST_TRIPS = [
  { id: 1, date: 'Oct 12', route: 'Hyd -> Warangal', dist: '148 km', eff: '132 Wh/km' },
  { id: 2, date: 'Sep 28', route: 'Hyd -> Vijayawada', dist: '280 km', eff: '128 Wh/km' },
];

const ProfileScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>JD</Text>
        </View>
        <Text style={styles.name}>John Doe</Text>
        <View style={styles.tag}><Text style={styles.tagText}>VoltPath Pro</Text></View>
      </View>

      {/* Vehicle Card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Vehicle</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={{ fontSize: 32 }}>🚙</Text>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.cardTitle}>Tata Nexon EV Max</Text>
              <Text style={styles.cardSub}>TS 09 FH 8822</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>Efficiency</Text>
            <Text style={styles.statValue}>130 Wh/km</Text>
          </View>
        </View>
      </View>

      {/* Trip History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Past Trips</Text>
        {PAST_TRIPS.map(trip => (
          <View key={trip.id} style={styles.tripItem}>
            <View>
              <Text style={styles.tripRoute}>{trip.route}</Text>
              <Text style={styles.tripDate}>{trip.date}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.tripDist}>{trip.dist}</Text>
              <Text style={styles.tripEff}>{trip.eff}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', padding: 40, backgroundColor: colors.surface },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  name: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  tag: { backgroundColor: 'rgba(255, 255, 255, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 },
  tagText: { color: colors.textSecondary, fontSize: 12, fontWeight: 'bold' },
  
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  cardSub: { fontSize: 14, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { color: colors.textSecondary },
  statValue: { color: colors.primary, fontWeight: 'bold' },
  
  tripItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  tripRoute: { color: colors.textPrimary, fontWeight: 'bold', fontSize: 16 },
  tripDate: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  tripDist: { color: colors.primary, fontWeight: 'bold' },
  tripEff: { color: colors.textSecondary, fontSize: 12 }
});

export default ProfileScreen;