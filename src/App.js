import React from 'react';
import { StatusBar } from 'react-native';
import { TripProvider } from './context/TripContext';
import AppNavigator from './navigation/AppNavigator';
import { colors } from './theme/colors';

// This is the main entry point
export default function App() {
  return (
    // 1. Wrap the app in the Context Provider so state is global
    <TripProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {/* 2. Load the Navigator */}
      <AppNavigator />
    </TripProvider>
  );
}