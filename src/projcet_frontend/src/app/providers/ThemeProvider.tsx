import React, { createContext, useContext, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import { useAtom } from 'jotai';
import { themeAtom } from '../store/ui';
import { getAntdTheme } from '../theme/antd-theme';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useAtom(themeAtom);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    // Apply theme to document root
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Update data attribute for CSS - this will trigger the CSS file theming
    root.setAttribute('data-theme', theme);
    
    // Debug: Check if CSS variables are being applied
    console.log('Theme applied:', theme);
    console.log('Background color:', getComputedStyle(root).getPropertyValue('--background'));
    console.log('Computed background:', getComputedStyle(root).backgroundColor);
  }, [theme]);

  const contextValue: ThemeContextType = {
    theme,
    toggleTheme,
  };

  const currentTheme = getAntdTheme(theme === 'dark');
  return (
    <ThemeContext.Provider value={contextValue}>
      <ConfigProvider theme={currentTheme}>
        <div className={`min-h-screen transition-colors duration-200 ${theme}`}>
          {children}
        </div>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};