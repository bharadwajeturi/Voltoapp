import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { ThemeProvider } from '../src/theme/ThemeContext';

// --- SCREENS ---
import SmartPlannerScreen from '../src/screens/SmartPlannerScreen';
import RoutePlannerScreen from '../src/screens/RoutePlannerScreen';
import TripPlannerScreen from '../src/screens/TripPlannerScreen';
import NearMeScreen from '../src/screens/NearMeScreen';
import LoadingScreen from '../src/screens/LoadingScreen'; // 🟢 FIX: Import this!

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 🟢 TAB NAVIGATOR (The Main App)
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#334155',
          height: 60,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#2ECC71',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Route') iconName = focused ? 'map' : 'map-outline';
          else if (route.name === 'Stops') iconName = focused ? 'list' : 'list-outline';
          else if (route.name === 'Near Me') iconName = focused ? 'navigate' : 'navigate-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Route" component={RoutePlannerScreen} />
      <Tab.Screen name="Stops" component={TripPlannerScreen} />
      <Tab.Screen name="Near Me" component={NearMeScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NavigationContainer>
          <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            
            {/* 1. Start Here */}
            <Stack.Screen name="SmartPlanner" component={SmartPlannerScreen} />
            
            {/* 2. 🟢 FIX: Register the Loading Screen */}
            <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
            
            {/* 3. Go Here after 'Plan Trip' */}
            <Stack.Screen name="MainApp" component={MainTabNavigator} />
            
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}