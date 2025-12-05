import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import PrimaryButton from '../components/common/PrimaryButton';

const EmergencyScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Safety Net 🛡️</Text>
        <Text style={styles.subtitle}>Help is nearby.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Help Bot Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 Troubleshooting Bot</Text>
          <Text style={styles.cardBody}>
            Car won't start? Screen blank? Follow our quick decision tree to fix common EV issues.
          </Text>
          <TouchableOpacity style={styles.secondaryBtn}>
            <Text style={styles.secondaryBtnText}>Start Diagnostic</Text>
          </TouchableOpacity>
        </View>

        {/* P2P Emergency Charge */}
        <View style={[styles.card, styles.p2pCard]}>
          <Text style={styles.cardTitle}>🆘 Emergency Charge</Text>
          <Text style={styles.cardBody}>
            Stranded with 0%? Broadcast a request to VoltPath users within 5km for a quick top-up.
          </Text>
          <PrimaryButton title="Request Help (Broadcast)" onPress={() => alert('Broadcasting...')} />
          <Text style={styles.disclaimer}>
            *VoltPath connects you to helpers. Please settle any payments via UPI directly.
          </Text>
        </View>

        {/* Official Support */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📞 Roadside Assistance</Text>
          <View style={styles.row}>
            <Text style={styles.phone}>1800-123-VOLT</Text>
            <TouchableOpacity style={styles.callBtn}>
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 40, backgroundColor: colors.surface },
  title: { fontSize: 28, fontWeight: 'bold', color: colors.textPrimary },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
  content: { padding: 16 },
  
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  p2pCard: { borderColor: colors.danger, borderWidth: 1 },
  
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  cardBody: { fontSize: 14, color: colors.textSecondary, marginBottom: 16, lineHeight: 20 },
  disclaimer: { fontSize: 12, color: colors.textSecondary, fontStyle: 'italic', marginTop: 12, textAlign: 'center' },
  
  secondaryBtn: { paddingVertical: 12, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, alignItems: 'center' },
  secondaryBtnText: { color: colors.primary, fontWeight: 'bold' },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  phone: { fontSize: 20, color: colors.textPrimary, fontWeight: 'bold' },
  callBtn: { backgroundColor: colors.success, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  callBtnText: { color: '#000', fontWeight: 'bold' }
});

export default EmergencyScreen;