import { useState, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

export const useMapAnimation = () => {
    const [collapsed, setCollapsed] = useState(false);
    const mapHeight = useRef(new Animated.Value(height * 0.45)).current;

    const handleScroll = (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if (offsetY > 50 && !collapsed) {
            setCollapsed(true);
            Animated.timing(mapHeight, { 
                toValue: height * 0.25, 
                duration: 300, 
                useNativeDriver: false 
            }).start();
        } else if (offsetY < 0 && collapsed) {
            setCollapsed(false);
            Animated.timing(mapHeight, { 
                toValue: height * 0.45, 
                duration: 300, 
                useNativeDriver: false 
            }).start();
        }
    };

    return { mapHeight, handleScroll };
};