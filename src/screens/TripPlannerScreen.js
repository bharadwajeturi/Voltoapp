import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Modal, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useTripStore } from '../store/useTripStore';
import { Ionicons } from '@expo/vector-icons';
import GreenScoreStars from '../components/GreenScoreStars'; 

// --- CLUSTER CARD ---
const ClusterCard = ({ area, onPress }) => {
  // 🟢 SAFE ACCESS: Prevent crash if previewStations is missing
  const bestStation = area.previewStations?.[0] || {};
  const count = area.stations ? area.stations.length : 0;
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
            <Text style={styles.areaName} numberOfLines={1}>{area.name || "Unknown Area"}</Text>
            <Text style={styles.subText}>{count} chargers nearby</Text>
        </View>
        <GreenScoreStars score={area.greenScore} />
      </View>

      <View style={styles.divider} />

      <View style={styles.stationRow}>
        <View style={styles.iconBox}>
            <Ionicons name="trophy" size={18} color="#FFD700" />
        </View>
        <View style={styles.infoBox}>
            <Text style={styles.stationName} numberOfLines={1}>
                {bestStation.name || "Station"}
            </Text>
            <Text style={styles.stationMeta}>
                {bestStation.powerkw || 0}kW • {bestStation.operator || "Public"}
            </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#64748b" />
      </View>
    </TouchableOpacity>
  );
};

export default function TripPlannerScreen() {
  const { groupedAreas = [] } = useTripStore(); // 🟢 Default to empty array
  const [selectedCluster, setSelectedCluster] = useState(null);

  return (
    <View style={styles.container}>
      <View style={styles.pageHeader}>
         <Text style={styles.headerTitle}>Trip Planner</Text>
         <Text style={styles.headerSub}>{groupedAreas.length} Areas Identified</Text>
      </View>

      <FlatList
        data={groupedAreas}
        keyExtractor={(item, index) => item.areaId || index.toString()}
        renderItem={({ item }) => (
          <ClusterCard area={item} onPress={() => setSelectedCluster(item)} />
        )}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
            <View style={{marginTop: 50, alignItems: 'center'}}>
                <Text style={styles.emptyText}>No stations found along this route.</Text>
            </View>
        }
      />

      {/* Popup Modal */}
      <Modal visible={!!selectedCluster} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedCluster?.name}</Text>
              <TouchableOpacity onPress={() => setSelectedCluster(null)}>
                <Ionicons name="close-circle" size={30} color="#cbd5e1" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={selectedCluster?.stations || []}
              keyExtractor={(s, i) => s.id || i.toString()}
              renderItem={({ item }) => (
                <View style={styles.popupItem}>
                   <View style={{flex: 1}}>
                       <Text style={styles.popupName}>{item.name}</Text>
                       <Text style={styles.popupMeta}>{item.powerkw}kW • {item.operator}</Text>
                       <GreenScoreStars score={item.greenScore} />
                   </View>
                   <TouchableOpacity 
                      style={styles.navBtn}
                      onPress={() => Linking.openURL(`google.navigation:q=${item.lat},${item.lng}`)}
                   >
                      <Ionicons name="navigate" size={20} color="#fff" />
                   </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  pageHeader: { padding: 20, paddingTop: 50, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { color: '#94a3b8', marginTop: 4 },
  emptyText: { color: '#64748b', textAlign: 'center' },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleContainer: { flex: 1, marginRight: 10 }, 
  areaName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  subText: { color: '#94a3b8', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  stationRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 215, 0, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoBox: { flex: 1 }, 
  stationName: { color: '#e2e8f0', fontWeight: '600', fontSize: 14 },
  stationMeta: { color: '#64748b', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', height: '60%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  popupItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  popupName: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  popupMeta: { color: '#94a3b8', fontSize: 12, marginBottom: 4 },
  navBtn: { backgroundColor: '#3b82f6', padding: 10, borderRadius: 20 }
});