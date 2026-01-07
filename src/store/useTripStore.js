import { create } from 'zustand';
import axios from 'axios';
import { API_BASE_URL } from '../config/constants'; // 🟢 Import Config

// Helper: Safely parse coordinates
function parseCoord(value) {
    if (value === null || value === undefined) return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
}

// Helper: Sanitize Station Data
function sanitizeData(stopList) {
    if (!Array.isArray(stopList)) return [];

    return stopList.map(item => {
        const station = item.station || item;
        const safeStation = {
            ...station,
            id: station.id || Math.random().toString(),
            name: station.name || "Unknown Station",
            lat: parseCoord(station.lat ?? station.latitude),
            lng: parseCoord(station.lng ?? station.longitude),
            powerkw: parseFloat(station.powerkw || 0),
            trustscore: parseFloat(station.trustscore || 0),
            connectorTypes: Array.isArray(station.connectorTypes) ? station.connectorTypes : ['Unknown'],
            amenities: Array.isArray(station.amenities) ? station.amenities : [],
            address: station.address || ""
        };
        // 🟢 2. NEW: Sanitize Alternatives (Prevent Crash on Swap)
        let safeAlternatives = [];
        if (Array.isArray(item.alternatives)) {
            safeAlternatives = item.alternatives.map(alt => ({
                ...alt,
                id: alt.id || Math.random().toString(),
                name: alt.name || "Alternative",
                lat: parseCoord(alt.lat ?? alt.latitude),
                lng: parseCoord(alt.lng ?? alt.longitude),
                powerkw: parseFloat(alt.powerkw || 0),
                connectorTypes: Array.isArray(alt.connectorTypes) ? alt.connectorTypes : ['Unknown'],
                address: alt.address || ""
            }));
        }
        // Return merged object
        if (item.station) {
            return { ...item, station: safeStation, alternatives: safeAlternatives };
        } else {
            return item.station ? { ...item, station: safeStation } : safeStation;
        }
    });
}

