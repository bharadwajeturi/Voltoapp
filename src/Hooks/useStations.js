import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';  // ✅ Check this import path
import { logInfo, logError } from '../utils/logger';

export const useStations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNearbyStations = useCallback(async (lat, lng, radius = 50, limit = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      logInfo('🔍 Fetching nearby stations:', { lat, lng, radius });
      
      // ✅ FIXED: Correct endpoint
      const response = await api.get('/nearby-stations', {
        params: { lat, lng, radius, limit }
      });
      
      const stationData = response.data.data || [];
      setStations(stationData);
      logInfo(`✅ Found ${stationData.length} stations`);
      
    } catch (err) {
      logError('❌ Error fetching nearby stations:', err.response?.status, err.message);
      
      // ✅ MOCK DATA FALLBACK
      const mockStations = [
        {
          id: 'mock1',
          name: 'Zeon Charging Station - Gachibowli',
          lat: parseFloat(lat) + 0.001,
          lng: parseFloat(lng) + 0.001,
          distance: 1.2,
          power: 60,
          price: 15,
          brand: 'Zeon'
        },
        {
          id: 'mock2',
          name: 'Tata Power EV Station',
          lat: parseFloat(lng) - 0.002,
          lng: parseFloat(lng) - 0.001,
          distance: 2.8,
          power: 30,
          price: 12,
          brand: 'Tata Power'
        },
        {
          id: 'mock3',
          name: 'Magenta ChargePoint',
          lat: parseFloat(lat) + 0.003,
          lng: parseFloat(lng) + 0.002,
          distance: 4.1,
          power: 50,
          price: 14,
          brand: 'Magenta'
        }
      ];
      
      setStations(mockStations);
      setError('Using demo stations (API temporarily unavailable)');
      logInfo('✅ Loaded 3 mock stations');
      
    } finally {
      setLoading(false);
    }
  }, []);

  const stationCount = stations.length;

  return {
    stations,
    loading,
    error,
    fetchNearbyStations,
    stationCount
  };
};
