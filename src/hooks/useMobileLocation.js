import { useState, useEffect, useRef } from 'react';

export const useMobileLocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [heading, setHeading] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  const lastKnownLocation = useRef(null);

  // Check geolocation permission status
  const checkPermission = async () => {
    if (!navigator.permissions) return 'unknown';
    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(permission.state);
      return permission.state;
    } catch (error) {
      console.error('Error checking geolocation permission:', error);
      return 'unknown';
    }
  };

  // Get current location (one-time)
  const getCurrentLocation = async (options = {}) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return null;
    }

    setIsLoading(true);
    setError(null);

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000, // 1 minute
      ...options
    };

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };

          setLocation(locationData);
          setAccuracy(position.coords.accuracy);
          setHeading(position.coords.heading);
          setSpeed(position.coords.speed);
          setIsLoading(false);
          setError(null);

          lastKnownLocation.current = locationData;
          resolve(locationData);
        },
        (error) => {
          setIsLoading(false);
          let errorMessage = 'Unable to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              setPermissionStatus('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
            default:
              errorMessage = 'An unknown error occurred';
              break;
          }
          
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  };

  // Start watching location (continuous updates)
  const startWatching = (options = {}) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return null;
    }

    if (watchId) {
      stopWatching();
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000, // 5 seconds for continuous updates
      ...options
    };

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        };

        setLocation(locationData);
        setAccuracy(position.coords.accuracy);
        setHeading(position.coords.heading);
        setSpeed(position.coords.speed);
        setError(null);

        lastKnownLocation.current = locationData;
      },
      (error) => {
        let errorMessage = 'Unable to watch location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied';
            setPermissionStatus('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location timeout';
            break;
        }
        
        setError(errorMessage);
      },
      defaultOptions
    );

    setWatchId(id);
    return id;
  };

  // Stop watching location
  const stopWatching = () => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  };

  // Request permission explicitly
  const requestPermission = async () => {
    try {
      // Try to get location to trigger permission prompt
      await getCurrentLocation({ timeout: 5000 });
      return 'granted';
    } catch (error) {
      if (error.message.includes('denied')) {
        return 'denied';
      }
      return 'prompt';
    }
  };

  // Calculate distance between two points (in meters)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Get accuracy level description
  const getAccuracyLevel = () => {
    if (!accuracy) return 'unknown';
    if (accuracy <= 5) return 'excellent';
    if (accuracy <= 10) return 'good';
    if (accuracy <= 50) return 'fair';
    return 'poor';
  };

  // Check if location is stale
  const isLocationStale = (maxAge = 300000) => { // 5 minutes default
    if (!location) return true;
    return Date.now() - location.timestamp > maxAge;
  };

  // Get last known location
  const getLastKnownLocation = () => {
    return lastKnownLocation.current;
  };

  // Cleanup on unmount
  useEffect(() => {
    checkPermission();
    
    return () => {
      stopWatching();
    };
  }, []);

  return {
    // State
    location,
    error,
    isLoading,
    accuracy,
    heading,
    speed,
    permissionStatus,
    watchId,

    // Actions
    getCurrentLocation,
    startWatching,
    stopWatching,
    requestPermission,
    checkPermission,

    // Utilities
    calculateDistance,
    getAccuracyLevel,
    isLocationStale,
    getLastKnownLocation,

    // Computed values
    isWatching: !!watchId,
    hasLocation: !!location,
    isAccurate: accuracy && accuracy <= 10,
    isHighAccuracy: accuracy && accuracy <= 5
  };
};

export default useMobileLocation;
