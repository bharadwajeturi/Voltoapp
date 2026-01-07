import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StationCard from '../common/StationCard';

export default function TripTimelineItem({ item, index, isLast, onVerify, onSwap, amenities }) {
    const isStart = item.type === 'START';
    const isEnd = item.type === 'DESTINATION';
    
    // SOC Logic
    const soc = item.arrivalSOC;
    const socColor = soc < 20 ? '#EF4444' : soc < 40 ? '#F59E0B' : '#2ECC71';
    
    // Time Formatting
    const currentTime = new Date();
    const toTime = (dateObj) => dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

    const arrivalDate = item.arrivalTime ? new Date(item.arrivalTime) : new Date(currentTime.getTime() + (item.accumulatedTimeMin || 0) * 60000);
    const arrivalTimeStr = item.arrivalTime && !item.arrivalTime.includes('T') ? item.arrivalTime : toTime(arrivalDate);
    const startTimeStr = item.startTime || toTime(currentTime);
    const distance = Math.round(item.distanceFromLast || 0);

    // 🟢 CASE 1: START POINT OR DESTINATION (Always Simple Layout)
    // We force 'isEnd' to use this layout, even if it's a charger.
    if (isStart || isEnd) {
        return (
            <View style={styles.timelineItem}>
                {!isLast && <View style={[styles.timelineLine, { backgroundColor: '#334155' }]} />}
                <View style={[styles.nodeCard, isStart ? styles.startBorder : styles.endBorder]}>
                    <View style={styles.nodeContent}>
                        <View style={styles.nodeLeft}>
                            <View style={[styles.iconBox, { backgroundColor: isStart ? 'rgba(46, 204, 113, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                                <Ionicons name={isStart ? "location" : "flag"} size={24} color={isStart ? "#2ECC71" : "#EF4444"} />
                            </View>
                            <View style={{flex: 1, marginLeft: 12}}>
                                <Text style={styles.nodeLabel}>{isStart ? "STARTING POINT" : "DESTINATION"}</Text>
                                <Text style={styles.nodeTitle} numberOfLines={2}>{item.station.name}</Text>
                                <Text style={styles.nodeTime}>
                                    {isStart ? `Depart: ${startTimeStr}` : `Arrive: ${arrivalTimeStr}`}
                                </Text>
                                
                                {/* 🟢 Optional: Show Charging Details cleanly if Destination Charging is ON */}
                                {isEnd && item.chargeTime > 0 && (
                                    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                                        <Ionicons name="flash" size={10} color="#3b82f6" />
                                        <Text style={{color: '#94a3b8', fontSize: 11, marginLeft: 4}}>
                                            Charge to {item.targetSOC}% ({item.chargeTime}m)
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={[styles.circleBadge, { borderColor: socColor }]}>
                            <Text style={[styles.circleSoc, { color: socColor }]}>{Math.round(soc)}%</Text>
                            <Text style={styles.circleLabel}>SOC</Text>
                            {!isStart && <Text style={styles.circleDist}>{distance}km</Text>}
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // 🟢 CASE 2: INTERMEDIATE CHARGER (Detailed Card with Swap/Verify)
    // Only used for stops BETWEEN Start and End
    return (
        <View style={styles.timelineItem}>
            {!isLast && <View style={[styles.timelineLine, { backgroundColor: '#334155' }]} />}
            
            <StationCard 
                station={item.station}
                amenities={amenities}
                onVerifyPress={onVerify}
                ActionComponent={
                    <TouchableOpacity style={styles.swapButton} onPress={onSwap}>
                        <Ionicons name="swap-horizontal" size={16} color="#fff" />
                        <Text style={styles.swapText}>Swap Station</Text>
                    </TouchableOpacity>
                }
                InfoComponent={
                    <View style={{flexDirection:'row', gap:5, alignItems:'center'}}>
                         <Ionicons name="battery-charging" size={14} color={item.arrivalSOC < 20 ? '#EF4444' : '#2ECC71'} />
                         <Text style={{color:'#fff', fontSize:12, fontWeight:'bold'}}>{item.arrivalSOC}% Arr</Text>
                         <Text style={{color:'#64748b', fontSize:12}}> • </Text>
                         <Ionicons name="time-outline" size={14} color="#3b82f6" />
                         <Text style={{color:'#fff', fontSize:12}}>{item.chargeTime}m Chg</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    timelineItem: { marginBottom: 20 },
    timelineLine: { position: 'absolute', left: 22, top: 20, bottom: -30, width: 2, zIndex: -1 },
    nodeCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 10, borderWidth: 1, elevation: 4 },
    startBorder: { borderColor: '#2ECC71' },
    endBorder: { borderColor: '#E74C3C' },
    nodeContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    nodeLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    nodeLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
    nodeTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    nodeTime: { color: '#cbd5e1', fontSize: 12 },
    circleBadge: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
    circleSoc: { fontSize: 14, fontWeight: 'bold' },
    circleLabel: { fontSize: 8, color: '#64748b' },
    circleDist: { fontSize: 9, color: '#94a3b8', marginTop: 1 },
    swapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', paddingVertical: 8, borderRadius: 8, gap: 6, marginTop: 5 },
    swapText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});