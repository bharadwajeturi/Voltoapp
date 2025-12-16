import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../theme/ThemeContext';

export default function MapScreen({ route }) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        showsUserLocation={true}
        showsMyLocationButton={true}
        initialRegion={{
            latitude: 17.3850,
            longitude: 78.4867,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
        }}
        customMapStyle={theme.mode === 'premium' ? [
            { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
            { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
        ] : []}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});