/**
 * Calculates max range based on battery and efficiency.
 * * @param {number} currentBattery - Current battery % (0-100)
 * @param {number} targetArrivalBattery - Desired arrival % (e.g., 15)
 * @param {number} batteryCapacitykWh - Total battery size (e.g., 40.5 kWh)
 * @param {number} efficiencyWhPerKm - Car efficiency (e.g., 130 Wh/km)
 * @returns {number} Range in Kilometers
 */
export const calculateMaxRange = (
  currentBattery, 
  targetArrivalBattery, 
  batteryCapacitykWh, 
  efficiencyWhPerKm
) => {
  // 1. Calculate usable percentage
  const usablePercent = Math.max(0, currentBattery - targetArrivalBattery);
  
  // 2. Convert to kWh
  const usableEnergykWh = (usablePercent / 100) * batteryCapacitykWh;
  
  // 3. Convert Wh/km to kWh/km
  const efficiencykWhPerKm = efficiencyWhPerKm / 1000;
  
  // 4. Calculate Range
  const rangeKm = usableEnergykWh / efficiencykWhPerKm;
  
  return Math.floor(rangeKm);
};

export const estimateBatteryAtDestination = (
  distanceKm,
  currentBattery,
  batteryCapacitykWh,
  efficiencyWhPerKm
) => {
  const energyNeededkWh = distanceKm * (efficiencyWhPerKm / 1000);
  const percentDrop = (energyNeededkWh / batteryCapacitykWh) * 100;
  
  return Math.floor(Math.max(0, currentBattery - percentDrop));
};