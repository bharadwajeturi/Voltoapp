import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

export default function CrisisModeButton() {
  const [visible, setVisible] = useState(false);
  const { theme } = useTheme();

  return (
    <>
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setVisible(true)}
      >
        <Ionicons name="warning" size={24} color="#fff" />
        <Text style={styles.fabText}>HELP</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.title, { color: '#E74C3C' }]}>CRISIS MODE</Text>
            
            <TouchableOpacity style={styles.option}>
              <Ionicons name="construct" size={24} color={theme.text} />
              <View style={{ marginLeft: 15 }}>
                <Text style={[styles.optTitle, { color: theme.text }]}>Car Won't Start</Text>
                <Text style={{ color: theme.textSecondary }}>Offline Troubleshoot Guide</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.option}>
              <Ionicons name="people" size={24} color={theme.text} />
              <View style={{ marginLeft: 15 }}>
                <Text style={[styles.optTitle, { color: theme.text }]}>P2P Rescue (V2L)</Text>
                <Text style={{ color: theme.textSecondary }}>Find nearby EV owners</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.closeBtn, { backgroundColor: theme.background }]} 
              onPress={() => setVisible(false)}
            >
              <Text style={{ color: theme.text }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', bottom: 100, right: 20, 
    backgroundColor: '#E74C3C', borderRadius: 30, 
    paddingVertical: 12, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', elevation: 5
  },
  fabText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  optTitle: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { marginTop: 20, padding: 15, borderRadius: 10, alignItems: 'center' }
});