import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useTripStore } from '../store/useTripStore'; // Adjust path if needed
import { API_BASE_URL } from '../config/constants';

export const useStationLogic = () => {
    const swapStation = useTripStore(state => state.swapStation);
    
    const [lazyAmenities, setLazyAmenities] = useState({});
    
    // UI State for Modals
    const [verifyModalVisible, setVerifyModalVisible] = useState(false);
    const [selectedForVerify, setSelectedForVerify] = useState(null);
    const [swapModalVisible, setSwapModalVisible] = useState(false);
    const [stationToSwap, setStationToSwap] = useState(null);

    // 1. Fetch Amenities
    const fetchAmenitiesForStation = async (station) => {
        if (!station.id || lazyAmenities[station.id] || station.id === 'trip_start' || station.id === 'trip_end') return;
        try {
            const response = await axios.get(`${API_BASE_URL}/station/amenities`, {
                params: { stationId: station.id, lat: station.lat, lng: station.lng }
            });
            if (response.data && response.data.length > 0) {
                setLazyAmenities(prev => ({ ...prev, [station.id]: response.data }));
            }
        } catch (e) { }
    };

    // 2. Submit Verification
    const handleVerificationSubmit = async (data) => {
        try {
            const existing = await AsyncStorage.getItem('pending_verifications');
            const parsed = existing ? JSON.parse(existing) : [];
            parsed.push(data);
            await AsyncStorage.setItem('pending_verifications', JSON.stringify(parsed));
            await axios.post(`${API_BASE_URL}/station/verify`, data);
            const remaining = parsed.filter(i => i.timestamp !== data.timestamp);
            await AsyncStorage.setItem('pending_verifications', JSON.stringify(remaining));
            Alert.alert("Success", "Station verified! Trust score updated.");
        } catch (e) {
            Alert.alert("Saved Offline", "We'll sync this when you're back online.");
        }
    };

    // 3. Modal Handlers
    const handleSwapPress = useCallback((station) => {
        setStationToSwap(station);
        setSwapModalVisible(true);
    }, []);

    const handleVerifyPress = useCallback((station) => {
        setSelectedForVerify(station);
        setVerifyModalVisible(true);
    }, []);

    const handleSwapConfirm = useCallback((newStation) => {
        if (stationToSwap) {
            swapStation(stationToSwap.id, newStation);
            setSwapModalVisible(false);
        }
    }, [stationToSwap]);

    return {
        lazyAmenities,
        fetchAmenitiesForStation,
        handleVerificationSubmit,
        verifyModalVisible,
        setVerifyModalVisible,
        selectedForVerify,
        swapModalVisible,
        setSwapModalVisible,
        stationToSwap,
        handleSwapPress,
        handleVerifyPress,
        handleSwapConfirm
    };
};