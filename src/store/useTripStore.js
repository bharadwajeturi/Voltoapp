import { create } from 'zustand';

const useTripStore = create((set) => ({
  // --- USER STATE ---
  user: {
    carModel: 'Tata Nexon EV',
    batteryCapacity: 40.5,
  },
  
  // --- TRIP INPUTS ---
  tripRequest: {
    start: null, // { lat, lng, name }
    end: null,   // { lat, lng, name }
    startBattery: 100,
    minBuffer: 20,
  },

  // --- TRIP RESULTS (Parallel Data) ---
  tripResult: {
    tripId: null,
    totalDistance: 0,
    routePolyline: null,  // For Map Screen
    areaClusters: [],     // For List Screen
    allStations: [],      // For Map Pins
    selectedStops: [],    // User's confirmed stops
  },

  isLoading: false,
  error: null,

  // --- ACTIONS ---
  setTripRequest: (updates) => set((state) => ({ 
    tripRequest: { ...state.tripRequest, ...updates } 
  })),

  // The Magic "Parallel Update" Action
  setTripData: (apiResponse) => set((state) => ({
    tripResult: {
      ...state.tripResult,
      tripId: apiResponse.trip_id,
      totalDistance: apiResponse.total_distance_km,
      routePolyline: apiResponse.route_geometry,
      areaClusters: apiResponse.groupedAreas || [],
      allStations: apiResponse.stations || [],
    },
    isLoading: false,
  })),

  addStop: (station) => set((state) => ({
    tripResult: {
      ...state.tripResult,
      selectedStops: [...state.tripResult.selectedStops, station]
    }
  })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (err) => set({ error: err }),
}));

export default useTripStore;