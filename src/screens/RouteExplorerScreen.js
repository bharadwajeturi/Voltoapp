import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, TextInput } from 'react-native';

// --- MOCKS FOR PREVIEW ENVIRONMENT ---
// In your real app, replace these with actual imports:
// import { useTrip } from '../context/TripContext';
// import { colors } from '../theme/colors';
// import PrimaryButton from '../components/common/PrimaryButton';
// import RouteInfoCard from '../components/map/RouteInfoCard';
// import TripStopCard from '../components/planner/TripStopCard';

const colors = {
  primary: '#00D09C',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  surface: '#1E293B',
  surfaceHighlight: '#334155',
  border: '#334155',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  background: '#0F172A',
};

const useTrip = () => {
  // Mocking the context hook
  return {
    tripDetails: {
      startLocation: { description: 'Hyderabad' },
      endLocation: { description: 'Warangal' },
      plannedStops: [
         // You can test with data here if needed, default is empty
      ] 
    }
  };
};

const PrimaryButton = ({ title, icon, onPress }) => (
  <TouchableOpacity style={localStyles.primaryBtn} onPress={onPress}>
    <Text style={localStyles.primaryBtnText}>{title}</Text>
    {icon && <Text style={{ marginLeft: 8, fontSize: 18, color: '#000' }}>{icon}</Text>}
  </TouchableOpacity>
);

const RouteInfoCard = ({ batteryEstimate, distance }) => (
  <View style={localStyles.infoCard}>
    <View style={localStyles.infoRow}>
      <Text style={{ fontSize: 24, marginRight: 10 }}>⚡</Text>
      <View>
        <Text style={localStyles.infoLabel}>Est. Arrival Battery</Text>
        <Text style={localStyles.infoValue}>{batteryEstimate}% ⚠️</Text>
      </View>
    </View>
    <View style={{ width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: 15 }} />
    <View>
      <Text style={localStyles.infoLabel}>Distance</Text>
      <Text style={[localStyles.infoValue, { color: colors.textPrimary }]}>{distance} km</Text>
    </View>
  </View>
);

const TripStopCard = ({ stop, isLast }) => {
  const getBatteryColor = (level) => {
    if (level > 50) return colors.success;
    if (level > 20) return colors.warning;
    return colors.danger;
  };

  return (
    <View style={localStyles.stopContainer}>
      <View style={localStyles.batteryCol}>
        <View style={localStyles.lineTop} />
        <View style={[localStyles.batteryBadge, { borderColor: getBatteryColor(stop.arrivalBattery) }]}>
          <Text style={[localStyles.batteryText, { color: getBatteryColor(stop.arrivalBattery) }]}>
            {stop.arrivalBattery}%
          </Text>
        </View>
        {!isLast && <View style={localStyles.lineBottom} />}
      </View>
      <View style={localStyles.stopCard}>
        <View style={localStyles.headerRow}>
          <View>
            <Text style={localStyles.stationName}>{stop.name}</Text>
            <Text style={localStyles.address}>{stop.address}</Text>
          </View>
          <View style={localStyles.amenityRow}>
            {stop.amenities?.includes('food') && <Text style={localStyles.icon}>🍔</Text>}
            {stop.amenities?.includes('coffee') && <Text style={localStyles.icon}>☕</Text>}
            {stop.amenities?.includes('restroom') && <Text style={localStyles.icon}>🚻</Text>}
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
            <View style={localStyles.tag}>
                <Text style={localStyles.tagText}>⚡ {stop.type}</Text>
            </View>
            <View style={localStyles.tag}>
                <Text style={localStyles.tagText}>🕒 {stop.chargeTime} min stop</Text>
            </View>
        </View>
      </View>
    </View>
  );
};

// --- END MOCKS ---

// Fallback data if context is empty (for testing)
const MOCK_ROUTE = [
  { 
    id: 's1', 
    name: 'Tata Power Charging', 
    address: 'ORR Exit 12, Hyderabad', 
    type: '50kW DC', 
    arrivalBattery: 65, 
    chargeTime: 15,
    amenities: ['coffee', 'restroom'] 
  },
];

