/**
 * VoltPath Mobile App - Main Entry Point
 * Features: 
 * 1. Smart Planner (AI Simulation, Brand Logic, Hotel Suggestions)
 * 2. Route Explorer (Manual Trip Planning with Station Search)
 * 3. Near Me (Filterable Map List)
 * 4. Help (SOS & Diagnostics)
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';

// --- MOCK DATA ---
const STATIONS_DB = [
  { id: 'stn-001', name: 'TATA Power - Vivanta', distance: 1.2, type: 'DC Fast (60kW)', status: 'Available', operator: 'Tata Power', amenities: { type: 'Hotel', name: 'Vivanta Grill' } },
  { id: 'stn-002', name: 'Zeon Charging Hub', distance: 4.5, type: 'DC Fast (50kW)', status: 'Busy', operator: 'Zeon', amenities: { type: 'Cafe', name: 'Starbucks' } },
  { id: 'stn-003', name: 'Shell Recharge', distance: 2.1, type: 'DC Ultra (120kW)', status: 'Available', operator: 'Shell', amenities: { type: 'Convenience', name: 'Shell Select' } }
];

const ALL_ROUTE_STATIONS = [
  { id: 'r1', name: 'Tata Power - Ghatkesar', type: 'DC 25kW', dist: '18km', status: 'Available', amenity: 'Highway Snack Point' },
  { id: 'r2', name: 'Relux Electric - Bhongir', type: 'DC 60kW', dist: '48km', status: 'Available', amenity: 'Vivera Hotel' },
  { id: 'r3', name: 'Statiq Hub - Aler', type: 'DC 30kW', dist: '75km', status: 'Busy', amenity: 'Haritha Resort' },
  { id: 'r4', name: 'LionCharge - Jangaon', type: 'DC 50kW', dist: '92km', status: 'Available', amenity: 'Coffee Day' },
  { id: 'r5', name: 'Zeon Charging - Ghanpur', type: 'DC 50kW', dist: '115km', status: 'Available', amenity: 'Priya Dhaba' },
];

const BRAND_STATION_LOGIC: any = {
  'Tata': { name: 'Tata Power - Bhongir X Road', operator: 'Tata Power', etaOffset: 65, type: 'DC Fast (60kW)', badge: 'Preferred Partner', badgeColor: '#1e3a8a', distanceFromStart: 48.2, amenityDist: '150m' },
  'MG': { name: 'Zeon Charging - Narketpalle', operator: 'Zeon', etaOffset: 95, type: 'DC Fast (50kW)', badge: 'MG Priority', badgeColor: '#7f1d1d', distanceFromStart: 72.5, amenityDist: '50m' },
  'Hyundai': { name: 'Shell Recharge - Highway', operator: 'Shell', etaOffset: 80, type: 'DC Ultra (120kW)', badge: '800V Support', badgeColor: '#713f12', distanceFromStart: 65.0, amenityDist: 'On-site' },
  'Mahindra': { name: 'Statiq Hub - Bhongir', operator: 'Statiq', etaOffset: 70, type: 'DC Fast (30kW)', badge: 'Compatible', badgeColor: '#374151', distanceFromStart: 50.1, amenityDist: '300m' },
  'BYD': { name: 'ChargeZone - Food Court', operator: 'ChargeZone', etaOffset: 75, type: 'DC Fast (60kW)', badge: 'Blade Battery Opt.', badgeColor: '#134e4a', distanceFromStart: 58.4, amenityDist: '100m' }
};

// --- COMPONENT: TAB 1 - ROUTE EXPLORER (MANUAL) ---
const RouteExplorerScreen: React.FC = () => {
  const [view, setView] = useState<'planning' | 'summary'>('planning');
  const [query, setQuery] = useState('');
  const [trip, setTrip] = useState<any[]>([]);
  const [battery, setBattery] = useState('80');
  const [startTime, setStartTime] = useState('08:00');

  const addToTrip = (station: any) => {
    if (!trip.find(t => t.id === station.id)) {
      setTrip([...trip, station].sort((a, b) => parseInt(a.dist) - parseInt(b.dist)));
    }
  };

  const removeFromTrip = (id: string) => setTrip(trip.filter(t => t.id !== id));

  const filteredStations = ALL_ROUTE_STATIONS.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.type.toLowerCase().includes(query.toLowerCase())
  );

  const calculateStats = (distStr: string, prevDist = 0) => {
    const dist = parseInt(distStr);
    const legDist = dist - prevDist;
    const batDrop = Math.ceil(legDist / 3);
    return { legDist, batDrop };
  };

  const openMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=Gachibowli&destination=Warangal&waypoints=${trip.map(t => encodeURIComponent(t.name)).join('|')}&travelmode=driving`;
    Linking.openURL(url);
  };

  if (view === 'summary') {
    let currentBat = parseInt(battery);
    let prevDist = 0;

    return (
      <View style={styles.screenContent}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Trip Summary</Text>
          <TouchableOpacity onPress={() => setView('planning')}>
            <Text style={styles.linkText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer}>
          {/* Start Card */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.labelBlue}>START • {startTime}</Text>
                <Text style={styles.cardTitle}>Gachibowli</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.statLarge}>{battery}%</Text>
                <Text style={styles.subtext}>Initial Charge</Text>
              </View>
            </View>
          </View>

          {/* Stops */}
          {trip.map((stop, idx) => {
            const { legDist, batDrop } = calculateStats(stop.dist, prevDist);
            currentBat = currentBat - batDrop;
            prevDist = parseInt(stop.dist);
            
            // Time Calc
            const travelMins = Math.ceil(parseInt(stop.dist) * 1);
            const startH = parseInt(startTime.split(':')[0]);
            const startM = parseInt(startTime.split(':')[1]);
            const arrM = startM + travelMins + (idx * 30);
            const arrTimeH = startH + Math.floor(arrM / 60);
            const arrTimeM = arrM % 60;
            const timeStr = `${arrTimeH}:${arrTimeM < 10 ? '0' + arrTimeM : arrTimeM}`;

            return (
              <View key={stop.id} style={styles.timelineItem}>
                <View style={styles.timelineLine} />
                <View style={styles.timelineDot} />
                <View style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitleSmall}>{stop.name}</Text>
                    <Text style={styles.badge}>{stop.type}</Text>
                  </View>
                  <Text style={styles.subtext}>+{legDist}km drive • ETA {timeStr}</Text>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoText}>Arrival: {currentBat}%</Text>
                    <Text style={styles.infoText}>{stop.amenity}</Text>
                  </View>
                  <Text style={styles.noteText}>*Assumed charge to 80% (25m)</Text>
                  {/* Hidden Logic: Reset battery for next leg */ (currentBat = 80) && null} 
                </View>
              </View>
            );
          })}

          {/* Destination */}
          <View style={[styles.card, { marginTop: 20, borderColor: '#ef4444' }]}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={[styles.labelBlue, { color: '#ef4444' }]}>DESTINATION</Text>
                <Text style={styles.cardTitle}>Warangal</Text>
                <Text style={styles.subtext}>Total: 150km</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.statLarge, { color: currentBat - Math.ceil((150 - prevDist) / 3) < 20 ? '#ef4444' : '#a3e635' }]}>
                  {currentBat - Math.ceil((150 - prevDist) / 3)}%
                </Text>
                <Text style={styles.subtext}>Final Charge</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.actionButton} onPress={openMaps}>
          <Text style={styles.actionButtonText}>Open Route in Maps</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screenContent}>
      <Text style={styles.screenTitle}>Route Explorer</Text>
      <Text style={styles.screenSubtitle}>Hyd → Wgl ({ALL_ROUTE_STATIONS.length} Stations)</Text>

      {/* Inputs */}
      <View style={styles.rowInputs}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>BATTERY</Text>
          <TextInput 
            style={styles.input} 
            value={battery} 
            onChangeText={setBattery} 
            keyboardType="numeric"
            placeholder="80" 
            placeholderTextColor="#666"
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>START TIME</Text>
          <TextInput 
            style={styles.input} 
            value={startTime} 
            onChangeText={setStartTime} 
            placeholder="08:00" 
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <TextInput 
        style={styles.searchBar} 
        placeholder="Filter stations..." 
        placeholderTextColor="#94A3B8"
        value={query}
        onChangeText={setQuery}
      />

      {/* Timeline Visualizer */}
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionHeader}>Selected Stops ({trip.length})</Text>
        <ScrollView style={{ maxHeight: 150 }}>
          {trip.length === 0 && <Text style={styles.emptyText}>Add stations from list below.</Text>}
          {trip.map(stop => (
            <View key={stop.id} style={styles.selectedItem}>
              <Text style={styles.selectedItemText}>{stop.name}</Text>
              <TouchableOpacity onPress={() => removeFromTrip(stop.id)}>
                <Text style={{ color: '#ef4444' }}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Available List */}
      <Text style={styles.sectionHeader}>Available on Route</Text>
      <ScrollView>
        {filteredStations.map(s => {
          const isAdded = trip.find(t => t.id === s.id);
          return (
            <View key={s.id} style={[styles.stationCard, isAdded && styles.stationCardDisabled]}>
              <View>
                <Text style={styles.cardTitleSmall}>{s.name}</Text>
                <Text style={styles.subtext}>{s.dist} • {s.type}</Text>
              </View>
              <TouchableOpacity 
                style={[styles.addButton, isAdded && { backgroundColor: '#334155' }]} 
                onPress={() => !isAdded && addToTrip(s)}
                disabled={!!isAdded}
              >
                <Text style={styles.addButtonText}>{isAdded ? '✓' : '+'}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.actionButton} onPress={() => setView('summary')}>
        <Text style={styles.actionButtonText}>Review Plan</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- COMPONENT: TAB 2 - SMART PLANNER (AI) ---
const SmartPlannerScreen: React.FC = () => {
  const [step, setStep] = useState<'input' | 'calculating' | 'result'>('input');
  const [brand, setBrand] = useState('Tata');
  const [stops, setStops] = useState<string[]>([]);
  const [origin, setOrigin] = useState('Gachibowli, Hyderabad');
  
  const handleSimulate = () => {
    setStep('calculating');
    setTimeout(() => setStep('result'), 3000);
  };

  const addStop = () => { if(stops.length < 2) setStops([...stops, '']); };
  const updateStop = (text: string, index: number) => {
    const newStops = [...stops];
    newStops[index] = text;
    setStops(newStops);
  };

  const openGoogleMaps = () => {
    const station = BRAND_STATION_LOGIC[brand] || BRAND_STATION_LOGIC['Mahindra'];
    let waypoints = stops.filter(s => s).map(s => encodeURIComponent(s));
    waypoints.push(encodeURIComponent(station.name)); 
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=Warangal&waypoints=${waypoints.join('|')}&travelmode=driving`;
    Linking.openURL(url);
  };

  if (step === 'calculating') {
    return (
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color="#D4FF00" />
        <Text style={styles.loadingText}>AI Processing...</Text>
        <Text style={styles.subtext}>Checking Traffic & Battery Efficiency...</Text>
      </View>
    );
  }

  if (step === 'result') {
    const station = BRAND_STATION_LOGIC[brand] || BRAND_STATION_LOGIC['Mahindra'];
    return (
      <View style={styles.screenContent}>
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>AI Plan</Text>
          <TouchableOpacity onPress={() => setStep('input')}>
            <Text style={styles.linkText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtext}>Optimized for {brand}</Text>

        <View style={styles.card}>
          <View style={[styles.badgeContainer, { backgroundColor: station.badgeColor }]}>
            <Text style={styles.badgeText}>{station.badge}</Text>
          </View>
          <Text style={styles.cardTitle}>{station.name}</Text>
          <Text style={styles.subtext}>ETA: +{station.etaOffset} mins</Text>
          
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{station.distanceFromStart} km from Start</Text>
            <Text style={styles.infoText}>~40% Battery on Arrival</Text>
          </View>
          
          <View style={styles.amenityRow}>
            <Text style={styles.amenityText}>Suggested Stop: Highway Treat</Text>
            <Text style={styles.subtext}>{station.amenityDist} walk</Text>
          </View>
        </View>

        {/* Hotel Suggestion */}
        <View style={[styles.card, { borderColor: '#6366f1', marginTop: 20 }]}>
          <Text style={[styles.labelBlue, { color: '#6366f1' }]}>DESTINATION: WARANGAL</Text>
          <Text style={styles.cardTitleSmall}>Suggested Stay & Charge</Text>
          <View style={styles.hotelRow}>
            <View>
              <Text style={styles.hotelName}>Hotel Suprabha</Text>
              <Text style={styles.subtext}>EV Charger on-site (7kW AC)</Text>
            </View>
            <TouchableOpacity style={styles.bookButton}>
              <Text style={styles.bookButtonText}>Book</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={openGoogleMaps}>
          <Text style={styles.actionButtonText}>Open in Google Maps</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <Text style={styles.screenTitle}>Smart Planner</Text>
      <Text style={styles.screenSubtitle}>Context-aware route simulation</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>START LOCATION</Text>
        <TextInput style={styles.input} value={origin} onChangeText={setOrigin} placeholderTextColor="#666" />
        
        {stops.map((stop, index) => (
          <View key={index} style={{ marginTop: 10 }}>
            <Text style={styles.inputLabel}>STOP {index + 1}</Text>
            <TextInput 
              style={styles.input} 
              value={stop} 
              onChangeText={(text) => updateStop(text, index)} 
              placeholder="Enter city/place" 
              placeholderTextColor="#666"
            />
          </View>
        ))}

        <Text style={[styles.inputLabel, { marginTop: 10 }]}>DESTINATION</Text>
        <TextInput style={styles.input} value="Warangal, Telangana" editable={false} />
      </View>

      <TouchableOpacity onPress={addStop} style={{ alignSelf: 'flex-end', marginBottom: 20 }}>
        <Text style={styles.linkText}>+ Add Stop</Text>
      </TouchableOpacity>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>VEHICLE BRAND</Text>
        {/* Simple text input for demo, use Picker in real app */}
        <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Tata, MG, Hyundai..." placeholderTextColor="#666"/>
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={handleSimulate}>
        <Text style={styles.actionButtonText}>Simulate AI Route</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- TAB 3 & 4 PLACEHOLDERS ---
const NearMeScreen: React.FC = () => (
  <View style={styles.screenContent}>
    <Text style={styles.screenTitle}>Near Me</Text>
    <ScrollView>
      {STATIONS_DB.map(s => (
        <View key={s.id} style={styles.stationCard}>
          <View>
            <Text style={styles.cardTitleSmall}>{s.name}</Text>
            <Text style={styles.subtext}>{s.distance}km • {s.operator}</Text>
          </View>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: s.status === 'Available' ? '#a3e635' : '#ef4444' }} />
        </View>
      ))}
    </ScrollView>
  </View>
);

const HelpScreen: React.FC = () => (
  <View style={styles.centerContent}>
    <Text style={[styles.screenTitle, { color: '#ef4444' }]}>Emergency Help</Text>
    <TouchableOpacity style={styles.card}>
      <Text style={styles.cardTitleSmall}>Car Troubleshooting</Text>
      <Text style={styles.subtext}>Bot guide for common errors</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.card}>
      <Text style={styles.cardTitleSmall}>Request P2P Charge</Text>
      <Text style={styles.subtext}>Find V2L owners nearby</Text>
    </TouchableOpacity>
  </View>
);

// --- MAIN APP ---
const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'route' | 'smart' | 'near' | 'help'>('smart');

  const renderScreen = () => {
    switch (activeTab) {
      case 'route': return <RouteExplorerScreen />;
      case 'smart': return <SmartPlannerScreen />;
      case 'near': return <NearMeScreen />;
      case 'help': return <HelpScreen />;
      default: return <SmartPlannerScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {renderScreen()}
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('route')}>
          <Text style={activeTab === 'route' ? styles.navTextActive : styles.navText}>Route</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('smart')}>
          <Text style={activeTab === 'smart' ? styles.navTextActive : styles.navText}>Smart</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('near')}>
          <Text style={activeTab === 'near' ? styles.navTextActive : styles.navText}>Near Me</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('help')}>
          <Text style={activeTab === 'help' ? styles.navTextActive : styles.navText}>Help</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  contentContainer: { flex: 1 },
  screenContent: { flex: 1, padding: 20 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
  screenSubtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 20 },
  subtext: { fontSize: 12, color: '#94A3B8' },
  
  // Navigation
  navigation: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 15, backgroundColor: '#000', borderTopWidth: 1, borderTopColor: '#1E293B' },
  navItem: { alignItems: 'center', padding: 5 },
  navText: { color: '#475569', fontSize: 12 },
  navTextActive: { color: '#D4FF00', fontSize: 12, fontWeight: 'bold' },

  // Cards & Inputs
  card: { backgroundColor: '#1E293B', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 5 },
  cardTitleSmall: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  inputContainer: { backgroundColor: '#1E293B', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#334155', marginBottom: 10 },
  input: { backgroundColor: '#0F172A', color: '#FFF', borderRadius: 8, padding: 10, marginTop: 5 },
  inputLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8' },
  actionButton: { backgroundColor: '#D4FF00', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  actionButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#D4FF00', fontWeight: 'bold' },
  
  // Specifics
  badgeContainer: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 10 },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#FFF', textTransform: 'uppercase' },
  badge: { fontSize: 10, color: '#D4FF00', backgroundColor: '#334155', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  infoBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#0F172A', padding: 10, borderRadius: 8, marginTop: 10 },
  infoText: { fontSize: 12, color: '#FFF' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowInputs: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  inputGroup: { flex: 1, backgroundColor: '#1E293B', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  searchBar: { backgroundColor: '#1E293B', padding: 12, borderRadius: 12, color: '#FFF', marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  
  // Timeline
  timelineContainer: { backgroundColor: '#1E293B', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#334155' },
  sectionHeader: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8', marginBottom: 10 },
  selectedItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#334155' },
  selectedItemText: { color: '#FFF', fontSize: 14 },
  emptyText: { color: '#64748B', fontStyle: 'italic', fontSize: 12 },
  
  // Station List
  stationCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1E293B', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  stationCardDisabled: { opacity: 0.5, backgroundColor: '#0F172A' },
  addButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#D4FF00', justifyContent: 'center', alignItems: 'center' },
  addButtonText: { fontWeight: 'bold', color: '#000' },
  
  // Summary
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scrollContainer: { flex: 1 },
  labelBlue: { fontSize: 10, fontWeight: 'bold', color: '#3b82f6', marginBottom: 2 },
  statLarge: { fontSize: 24, fontWeight: 'bold', color: '#D4FF00' },
  timelineItem: { position: 'relative', paddingLeft: 20, marginBottom: 10 },
  timelineLine: { position: 'absolute', left: 6, top: 0, bottom: 0, width: 2, backgroundColor: '#334155' },
  timelineDot: { position: 'absolute', left: 0, top: 20, width: 14, height: 14, borderRadius: 7, backgroundColor: '#D4FF00', borderWidth: 3, borderColor: '#0F172A', zIndex: 1 },
  noteText: { fontSize: 10, color: '#D4FF00', textAlign: 'center', marginTop: 5 },
  
  // Hotel
  hotelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, backgroundColor: '#0F172A', padding: 10, borderRadius: 8 },
  hotelName: { fontSize: 14, fontWeight: 'bold', color: '#FFF' },
  bookButton: { backgroundColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  bookButtonText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  amenityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  amenityText: { fontSize: 12, fontWeight: 'bold', color: '#94A3B8' },
  loadingText: { color: '#FFF', marginTop: 15, fontSize: 18, fontWeight: 'bold' },
});

export default App;