import React, { useState, useEffect, useCallback, memo } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Dimensions
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

// Memoize Item
const StationItem = memo(({ item, theme }) => (
  <View style={[styles.card, theme.cardStyle, { backgroundColor: theme.surface }]}>
    <View style={styles.row}>
      <View style={{flex: 1}}>
          <Text style={[styles.name, { color: theme.text }]}>{item.name}</Text>
          <Text style={[styles.sub, { color: theme.textSecondary }]}>
              {item.distance ? `${item.distance.toFixed(1)} km • ` : ''} {item.powerkw} kW
          </Text>
      </View>
      <View style={[styles.scoreBadge, { borderColor: item.scoreColor || theme.primary }]}>
          <Text style={{ color: item.scoreColor || theme.primary, fontWeight: 'bold' }}>
              {item.greenScore || '-'}
          </Text>
      </View>
    </View>
  </View>
));

export default function NearMeScreen() {
  const { theme } = useTheme();
  const [location, setLocation] = useState(null);
  const [addressName, setAddressName] = useState('Locating...');
  const [radius, setRadius] = useState(10);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      updateAddress(loc.coords.latitude, loc.coords.longitude);
      fetchNearbyStations(loc.coords.latitude, loc.coords.longitude, radius);
    })();
  }, []);

  const updateAddress = async (lat, lng) => {
    try {
      const [result] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result) {
        setAddressName(`${result.street || ''}, ${result.city || ''}`.replace(/^, /, ''));
      }
    } catch (e) {}
  };

  const fetchNearbyStations = async (lat, lng, r) => {
    setLoading(true);
    try {
      const data = await api.getNearby(lat, lng, r);
      setStations(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRadiusChange = (val) => {
    setRadius(val);
    if (location) fetchNearbyStations(location.latitude, location.longitude, val);
  };

  const renderStationCard = useCallback(({ item }) => (
    <StationItem item={item} theme={theme} />
  ), [theme]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* MAP VIEW (Top Half) */}
      <View style={{ height: '40%', width: '100%' }}>
         {location && (
            <MapView
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                showsUserLocation={true}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                }}
            >
                {stations.map((station, i) => (
                    <Marker 
                        key={station.id || i}
                        coordinate={{ latitude: parseFloat(station.lat), longitude: parseFloat(station.lng) }}
                        title={station.name}
                        description={`${station.powerkw} kW`}
                        pinColor={station.greenScore > 80 ? 'green' : 'orange'}
                    />
                ))}
            </MapView>
         )}
      </View>

      {/* CONTROLS & LIST (Bottom Half) */}
      <View style={{ flex: 1, padding: 15 }}>
        <View style={[styles.headerRow, {borderBottomColor: theme.border}]}>
            <Ionicons name="location" size={20} color={theme.primary} />
            <Text style={[styles.addrText, {color: theme.text}]} numberOfLines={1}>{addressName}</Text>
        </View>

        <View style={styles.sliderRow}>
            <Text style={{ color: theme.text }}>Radius: {radius} km</Text>
            <Slider
                style={{ flex: 1, marginLeft: 10 }}
                minimumValue={5} maximumValue={50} step={5}
                value={radius} onSlidingComplete={handleRadiusChange}
                minimumTrackTintColor={theme.primary} thumbTintColor={theme.primary}
            />
        </View>

        {loading ? (
            <ActivityIndicator color={theme.primary} />
        ) : (
            <FlatList
                data={stations}
                keyExtractor={(item, index) => item.id || index.toString()}
                renderItem={renderStationCard}
                showsVerticalScrollIndicator={false}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={5}
                removeClippedSubviews={true}
                ListEmptyComponent={<Text style={{textAlign:'center', color: theme.textSecondary, marginTop: 20}}>No stations found.</Text>}
            />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, marginBottom: 10 },
  addrText: { marginLeft: 10, fontSize: 16, fontWeight: '600', flex: 1 },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  card: { padding: 15, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: 'bold' },
  sub: { fontSize: 12 },
  scoreBadge: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, justifyContent: 'center', alignItems: 'center' }
});