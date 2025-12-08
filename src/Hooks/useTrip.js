import { useState, useCallback } from 'react';
import { apiV2 } from '../services/api';
import { logInfo, logError } from '../utils/logger';

export const useTrip = () => {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const planRoute = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);

      const {
        start,
        end,
        currentBattery,
        minArrivalBattery,
        carModel
      } = params;

      logInfo(`🗺️ Planning route: (${start.latitude}, ${start.longitude}) → (${end.latitude}, ${end.longitude})`);

      // ✅ CORRECT PARAMETER NAMES:
      const response = await apiV2.post('/route/plan', {
        startPoint: {
          latitude: start.latitude,
          longitude: start.longitude
        },
        endPoint: {
          latitude: end.latitude,
          longitude: end.longitude
        },
        startSOC: parseFloat(currentBattery),
        minArrivalSOC: parseFloat(minArrivalBattery),
        carModel: carModel
      });

      const routeData = response.data?.data || response.data;
      setRoute(routeData);

      const stopCount = routeData?.stops?.length || 0;
      logInfo(`✅ Route planned with ${stopCount} charging stops`);
      
      return routeData;
    } catch (err) {
      const errorMsg = 
        err.response?.data?.error || 
        err.response?.data?.message ||
        err.message || 
        'Failed to plan route';

      setError(errorMsg);
      setRoute(null);

      logError(`❌ Route planning failed: ${errorMsg}`, err);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    route,
    loading,
    error,
    planRoute
  };
};
