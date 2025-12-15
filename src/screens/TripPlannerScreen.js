import React, { useState, useCallback, memo } from 'react';
import { 
  View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, Vibration, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import useTripStore from '../store/useTripStore';
import ClusterCard from '../components/ClusterCard'; 

// Memoized List Item
const ClusterListItem = memo(({ item, onAdd, onPress }) => (
  <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.9}>
    <ClusterCard item={item} onAdd={onAdd} />
  </TouchableOpacity>
));

function StationListModal({ visible, area, onClose, onAdd }) {
  const { theme } = useTheme();

  const renderItem = useCallback(({ item }) => (
    <View style={[styles.modalItem, { borderBottomColor: theme.border }]}>
      <View style={{flex: 1}}>
        <Text style={[styles.stName, { color: theme.text }]}>{item.name}</Text>
        <Text style={[styles.stDetail, { color: theme.textSecondary }]}>
          {item.powerkw} kW • {item.operator}
        </Text>
        <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
          <View style={{width: 60, height: 6, backgroundColor: '#eee', borderRadius: 3, marginRight: 5}}>
             <View style={{width: `${item.greenScore || 50}%`, height: '100%', backgroundColor: item.scoreColor || 'orange', borderRadius: 3}} />
          </View>
          <Text style={{fontSize: 10, color: item.scoreColor || 'orange', fontWeight: 'bold'}}>
            {item.greenScore > 80 ? 'Excellent' : item.greenScore > 50 ? 'Good' : 'Average'}
          </Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => { onAdd(item); onClose(); }}>
        <Ionicons name="add-circle" size={32} color={theme.primary} />
      </TouchableOpacity>
    </View>
  ), [theme, onAdd, onClose]);

  if (!area) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{area.areaName}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={{color: theme.textSecondary, marginBottom: 10}}>
            {area.totalStationsInArea} chargers available here
          </Text>

          <FlatList 
            data={area.popupStations || []}
            keyExtractor={(s, index) => s.id || index.toString()}
            renderItem={renderItem}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        </View>
      </View>
    </Modal>
  );
}

export default function TripPlannerScreen() {
  const { theme } = useTheme();
  const { tripResult, addStop } = useTripStore();
  const [selectedArea, setSelectedArea] = useState(null);

  const handleAddStop = useCallback((station) => {
    try {
        if (Platform.OS === 'android') {
            Vibration.vibrate(100);
        } else {
            Vibration.vibrate(); 
        }
    } catch (e) {}
    addStop(station); 
  }, [addStop]);

  const openAreaDetails = useCallback((area) => {
    setSelectedArea(area);
  }, []);

  const renderCluster = useCallback(({ item }) => (
    <ClusterListItem item={item} onAdd={handleAddStop} onPress={openAreaDetails} />
  ), [handleAddStop, openAreaDetails]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Suggested Stops</Text>
      </View>
      
      <FlatList
        data={tripResult?.areaClusters || []}
        keyExtractor={(item) => item.areaId}
        renderItem={renderCluster}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
      />

      <StationListModal 
        visible={!!selectedArea} 
        area={selectedArea} 
        onClose={() => setSelectedArea(null)}
        onAdd={handleAddStop}
      />

      {tripResult?.selectedStops?.length > 0 && (
        <View style={[styles.bucket, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Text style={{ color: theme.text, fontWeight: 'bold' }}>
            🎒 Stops Added: {tripResult.selectedStops.length}
          </Text>
          <TouchableOpacity style={[styles.goButton, { backgroundColor: theme.accent }]}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>START NAV</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  bucket: { padding: 20, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 30, elevation: 20 },
  goButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { height: '70%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalItem: { flexDirection: 'row', paddingVertical: 15, borderBottomWidth: 1, alignItems: 'center' },
  stName: { fontWeight: 'bold', fontSize: 16 },
  stDetail: { fontSize: 12 }
});