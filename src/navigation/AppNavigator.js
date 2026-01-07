import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import SmartPlannerScreen from '../screens/SmartPlannerScreen';
import RoutePlannerScreen from '../screens/RoutePlannerScreen';
import NearMeScreen from '../screens/NearMeScreen';
import LoadingScreen from '../screens/LoadingScreen'; 
import HelpScreen from '../screens/HelpScreen'; 

import { useTheme } from '../theme/ThemeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const PremiumScreen = () => (
    <View style={{flex:1, backgroundColor:'#0f172a', justifyContent:'center', alignItems:'center'}}>
        <Text style={{color:'#fff', fontWeight:'bold', fontSize: 18}}>Premium Subscription</Text>
    </View>
);

// 🟢 1. DASHBOARD TABS (Visible ONLY AFTER planning a trip)
function TripDashboard() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface || '#1e293b', 
          borderTopWidth: 0,
          elevation: 10,
          height: 60,
          paddingBottom: 8
        },
        tabBarActiveTintColor: theme.primary || '#2ECC71',
        tabBarInactiveTintColor: theme.textSecondary || '#64748b',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          
          if (route.name === 'RoutePlanner') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'NearMe') iconName = focused ? 'location' : 'location-outline';
          else if (route.name === 'HelpHub') iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          else if (route.name === 'Premium') iconName = focused ? 'diamond' : 'diamond-outline';
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* 🟢 Merged Screen: Map + List */}
      <Tab.Screen 
        name="RoutePlanner" 
        component={RoutePlannerScreen} 
        options={{ title: 'Route' }} 
      />
      
      <Tab.Screen 
        name="NearMe" 
        component={NearMeScreen} 
        options={{ title: 'Near Me' }} 
      />
      
      <Tab.Screen 
        name="HelpHub" 
        component={HelpScreen} 
        options={{ title: 'Assistant' }} 
      />

      <Tab.Screen 
        name="Premium" 
        component={PremiumScreen} 
        options={{ title: 'Premium' }} 
      />
    </Tab.Navigator>
  );
}

// 🟢 2. ROOT NAVIGATOR (The Stack)
export default function AppNavigator() {
  const navigationTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: '#0f172a' },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="SmartPlanner">
        
        {/* 1. START HERE: Full Screen Planner */}
        <Stack.Screen name="SmartPlanner" component={SmartPlannerScreen} />

        {/* 2. GO HERE: Dashboard (Tabs) */}
        <Stack.Screen name="TripDashboard" component={TripDashboard} />

        {/* Utilities */}
        <Stack.Screen 
            name="Loading" 
            component={LoadingScreen} 
            options={{ presentation: 'transparentModal' }}
        />
        
        {/* 3. HELP SCREEN (Standalone Stack Version for SmartPlanner) */}
        <Stack.Screen name="HelpHub" component={HelpScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}