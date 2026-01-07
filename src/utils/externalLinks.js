import { Linking, Platform, Alert } from 'react-native';

/**
 * Opens Apple Maps (iOS) or Google Maps (Android)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} label - Name of the station
 */
export const openMaps = (lat, lng, label = "Station") => {
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const labelEncoded = encodeURIComponent(label);
    
    const url = Platform.select({
        ios: `${scheme}${labelEncoded}@${latLng}`,
        android: `${scheme}${latLng}(${labelEncoded})`
    });

    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open maps."));
};

/**
 * Opens Google Search in the default browser
 * @param {string} query - Text to search (e.g. "Tata Power Hyderabad")
 */
export const openGoogleSearch = (query) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open browser."));
};