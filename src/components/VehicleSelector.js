import React, { useState, useEffect } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, 
    TextInput, ActivityIndicator, Dimensions 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';

const { height } = Dimensions.get('window');

export default function VehicleSelector({ selectedVehicle, onSelect }) {
    const [modalVisible, setModalVisible] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch vehicles when the component mounts
    useEffect(() => {
        fetchVehicles();
    }, []);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            // 🟢 REPLACE WITH YOUR COMPUTER'S LOCAL IP ADDRESS
            // Example: http://192.168.1.5:3000/api/vehicles
            const res = await axios.get('http://192.168.0.136:3000/api/vehicles'); 
            setVehicles(res.data);
            setFiltered(res.data);
        } catch (e) {
            console.error("Failed to load vehicles", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (text) => {
        setSearch(text);
        if (!text) {
            setFiltered(vehicles);
        } else {
            const lower = text.toLowerCase();
            const f = vehicles.filter(v => 
                v.brand.toLowerCase().includes(lower) || 
                v.model.toLowerCase().includes(lower)
            );
            setFiltered(f);
        }
    };

    const handleSelect = (item) => {
        onSelect(item);
        setModalVisible(false);
        setSearch(''); // Reset search
        setFiltered(vehicles); // Reset list
    };

    return (
        <View>
            {/* 🟢 Trigger Button (Visible on Screen) */}
            <TouchableOpacity 
                style={styles.selectorBtn} 
                onPress={() => setModalVisible(true)}
            >
                <View style={styles.btnLeft}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="car-sport" size={20} color="#3b82f6" />
                    </View>
                    <View>
                        <Text style={styles.label}>SELECTED VEHICLE</Text>
                        <Text style={styles.value} numberOfLines={1}>
                            {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : "Select Your EV"}
                        </Text>
                    </View>
                </View>
                <Ionicons name="chevron-down" size={20} color="#64748b" />
            </TouchableOpacity>

            {/* 🟢 Search Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Electric Vehicle</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color="#94a3b8" />
                            </TouchableOpacity>
                        </View>

                        {/* Search Bar */}
                        <View style={styles.searchBox}>
                            <Ionicons name="search" size={20} color="#64748b" />
                            <TextInput 
                                style={styles.input} 
                                placeholder="Search Brand or Model..." 
                                placeholderTextColor="#64748b"
                                value={search}
                                onChangeText={handleSearch}
                                autoCorrect={false}
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => handleSearch('')}>
                                    <Ionicons name="close-circle" size={18} color="#64748b" />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Vehicle List */}
                        {loading ? (
                            <View style={styles.centerLoader}>
                                <ActivityIndicator size="large" color="#3b82f6" />
                                <Text style={styles.loadingText}>Loading Catalog...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filtered}
                                keyExtractor={item => item.id}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingBottom: 20 }}
                                renderItem={({item}) => (
                                    <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)}>
                                        <View style={styles.itemInfo}>
                                            <Text style={styles.brandText}>{item.brand}</Text>
                                            <Text style={styles.modelText}>{item.model}</Text>
                                        </View>
                                        <View style={styles.specBadge}>
                                            <MaterialCommunityIcons name="lightning-bolt" size={12} color="#3b82f6" />
                                            <Text style={styles.specText}>{item.batteryKwh} kWh</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ItemSeparatorComponent={() => <View style={styles.separator} />}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>No vehicles found matching "{search}"</Text>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    // Trigger Button
    selectorBtn: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#1e293b', padding: 12, borderRadius: 16, 
        borderWidth: 1, borderColor: '#334155', marginBottom: 20
    },
    btnLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    iconCircle: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(59, 130, 246, 0.1)',
        justifyContent: 'center', alignItems: 'center'
    },
    label: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5, marginBottom: 2 },
    value: { color: '#fff', fontSize: 16, fontWeight: '600' },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { 
        height: height * 0.75, backgroundColor: '#0f172a', 
        borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.5, shadowRadius: 10
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    closeBtn: { padding: 5 },
    
    // Search
    searchBox: { 
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', 
        paddingHorizontal: 12, borderRadius: 12, height: 50, marginBottom: 15,
        borderWidth: 1, borderColor: '#334155'
    },
    input: { flex: 1, color: '#fff', marginLeft: 10, fontSize: 16 },

    // List Items
    item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
    itemInfo: { flex: 1 },
    brandText: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    modelText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    
    specBadge: { 
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.2)' 
    },
    specText: { color: '#3b82f6', fontSize: 12, fontWeight: 'bold' },
    
    separator: { height: 1, backgroundColor: '#1e293b' },
    
    // States
    centerLoader: { marginTop: 50, alignItems: 'center' },
    loadingText: { color: '#64748b', marginTop: 10 },
    emptyText: { color: '#64748b', textAlign: 'center', marginTop: 30, fontSize: 16 }
});