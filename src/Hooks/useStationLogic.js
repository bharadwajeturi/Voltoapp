import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTripStore } from '../store/useTripStore'; 
import { API_BASE_URL } from '../config/constants';

export const useStationLogic = () => {
    // Global State
    const swapStation = useTripStore(state => state.swapStation);
    
    // Local State
    const [lazyAmenities, setLazyAmenities] = useState({});
    const [verifyModalVisible, setVerifyModalVisible] = useState(false);
    const [selectedForVerify, setSelectedForVerify] = useState(null);
    const [swapModalVisible, setSwapModalVisible] = useState(false);
    const [stationToSwap, setStationToSwap] = useState(null);

    // 🟢 1. FETCH AMENITIES (The Missing Function)
    const fetchAmenitiesForStation = async (station) => {
        // Guard Clauses: Don't fetch if missing ID, already fetched, or is a generic start/end point
        if (!station || !station.id || lazyAmenities[station.id]) return;
        if (station.id === 'trip_start' || station.id === 'trip_end') return;

        try {
            // console.log(`[LazyLoad] Fetching amenities for ${station.name}...`);
            const response = await axios.get(`${API_BASE_URL}/station/amenities`, {
                params: { stationId: station.id, lat: station.lat, lng: station.lng }
            });

            if (response.data && response.data.length > 0) {
                setLazyAmenities(prev => ({ 
                    ...prev, 
                    [station.id]: response.data 
                }));
            }
        } catch (error) {
            // Silently fail for amenities (it's not critical)
            // console.warn(`[LazyLoad] Failed for ${station.id}`, error.message);
        }
    };

    // 🟢 2. VERIFICATION LOGIC
    const handleVerificationSubmit = async (data) => {
        try {
            // A. Optimistic Save (Local Storage)
            const history = await AsyncStorage.getItem('pending_verifications');
            const parsed = history ? JSON.parse(history) : [];
            parsed.push(data);
            await AsyncStorage.setItem('pending_verifications', JSON.stringify(parsed));
            
            // B. Try Online Save
            await axios.post(`${API_BASE_URL}/verify`, data);
            
            // C. Cleanup if successful
            const remaining = parsed.filter(i => i.timestamp !== data.timestamp);
            await AsyncStorage.setItem('pending_verifications', JSON.stringify(remaining));
            
            Alert.alert("Success", "Station verified! Trust score updated.");
            setVerifyModalVisible(false);
        } catch (e) {
            Alert.alert("Saved Offline", "We'll sync this when you're back online.");
            setVerifyModalVisible(false);
        }
    };

    // 🟢 3. MODAL HANDLERS
    const handleVerifyPress = useCallback((station) => {
        if (!station) return;
        setSelectedForVerify(station);
        setVerifyModalVisible(true);
    }, []);

    const handleSwapPress = useCallback((station) => {
        if (!station) return;
        setStationToSwap(station);
        setSwapModalVisible(true);
    }, []);

    const handleSwapConfirm = useCallback((newStation) => {
        if (stationToSwap) {
            swapStation(stationToSwap.id, newStation);
            setSwapModalVisible(false);
        }
    }, [stationToSwap, swapStation]);

    // 🟢 4. EXPORT EVERYTHING
    return {
        // Data
        lazyAmenities,
        
        // Functions
        fetchAmenitiesForStation, // <--- THIS WAS MISSING
        handleVerificationSubmit,
        
        // Modal Control
        verifyModalVisible,
        setVerifyModalVisible,
        selectedForVerify,
        handleVerifyPress,

        // Swap Control
        swapModalVisible,
        setSwapModalVisible,
        stationToSwap,
        handleSwapPress,
        handleSwapConfirm,
    };
};