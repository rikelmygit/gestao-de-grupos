export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0B',
        surface: '#131316',
        border: '#26262B',
        muted: '#8A8A93',
        accent: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
