// Utils/calculations.js
// Mathematical calculations and computations

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateBatteryAfterDrive = (
  currentBattery,
  distance,
  carEfficiency
) => {
  const batteryConsumed = distance / carEfficiency;
  return Math.max(0, currentBattery - batteryConsumed);
};

export const calculateChargingTime = (fromBattery, toBattery) => {
  // Simplified charging curve: ~2-5 min per percentage
  const difference = toBattery - fromBattery;
  if (difference <= 0) return 0;
  
  // Slower after 80%
  if (toBattery <= 80) {
    return difference * 2; // 2 min per %
  } else if (fromBattery >= 80) {
    return difference * 5; // 5 min per % above 80
  } else {
    // Mixed
    const to80 = 80 - fromBattery;
    const after80 = toBattery - 80;
    return to80 * 2 + after80 * 5;
  }
};

export const calculateEstimatedArrival = (startTime, durationMinutes) => {
  const arrival = new Date(startTime);
  arrival.setMinutes(arrival.getMinutes() + durationMinutes);
  return arrival;
};

export const canReachDestination = (
  currentBattery,
  distance,
  targetBattery,
  carEfficiency
) => {
  const batteryNeeded = distance / carEfficiency;
  const batteryAvailable = currentBattery - targetBattery;
  return batteryAvailable >= batteryNeeded;
};

export const calculateTotalTrip = (stops) => {
  let totalDistance = 0;
  let totalChargingTime = 0;
  
  stops.forEach((stop) => {
    totalDistance += stop.legDistance || 0;
    totalChargingTime += stop.chargeTimeMinutes || 0;
  });
  
  return {
    totalDistance: parseFloat(totalDistance.toFixed(1)),
    totalChargingTime,
    totalChargeStops: stops.length
  };
};

export const calculateFastestRoute = (routes) => {
  if (!routes || routes.length === 0) return null;
  
  return routes.reduce((fastest, current) => {
    const currentTime = current.totalChargingTime + (current.totalDistance / 100) * 60;
    const fastestTime = fastest.totalChargingTime + (fastest.totalDistance / 100) * 60;
    return currentTime < fastestTime ? current : fastest;
  });
};

export const calculateMostEconomical = (routes) => {
  if (!routes || routes.length === 0) return null;
  
  return routes.reduce((best, current) => {
    return current.totalChargingTime < best.totalChargingTime ? current : best;
  });
};

export const roundToNearest = (value, nearest = 0.5) => {
  return Math.round(value / nearest) * nearest;
};
