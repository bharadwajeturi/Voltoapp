import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  StyleSheet
} from 'react-native';

import { useRoute } from '../Hooks/useRoute'; // ✅ GLOBAL ROUTE

import {
  formatDistance,
  formatTime,
  formatBattery
} from '../utils/formatters';

import { logInfo, logScreenNavigation } from '../utils/logger';

const RouteExplorerScreen = ({ navigation, route }) => {
  logScreenNavigation('RouteExplorerScreen');

  const scrollViewRef = useRef(null);

  // ✅ CORRECT: useRoute() hook from React Navigation
  const navigationRoute = route || {};
  const navigationParams = navigationRoute.params || {};

  // ✅ BOTH SOURCES: NAV PARAMS + GLOBAL CONTEXT
  const { globalRoute } = useRoute();
  const routeData = navigationParams.routeData || globalRoute || {};

  logInfo('RouteExplorer NAV PARAMS:', navigationParams);
  logInfo('RouteExplorer RAW INPUT:', routeData);
  logInfo('RouteExplorer GLOBAL ROUTE:', globalRoute);

  // ✅ PRIORITY: nav params > global > empty
  const hasRouteData = routeData && Object.keys(routeData).length > 0;

  useEffect(() => {
    if (routeData && hasRouteData) {
      // Auto-scroll to stops section if exists
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 300, animated: true });
      }, 500);
    }
  }, [routeData]);

  if (!hasRouteData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={styles.noDataText}>Loading route data...</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation?.goBack?.()}
        >
          <Text style={styles.buttonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ✅ PERFECT DATA EXTRACTION
  const statistics = routeData.statistics || {};
  const plannedStops = routeData.plannedStops || [];
  const finalLeg = routeData.finalLeg || {};
  const carModel = routeData.carModel || 'Tata Nexon EV';

  const totalDistance = parseFloat(statistics.totalDistance || finalLeg.distanceKm || 0) || 0;
  const totalStops = parseInt(statistics.totalStops || plannedStops.length || 0) || 0;
  const totalTime = parseInt(statistics.totalTime || 0) || 12;
  const finalSOC = parseFloat(finalLeg.arrivalSOC || 0) || 0;

  logInfo('RouteExplorer DISPLAY DATA:', {
    totalDistance,
    totalStops,
    totalTime,
    finalSOC,
    carModel
  });

  const shareRoute = async () => {
    try {
      const routeSummary = `🚗 EV Route Plan\n\n📏 Total Distance: ${formatDistance(totalDistance)}\n⚡ Charging Stops: ${totalStops}\n⏱️ Est. Time: ${formatTime(totalTime)}\n🔋 Arrival Battery: ${formatBattery(finalSOC)}\n🚙 Car: ${carModel}`;
      
      const result = await Share.share({
        message: routeSummary
      });

      if (result.action === Share.sharedAction) {
        logInfo('Route shared successfully');
      }
    } catch (error) {
      logError('Error sharing route:', error);
      Alert.alert('Share Failed', 'Could not share route');
    }
  };

  const renderStops = () => {
    if (totalStops === 0) {
      return (
        <View style={styles.noStopsContainer}>
          <Text style={styles.noStopsText}>🎉 Direct Route Complete!</Text>
          <Text style={styles.finalLegText}>Distance: {formatDistance(totalDistance)}</Text>
          <Text style={styles.finalLegText}>Arrival Battery: {formatBattery(finalSOC)}</Text>
        </View>
      );
    }

    return plannedStops.map((stop, idx) => (
      <View key={idx} style={styles.stopCard}>
        <View style={styles.stopTimeline}>
          <View style={styles.stopDot} />
          <View style={styles.stopLine} />
        </View>
        <Text style={styles.stopName}>{stop.station?.name || 'Charging Stop'}</Text>
        <Text style={styles.stopDetails}>
          Charging: {formatBattery(stop.charging?.arrivalSOC)} → {formatBattery(stop.charging?.departureSOC)}
        </Text>
        {stop.station?.address && (
          <Text style={styles.stopAddress}>{stop.station.address}</Text>
        )}
      </View>
    ));
  };

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <Text style={styles.title}>🗺️ Route Planned Successfully!</Text>
      <Text style={styles.subtitle}>{carModel}</Text>

      {/* SUMMARY CARD */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Distance</Text>
            <Text style={styles.summaryValue}>{formatDistance(totalDistance)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Charging Stops</Text>
            <Text style={styles.summaryValue}>{totalStops}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Est. Time</Text>
            <Text style={styles.summaryValue}>{formatTime(totalTime)}</Text>
          </View>
        </View>

        <View style={styles.finalBatteryRow}>
          <Text style={styles.finalBatteryLabel}>Arrival Battery</Text>
          <Text 
            style={[
              styles.finalBatteryValue, 
              { color: finalSOC >= 20 ? '#51cf66' : '#ff6b6b' }
            ]}
          >
            {formatBattery(finalSOC)}
          </Text>
        </View>
      </View>

      {/* ⚡ PLANNED STOPS */}
      <Text style={styles.sectionTitle}>⚡ Planned Charging Stops</Text>
      {renderStops()}

      {/* ACTION BUTTONS */}
      <TouchableOpacity 
        style={styles.shareButton}
        onPress={shareRoute}
        activeOpacity={0.7}
      >
        <Text style={styles.shareButtonText}>📤 Share Route</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.primaryButton]}
        onPress={() => navigation?.navigate?.('SmartPlanner')}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonText}>🚗 Plan New Route</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]}
        onPress={() => navigation?.goBack?.()}
        activeOpacity={0.7}
      >
        <Text style={styles.buttonTextSecondary}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa' 
  },
  content: { 
    padding: 20,
    paddingBottom: 40
  },
  centerContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 40, 
    backgroundColor: '#f8f9fa' 
  },
  noDataText: { 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 20, 
    textAlign: 'center' 
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    marginBottom: 8, 
    color: '#1a1a1a', 
    textAlign: 'center' 
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 24, 
    textAlign: 'center', 
    fontWeight: '500' 
  },
  summaryCard: {
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 24, 
    marginBottom: 24,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 12, 
    elevation: 8
  },
  summaryRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  summaryItem: { 
    alignItems: 'center', 
    flex: 1 
  },
  summaryLabel: { 
    fontSize: 12, 
    color: '#666', 
    marginBottom: 4 
  },
  summaryValue: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#0066cc' 
  },
  finalBatteryRow: { 
    alignItems: 'center', 
    paddingTop: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f0' 
  },
  finalBatteryLabel: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 4 
  },
  finalBatteryValue: { 
    fontSize: 28, 
    fontWeight: 'bold' 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 16, 
    color: '#1a1a1a' 
  },
  noStopsContainer: {
    backgroundColor: '#e8f5e8', 
    padding: 24, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginBottom: 24 
  },
  noStopsText: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#28a745', 
    marginBottom: 12 
  },
  finalLegText: { 
    fontSize: 16, 
    color: '#666', 
    textAlign: 'center', 
    marginBottom: 4 
  },
  stopCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    position: 'relative'
  },
  stopTimeline: {
    position: 'absolute',
    left: 20,
    top: 12,
    height: '100%',
    width: 4,
    backgroundColor: '#e0e0e0'
  },
  stopDot: {
    position: 'absolute',
    left: -8,
    top: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0066cc',
    borderWidth: 3,
    borderColor: '#fff'
  },
  stopLine: {
    position: 'absolute',
    left: -8,
    top: 20,
    bottom: 0,
    width: 4,
    backgroundColor: '#e0e0e0'
  },
  stopName: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 4,
    marginLeft: 32
  },
  stopDetails: { 
    fontSize: 14, 
    color: '#666',
    marginLeft: 32,
    marginBottom: 4
  },
  stopAddress: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 32
  },
  shareButton: {
    backgroundColor: '#17a2b8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600'
  },
  button: { 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginBottom: 12 
  },
  primaryButton: { 
    backgroundColor: '#0066cc' 
  },
  secondaryButton: { 
    backgroundColor: '#f8f9fa', 
    borderWidth: 2, 
    borderColor: '#e0e0e0' 
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 17, 
    fontWeight: '600' 
  },
  buttonTextSecondary: { 
    color: '#1a1a1a', 
    fontSize: 17, 
    fontWeight: '600' 
  }
});

export default RouteExplorerScreen;
