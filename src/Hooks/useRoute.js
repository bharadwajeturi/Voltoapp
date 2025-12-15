// Hooks/useRoute.js
// Custom hook for route planning and management

import { useState, useCallback } from 'react';
import { calculateRoute, getChargingStops } from '../services/api';
import { calculateTotalTrip } from '../utils/calculations';
import { logInfo, logError } from '../utils/logger';

/**
 * useRoute Hook
 * Manages route planning and charging stops
 */
export const useRoute = () => {
  const [route, setRoute] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================================
  // PLAN ROUTE
  // ============================================

  const planRoute = useCallback(async (params) => {
  try {
    setLoading(true);
    setError(null);

    if (!params.start || !params.end) {
      throw new Error('Start and end locations are required');
    }

    logInfo('🗺 Planning route...');

    // ✅ FIX: Only include maxChargeSOC if battery needs charging
    const routeParams = {
      start: params.start,
      end: params.end,
      stops: params.stops || [],
      currentBattery: params.currentBattery,
      minArrivalBattery: params.minArrivalBattery,
      carModel: params.carModel
    };

    // Only add charging target if battery is below 80%
    if (params.currentBattery < 80) {
      routeParams.maxChargeSOC = 80;
      logInfo(`🔋 Battery ${params.currentBattery}% < 80%, will charge to 80%`);
    } else {
      logInfo(`🔋 Battery ${params.currentBattery}% >= 80%, no charging needed`);
    }

    const routeData = await calculateRoute(routeParams);

    logInfo(`✓ Route planned with ${routeData.stops?.length || 0} charging stops`);
    setRoute(routeData);
    setStops(routeData.stops || []);
    return routeData;

  } catch (err) {
    logError('❌ Error planning route', err);
    setError(err.message);
    return null;
  } finally {
    setLoading(false);
  }
}, []);

  // ============================================
  // GET CHARGING STOPS
  // ============================================

  const getStops = useCallback(async (start, end, batteryPercentage, carModel) => {
    try {
      setLoading(true);
      setError(null);

      logInfo('⚡ Fetching charging stops...');
      const stopsData = await getChargingStops(start, end, batteryPercentage, carModel);

      logInfo(`✓ Found ${stopsData.length} charging stops`);
      setStops(stopsData);
      
      return stopsData;
    } catch (err) {
      logError('❌ Error fetching charging stops', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // ROUTE ANALYSIS
  // ============================================

  const getRouteSummary = useCallback(() => {
    if (!route || !route.stops) {
      return null;
    }

    const summary = calculateTotalTrip(route.stops);
    logInfo(`📊 Route Summary: ${summary.totalChargeStops} stops, ${summary.totalDistance.toFixed(1)}km`);
    
    return summary;
  }, [route]);

  // ============================================
  // UTILITY METHODS
  // ============================================

  const clearRoute = useCallback(() => {
    logInfo('🗑 Clearing route data');
    setRoute(null);
    setStops([]);
    setError(null);
  }, []);

  const updateStop = useCallback((stopIndex, updates) => {
    if (stopIndex < 0 || stopIndex >= stops.length) {
      logError(`❌ Invalid stop index: ${stopIndex}`);
      return false;
    }

    const updatedStops = [...stops];
    updatedStops[stopIndex] = { ...updatedStops[stopIndex], ...updates };
    setStops(updatedStops);
    
    logInfo(`✓ Updated stop ${stopIndex + 1}`);
    return true;
  }, [stops]);

  return {
    route,
    stops,
    loading,
    error,
    planRoute,
    getStops,
    getRouteSummary,
    clearRoute,
    updateStop,
    stopCount: stops.length,
    hasRoute: !!route
  };
};
