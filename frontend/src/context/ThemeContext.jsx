import React, { createContext, useContext, useState, useEffect } from 'react';
import { THEME_KEY, darkTokens, lightTokens } from '../styles/tokens';

const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} });

function applyTokens(tokens) {
  const root = document.documentElement;
  Object.entries(tokens).forEach(([key, val]) => root.style.setProperty(key, val));
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    applyTokens(theme === 'dark' ? darkTokens : lightTokens);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
