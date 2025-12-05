import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';
import  TripContext  from '../context/TripContext';
import { colors } from '../theme/colors';
import PrimaryButton from '../components/common/PrimaryButton';
import StationCard from '../components/common/StationCard'; 
import RouteInfoCard from '../components/map/RouteInfoCard';

const MOCK_STATIONS = [
  { id: 's1', name: 'Tata Power Charging', address: 'ORR Exit 12', type: '50kW CCS2', status: 'Available' },
  { id: 's2', name: 'Zeon Charging Hub', address: 'Highway Food Court', type: '60kW CCS2', status: 'Busy' },
];

const RouteExplorerScreen = ({ navigation }) => {
  const { tripDetails } = useContext(TripContext);
  const [routeSearch, setRouteSearch] = useState('');
  
  const startName = tripDetails.startLocation?.description?.split(',')[0] || 'Start';
  const endName = tripDetails.endLocation?.description?.split(',')[0] || 'End';

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={{ fontSize: 40 }}>🗺️</Text>
          <Text style={styles.mapText}>Google Map Rendering...</Text>
          <Text style={styles.routeText}>{startName} ➔ {endName}</Text>
          <View style={styles.polyline} />
        </View>

        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('SmartPlanner')}>
            <Text style={styles.backBtnText}>✏️ Edit Plan</Text>
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search along route..."
              placeholderTextColor={colors.textSecondary}
              value={routeSearch}
              onChangeText={setRouteSearch}
            />
          </View>
        </View>

        <RouteInfoCard batteryEstimate={12} distance={150} />
      </View>

      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.headerTitle}>Charging Stops</Text>
          <Text style={styles.headerSub}>{MOCK_STATIONS.length} stations on route</Text>
        </View>

        <FlatList
          data={MOCK_STATIONS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <StationCard item={item} onAction={() => {}} actionLabel="+" />
          )}
        />

        <View style={styles.footer}>
          <PrimaryButton 
            title="Start Navigation" 
            icon="🧭"
            onPress={() => Alert.alert('Launching Google Maps...')}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapContainer: { flex: 0.6, backgroundColor: '#E2E8F0', position: 'relative' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapText: { fontSize: 18, fontWeight: 'bold', color: colors.background, marginTop: 10 },
  routeText: { fontSize: 14, color: colors.surfaceHighlight, marginTop: 4 },
  polyline: { width: 200, height: 100, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#3B82F6', borderRadius: 50, position: 'absolute', top: '40%' },
  
  headerOverlay: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginRight: 12, elevation: 4 },
  backBtnText: { fontWeight: 'bold', color: colors.textPrimary },
  searchBox: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 42, justifyContent: 'center', elevation: 4 },
  searchInput: { color: colors.textPrimary, fontSize: 14 },

  listContainer: { flex: 0.4, backgroundColor: colors.background },
  listHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: colors.textSecondary, fontSize: 14 },
  footer: { padding: 16, paddingTop: 8 }
});

export default RouteExplorerScreen;