import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import { colors } from '../theme/colors';
import StationCard from '../components/common/StationCard';

const NEARBY_STATIONS = [
  { id: '1', name: 'IKEA Hyderabad Charge', distance: '1.2 km', status: 'Available', address: 'Hitech City' },
  { id: '2', name: 'Sarath City Mall', distance: '2.5 km', status: 'In Use', address: 'Kondapur' },
  { id: '3', name: 'Cyber Towers DC Fast', distance: '3.1 km', status: 'Available', address: 'Madhapur' },
];

const NearMeScreen = () => {
  const [search, setSearch] = useState('');

  const filteredStations = NEARBY_STATIONS.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.mapArea}>
        <Text style={{ fontSize: 32 }}>📍</Text>
        <Text style={styles.mapText}>You are here</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.searchInput}
          placeholder="Search nearby (e.g. Mall)..."
          placeholderTextColor={colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.cardsContainer}>
        <FlatList
          horizontal
          data={filteredStations}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <StationCard item={item} onAction={() => alert('Navigating...')} actionLabel="Go" showAmenities={false} />
            </View>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  mapArea: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#334155' },
  mapText: { color: colors.textPrimary, fontWeight: 'bold', marginTop: 8 },
  searchContainer: { position: 'absolute', top: 50, left: 16, right: 16, backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, elevation: 5 },
  searchInput: { color: colors.textPrimary, fontSize: 16 },
  cardsContainer: { position: 'absolute', bottom: 20, left: 0, right: 0 },
  cardWrapper: { width: 280, marginRight: 16 }
});

export default NearMeScreen;