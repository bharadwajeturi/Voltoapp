/**
 * Calculates the distance between two coordinates in Kilometers.
 * Uses the Haversine formula.
 * @param {Object} start - { lat, lng }
 * @param {Object} end   - { lat, lng }
 * @returns {number} Distance in km
 */
export const getDistance = (start, end) => {
    // 1. Safety Checks
    if (!start || !end) return 0;

    // 2. Normalize Inputs (Handle lat vs latitude)
    const lat1 = start.lat || start.latitude;
    const lon1 = start.lng || start.longitude;
    const lat2 = end.lat || end.latitude;
    const lon2 = end.lng || end.longitude;

    if ([lat1, lon1, lat2, lon2].some(c => c === undefined || c === null || isNaN(c))) {
        return 0;
    }

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
};

const deg2rad = (deg) => deg * (Math.PI / 180);