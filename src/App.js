import React from 'react';
import { LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from '../src/navigation/AppNavigator';
import { TripProvider } from '../src/context/TripContext';
import { RouteProvider } from '../src/Hooks/useRoute'; // ✅ IMPORT PROVIDER

LogBox.ignoreLogs(['Non-serializable values']);

export default function App() {
  return (
    <NavigationContainer>
      <TripProvider>
        <RouteProvider>  {/* ✅ WRAP APP */}
          <AppNavigator />
        </RouteProvider>
      </TripProvider>
    </NavigationContainer>
  );
}
