export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textAlt: string;
    success: string;
    warning: string;
    error: string;
    shadow: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

export const theme: Theme = {
  colors: {
    primary: '#6366f1',
    secondary: '#a855f7',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    textAlt: '#94a3b8',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  radii: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px',
  },
}; 