import { create } from 'zustand';

export const useTripStore = create((set) => ({
  // 1. Trip State
  tripId: null,
  routePolyline: null,
  totalDistance: 0,
  startPoint: null,
  endPoint: null,
  
  // 2. Station Data
  allStations: [],
  selectedStops: [],
  
  // 3. Cluster Data
  groupedAreas: [],

  // 4. Actions
  setTripData: (data, requestData) => set({
    tripId: data.tripId,
    routePolyline: data.routePolyline,
    totalDistance: data.totalDistance,
    allStations: data.allStations || [],
    selectedStops: data.selectedStops || [],
    startPoint: requestData?.start || null,
    endPoint: requestData?.end || null,
    // 🟢 Auto-cluster with Preview Stations
    groupedAreas: groupStationsIntoAreas(data.allStations || []) 
  }),

  resetTrip: () => set({
    tripId: null,
    routePolyline: null,
    allStations: [],
    selectedStops: [],
    groupedAreas: [],
    startPoint: null,
    endPoint: null
  })
}));

// --- Helper Functions ---

function groupStationsIntoAreas(stations) {
    const areas = {};
    
    stations.forEach(station => {
        const areaKey = station.geohash ? station.geohash.substring(0, 5) : 'unknown';
        
        if (!areas[areaKey]) {
            areas[areaKey] = {
                areaId: areaKey,
                name: extractAreaName(station),
                stations: []
            };
        }
        areas[areaKey].stations.push(station);
    });

    return Object.values(areas).map(area => {
        // Sort by Score
        area.stations.sort((a, b) => (b.greenScore || 0) - (a.greenScore || 0));
        
        // 🟢 FIX: Create 'previewStations' (Top 2 for the UI Card)
        area.previewStations = area.stations.slice(0, 2);
        
        area.greenScore = area.stations[0]?.greenScore || 0;
        return area;
    }).sort((a, b) => b.greenScore - a.greenScore);
}

function extractAreaName(station) {
    if (station.address) {
        const parts = station.address.split(',');
        if (parts.length >= 2) return parts.slice(0, 2).join(', ');
        return parts[0];
    }
    return "Unknown Area";
}