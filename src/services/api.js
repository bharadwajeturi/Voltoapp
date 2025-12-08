// Services/api.js
// API integration with Utils for error handling and logging

import axios from 'axios';
import { Platform } from 'react-native';
import { logError, logInfo, logApiCall } from '../utils/logger';
import { getErrorMessage, retryApiCall } from '../utils/errorHandler';
import { ERROR_MESSAGES } from '../utils/constants';

// Base configuration
const API_BASE_URL = 'http://192.168.0.136:5000/api';


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Response interceptor with logging
apiClient.interceptors.response.use(
  response => {
    logApiCall(response.config.url, response.config.method.toUpperCase(), response.status);
    return response;
  },
  error => {
    logError(`API Error: ${error.config?.url}`, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================
// GOOGLE MAPS API KEY - From Backend (SECURE)
// ============================================

let cachedGoogleApiKey = null;

export const getGoogleMapsApiKey = async () => {
  if (cachedGoogleApiKey) {
    logInfo('Using cached Google Maps API Key');
    return cachedGoogleApiKey;
  }
  
  try {
    logInfo('Fetching Google Maps API Key from backend...');
    const response = await apiClient.get('/config/google-maps-key');
    cachedGoogleApiKey = response.data.apiKey;
    logInfo('✓ Google Maps API Key fetched successfully');
    return cachedGoogleApiKey;
  } catch (error) {
    logError('Failed to fetch Google Maps API key from backend', error);
    throw error;
  }
};

// ============================================
// STATION ENDPOINTS
// ============================================

export const getNearbyStations = async (latitude, longitude, radiusKm = 50, carBrand = null) => {
  try {
    logInfo(`Fetching nearby stations: ${latitude}, ${longitude}, ${radiusKm}km`);
    
    const params = { lat: latitude, lng: longitude, radius: radiusKm };
    if (carBrand) params.brand = carBrand;

    const response = await apiClient.get('/stations/nearby', { params });
    logInfo(`Found ${response.data.stations?.length || 0} stations`);
    return response.data.stations || [];
  } catch (error) {
    logError('Error fetching nearby stations', error);
    throw error;
  }
};

export const searchStations = async (query) => {
  try {
    logInfo(`Searching stations: "${query}"`);
    const response = await apiClient.get('/stations/search', { params: { query } });
    logInfo(`Found ${response.data.stations?.length || 0} matching stations`);
    return response.data.stations || [];
  } catch (error) {
    logError('Error searching stations', error);
    throw error;
  }
};

export const getStationDetails = async (stationId) => {
  try {
    logInfo(`Fetching station details: ${stationId}`);
    const response = await apiClient.get(`/stations/${stationId}`);
    return response.data.station;
  } catch (error) {
    logError(`Error fetching station ${stationId}`, error);
    throw error;
  }
};

// ============================================
// ROUTE PLANNING ENDPOINTS
// ============================================

export const calculateRoute = async (params) => {
  try {
    logInfo('Calculating route with charging stops...');
    const start = {
      lat: params.start.latitude || params.start.lat,
      lng: params.start.longitude || params.start.lng
    };
    
    const end = {
      lat: params.end.latitude || params.end.lat,
      lng: params.end.longitude || params.end.lng
    };
    const response = await apiClient.post('/plan-route', {
      start,
      end,
      carModel: params.carModel,
      startSOC: params.currentBattery,           // Renamed
      targetArrivalSOC: params.minArrivalBattery, // Renamed
      maxChargeSOC: 80,                          // Added
      startTime: new Date().toISOString()
    });
    logInfo(`✓ Route calculated with ${response.data.data?.statistics?.totalStops || 0} stops`);
    return response.data.data;
  } catch (error) {
    logError('Error calculating route', error);
    throw error;
  }
};

export const getChargingStops = async (start, end, batteryPercentage, carModel) => {
  try {
    logInfo('Fetching optimal charging stops...');
    const response = await apiClient.post('/routes/charging-stops', {
      start, end, batteryPercentage, carModel
    });
    logInfo(`Found ${response.data.stops?.length || 0} charging stops`);
    return response.data.stops || [];
  } catch (error) {
    logError('Error fetching charging stops', error);
    throw error;
  }
};

// ============================================
// TRIP ENDPOINTS
// ============================================

export const saveTrip = async (tripData) => {
  try {
    logInfo('Saving trip to backend...');
    const response = await apiClient.post('/trips', tripData);
    logInfo(`✓ Trip saved with ID: ${response.data.trip?.id}`);
    return response.data.trip;
  } catch (error) {
    logError('Error saving trip', error);
    throw error;
  }
};

export const getUserTrips = async (userId) => {
  try {
    logInfo(`Fetching trips for user: ${userId}`);
    const response = await apiClient.get(`/trips/user/${userId}`);
    logInfo(`Found ${response.data.trips?.length || 0} trips`);
    return response.data.trips || [];
  } catch (error) {
    logError('Error fetching user trips', error);
    throw error;
  }
};

export const getTripDetails = async (tripId) => {
  try {
    logInfo(`Fetching trip details: ${tripId}`);
    const response = await apiClient.get(`/trips/${tripId}`);
    return response.data.trip;
  } catch (error) {
    logError(`Error fetching trip ${tripId}`, error);
    throw error;
  }
};

export const updateTrip = async (tripId, updates) => {
  try {
    logInfo(`Updating trip: ${tripId}`);
    const response = await apiClient.patch(`/trips/${tripId}`, updates);
    logInfo(`✓ Trip updated successfully`);
    return response.data.trip;
  } catch (error) {
    logError('Error updating trip', error);
    throw error;
  }
};

export const deleteTrip = async (tripId) => {
  try {
    logInfo(`Deleting trip: ${tripId}`);
    const response = await apiClient.delete(`/trips/${tripId}`);
    logInfo(`✓ Trip deleted successfully`);
    return response.data.success;
  } catch (error) {
    logError('Error deleting trip', error);
    throw error;
  }
};

// ============================================
// ERROR HANDLING
// ============================================



export default apiClient;
