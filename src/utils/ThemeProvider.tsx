'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
};

// Provide default values to avoid errors during server rendering
const defaultThemeContext: ThemeContextType = {
  isDarkMode: false,
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle theme initialization
  useEffect(() => {
    // Set mounted to true when the component mounts
    setMounted(true);
    
    // Try to get theme from localStorage first
    try {
      const storedTheme = localStorage.getItem('theme');
      
      if (storedTheme) {
        setIsDarkMode(storedTheme === 'dark');
      } else {
        // Fall back to system preference if no stored theme
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDarkMode(mediaQuery.matches);
        
        const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
      }
    } catch (error) {
      // Handle case where localStorage might not be available (e.g., SSR)
      console.warn('Could not access localStorage for theme:', error);
    }
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev;
      // Store theme preference in localStorage
      try {
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      } catch (error) {
        console.warn('Could not save theme to localStorage:', error);
      }
      return newTheme;
    });
  };

  // Provide value from state or default
  const themeContextValue = {
    isDarkMode,
    toggleTheme
  };

  // Always render the ThemeContext.Provider, but only add the "dark" class if mounted
  // This prevents hydration issues while still providing access to the theme context
  return (
    <ThemeContext.Provider value={themeContextValue}>
      <div className={mounted && isDarkMode ? 'dark' : ''}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
} 