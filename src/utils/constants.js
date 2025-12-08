// Utils/constants.js
// Global constants and enumerations

// utils/constants.js
export const CAR_EFFICIENCY = {
  'Tata Nexon': 16.5,
  'Tata Nexon EV': 16.5,  // ✅ EXACT MATCH
  'MG ZS': 17.2,
  'MG ZS EV': 17.2,
  'Hyundai Kona': 15.8,
  'Hyundai Kona Electric': 15.8,
  'Mahindra XUV400': 16.2,
  'BMW i4': 18.5
};

export const CAR_BATTERY_SIZE = {
  'Tata Nexon': 40.5,
  'Tata Nexon EV': 40.5,  // ✅ EXACT MATCH
  'MG ZS': 50.3,
  'MG ZS EV': 50.3,
  'Hyundai Kona': 39.2,
  'Hyundai Kona Electric': 39.2,
  'Mahindra XUV400': 39.4,
  'BMW i4': 81.0
};

export const CHARGING_BRANDS = ['Zeon', 'Tata Power', 'Magenta', 'Ather'];




export const AMENITY_TYPES = {
  RESTAURANT: 'Restaurant',
  RESTROOM: 'Restroom',
  HOTEL: 'Hotel',
  ATM: 'ATM',
  PHARMACY: 'Pharmacy',
  PETROL_PUMP: 'Petrol Pump'
};

export const CHARGE_SPEEDS = {
  LEVEL1: '2 kW',
  LEVEL2: '7-11 kW',
  LEVEL3_AC: '43-50 kW',
  LEVEL3_DC: '50-350 kW'
};

export const TRIP_STATUS = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const ERROR_MESSAGES = {
  INVALID_LOCATION: 'Invalid location coordinates',
  LOW_BATTERY: 'Battery too low to proceed',
  NO_STATIONS: 'No charging stations found',
  NETWORK_ERROR: 'Network connection failed',
  INVALID_INPUT: 'Please check your inputs',
  SERVER_ERROR: 'Server error. Please try again later'
};

export const SUCCESS_MESSAGES = {
  TRIP_SAVED: 'Trip saved successfully',
  ROUTE_PLANNED: 'Route planned successfully',
  STATION_UPDATED: 'Station updated'
};

export const API_ENDPOINTS = {
  STATIONS_NEARBY: '/api/stations/nearby',
  SEARCH_STATIONS: '/api/stations/search',
  CALCULATE_ROUTE: '/api/routes/calculate',
  SAVE_TRIP: '/api/trips',
  GET_TRIPS: '/api/trips'
};

export const MAP_CONFIG = {
  DEFAULT_ZOOM: 12,
  STATION_ZOOM: 15,
  MAX_ZOOM: 20,
  MIN_ZOOM: 5
};

export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};