const RouteExplorerScreen = ({ navigation }) => {
  const { tripDetails } = useTrip();
  const [routePlan, setRoutePlan] = useState([]);
  const [routeSearch, setRouteSearch] = useState('');
  
  const startName = tripDetails.startLocation?.description?.split(',')[0] || 'Start';
  const endName = tripDetails.endLocation?.description?.split(',')[0] || 'End';

  // Load planned stops from Context when screen mounts
  useEffect(() => {
    if (tripDetails.plannedStops && tripDetails.plannedStops.length > 0) {
      // Map the simple station objects to the detailed route format if needed
      // For now, we assume the objects passed are compatible or we add default route props
      const formattedStops = tripDetails.plannedStops.map(stop => ({
        ...stop,
        arrivalBattery: stop.arrivalBattery || Math.floor(Math.random() * 40) + 20, // Mock calc
        chargeTime: stop.chargeTime || 20, // Default 20 mins
        amenities: stop.amenities || ['restroom']
      }));
      setRoutePlan(formattedStops);
    } else {
      // If no stops passed (e.g. direct nav), show empty or mock
      setRoutePlan(MOCK_ROUTE); 
    }
  }, [tripDetails.plannedStops]);

  // NAVIGATION FIX: Use goBack() to return to the previous screen (Smart or Manual)
  const handleEditPlan = () => {
      // Safe check for navigation object in preview
      if (navigation && navigation.canGoBack && navigation.canGoBack()) {
        navigation.goBack();
      } else if (navigation && navigation.navigate) {
        navigation.navigate('SmartPlanner');
      } else {
        Alert.alert("Navigation", "Going back to SmartPlanner");
      }
  };

  return (
    <View style={styles.container}>
      {/* Top Map Section */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Text style={{ fontSize: 40 }}>🗺️</Text>
          <Text style={styles.mapText}>Google Map Rendering...</Text>
          <Text style={styles.routeText}>{startName} ➔ {endName}</Text>
          <View style={styles.polyline} />
        </View>

        <View style={styles.headerOverlay}>
          <TouchableOpacity style={styles.backBtn} onPress={handleEditPlan}>
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

      {/* Bottom Timeline Section */}
      <View style={styles.listContainer}>
        <View style={styles.listHeader}>
          <Text style={styles.headerTitle}>Your Trip Plan</Text>
          <Text style={styles.headerSub}>{routePlan.length} charging stops required</Text>
        </View>

        <FlatList
          data={routePlan}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          renderItem={({ item, index }) => (
            <TripStopCard 
                stop={item} 
                isLast={index === routePlan.length - 1} 
            />
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 20 }}>
              No stops added yet.
            </Text>
          }
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
  
  // Map Section
  mapContainer: { flex: 0.55, backgroundColor: '#E2E8F0', position: 'relative' },
  mapPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapText: { fontSize: 18, fontWeight: 'bold', color: colors.background, marginTop: 10 },
  routeText: { fontSize: 14, color: colors.surfaceHighlight, marginTop: 4 },
  polyline: { width: 200, height: 100, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#3B82F6', borderRadius: 50, position: 'absolute', top: '40%' },
  
  headerOverlay: { position: 'absolute', top: 50, left: 16, right: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, marginRight: 12, elevation: 4 },
  backBtnText: { fontWeight: 'bold', color: colors.textPrimary },
  searchBox: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, height: 42, justifyContent: 'center', elevation: 4 },
  searchInput: { color: colors.textPrimary, fontSize: 14 },

  // List Section
  listContainer: { flex: 0.45, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  listHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: colors.textSecondary, fontSize: 14 },
  footer: { padding: 16, paddingTop: 8, backgroundColor: colors.background }
});

const localStyles = StyleSheet.create({
  primaryBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
  },
  primaryBtnText: { color: colors.textInverse || '#000', fontSize: 16, fontWeight: 'bold' },
  infoCard: {
    position: 'absolute', bottom: 20, left: 20, right: 20,
    backgroundColor: colors.surface, padding: 16, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    elevation: 5, borderWidth: 1, borderColor: colors.border,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 'bold' },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: colors.warning },
  
  stopContainer: { flexDirection: 'row', paddingHorizontal: 16, minHeight: 100 },
  batteryCol: { alignItems: 'center', width: 50, marginRight: 12 },
  lineTop: { width: 2, height: 15, backgroundColor: colors.border },
  lineBottom: { width: 2, flex: 1, backgroundColor: colors.border },
  batteryBadge: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface, zIndex: 10 },
  batteryText: { fontSize: 12, fontWeight: 'bold' },
  stopCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  stationName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  address: { fontSize: 12, color: colors.textSecondary },
  amenityRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 8 },
  icon: { fontSize: 14, marginLeft: 4 },
  tag: { backgroundColor: colors.surfaceHighlight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  tagText: { color: colors.textSecondary, fontSize: 11, fontWeight: '600' }
});

export default RouteExplorerScreen;