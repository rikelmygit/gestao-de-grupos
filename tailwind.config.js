export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',
        muted: '#64748B',
        accent: '#2563EB',
        'accent-light': '#EFF6FF',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)',
        pop: '0 8px 32px rgba(15,23,42,0.12)',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
