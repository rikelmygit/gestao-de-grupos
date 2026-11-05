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
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,0.06), 0 8px 24px rgba(15,23,42,0.05)',
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
    },
  },
  plugins: [],
};
