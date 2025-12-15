import React from 'react';
import { TouchableOpacity } from 'react-native';

export default function HapticButton({ onPress, children, style }) {
  const handlePress = (e) => {
    if (onPress) onPress(e);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={style} activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}