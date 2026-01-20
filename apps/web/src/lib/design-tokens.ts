/**
 * BabyNest Design Tokens
 * 
 * Centralized design system tokens for consistent styling across the application.
 * These tokens should be used in conjunction with Tailwind CSS utilities and CSS variables.
 */

export const designTokens = {
  /**
   * Border Radius Scale
   * Usage: Use these values for consistent rounded corners
   */
  borderRadius: {
    sm: '0.5rem',      // 8px - small badges, pills
    md: '0.75rem',     // 12px - buttons, inputs, icon containers
    lg: '1rem',        // 16px - cards, modals, dialogs
    xl: '1.25rem',     // 20px - large cards, hero elements
    '2xl': '1.5rem',   // 24px - extra large cards
    full: '9999px',    // circular - avatars, status dots
  },

  /**
   * Spacing Scale
   * Usage: Consistent spacing for padding, margins, and gaps
   */
  spacing: {
    card: {
      padding: '1.5rem',      // 24px - standard card padding
      gap: '1rem',            // 16px - gap between card sections
    },
    section: {
      gap: '1.5rem',          // 24px - gap between major sections
      padding: '1rem',        // 16px - section padding
    },
    element: {
      gap: '0.75rem',         // 12px - gap between related elements
      padding: '0.5rem',      // 8px - small element padding
    },
    icon: {
      sm: '1rem',             // 16px - small icon size
      md: '1.25rem',          // 20px - medium icon size
      lg: '1.5rem',           // 24px - large icon size
      xl: '2rem',             // 32px - extra large icon size
    },
  },

  /**
   * Animation Durations
   * Usage: Consistent timing for transitions and animations
   */
  animation: {
    instant: '0ms',           // No animation (accessibility)
    fast: '150ms',            // Micro-interactions (hover, focus)
    normal: '200ms',          // Default transitions
    slow: '300ms',            // Complex transitions
    slower: '500ms',          // Page transitions, major state changes
  },

  /**
   * Animation Easing Functions
   * Usage: Consistent easing for smooth animations
   */
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',      // Standard ease-in-out
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // Bounce effect
    smooth: 'cubic-bezier(0.4, 0, 0.6, 1)',       // Smooth ease
    sharp: 'cubic-bezier(0.4, 0, 1, 1)',          // Sharp ease-in
  },

  /**
   * Shadow Tokens
   * Usage: Reference to CSS variables for themed shadows
   */
  shadows: {
    card: 'var(--shadow-card)',
    elevated: 'var(--shadow-elevated)',
    glow: 'var(--shadow-glow)',
    warm: 'var(--shadow-warm)',
    warmLg: 'var(--shadow-warm-lg)',
    warmXl: 'var(--shadow-warm-xl)',
  },

  /**
   * Typography Scale
   * Usage: Consistent font sizes and weights
   */
  typography: {
    fontSize: {
      xs: '0.75rem',          // 12px
      sm: '0.875rem',         // 14px
      base: '1rem',           // 16px
      lg: '1.125rem',         // 18px
      xl: '1.25rem',          // 20px
      '2xl': '1.5rem',        // 24px
      '3xl': '1.875rem',      // 30px
      '4xl': '2.25rem',       // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  /**
   * Z-Index Scale
   * Usage: Consistent layering
   */
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modalBackdrop: 40,
    modal: 50,
    popover: 60,
    tooltip: 70,
  },

  /**
   * Breakpoints
   * Usage: Responsive design breakpoints (matches Tailwind defaults)
   */
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  /**
   * Touch Target Sizes
   * Usage: Minimum sizes for interactive elements (accessibility)
   */
  touchTarget: {
    min: '44px',              // Minimum touch target size (WCAG)
    comfortable: '48px',      // Comfortable touch target
    large: '56px',            // Large touch target
  },
} as const;

/**
 * Type-safe design token access
 */
export type DesignTokens = typeof designTokens;

/**
 * Helper function to get design token values
 */
export function getToken<K extends keyof DesignTokens>(
  category: K
): DesignTokens[K] {
  return designTokens[category];
}

/**
 * Tailwind class name helpers for common patterns
 */
export const classNames = {
  /**
   * Card styles
   */
  card: {
    base: 'rounded-2xl border bg-card text-card-foreground transition-all duration-300',
    padding: 'p-6',
    hover: 'hover:-translate-y-1 hover:shadow-lg',
  },

  /**
   * Button styles
   */
  button: {
    base: 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200',
    sizes: {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-14 px-10 text-lg',
    },
    hover: 'hover:scale-[1.02] active:scale-95',
  },

  /**
   * Input styles
   */
  input: {
    base: 'h-11 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm',
    focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  },

  /**
   * Icon container styles
   */
  icon: {
    sm: 'w-8 h-8 rounded-xl flex items-center justify-center',
    md: 'w-10 h-10 rounded-xl flex items-center justify-center',
    lg: 'w-12 h-12 rounded-xl flex items-center justify-center',
    xl: 'w-16 h-16 rounded-2xl flex items-center justify-center',
  },

  /**
   * Focus ring styles
   */
  focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
} as const;

export default designTokens;
