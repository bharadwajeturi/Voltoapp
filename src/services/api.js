// Base URL for your future Backend or Google Proxy
const BASE_URL = 'https://maps.googleapis.com/maps/api';
const API_KEY = 'YOUR_GOOGLE_API_KEY'; // TODO: Move to .env

// Fetch Place Suggestions
export const fetchPlaceSuggestions = async (query) => {
  if (!query || query.length < 3) return [];
  
  // Placeholder for real fetch
  // const response = await fetch(`${BASE_URL}/place/autocomplete/json?input=${query}&key=${API_KEY}`);
  // const data = await response.json();
  // return data.predictions;
  
  console.log(`Fetching suggestions for: ${query}`);
  return []; // Returning empty until key is added
};

// Fetch Directions (Polyline)
export const fetchDirections = async (origin, destination) => {
  // const response = await fetch(`${BASE_URL}/directions/json?origin=${origin}&destination=${destination}&key=${API_KEY}`);
  return null;
};