import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics'; // 🟢 AUDIT FIX: Import Haptics

export default function HapticButton({ onPress, children, style, type = 'Light' }) {
  const handlePress = (e) => {
    // 🟢 AUDIT FIX: Trigger Haptic Feedback
    if (Platform.OS !== 'web') {
        if (type === 'Heavy') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } else if (type === 'Medium') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }
    
    if (onPress) onPress(e);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={style} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}