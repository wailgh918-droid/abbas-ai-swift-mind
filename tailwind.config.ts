module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'deep-charcoal': 'hsl(0, 0%, 3%)',
        'midnight-blue': 'hsl(224, 70%, 12%)',
        'electric-blue': 'hsl(200, 100%, 50%)',
      },
      fontFamily: {
        'sans': ['Plus Jakarta Sans', 'sans-serif'],
      },
      backdropBlur: {
        'md': '10px',
      },
      glass: {
        'front': 'rgba(255, 255, 255, 0.1)',
        'back': 'rgba(0, 0, 0, 0.5)',
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['active'],
      textColor: ['active'],
      backdropBlur: ['hover'],
    },
  },
  plugins: [],
  keyframes: {
    glowingPulse: {
      '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
      '50%': { opacity: '1', transform: 'scale(1.05)' },
    },
    smoothScale: {
      '0%': { transform: 'scale(1)' },
      '100%': { transform: 'scale(1.1)' },
    },
    skeletonLoad: {
      '0%': { opacity: '0.3' },
      '100%': { opacity: '0.7' },
    },
  },
  animation: {
    glowingPulse: 'glowingPulse 1.5s ease-in-out infinite',
    smoothScale: 'smoothScale 0.5s ease-in-out forwards',
    skeletonLoad: 'skeletonLoad 1.2s ease-in-out infinite',
  },
};