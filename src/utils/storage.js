// Utils/storage.js
// Local storage utilities for offline data

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PREFERENCES: '@voltpath_preferences',
  SAVED_TRIPS: '@voltpath_trips',
  OFFLINE_ROUTES: '@voltpath_routes',
  FAVORITE_STATIONS: '@voltpath_favorites',
  USER_PROFILE: '@voltpath_profile'
};

export const saveUserPreferences = async (preferences) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_PREFERENCES,
      JSON.stringify(preferences)
    );
    return true;
  } catch (error) {
    console.error('Error saving preferences:', error);
    return false;
  }
};

export const getUserPreferences = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting preferences:', error);
    return null;
  }
};

export const saveTrip = async (trip) => {
  try {
    const trips = await getTrips();
    const updated = [...(trips || []), { ...trip, id: Date.now() }];
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_TRIPS, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('Error saving trip:', error);
    return false;
  }
};

export const getTrips = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_TRIPS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting trips:', error);
    return [];
  }
};

export const deleteTrip = async (tripId) => {
  try {
    const trips = await getTrips();
    const filtered = trips.filter(t => t.id !== tripId);
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_TRIPS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting trip:', error);
    return false;
  }
};

export const saveFavoriteStation = async (station) => {
  try {
    const favorites = await getFavoriteStations();
    const updated = [...(favorites || []), station];
    const unique = Array.from(new Map(updated.map(s => [s.id, s])).values());
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_STATIONS, JSON.stringify(unique));
    return true;
  } catch (error) {
    console.error('Error saving favorite:', error);
    return false;
  }
};

export const getFavoriteStations = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_STATIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const removeFavoriteStation = async (stationId) => {
  try {
    const favorites = await getFavoriteStations();
    const filtered = favorites.filter(s => s.id !== stationId);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_STATIONS, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
};

export const clearAllStorage = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};
