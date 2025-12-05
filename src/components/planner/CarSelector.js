import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const CarSelector = ({ label, value, placeholder, options, onSelect }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
      >
        <Text style={[styles.valueText, !value && styles.placeholderText]}>
          {value ? value.name : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vehicle</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.closeBtn}>Close</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={options}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={styles.carIcon}>🚗</Text>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>{item.name}</Text>
                    <Text style={styles.optionSubtitle}>
                      Range: {item.range} km • Eff: {item.efficiency} Wh/km
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  valueText: { fontSize: 16, color: colors.textPrimary },
  placeholderText: { color: colors.textSecondary },
  arrow: { fontSize: 16, color: colors.primary },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.backdrop,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  closeBtn: { color: colors.danger, fontSize: 16, fontWeight: '600' },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  carIcon: { fontSize: 24, marginRight: 12 },
  optionTextContainer: { flex: 1 },
  optionTitle: { fontSize: 16, color: colors.textPrimary, fontWeight: '500' },
  optionSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});

export default CarSelector;