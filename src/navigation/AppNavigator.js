import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import SmartPlannerScreen from '../screens/SmartPlannerScreen';
import RoutePlannerScreen from '../screens/RoutePlannerScreen';
import TripPlannerScreen from '../screens/TripPlannerScreen';
import NearMeScreen from '../screens/NearMeScreen';
import { useTheme } from '../theme/ThemeContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TripTabs() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'map';
          if (route.name === 'RoutePlanner') iconName = focused ? 'map' : 'map-outline';
          if (route.name === 'TripPlanner') iconName = focused ? 'list' : 'list-outline';
          if (route.name === 'NearMe') iconName = focused ? 'navigate' : 'navigate-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="RoutePlanner" component={RoutePlannerScreen} options={{ title: 'Map' }} />
      <Tab.Screen name="TripPlanner" component={TripPlannerScreen} options={{ title: 'Stops' }} />
      <Tab.Screen name="NearMe" component={NearMeScreen} options={{ title: 'Near Me' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useTheme();

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Gatekeeper: Start here */}
        <Stack.Screen name="SmartPlanner" component={SmartPlannerScreen} />
        {/* Main Dashboard: Map, List, Near Me */}
        <Stack.Screen name="TripDashboard" component={TripTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}