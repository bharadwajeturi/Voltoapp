// Context/TripContext.js
// Global state management with validation

import React, { createContext, useState, useCallback, useContext } from 'react';
import { validateTrip, validateLocation, validateBatteryPercentage, validateCarModel } from '../utils/validators';
import { calculateDistance } from '../utils/calculations';
import { logInfo, logError, logWarn } from '../utils/logger';
import { saveTrip as saveTripToStorage, getTrips as getTripsFromStorage } from '../utils/storage';

export const TripContext = createContext();

export const TripProvider = ({ children }) => {
  const [trip, setTrip] = useState({
    currentLocation: null,
    destination: null,
    currentBattery: 100,
    carModel: 'Tata Nexon',
    minArrivalBattery: 15,
    plannedStops: [],
    status: 'planning',
    startTime: new Date()
  });

  const [trips, setTrips] = useState([]);

  // ============================================
  // TRIP MANAGEMENT
  // ============================================

  const setCurrentLocation = useCallback((location) => {
    if (!validateLocation(location.latitude, location.longitude)) {
      logError('Invalid location', location);
      return false;
    }
    
    logInfo(`Setting current location: ${location.latitude}, ${location.longitude}`);
    setTrip(prev => ({ ...prev, currentLocation: location }));
    return true;
  }, []);

  const setDestination = useCallback((location) => {
    if (!validateLocation(location.latitude, location.longitude)) {
      logError('Invalid destination', location);
      return false;
    }
    
    logInfo(`Setting destination: ${location.latitude}, ${location.longitude}`);
    setTrip(prev => ({ ...prev, destination: location }));
    return true;
  }, []);

  const setBattery = useCallback((battery) => {
    if (!validateBatteryPercentage(battery)) {
      logError('Invalid battery percentage', battery);
      return false;
    }
    
    logInfo(`Battery updated: ${battery}%`);
    setTrip(prev => ({ ...prev, currentBattery: battery }));
    return true;
  }, []);

  const setCarModel = useCallback((model) => {
    if (!validateCarModel(model)) {
      logError('Invalid car model', model);
      return false;
    }
    
    logInfo(`Car model changed: ${model}`);
    setTrip(prev => ({ ...prev, carModel: model }));
    return true;
  }, []);

  const setPlannedStops = useCallback((stops) => {
    logInfo(`Setting ${stops.length} planned stops`);
    setTrip(prev => ({ ...prev, plannedStops: stops }));
  }, []);

  const addPlannedStop = useCallback((stop) => {
    logInfo(`Adding stop: ${stop.name}`);
    setTrip(prev => ({
      ...prev,
      plannedStops: [...prev.plannedStops, stop]
    }));
  }, []);

  const clearTrip = useCallback(() => {
    logInfo('Clearing trip data');
    setTrip({
      currentLocation: null,
      destination: null,
      currentBattery: 100,
      carModel: 'Tata Nexon',
      minArrivalBattery: 15,
      plannedStops: [],
      status: 'planning',
      startTime: new Date()
    });
  }, []);

  // ============================================
  // TRIP VALIDATION
  // ============================================

  const isValidTrip = useCallback(() => {
    const valid = validateTrip(trip);
    if (!valid) {
      logWarn('Invalid trip configuration');
    } else {
      logInfo('Trip configuration valid ✓');
    }
    return valid;
  }, [trip]);

  const getTripDistance = useCallback(() => {
    if (!trip.currentLocation || !trip.destination) {
      logWarn('Cannot calculate distance without locations');
      return 0;
    }
    
    const distance = calculateDistance(
      trip.currentLocation.latitude,
      trip.currentLocation.longitude,
      trip.destination.latitude,
      trip.destination.longitude
    );
    
    logInfo(`Trip distance: ${distance.toFixed(1)} km`);
    return distance;
  }, [trip]);

  // ============================================
  // TRIP PERSISTENCE
  // ============================================

  const saveTripLocally = useCallback(async () => {
    try {
      if (!isValidTrip()) {
        logError('Cannot save invalid trip');
        return false;
      }
      
      const result = await saveTripToStorage(trip);
      if (result) {
        logInfo('✓ Trip saved to local storage');
      }
      return result;
    } catch (error) {
      logError('Error saving trip locally', error);
      return false;
    }
  }, [trip, isValidTrip]);

  const loadTripsLocally = useCallback(async () => {
    try {
      const loadedTrips = await getTripsFromStorage();
      setTrips(loadedTrips);
      logInfo(`✓ Loaded ${loadedTrips.length} trips from local storage`);
      return loadedTrips;
    } catch (error) {
      logError('Error loading trips', error);
      return [];
    }
  }, []);

  const value = {
    // State
    trip,
    trips,
    
    // Location methods
    setCurrentLocation,
    setDestination,
    
    // Battery methods
    setBattery,
    setCurrentBattery: setBattery,
    setMinArrivalBattery: (battery) => {
      setTrip(prev => ({
        ...prev,
        minArrivalBattery: battery
      }));
    },
    
    // Car model
    setCarModel,
    
    // Stops management
    setPlannedStops,
    addPlannedStop,
    
    // Trip management
    clearTrip,
    isValidTrip,
    getTripDistance,
    saveTripLocally,
    loadTripsLocally
  };

  return (
    <TripContext.Provider value={value}>
      {children}
    </TripContext.Provider>
  );
};

// ✅ CRITICAL: Custom hook for easy use in components
export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};
