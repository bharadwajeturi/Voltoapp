import { create } from 'zustand';

const useTripStore = create((set) => ({
  // --- USER STATE ---
  user: {
    carModel: 'Tata Nexon EV',
    batteryCapacity: 40.5,
  },
  
  // --- TRIP INPUTS ---
  tripRequest: {
    start: null, 
    end: null,   
    startBattery: 100,
    minBuffer: 20,
  },

  // --- TRIP RESULTS (Parallel Data) ---
  tripResult: {
    tripId: null,
    totalDistance: 0,
    routePolyline: null,  
    areaClusters: [],     // Derived for List Screen
    allStations: [],      // Raw for Map Pins
    selectedStops: [],    // User's confirmed stops
    routeHeatmap: [],     // 🟢 Added for heatmap support
  },

  isLoading: false,
  error: null,

  // --- ACTIONS ---
  setTripRequest: (updates) => set((state) => ({ 
    tripRequest: { ...state.tripRequest, ...updates } 
  })),

  // 🟢 AUDIT FIX: Align keys with Backend Response
  setTripData: (apiResponse) => set((state) => {
    
    // Derive simple clusters if backend didn't send them
    // This groups stations by proximity for the list view
    let clusters = apiResponse.areaClusters || [];
    if (clusters.length === 0 && apiResponse.allStations?.length > 0) {
        clusters = simpleCluster(apiResponse.allStations);
    }

    return {
        tripResult: {
            ...state.tripResult,
            // Map Backend Keys -> Frontend Store Keys
            tripId: apiResponse.tripId, 
            totalDistance: apiResponse.totalDistance,
            routePolyline: apiResponse.routePolyline,
            allStations: apiResponse.allStations || [],
            selectedStops: apiResponse.selectedStops || [],
            routeHeatmap: apiResponse.routeHeatmap || [],
            areaClusters: clusters
        }
    };
  }),

  setLoading: (loading) => set({ isLoading: loading }),
  
  addStop: (station) => set((state) => ({
    tripResult: {
      ...state.tripResult,
      selectedStops: [...state.tripResult.selectedStops, station]
    }
  })),

  clearTrip: () => set((state) => ({
    tripResult: {
      tripId: null,
      totalDistance: 0,
      routePolyline: null,
      areaClusters: [],
      allStations: [],
      selectedStops: [],
      routeHeatmap: []
    }
  }))
}));

// Helper: Simple Client-Side Clustering for List View
function simpleCluster(stations) {
    // Group stations into 50km chunks for display
    const clusters = [];
    let currentCluster = null;

    stations.forEach((s, index) => {
        // Start new cluster every ~5 stations or large distance gap
        if (!currentCluster || currentCluster.popupStations.length >= 5) {
            currentCluster = {
                areaId: `area_${index}`,
                areaName: s.address ? s.address.split(',')[0] : `Stop #${clusters.length + 1}`,
                score: 85, // Placeholder
                popupStations: []
            };
            clusters.push(currentCluster);
        }
        currentCluster.popupStations.push(s);
    });
    return clusters;
}

export default useTripStore;