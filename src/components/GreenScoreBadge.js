import { StyleSheet, Text, View } from 'react-native';

export default function GreenScoreBadge({ score }) {
  const getColor = (s) => {
    if (s >= 80) return '#2ECC71'; // Green
    if (s >= 60) return '#F1C40F'; // Yellow
    if (s >= 40) return '#E67E22'; // Orange
    return '#E74C3C'; // Red
  };

  const color = getColor(score || 0);

  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <Text style={[styles.text, { color: color }]}>{score || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  text: { fontSize: 12, fontWeight: 'bold' }
});