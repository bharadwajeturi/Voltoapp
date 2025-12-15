import { createContext, useContext, useState } from 'react';
import { StatusBar } from 'react-native';

// --- THEME DEFINITIONS ---
const themes = {
  colors: {
    mode: 'eco',
    background: '#F5F7FA', // Soft White
    surface: '#FFFFFF',
    text: '#1A202C',
    textSecondary: '#718096',
    primary: '#2ECC71',    // Leaf Green
    secondary: '#3498DB',
    accent: '#F1C40F',
    border: '#E2E8F0',
    shadow: '#000000',
    cardStyle: {
      borderRadius: 16,
      elevation: 2,
      shadowOpacity: 0.1,
    },
    statusBarStyle: 'dark-content',
  },
  premium: {
    mode: 'premium',
    background: '#0B0E14', // Midnight Black
    surface: '#151922',    // Deep Charcoal
    text: '#FFFFFF',
    textSecondary: '#A0AEC0',
    primary: '#FFD700',    // Electric Gold
    secondary: '#00F0FF',  // Cyber Cyan
    accent: '#FF0055',     // Neon Red
    border: '#2D3748',
    shadow: '#FFD700',     // Gold Glow
    cardStyle: {
      borderRadius: 8,     // Sharp Edges
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 0, 0.2)', // Subtle Gold Border
      shadowColor: '#FFD700',
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    statusBarStyle: 'light-content',
  }
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const theme = isPremium ? themes.premium : themes.colors;

  const toggleTheme = () => {
    setIsPremium(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, isPremium, toggleTheme }}>
      <StatusBar 
        barStyle={theme.statusBarStyle} 
        backgroundColor={theme.background} 
      />
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);