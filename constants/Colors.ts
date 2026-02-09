const tintColorLight = '#10B981'; // Fresh Green
const tintColorDark = '#10B981'; // Fresh Green

const light = {
  text: '#0F172A',
  background: '#FFFFFF',
  tint: tintColorLight,
  tabIconDefault: '#94A3B8',
  tabIconSelected: tintColorLight,
  primary: '#10B981',
  accent: '#F59E0B',
  destructive: '#EF4444',
  neutral: '#64748B',
  surface: '#F1F5F9', // Light gray surface
  inputBackground: '#F8FAFC',
  border: '#E2E8F0', // Consistent border color
};

export default {
  light: light,
  dark: light, // Force light mode colors even in dark mode
};
