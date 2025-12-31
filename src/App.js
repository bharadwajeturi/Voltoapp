import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { ThemeProvider } from './theme/ThemeContext'; 

// 🟢 IMPORT CORRECT NAVIGATOR
import AppNavigator from './navigation/AppNavigator'; 

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        {/* 🟢 Load the Single Source of Truth Navigator */}
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}