// Hooks/useRoute.js - GLOBAL ROUTE STATE
import { useState, createContext, useContext } from 'react';
import api from '../services/api';
import { logInfo, logError } from '../utils/logger';

// ✅ GLOBAL ROUTE CONTEXT
const RouteContext = createContext();

export const RouteProvider = ({ children }) => {
  const [globalRoute, setGlobalRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const planRoute = async (params) => {
    setLoading(true);
    setError(null);
    
    try {
      logInfo('🗺 Planning route...', params);
      
      const backendParams = {
        start: { lat: params.start.latitude || params.start.lat, lng: params.start.longitude || params.start.lng },
        end: { lat: params.end.latitude || params.end.lat, lng: params.end.longitude || params.end.lng },
        carModel: params.carModel,
        startSOC: params.currentBattery,
        targetArrivalSOC: params.minArrivalBattery,
        skipVerification: true
      };

      const response = await api.post('/plan-route', backendParams);
      const routeData = response.data.data;
      
      // ✅ SET GLOBAL STATE
      setGlobalRoute(routeData);
      logInfo('✅ GLOBAL ROUTE SET:', routeData);
      
      return routeData;
      
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message;
      logError('❌ Route error:', errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RouteContext.Provider value={{ globalRoute, planRoute, loading, error }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => useContext(RouteContext);
