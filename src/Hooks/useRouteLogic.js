import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import polyline from '@mapbox/polyline';
import { CONFIG } from '../config/constants';

export const useRouteLogic = (selectedStops, routePath, routePolyline, totalDistance, startName) => {
    // 🟢 NEW: State for Real Data Override
    const [realPolyline, setRealPolyline] = useState([]);
    const [realDistance, setRealDistance] = useState(0);
    const [realDuration, setRealDuration] = useState(0);

    // 🟢 NEW: Fetch Exact Route from Google (Client Side)
    const fetchExactRoute = async () => {
        if (selectedStops.length < 2) return;

        try {
            const origin = `${selectedStops[0].station.lat},${selectedStops[0].station.lng}`;
            const dest = `${selectedStops[selectedStops.length - 1].station.lat},${selectedStops[selectedStops.length - 1].station.lng}`;
            
            // Construct Waypoints (exclude start/end)
            const waypoints = selectedStops.slice(1, -1)
                .map(stop => `${stop.station.lat},${stop.station.lng}`)
                .join('|');

            // Call Google Directions API
            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&waypoints=optimize:true|${waypoints}&key=${CONFIG.GOOGLE_MAPS_API_KEY}`;
            
            const response = await axios.get(url);
            
            if (response.data.status === 'OK' && response.data.routes.length > 0) {
                const route = response.data.routes[0];
                
                // 1. Decode precise polyline
                const points = polyline.decode(route.overview_polyline.points).map(p => ({
                    latitude: p[0],
                    longitude: p[1]
                }));
                setRealPolyline(points);

                // 2. Sum up distance and duration
                let totalDistM = 0;
                let totalDurSec = 0;
                route.legs.forEach(leg => {
                    totalDistM += leg.distance.value;
                    totalDurSec += leg.duration.value;
                });

                setRealDistance(totalDistM / 1000); // km
                setRealDuration(totalDurSec / 60);  // min
            }
        } catch (error) {
            console.warn("Exact route fetch failed, falling back to basic polyline:", error.message);
        }
    };

    // 🟢 Trigger Exact Route Fetch when stops change
    useEffect(() => {
        if (selectedStops.length > 0) {
            fetchExactRoute();
        }
    }, [selectedStops]);

    // 2. Computed Values
    const finalRoutePoints = useMemo(() => {
        if (realPolyline.length > 0) return realPolyline;
        if (routePath && routePath.length > 0) return routePath; 
        if (!routePolyline) return [];
        try { return polyline.decode(routePolyline).map(p => ({ latitude: p[0], longitude: p[1] })); } catch (e) { return []; }
    }, [realPolyline, routePolyline, routePath]);

    const totalDurationMins = useMemo(() => {
        // Use real driving duration + charging time
        const drivingTime = realDuration > 0 ? realDuration : selectedStops.reduce((acc, stop) => acc + (stop.driveTime || 0), 0);
        const chargingTime = selectedStops.reduce((acc, stop) => acc + (stop.chargeTime || 0), 0);
        return drivingTime + chargingTime;
    }, [selectedStops, realDuration]);

    const etaTime = useMemo(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + totalDurationMins);
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }, [totalDurationMins]);

    const displayDistance = realDistance > 0 ? realDistance : (totalDistance / 1000);
    
    const displayStartName = (startName && startName !== 'Unknown') ? startName : (selectedStops[0]?.station?.name || "Start");

    return {
        finalRoutePoints,
        totalDurationMins,
        etaTime,
        displayDistance,
        displayStartName
    };
};