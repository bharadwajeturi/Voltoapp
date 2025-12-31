import { Alert } from 'react-native';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants'; // 🟢 Import from Central Config

const TIMEOUT_DURATION = 95000;

// Helper: Timeout Wrapper
const timeoutPromise = (ms) => {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error("Server timed out. Please try again."));
        }, ms);
    });
};

// 1. Plan Trip
export const planTrip = async (tripData) => {
  try {
    const response = await Promise.race([
        fetch(`${API_BASE_URL}/plan-route`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tripData),
        }),
        timeoutPromise(TIMEOUT_DURATION)
    ]);

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Planning failed');
    return data;

  } catch (error) {
    if (error.message === "Server timed out. Please try again.") {
        Alert.alert("Timeout", "The route calculation is taking longer than expected.");
    } else {
        Alert.alert('Error', error.message);
    }
    throw error;
  }
};

// 2. Fetch Nearby Stations
export const fetchNearbyStations = async (lat, lng, radiusKm = 5) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/nearby`, {
        params: { lat, lng, r: radiusKm }
    });
    return response.data;
  } catch (error) {
    console.error('Nearby Fetch Error:', error);
    return [];
  }
};

// 3. Verify Station
export const verifyStationApi = async (payload) => {
    try {
        const res = await axios.post(`${API_BASE_URL}/verify`, payload);
        return res.data;
    } catch (error) {
        throw error;
    }
};

// 4. Autocomplete
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

// 5. Place Details
export const fetchPlaceDetails = async (placeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/places/details?placeId=${placeId}`);
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Place Details Error:', error);
    return null;
  }
};