export const useTripStore = create((set, get) => ({
    // --- STATE ---
    activeStrategy: 'FAST',
    isLoading: false,
    chatHistory: [],
    
    // View Data (What the UI sees)
    viewData: {
        tripId: null,
        routePolyline: null,
        routePath: [],
        totalDistance: 0,
        startName: "Start",
        endName: "End",
        selectedStops: [],
        allStations: [], 
        strategy: 'FAST',
        ai_message: '',
    },

    // Raw Data (Stored from API)
    tripData: {
        meta: {},
        strategies: { FAST: {}, SLOW: {} }
    },

    userProfile: {
        id: 'Guest',
        name: 'Guest User',
        vehicle: { make: 'Generic', model: 'EV', battery: 'Unknown', connector: 'CCS2' }
    },

    // --- ACTIONS ---
    setLoading: (loading) => set({ isLoading: loading }),
    
    setUserProfile: (profileData) => {
        set({ 
            userProfile: {
                ...get().userProfile, 
                ...profileData,
                vehicle: { ...get().userProfile?.vehicle, ...(profileData.vehicle || {}) }
            } 
        });
    },

    // 🟢 VIEW UPDATER
    updateView: (strategy) => {
        const state = get();
        const meta = state.tripData.meta || {};
        const strategies = state.tripData.strategies || {};
        
        const targetData = strategies[strategy] || strategies.FAST || {};
        const planned = targetData.plannedStops || targetData.selectedStops || [];
        const candidates = targetData.allCandidates || targetData.allStations || [];

        set({
            activeStrategy: strategy,
            viewData: {
                tripId: meta.tripId,
                routePolyline: meta.routePolyline,
                routePath: meta.routePath || [],
                totalDistance: meta.totalDistance || 0,
                startName: meta.startName || "Start",
                endName: meta.endName || "Destination",
                selectedStops: sanitizeData(planned),
                allStations: sanitizeData(candidates),
                strategy: strategy,
                ai_message: meta.ai_message || "Trip planned successfully." 
            }
        });
    },

    toggleStrategy: (strategy) => {
        console.log(`🔄 [Store] Switching to ${strategy} Mode`);
        get().updateView(strategy);
    },

    // 🟢 NEW ACTION: Swap Station
    swapStation: (oldStationId, newStation) => {
        const { tripData, activeStrategy, updateView } = get();
        
        // 1. Get current strategy data
        const strategies = { ...tripData.strategies };
        const currentStrategyData = strategies[activeStrategy];

        if (!currentStrategyData || !currentStrategyData.plannedStops) return;

        // 2. Find index of stop to swap
        const stops = [...currentStrategyData.plannedStops];
        const index = stops.findIndex(s => s.station.id === oldStationId);

        if (index !== -1) {
            const oldStop = stops[index];
            
            // 3. Create new stop (Keep timing logic, swap station info)
            stops[index] = {
                ...oldStop,
                station: {
                    ...newStation,
                    id: newStation.id,
                    name: newStation.name,
                    lat: parseCoord(newStation.lat),
                    lng: parseCoord(newStation.lng),
                    powerkw: newStation.powerkw || oldStop.station.powerkw,
                    connectorTypes: newStation.connectorTypes || ['CCS2'],
                    address: newStation.address || "Address unavailable"
                },
                isUserSelected: true // Tag as user-modified
            };

            // 4. Update Strategy
            strategies[activeStrategy] = {
                ...currentStrategyData,
                plannedStops: stops
            };

            // 5. Update State & Refresh View
            set({
                tripData: {
                    ...tripData,
                    strategies: strategies
                }
            });
            
            // Refresh the UI immediately
            updateView(activeStrategy);
            console.log(`✅ Swapped ${oldStop.station.name} -> ${newStation.name}`);
        }
    },

    // 🟢 DATA SAVER (Parses API Response)
    setTripData: (apiResponse) => {
        console.log("📦 [Store] Saving Trip Data...");
        try {
            const meta = apiResponse.meta || {};
            const hasStrategies = apiResponse.strategies && apiResponse.strategies.FAST;
            let fastData, slowData;

            if (hasStrategies) {
                fastData = apiResponse.strategies.FAST;
                slowData = apiResponse.strategies.SLOW;
            } else {
                // Fallback for older API structure
                fastData = {
                    plannedStops: apiResponse.route || [],
                    allCandidates: apiResponse.candidates || []
                };
                slowData = fastData;
            }

            set({
                tripData: {
                    meta: {
                        tripId: apiResponse.tripId,
                        routePolyline: meta.routePolyline,
                        routePath: meta.routePath,
                        totalDistance: meta.totalDistance || (apiResponse.stats?.totalDistanceKm * 1000) || 0,
                        startName: meta.startName || "Start",
                        endName: meta.endName || "Destination",
                        ai_message: meta.ai_message
                    },
                    strategies: {
                        FAST: fastData,
                        SLOW: slowData
                    }
                }
            });

            // Initial View Update
            get().updateView('FAST');

        } catch (e) {
            console.error("❌ [Store] Data Parsing Error:", e);
        }
    },

    // 🟢 FETCH ACTION (Fixed: Added returns)
    fetchTripPlan: async (payload) => {
        const { setLoading, setTripData } = get();
        setLoading(true);
        try {
            // 🟢 USE CONFIG URL (Dynamic)
            console.log(`[Store] Fetching plan from ${API_BASE_URL}/plan-route`);
            const res = await axios.post(`${API_BASE_URL}/plan-route`, payload);
            
            if (res.data.success || res.data.tripId) { 
                console.log("✅ Trip Fetched. AI Message:", res.data.ai_message?.substring(0, 20) + "...");
                
                const enrichedResponse = {
                    ...res.data,
                    meta: {
                        ...res.data.meta, 
                        startName: payload.start.name,
                        endName: payload.end.name,
                        ai_message: res.data.ai_message 
                    }
                };

                setTripData(enrichedResponse);
                return true; // 🟢 CRITICAL FIX: Return true so LoadingScreen knows it worked
            }
            return false; // 🟢 Return false if API returns but success is false
        } catch (error) {
            console.error("Trip Plan Failed:", error.response ? error.response.data : error.message);
            return false; // 🟢 Return false on error
        } finally {
            setLoading(false);
        }
    }
}));

export default useTripStore;