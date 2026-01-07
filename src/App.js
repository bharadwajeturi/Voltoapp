import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from './theme/ThemeContext'; 
import AppNavigator from './navigation/AppNavigator'; 

// 🟢 1. IMPORT LOAD CONFIG
import { loadConfig } from './config/constants';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  // 🟢 2. LOAD CONFIG ON STARTUP (With Error Handling)
  useEffect(() => {
    const initApp = async () => {
      try {
        await loadConfig(); // Wait for Keys from Storage/Server
      } catch (error) {
        console.error("Failed to load config:", error);
        // Optional: You could show an Alert here if critical keys are missing
      } finally {
        setIsReady(true);   // 🟢 Always unlock the app, even if config fails
      }
    };
    initApp();
  }, []);

  // 🟢 3. SHOW SPLASH/LOADER WHILE WAITING
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ECC71" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        {/* 🟢 Set Status Bar to Light for Dark Mode Theme */}
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});