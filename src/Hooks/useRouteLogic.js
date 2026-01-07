import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import polyline from '@mapbox/polyline'; // Ensure this matches your package.json
import { CONFIG } from '../config/constants';

export const useRouteLogic = (selectedStops, routePath, routePolyline, totalDistance, startName) => {
    // State for Real Data Override
    const [realPolyline, setRealPolyline] = useState([]);
    const [realDistance, setRealDistance] = useState(0);
    const [realDuration, setRealDuration] = useState(0);

    // Fetch Exact Route from Google
    const fetchExactRoute = async () => {
        if (selectedStops.length < 2) return;

        try {
            const origin = `${selectedStops[0].station.lat},${selectedStops[0].station.lng}`;
            const dest = `${selectedStops[selectedStops.length - 1].station.lat},${selectedStops[selectedStops.length - 1].station.lng}`;
            
            const waypoints = selectedStops.slice(1, -1)
                .map(stop => `${stop.station.lat},${stop.station.lng}`)
                .join('|');

            const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&waypoints=optimize:true|${waypoints}&key=${CONFIG.GOOGLE_MAPS_API_KEY}`;
            
            const res = await axios.get(url);
            if (res.data.routes && res.data.routes.length > 0) {
                const route = res.data.routes[0];
                
                // Safe Polyline Decoding
                let points = [];
                try {
                    // Handle both import styles
                    const decodeFunc = polyline.decode || polyline; 
                    points = decodeFunc(route.overview_polyline.points).map(p => ({ latitude: p[0], longitude: p[1] }));
                } catch (e) {
                    console.warn("Polyline decode failed in fetch", e);
                }

                setRealPolyline(points);
                
                let distM = 0;
                let durS = 0;
                route.legs.forEach(leg => {
                    distM += leg.distance.value;
                    durS += leg.duration.value;
                });
                setRealDistance(distM / 1000);
                setRealDuration(Math.round(durS / 60));
            }
        } catch (error) {
            console.log("Google Route Error:", error.message);
        }
    };

    useEffect(() => {
        fetchExactRoute();
    }, [selectedStops]);

    // Computed Values
    const finalRoutePoints = useMemo(() => {
        if (realPolyline.length > 0) return realPolyline;
        if (routePath && routePath.length > 0) return routePath; 
        if (!routePolyline) return [];
        try { 
            // Safe Polyline Decoding
            const decodeFunc = polyline.decode || polyline;
            return decodeFunc(routePolyline).map(p => ({ latitude: p[0], longitude: p[1] })); 
        } catch (e) { return []; }
    }, [realPolyline, routePolyline, routePath]);

    const totalDurationMins = useMemo(() => {
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
    const displayStartName = startName || "Start";

    return { finalRoutePoints, totalDurationMins, etaTime, displayDistance, displayStartName };
};