import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import  TripContext  from '../context/TripContext';
import { CAR_MODELS } from '../constants/carModels';
import CarSelector from '../components/planner/CarSelector';
import PrimaryButton from '../components/common/PrimaryButton';

const TripPlannerScreen = ({ navigation }) => {
  const { tripDetails, updateTrip } = useContext(TripContext);
  const [search, setSearch] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manual Explorer 🗺️</Text>
        <Text style={styles.subtitle}>Find stations manually.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <CarSelector 
          label="Filter by Vehicle"
          placeholder="Select EV..."
          value={tripDetails.car}
          options={CAR_MODELS}
          onSelect={(car) => updateTrip('car', car)}
        />

        <View style={styles.searchBox}>
          <Text style={{ marginRight: 10 }}>🔍</Text>
          <TextInput 
            style={styles.input}
            placeholder="Search stations (e.g. Tata Power)"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <PrimaryButton 
          title="Search Map" 
          icon="➔"
          onPress={() => navigation.navigate('RouteExplorer')}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  content: { padding: 24 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  input: { flex: 1, color: colors.textPrimary, fontSize: 16 }
});

export default TripPlannerScreen;