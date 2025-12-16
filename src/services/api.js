import { Alert } from 'react-native';

// 🟢 CONFIG: Your Local IP (Replace with your actual IP)
const API_BASE_URL = 'http://192.168.0.136:3000/api'; 

const TIMEOUT_DURATION = 95000;

const timeoutPromise = (ms) => {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error("Server timed out. Please try again."));
        }, ms);
    });
};

export const planTrip = async (tripData) => {
  try {
    // 🟢 Race: Fetch vs Timeout
    const response = await Promise.race([
        fetch(`${API_BASE_URL}/plan-route`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tripData),
        }),
        timeoutPromise(TIMEOUT_DURATION) // Fails if fetch takes > 15s
    ]);

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Planning failed');
    return data;

  } catch (error) {
    // 🟢 Handle specific timeout error
    if (error.message === "Server timed out. Please try again.") {
        Alert.alert("Timeout", "The route calculation is taking longer than expected. Please try a shorter route.");
    } else {
        Alert.alert('Error', error.message);
    }
    throw error;
  }
};

export const fetchNearbyStations = async (lat, lng, radius = 10) => {
  try {
    const response = await fetch(`${API_BASE_URL}/nearby?lat=${lat}&lng=${lng}&r=${radius}`);
    return await response.json();
  } catch (error) {
    console.error('Nearby Fetch Error:', error);
    return [];
  }
};

// 🟢 NEW: Google Places Autocomplete (Proxied via Backend)
// Requirement: Backend must have GET /api/places/autocomplete?query=...
export const searchPlaces = async (query) => {
  try {
    const response = await fetch(`${API_BASE_URL}/places/autocomplete?query=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.predictions || [];
  } catch (error) {
    console.warn('Autocomplete Error:', error);
    return [];
  }
};

// Add to src/services/api.js

// 🟢 NEW: Fetch Lat/Lng for a Place ID
export const fetchPlaceDetails = async (placeId) => {
  try {
    // 🟢 CONFIG: Ensure API_BASE_URL is correct (e.g., http://192.168.0.136:3000/api)
    const response = await fetch(`${API_BASE_URL}/places/details?placeId=${placeId}`);
    const data = await response.json();
    
    if (data.lat && data.lng) {
        return data; // Returns { lat: ..., lng: ... }
    }
    throw new Error("Invalid location data");
  } catch (error) {
    console.warn('Details Fetch Error:', error);
    return null;
  }
};