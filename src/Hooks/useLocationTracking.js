import { useEffect, useState, useCallback, useRef } from 'react';
import { watchLocation, getCurrentLocation } from '../utils/permissions';
import { logInfo, logError } from '../utils/logger';
import { debounce } from '../utils/debounce';

/**
 * useLocationTracking Hook
 * Provides real-time location tracking with debouncing
 * 
 * @param {Function} onLocationChange - Callback when location changes
 * @returns {Object} { location, error, isTracking, startTracking, stopTracking }
 */
export const useLocationTracking = (onLocationChange) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);  // ← IMPORTANT: Must have this
  const subscriptionRef = useRef(null);

  // Debounced location handler
  const handleLocationChange = useCallback(
    debounce((newLocation) => {
      const newLoc = {
        latitude: newLocation.coords.latitude,
        longitude: newLocation.coords.longitude,
        accuracy: newLocation.coords.accuracy,
        altitude: newLocation.coords.altitude,
        timestamp: newLocation.timestamp,
      };

      logInfo(
        `Location updated: ${newLoc.latitude.toFixed(4)}, ${newLoc.longitude.toFixed(4)}`
      );

      setLocation(newLoc);

      if (onLocationChange) {
        onLocationChange(newLoc);
      }
    }, 1000),
    [onLocationChange]
  );

  const startTracking = useCallback(async () => {
    try {
      logInfo('Starting location tracking...');

      // Get initial location
      const initialLocation = await getCurrentLocation();
      setLocation({
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        accuracy: initialLocation.accuracy,
      });

      // Watch for location changes
      subscriptionRef.current = await watchLocation(handleLocationChange);

      setIsTracking(true);  // ← SET TO TRUE
      logInfo('Location tracking started');
    } catch (err) {
      logError('Failed to start location tracking', err);
      setError(err.message);
    }
  }, [handleLocationChange]);

  const stopTracking = useCallback(() => {
    try {
      logInfo('Stopping location tracking...');

      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }

      setIsTracking(false);  // ← SET TO FALSE
      logInfo('Location tracking stopped');
    } catch (err) {
      logError('Error stopping location tracking', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, []);

  // ✅ RETURN ALL VARIABLES - INCLUDING isTracking!
  return {
    location,
    error,
    isTracking,           // ← THIS MUST BE HERE
    startTracking,
    stopTracking,
  };
};
