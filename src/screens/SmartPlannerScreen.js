import React, { useContext, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { colors } from '../theme/colors';
import  TripContext  from '../context/TripContext';
import { CAR_MODELS } from '../constants/carModels';
import PrimaryButton from '../components/common/PrimaryButton';
import CarSelector from '../components/planner/CarSelector';
import CircularBatterySlider from '../components/planner/CircularBatterySlider';

const SmartPlannerScreen = ({ navigation }) => {
  const { tripDetails, updateTrip } = useContext(TripContext);
  const [loading, setLoading] = useState(false);

  const handleSimulate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('RouteExplorer');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Smart AI Planner 🧠</Text>
        <Text style={styles.subtitle}>Let AI optimize your charging stops.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <CarSelector 
          label="Select Vehicle"
          placeholder="Choose your EV..."
          value={tripDetails.car}
          options={CAR_MODELS}
          onSelect={(car) => updateTrip('car', car)}
        />

        <CircularBatterySlider 
          value={tripDetails.currentBattery}
          onChange={(val) => updateTrip('currentBattery', val)}
        />

        <View style={styles.locationCard}>
          <View style={styles.inputRow}>
            <Text style={styles.dot}>🟢</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Start Location"
              placeholderTextColor={colors.textSecondary}
              value={tripDetails.startLocation?.description}
              onChangeText={(text) => updateTrip('startLocation', { description: text })}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.inputRow}>
            <Text style={styles.dot}>🔴</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Destination"
              placeholderTextColor={colors.textSecondary}
              value={tripDetails.endLocation?.description}
              onChangeText={(text) => updateTrip('endLocation', { description: text })}
            />
          </View>
        </View>

        <PrimaryButton 
          title={loading ? "Calculating Route..." : "Simulate Trip"} 
          icon="✨"
          disabled={loading}
          onPress={handleSimulate}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  content: { padding: 24 },
  locationCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { marginRight: 12, fontSize: 12 },
  input: { flex: 1, color: colors.textPrimary, fontSize: 16, paddingVertical: 8 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8, marginLeft: 24 },
});

export default SmartPlannerScreen;