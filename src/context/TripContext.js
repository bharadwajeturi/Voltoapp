import React, { createContext, useState, useContext } from 'react';

// 1. Create the context
export const TripContext = createContext();

// 2. Provider Component
export const TripProvider = ({ children }) => {
  const [tripDetails, setTripDetails] = useState({
    startLocation: null,
    endLocation: null,
    car: null,
    currentBattery: 80,
    minArrivalBattery: 15
  });

  const updateTrip = (key, value) => {
    setTripDetails(prev => ({ ...prev, [key]: value }));
  };

  const isValidTrip = () => {
    return (
      tripDetails.startLocation !== null &&
      tripDetails.endLocation !== null &&
      tripDetails.car !== null
    );
  };

  return (
    <TripContext.Provider value={{ tripDetails, updateTrip, isValidTrip }}>
      {children}
    </TripContext.Provider>
  );
};

// 3. Custom Hook (Best Practice)
export const useTrip = () => {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error('useTrip must be used within a TripProvider');
  }
  return context;
};