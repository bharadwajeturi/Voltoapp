import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { openMaps, openGoogleSearch } from '../../utils/externalLinks'; 

// Amenity Helper
const AmenityIcon = ({ type }) => {
    let icon = 'star', color = '#94a3b8', label = type;
    const t = (type || '').toLowerCase();

    if (t.includes('food') || t.includes('cafe')) { icon = 'silverware-fork-knife'; color = '#F59E0B'; label='Food'; }
    else if (t.includes('wifi')) { icon = 'wifi'; color = '#3b82f6'; label='WiFi'; }
    else if (t.includes('toilet') || t.includes('restroom')) { icon = 'toilet'; color = '#EF4444'; label='Restroom'; }
    else if (t.includes('shop') || t.includes('store')) { icon = 'shopping'; color = '#8B5CF6'; label='Shop'; }
    else if (t.includes('hotel')) { icon = 'bed'; color = '#EC4899'; label='Stay'; }

    return (
        <View style={[styles.amenityChip, { borderColor: color, backgroundColor: `${color}15` }]}>
            <MaterialCommunityIcons name={icon} size={12} color={color} />
            <Text style={[styles.amenityText, { color }]}>{label}</Text>
        </View>
    );
};

export default function StationCard({ 
    station, 
    onPress, 
    onVerifyPress, 
    ActionComponent, 
    InfoComponent, 
    amenities = [], 
    showSpecs = true, 
    style 
}) {
    if (!station) return null;

    const name = station.name || "Unknown Station";
    const address = station.address || "Location unavailable";
    const power = station.powerkw || 0;
    const connector = station.connectorTypes?.[0] || "Unknown";
    const score = station.trustscore || 0;

    const getScoreColor = (s) => {
        if (s >= 80) return '#2ECC71'; 
        if (s >= 50) return '#F1C40F'; 
        return '#EF4444'; 
    };
    const scoreColor = getScoreColor(score);

    return (
        <TouchableOpacity 
            activeOpacity={0.9}
            onPress={onPress}
            style={[styles.card, style]}
        >
            {/* Header */}
            <View style={styles.headerRow}>
                <View style={styles.infoContainer}>
                    <Text style={styles.title} numberOfLines={1}>{name}</Text>
                    <Text style={styles.address} numberOfLines={1}>{address}</Text>
                </View>
                
                {/* Trust Score (Only show for Stations, not Start/End locations) */}
                {showSpecs && (
                    <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor}20`, borderColor: scoreColor }]}>
                        <Text style={[styles.scoreText, { color: scoreColor }]}>{Math.round(score)}</Text>
                    </View>
                )}
            </View>

            {/* 🟢 SPECS ROW (Hidden for Start/End) */}
            {showSpecs && (
                <View style={styles.specRow}>
                    <View style={styles.specItem}>
                        <Ionicons name="flash" size={14} color="#F1C40F" />
                        <Text style={styles.specText}>{power} kW</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.specItem}>
                        <MaterialCommunityIcons name="power-plug" size={14} color="#3b82f6" />
                        <Text style={styles.specText}>{connector}</Text>
                    </View>
                </View>
            )}

            {/* 🟢 INFO COMPONENT (Injected from Parent - e.g. "Start Point") */}
            {InfoComponent && (
                <View style={[styles.infoRow, !showSpecs && { marginTop: 0 }]}>
                    {InfoComponent}
                </View>
            )}

            {/* Amenities */}
            {amenities && amenities.length > 0 && showSpecs && (
                <View style={styles.amenityContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {amenities.slice(0, 5).map((a, i) => (
                            <AmenityIcon key={i} type={a.type || a} />
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* 🟢 FIXED: BUTTONS (2 Rows) */}
            <View style={styles.actionsWrapper}>
                
                {/* Row 1: Navigation Buttons */}
                <View style={styles.navRow}>
                    <TouchableOpacity style={styles.navBtn} onPress={() => openMaps(station.lat, station.lng, name)}>
                        <Ionicons name="navigate" size={16} color="#94a3b8" />
                        <Text style={styles.navBtnText}>Map</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.navBtn} onPress={() => openGoogleSearch(`${name} ${address}`)}>
                        <Ionicons name="logo-google" size={16} color="#94a3b8" />
                        <Text style={styles.navBtnText}>Google</Text>
                    </TouchableOpacity>
                </View>

                {/* Row 2: Action Buttons (Verify / Swap) */}
                <View style={styles.actionRow}>
                    {/* Verify */}
                    {onVerifyPress && (
                        <TouchableOpacity style={[styles.actionBtn, styles.verifyBtn]} onPress={onVerifyPress}>
                            <MaterialCommunityIcons name="check-decagram" size={18} color="#000" />
                            <Text style={styles.verifyText}>Verify</Text>
                        </TouchableOpacity>
                    )}
                    
                    {/* Swap (Injected) */}
                    {ActionComponent && (
                        <View style={{flex: 1, marginLeft: onVerifyPress ? 10 : 0}}>
                            {ActionComponent}
                        </View>
                    )}
                </View>

            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1e293b',
        borderRadius: 16,
        padding: 15,
        borderWidth: 1,
        borderColor: '#334155',
        marginBottom: 10,
        elevation: 4,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
    infoContainer: { flex: 1, marginRight: 10 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 2 },
    address: { fontSize: 12, color: '#94a3b8' },
    
    scoreBadge: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    scoreText: { fontSize: 11, fontWeight: 'bold' },

    specRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#0f172a', padding: 8, borderRadius: 8 },
    specItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    specText: { color: '#cbd5e1', fontSize: 12, fontWeight: '600' },
    divider: { width: 1, height: 12, backgroundColor: '#334155', marginHorizontal: 12 },

    infoRow: { marginBottom: 12 },

    amenityContainer: { flexDirection: 'row', marginBottom: 15, height: 28 },
    amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginRight: 8 },
    amenityText: { fontSize: 10, fontWeight: '600' },

    // 🟢 BUTTON STYLES
    actionsWrapper: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12, gap: 10 },
    
    // Row 1
    navRow: { flexDirection: 'row', gap: 10 },
    navBtn: { 
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        backgroundColor: '#0f172a', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#334155' 
    },
    navBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },

    // Row 2
    actionRow: { flexDirection: 'row' },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6 },
    verifyBtn: { backgroundColor: '#F59E0B' },
    verifyText: { color: '#000', fontSize: 13, fontWeight: 'bold' }
});