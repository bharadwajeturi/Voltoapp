// Replace with your actual local IP or hosted URL
const BASE_URL = 'http://192.168.0.136:3000/api'; 

export const api = {
  /**
   * Plan a Trip
   * @param {Object} payload { start, end, carModel, currentBattery, minBuffer }
   */
  planTrip: async (payload) => {
    try {
      const response = await fetch(`${BASE_URL}/plan-route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (error) {
      console.error('[API] planTrip Error:', error);
      throw error;
    }
  },

  /**
   * Get Nearby Stations
   * @param {number} lat 
   * @param {number} lng 
   * @param {number} radius (km)
   */
  getNearby: async (lat, lng, radius = 10) => {
    try {
      const response = await fetch(`${BASE_URL}/nearby?lat=${lat}&lng=${lng}&r=${radius}`);
      return await response.json();
    } catch (error) {
      console.error('[API] getNearby Error:', error);
      throw error;
    }
  },

  /**
   * Scan for Crisis Help
   * @param {number} lat 
   * @param {number} lng 
   */
  scanForHelp: async (lat, lng) => {
    try {
      // Mock endpoint for now
      // const response = await fetch(`${BASE_URL}/crisis/scan`, ...);
      return { success: true, helpers: [] }; 
    } catch (error) {
      console.error('[API] scanForHelp Error:', error);
      throw error;
    }
  }
};