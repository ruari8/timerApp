// Warm, amber-toned dark theme inspired by old clocks and candlelight
export const theme = {
  colors: {
    // Backgrounds
    background: '#0D0D0D',
    backgroundSecondary: '#1A1A1A',
    backgroundTertiary: '#252525',
    card: '#1F1F1F',
    
    // Primary accent - warm amber
    primary: '#F59E0B',
    primaryLight: '#FBBF24',
    primaryDark: '#D97706',
    
    // Text
    text: '#FAFAFA',
    textSecondary: '#A3A3A3',
    textMuted: '#525252',
    
    // Segment colors
    work: '#E85D04',
    rest: '#2D6A4F',
    sprint: '#D90429',
    walk: '#4361EE',
    
    // Status
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    // Borders
    border: '#2E2E2E',
    borderLight: '#3D3D3D',
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
    timer: 72,
  },
  
  fontFamily: {
    regular: 'System',
    mono: 'Menlo',
  },
};

export type Theme = typeof theme;

