import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { TABS, SCREENS } from './BottomTabParams';
import { useTrip } from '../context/TripContext'; // Import the HOOK

import TripPlannerScreen from '../screens/TripPlannerScreen';
import RouteExplorerScreen from '../screens/RouteExplorerScreen';
import SmartPlannerScreen from '../screens/SmartPlannerScreen';
import NearMeScreen from '../screens/NearMeScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import ProfileScreen from '../screens/ProfileScreen';

const AppNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState(null); // specific stack screen overrides tab
  const [activeTab, setActiveTab] = useState(TABS.SMART); // Default to Smart Tab
  
  // Get validation status and trip details from Context
  const { isValidTrip, tripDetails } = useTrip();

  // Custom Navigation Function passed to screens
  const navigation = {
    navigate: (screen, params) => {
      // Logic for navigating to Route Explorer
      if (screen === SCREENS.ROUTE_EXPLORER) {
        setCurrentScreen(SCREENS.ROUTE_EXPLORER);
      } 
      // Logic for switching back to Smart Planner form
      else if (screen === 'SmartPlanner') {
        setActiveTab(TABS.SMART);
        setCurrentScreen(null); // Clear stack to show the main SmartPlanner screen
      }
      else {
        // General tab switching
        setCurrentScreen(null);
      }
    },
    goBack: () => {
      // If we are in RouteExplorer, going back depends on the active tab context
      if (currentScreen === SCREENS.ROUTE_EXPLORER) {
        if (activeTab === TABS.SMART) {
           setCurrentScreen(null); // Go back to Smart Planner Input
        } else {
           // If we were in Manual Planner, go back to Manual List
           setCurrentScreen(null); 
        }
      }
    },
    canGoBack: () => currentScreen !== null
  };

  const renderScreen = () => {
    // 1. If a specific stack screen is active (like RouteExplorer), show it overlaying the tab logic
    //    BUT we only want to show RouteExplorer if it belongs to the current flow.
    
    if (currentScreen === SCREENS.ROUTE_EXPLORER) {
        return <RouteExplorerScreen navigation={navigation} />;
    }

    // 2. Otherwise render the active Tab
    switch (activeTab) {
      case TABS.PLAN: 
        return <TripPlannerScreen navigation={navigation} />;
      
      case TABS.SMART: 
        // Logic: If Smart Tab is active, do we show Input Form or Result?
        // We handle this via the 'currentScreen' state above. 
        // If currentScreen is null, show Input Form.
        return <SmartPlannerScreen navigation={navigation} />;
      
      case TABS.NEAR_ME: return <NearMeScreen />;
      case TABS.HELP: return <EmergencyScreen />;
      case TABS.PROFILE: return <ProfileScreen />;
      default: return <SmartPlannerScreen navigation={navigation} />;
    }
  };

  const TabButton = ({ label, icon, tabName }) => {
    const handlePress = () => {
      if (tabName === TABS.SMART) {
          // *** CRITICAL LOGIC FLOW ***
          // If user clicks "Smart AI" tab:
          // 1. If a valid trip exists (isPlanned), go directly to Route Explorer (Result).
          // 2. Else, go to Smart Planner (Input).
          
          // Check if we have planned stops or a valid calculated route
          // For now, checking if start/end are set is a basic proxy, 
          // but ideally we check a flag like 'isRouteCalculated' in context.
          // Let's assume if we are already on the Smart Tab, we toggle or reset?
          
          // BETTER UX: Always go to Input first, unless we are explicitly "in a trip".
          // But per your request: "When we navigate to manual trip ... and again select smart ai button we should show route planner page"
          
          // Let's check if we have planned stops populated.
          if (tripDetails.plannedStops && tripDetails.plannedStops.length > 0) {
              setActiveTab(TABS.SMART);
              setCurrentScreen(SCREENS.ROUTE_EXPLORER);
          } else {
              setActiveTab(TABS.SMART);
              setCurrentScreen(null); // Show Input Form
          }
      } else {
          // Normal Tab Switch
          setActiveTab(tabName);
          setCurrentScreen(null); 
      }
    };

    return (
      <TouchableOpacity style={styles.tabBtn} onPress={handlePress}>
        <Text style={[styles.tabIcon, activeTab === tabName && styles.activeTabIcon]}>{icon}</Text>
        <Text style={[styles.tabLabel, activeTab === tabName && styles.activeTabLabel]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>
      <View style={styles.tabBar}>
        <TabButton label="Smart AI" icon="🤖" tabName={TABS.SMART} />
        <TabButton label="Manual" icon="🗺️" tabName={TABS.PLAN} />
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