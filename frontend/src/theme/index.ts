import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Color-blind friendly palette
// Using high-contrast colors that work for most color vision deficiencies
const colors = {
  brand: {
    // Primary blue (safe for all color blindness types)
    50: '#E6F2FF',
    100: '#BFDEFF',
    200: '#99CAFF',
    300: '#73B6FF',
    400: '#4DA2FF',
    500: '#268EFF', // Primary brand color
    600: '#0072E6',
    700: '#0059B3',
    800: '#004080',
    900: '#00264D',
  },
  // Card suits - color-blind friendly alternatives
  suits: {
    // Spades: Black (distinguishable from red)
    spades: '#000000',
    // Hearts: Red (distinguishable from black)
    hearts: '#E63946',
    // Diamonds: Red (distinguishable from black)
    diamonds: '#E63946',
    // Clubs: Black (distinguishable from red)
    clubs: '#000000',
  },
  // Table colors
  table: {
    // Felt green (adjusted for better contrast)
    felt: '#0B5D1E',
    feltDark: '#083D14',
    feltLight: '#0E7526',
  },
  // Action colors (high contrast)
  action: {
    call: '#06A77D', // Teal
    raise: '#E63946', // Red
    fold: '#6C757D', // Gray
    check: '#268EFF', // Blue
    allin: '#8B0000', // Dark Red
  },
  // Status colors
  status: {
    success: '#06A77D',
    warning: '#F77F00',
    error: '#E63946',
    info: '#268EFF',
  },
};

// Theme configuration
const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

// Component style overrides
const components = {
  Button: {
    defaultProps: {
      colorScheme: 'brand',
    },
    variants: {
      solid: {
        bg: 'brand.500',
        color: 'white',
        _hover: {
          bg: 'brand.600',
        },
        _active: {
          bg: 'brand.700',
        },
      },
      // Poker action buttons
      call: {
        bg: 'action.call',
        color: 'white',
        _hover: {
          bg: '#058A69',
        },
      },
      raise: {
        bg: 'action.raise',
        color: 'white',
        _hover: {
          bg: '#D32F3C',
        },
      },
      fold: {
        bg: 'action.fold',
        color: 'white',
        _hover: {
          bg: '#5A6268',
        },
      },
      check: {
        bg: 'action.check',
        color: 'white',
        _hover: {
          bg: '#0072E6',
        },
      },
      allin: {
        bg: 'action.allin',
        color: 'white',
        _hover: {
          bg: '#700000',
        },
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'gray.800',
        borderColor: 'gray.700',
      },
    },
  },
  Table: {
    variants: {
      poker: {
        table: {
          bg: 'table.felt',
          borderWidth: '8px',
          borderColor: 'table.feltDark',
          borderRadius: 'full',
        },
      },
    },
  },
};

// Font configuration
const fonts = {
  heading: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'Fira Code', 'Consolas', 'Monaco', monospace",
};

// Global styles
const styles = {
  global: {
    body: {
      bg: 'gray.900',
      color: 'gray.100',
    },
  },
};

// Breakpoints for responsive design
const breakpoints = {
  sm: '320px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Extend the theme
export const theme = extendTheme({
  config,
  colors,
  components,
  fonts,
  styles,
  breakpoints,
});

export default theme;
