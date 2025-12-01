/**
 * Design System Constants
 * Standardized values for consistent UI across the application
 */

export const DesignSystem = {
  // Typography Scale
  typography: {
    h1: 'text-3xl font-bold text-gray-900', // 30px
    h2: 'text-2xl font-bold text-gray-900', // 24px
    h3: 'text-xl font-semibold text-gray-900', // 20px
    h4: 'text-lg font-semibold text-gray-900', // 18px
    body: 'text-base text-gray-700', // 16px
    bodySmall: 'text-sm text-gray-600', // 14px
    bodyTiny: 'text-xs text-gray-600', // 12px
    label: 'text-sm font-medium text-gray-700', // 14px
    helper: 'text-sm text-gray-500', // 14px
    error: 'text-sm text-red-600', // 14px
  },

  // Spacing Scale (consistent 4px base unit)
  spacing: {
    xs: '0.5rem', // 8px
    sm: '0.75rem', // 12px
    md: '1rem', // 16px
    lg: '1.5rem', // 24px
    xl: '2rem', // 32px
    '2xl': '2.5rem', // 40px
    '3xl': '3rem', // 48px
  },

  // Padding/Margin Classes
  padding: {
    card: 'p-6', // 24px
    cardHeader: 'px-6 py-5', // 24px horizontal, 20px vertical
    cardContent: 'px-6 py-6', // 24px
    section: 'py-8', // 32px vertical
    container: 'px-4 sm:px-6 lg:px-8', // Responsive horizontal
  },

  // Border Radius
  radius: {
    sm: 'rounded-md', // 6px
    md: 'rounded-lg', // 8px
    lg: 'rounded-xl', // 12px
    full: 'rounded-full',
  },

  // Shadows
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    none: 'shadow-none',
  },

  // Colors (semantic naming)
  colors: {
    primary: {
      main: 'bg-blue-600 text-white',
      hover: 'hover:bg-blue-700',
      light: 'bg-blue-50 text-blue-900',
      border: 'border-blue-200',
    },
    secondary: {
      main: 'bg-gray-100 text-gray-900',
      hover: 'hover:bg-gray-200',
      light: 'bg-gray-50 text-gray-700',
      border: 'border-gray-200',
    },
    success: {
      main: 'bg-green-600 text-white',
      hover: 'hover:bg-green-700',
      light: 'bg-green-50 text-green-900',
      border: 'border-green-200',
    },
    error: {
      main: 'bg-red-600 text-white',
      hover: 'hover:bg-red-700',
      light: 'bg-red-50 text-red-900',
      border: 'border-red-200',
    },
    warning: {
      main: 'bg-yellow-600 text-white',
      hover: 'hover:bg-yellow-700',
      light: 'bg-yellow-50 text-yellow-900',
      border: 'border-yellow-200',
    },
  },

  // Border Colors
  border: {
    default: 'border-gray-200',
    focus: 'border-blue-500',
    error: 'border-red-500',
    success: 'border-green-500',
  },

  // Background Colors
  background: {
    page: 'bg-gradient-to-br from-blue-50 via-white to-gray-50',
    card: 'bg-white',
    section: 'bg-gray-50',
  },
} as const;

