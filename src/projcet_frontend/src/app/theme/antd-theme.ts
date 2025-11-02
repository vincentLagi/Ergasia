import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

const { darkAlgorithm, defaultAlgorithm } = theme;

export const getAntdTheme = (isDark: boolean): ThemeConfig => ({
  algorithm: isDark ? darkAlgorithm : defaultAlgorithm,
  token: {
    // Modern elegant primary colors
    colorPrimary: '#6366f1', // Modern indigo-500
    colorSuccess: '#059669', // Emerald-600
    colorWarning: '#d97706', // Amber-600
    colorError: '#dc2626',   // Red-600
    colorInfo: '#2563eb',    // Blue-600
    
    // Typography
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    
    // Layout
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,
    borderRadiusXS: 4,
    
    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,
    
    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      paddingContentHorizontal: 16,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
      paddingInline: 12,
    },
    Card: {
      borderRadius: 12,
      paddingLG: 24,
    },
    Modal: {
      borderRadius: 12,
    },
    Drawer: {
      borderRadius: 12,
    },
    Table: {
      borderRadius: 8,
    },
    Tabs: {
      borderRadius: 8,
    },
  },
});

// Legacy export for backward compatibility
export const antdTheme = getAntdTheme(false);