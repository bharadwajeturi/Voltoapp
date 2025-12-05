import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { TABS, SCREENS } from './BottomTabParams';

import TripPlannerScreen from '../screens/TripPlannerScreen';
import RouteExplorerScreen from '../screens/RouteExplorerScreen';
import SmartPlannerScreen from '../screens/SmartPlannerScreen';
import NearMeScreen from '../screens/NearMeScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import ProfileScreen from '../screens/ProfileScreen';

const AppNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.TRIP_PLANNER);
  const [activeTab, setActiveTab] = useState(TABS.SMART); 

  const navigation = {
    navigate: (screen) => {
      if (screen === 'RouteExplorer') {
        setCurrentScreen(SCREENS.ROUTE_EXPLORER);
      } else {
        if (screen === 'SmartPlanner') setActiveTab(TABS.SMART);
        else setCurrentScreen(screen);
      }
    },
    goBack: () => {
      if (currentScreen === SCREENS.ROUTE_EXPLORER) {
        if (activeTab === TABS.SMART) {
           // Do nothing, maybe reset state
        } else {
           setCurrentScreen(SCREENS.TRIP_PLANNER);
        }
      }
    },
  };

  const renderScreen = () => {
    switch (activeTab) {
      case TABS.PLAN: return currentScreen === SCREENS.ROUTE_EXPLORER ? <RouteExplorerScreen navigation={navigation} /> : <TripPlannerScreen navigation={navigation} />;
      case TABS.SMART: 
        if (currentScreen === SCREENS.ROUTE_EXPLORER) return <RouteExplorerScreen navigation={navigation} />;
        return <SmartPlannerScreen navigation={navigation} />;
      case TABS.NEAR_ME: return <NearMeScreen />;
      case TABS.HELP: return <EmergencyScreen />;
      case TABS.PROFILE: return <ProfileScreen />;
      default: return <SmartPlannerScreen navigation={navigation} />;
    }
  };

  const TabButton = ({ label, icon, tabName }) => (
    <TouchableOpacity 
      style={styles.tabBtn} 
      onPress={() => {
        setActiveTab(tabName);
        setCurrentScreen(null); 
      }}
    >
      <Text style={[styles.tabIcon, activeTab === tabName && styles.activeTabIcon]}>{icon}</Text>
      <Text style={[styles.tabLabel, activeTab === tabName && styles.activeTabLabel]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>
      <View style={styles.tabBar}>
        <TabButton label="Manual" icon="🗺️" tabName={TABS.PLAN} />
        <TabButton label="Smart AI" icon="🤖" tabName={TABS.SMART} />
        <TabButton label="Near Me" icon="📍" tabName={TABS.NEAR_ME} />
        <TabButton label="Safety" icon="🛡️" tabName={TABS.HELP} />
        <TabButton label="Profile" icon="👤" tabName={TABS.PROFILE} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: colors.surface, paddingBottom: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border, height: 70 },
  tabBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { fontSize: 20, color: colors.textSecondary, marginBottom: 4 },
  tabLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  activeTabIcon: { color: colors.primary, transform: [{ scale: 1.1 }] },
  activeTabLabel: { color: colors.primary }
});

export default AppNavigator;