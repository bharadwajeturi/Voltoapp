/**
 * src/config/constants.js
 * Best Practice: Dynamic Configuration
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🟢 1. NETWORK (Change this to your IP)
export const IP_ADDRESS = "192.168.0.136"; 
export const PORT = "3000";
export const API_BASE_URL = `http://${IP_ADDRESS}:${PORT}/api`;

// 🟢 2. DYNAMIC CONFIG CONTAINER
// We use an object so the key can be updated at runtime.
export const CONFIG = {
    GOOGLE_MAPS_API_KEY: null, 
};

// 🟢 3. STORAGE KEYS
export const STORAGE_KEYS = {
    GOOGLE_MAPS_KEY: 'voltpath_maps_key',
};

// 🟢 4. THE LOADER (Best Practice Logic)
export const loadConfig = async () => {
    try {
        // A. Try Local Storage first (Fastest)
        const localKey = await AsyncStorage.getItem(STORAGE_KEYS.GOOGLE_MAPS_KEY);
        if (localKey) {
            CONFIG.GOOGLE_MAPS_API_KEY = localKey;
            console.log("✅ Config: Loaded Key from Storage");
        }

        // B. Sync with Backend (Updates Key if changed)
        try {
            const response = await fetch(`${API_BASE_URL}/config`);
            const data = await response.json();
            
            if (data.googleMapsApiKey && data.googleMapsApiKey !== localKey) {
                CONFIG.GOOGLE_MAPS_API_KEY = data.googleMapsApiKey;
                await AsyncStorage.setItem(STORAGE_KEYS.GOOGLE_MAPS_KEY, data.googleMapsApiKey);
                console.log("✅ Config: Synced New Key from Server");
            }
        } catch (serverErr) {
            console.warn("⚠️ Config: Server unreachable, using local key.");
        }
    } catch (e) {
        console.error("❌ Config Error:", e);
    }
};

export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const MAX_VOICE_LIMIT = 150;