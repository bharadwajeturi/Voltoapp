import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function GreenScoreStars({ score }) {
  // Convert 0-100 score to 0-5 stars
  const stars = Math.max(1, Math.round((score / 100) * 5));
  
  // Color Logic
  const getColor = () => {
      if (score >= 80) return '#2ECC71'; // Green
      if (score >= 50) return '#F1C40F'; // Yellow
      return '#E74C3C'; // Red
  };

  return (
    <View style={styles.container}>
      {[...Array(5)].map((_, i) => (
        <Ionicons 
            key={i} 
            name={i < stars ? "star" : "star-outline"} 
            size={14} 
            color={i < stars ? getColor() : "#475569"} 
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 2 }
});