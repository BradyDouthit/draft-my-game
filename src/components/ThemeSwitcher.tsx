import React, { useState, useEffect } from 'react';
import { useTheme } from '@/utils/ThemeProvider';

export default function ThemeSwitcher() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state when component mounts
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render anything until after component mounts to avoid hydration issues
  if (!mounted) {
    return null;
  }
  
  return (
    <button
      onClick={toggleTheme}
      className={`
        fixed top-4 right-4 z-50 p-2 rounded-full 
        transition-colors duration-200 
        bg-[var(--surface)] border border-[var(--border)] shadow-md 
        ${isDarkMode 
          ? 'hover:bg-[#3a3a3a]' 
          : 'hover:bg-gray-200 hover:text-[var(--text-primary)]'
        }
      `}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? (
        // Sun icon for when in dark mode (switching to light)
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-[var(--text-primary)] transition-colors" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
          />
        </svg>
      ) : (
        // Moon icon for when in light mode (switching to dark)
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-[var(--text-primary)] transition-colors" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
          />
        </svg>
      )}
    </button>
  );
} 