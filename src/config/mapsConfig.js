// Config/mapsConfig.js
export const MAPS_CONFIG = {
  providers: {
    GOOGLE: 'google',
    MAPPLE: 'mapple',
  },

  // Determine which maps to show
  getMapProvider: (user) => {
    if (user?.isPremium && user?.features?.includes('mapple')) {
      return {
        primary: 'mapple',
        fallback: 'google',
      };
    }
    return {
      primary: 'google',
      fallback: null,
    };
  },

  // Google Maps URLs
  google: {
    directions: (origin, destination) =>
      `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`,
    
    search: (lat, lng) =>
      `https://www.google.com/maps/search/${lat},${lng}`,
  },

  // Mapple URLs (coming soon)
  mapple: {
    directions: (origin, destination) =>
      `https://mapple.example.com/directions?from=${origin.lat},${origin.lng}&to=${destination.lat},${destination.lng}`,
    
    search: (lat, lng) =>
      `https://mapple.example.com/search?q=${lat},${lng}`,
  },
};
