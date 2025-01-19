import { colors, typography, spacing, borderRadius, shadows } from './tokens'

// Base component themes that adapt to light/dark mode
export const componentThemes = {
  // Button variants
  button: {
    base: {
      padding: `${spacing[2]} ${spacing[4]}`,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSizes.sm,
      fontWeight: typography.fontWeights.medium,
      transition: 'all 0.2s ease-in-out',
    },
    primary: (theme) => ({
      background: theme.colors.primary[500],
      color: 'white',
      '&:hover': {
        background: theme.colors.primary[600],
      },
      '&:active': {
        background: theme.colors.primary[700],
      },
      '&:disabled': {
        background: theme.colors.neutral[300],
        color: theme.colors.neutral[500],
      },
    }),
    secondary: (theme) => ({
      background: theme.isDark ? colors.neutral[800] : colors.neutral[100],
      color: theme.isDark ? colors.neutral[100] : colors.neutral[800],
      '&:hover': {
        background: theme.isDark ? colors.neutral[700] : colors.neutral[200],
      },
    }),
    ghost: (theme) => ({
      background: 'transparent',
      color: theme.colors.primary[500],
      '&:hover': {
        background: theme.isDark ? colors.neutral[800] : colors.neutral[100],
      },
    }),
  },

  // Input fields
  input: {
    base: {
      width: '100%',
      padding: `${spacing[2]} ${spacing[3]}`,
      borderRadius: borderRadius.md,
      fontSize: typography.fontSizes.sm,
      transition: 'all 0.2s ease-in-out',
    },
    default: (theme) => ({
      background: theme.isDark ? colors.neutral[800] : 'white',
      border: `1px solid ${theme.isDark ? colors.neutral[700] : colors.neutral[300]}`,
      color: theme.isDark ? colors.neutral[100] : colors.neutral[900],
      '&:focus': {
        borderColor: theme.colors.primary[500],
        boxShadow: `0 0 0 1px ${theme.colors.primary[500]}`,
      },
      '&::placeholder': {
        color: theme.isDark ? colors.neutral[600] : colors.neutral[400],
      },
    }),
    error: (theme) => ({
      borderColor: theme.colors.error[500],
      '&:focus': {
        boxShadow: `0 0 0 1px ${theme.colors.error[500]}`,
      },
    }),
  },

  // Card components
  card: {
    base: {
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
    },
    default: (theme) => ({
      background: theme.isDark ? colors.neutral[800] : 'white',
      border: `1px solid ${theme.isDark ? colors.neutral[700] : colors.neutral[200]}`,
      boxShadow: theme.isDark ? 'none' : shadows.md,
    }),
    hover: (theme) => ({
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: theme.isDark ? `0 4px 12px ${colors.neutral[900]}` : shadows.lg,
      },
    }),
  },

  // Modal/Dialog
  modal: {
    overlay: (theme) => ({
      background: theme.isDark 
        ? 'rgba(0, 0, 0, 0.7)' 
        : 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(4px)',
    }),
    content: (theme) => ({
      background: theme.isDark ? colors.neutral[800] : 'white',
      borderRadius: borderRadius.xl,
      boxShadow: theme.isDark 
        ? `0 8px 32px rgba(0, 0, 0, 0.4)` 
        : shadows['2xl'],
      border: `1px solid ${theme.isDark ? colors.neutral[700] : colors.neutral[200]}`,
    }),
  },

  // Form elements
  form: {
    label: (theme) => ({
      color: theme.isDark ? colors.neutral[300] : colors.neutral[700],
      fontSize: typography.fontSizes.sm,
      fontWeight: typography.fontWeights.medium,
      marginBottom: spacing[1],
    }),
    helperText: (theme) => ({
      color: theme.isDark ? colors.neutral[400] : colors.neutral[600],
      fontSize: typography.fontSizes.xs,
      marginTop: spacing[1],
    }),
    errorText: (theme) => ({
      color: theme.colors.error[500],
      fontSize: typography.fontSizes.xs,
      marginTop: spacing[1],
    }),
  },

  // Navigation
  nav: {
    item: (theme) => ({
      padding: `${spacing[2]} ${spacing[3]}`,
      color: theme.isDark ? colors.neutral[300] : colors.neutral[700],
      borderRadius: borderRadius.md,
      '&:hover': {
        background: theme.isDark ? colors.neutral[700] : colors.neutral[100],
        color: theme.isDark ? colors.neutral[100] : colors.neutral[900],
      },
      '&.active': {
        background: theme.isDark ? colors.primary[900] : colors.primary[50],
        color: theme.colors.primary[500],
      },
    }),
  },

  // Table styles
  table: {
    header: (theme) => ({
      background: theme.isDark ? colors.neutral[900] : colors.neutral[50],
      borderBottom: `1px solid ${theme.isDark ? colors.neutral[700] : colors.neutral[200]}`,
      color: theme.isDark ? colors.neutral[300] : colors.neutral[700],
      fontSize: typography.fontSizes.sm,
      fontWeight: typography.fontWeights.semibold,
      padding: spacing[3],
    }),
    cell: (theme) => ({
      padding: spacing[3],
      borderBottom: `1px solid ${theme.isDark ? colors.neutral[800] : colors.neutral[100]}`,
      fontSize: typography.fontSizes.sm,
    }),
    row: (theme) => ({
      '&:hover': {
        background: theme.isDark ? colors.neutral[800] : colors.neutral[50],
      },
    }),
  },

  // Alert/Toast notifications
  alert: {
    base: {
      borderRadius: borderRadius.md,
      padding: `${spacing[3]} ${spacing[4]}`,
      marginBottom: spacing[3],
    },
    info: (theme) => ({
      background: theme.isDark ? colors.primary[900] : colors.primary[50],
      color: theme.isDark ? colors.primary[100] : colors.primary[900],
      border: `1px solid ${theme.colors.primary[500]}`,
    }),
    success: (theme) => ({
      background: theme.isDark ? colors.success[900] : colors.success[50],
      color: theme.isDark ? colors.success[100] : colors.success[900],
      border: `1px solid ${theme.colors.success[500]}`,
    }),
    warning: (theme) => ({
      background: theme.isDark ? colors.warning[900] : colors.warning[50],
      color: theme.isDark ? colors.warning[100] : colors.warning[900],
      border: `1px solid ${theme.colors.warning[500]}`,
    }),
    error: (theme) => ({
      background: theme.isDark ? colors.error[900] : colors.error[50],
      color: theme.isDark ? colors.error[100] : colors.error[900],
      border: `1px solid ${theme.colors.error[500]}`,
    }),
  },

  // Badge/Tag components
  badge: {
    base: {
      borderRadius: borderRadius.full,
      padding: `${spacing[0.5]} ${spacing[2]}`,
      fontSize: typography.fontSizes.xs,
      fontWeight: typography.fontWeights.medium,
    },
    solid: (theme) => ({
      background: theme.colors.primary[500],
      color: 'white',
    }),
    outline: (theme) => ({
      background: 'transparent',
      border: `1px solid ${theme.colors.primary[500]}`,
      color: theme.colors.primary[500],
    }),
    subtle: (theme) => ({
      background: theme.isDark ? colors.primary[900] : colors.primary[50],
      color: theme.colors.primary[500],
    }),
  },

  // Progress indicators
  progress: {
    track: (theme) => ({
      background: theme.isDark ? colors.neutral[700] : colors.neutral[200],
      borderRadius: borderRadius.full,
      height: spacing[1],
    }),
    indicator: (theme) => ({
      background: theme.colors.primary[500],
      borderRadius: borderRadius.full,
      transition: 'width 0.2s ease-in-out',
    }),
  },

  // Skeleton loading
  skeleton: (theme) => ({
    background: theme.isDark ? colors.neutral[800] : colors.neutral[200],
    borderRadius: borderRadius.md,
    '&::after': {
      background: `linear-gradient(
        90deg,
        transparent,
        ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.5)'},
        transparent
      )`,
    },
  }),
}

// Helper function to get component theme
export const getComponentTheme = (component, variant = 'default') => {
  const theme = componentThemes[component]
  return theme ? {
    ...(theme.base || {}),
    ...(theme[variant] ? theme[variant] : theme.default || {})
  } : {}
}

// Export individual component themes for direct use
export const {
  button,
  input,
  card,
  modal,
  form,
  nav,
  table,
  alert,
  badge,
  progress,
  skeleton
} = componentThemes 