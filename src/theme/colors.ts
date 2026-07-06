export const theme = {
  colors: {
    bgPrimary: '#08080A',      // Pure pitch-black space background
    bgSecondary: '#111116',    // Sleek charcoal card background
    bgTertiary: '#1A1A22',     // Elevated inputs and cards
    borderColor: '#1E1E26',    // Card border color
    
    // Custom premium gradients
    orangeGradient: ['#FF7E47', '#FFA26B'], // Fintech orange-to-peach gradient
    tealGradient: ['#00F2FE', '#4FACFE'],   // Neon cyan-to-blue gradient
    purpleGradient: ['#9B7EDE', '#7B5FB5'], // Purple-to-dark-purple gradient
    
    // Solid fallback color tokens
    accentPrimary: '#FF7E47',  // Primary Orange
    accentSecondary: '#00F2FE',// Primary Teal
    accentGlow: '#FFA26B',     // Bright orange glow
    
    textPrimary: '#FFFFFF',    // Main text
    textSecondary: '#E0DBEC',  // Subtext (high contrast readable)
    textTertiary: '#6B6280',   // Metadata and description text
    success: '#38EF7D',        // Bright emerald green for success metrics
    warning: '#FFB347',        // Soft orange
    error: '#FF6B6B',          // Coral (gentle alerts)
  },
  typography: {
    fontFamily: 'System', 
    h1: {
      fontSize: 32,
      fontWeight: 'bold' as const,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 18,
      fontWeight: '500' as const,
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 13,
      fontWeight: '500' as const,
      textTransform: 'uppercase' as const,
    },
  },
};

export type Theme = typeof theme;
