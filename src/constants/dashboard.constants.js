// Dashboard Theme Colors - Consistent with brand
export const THEME_COLORS = {
  PRIMARY: '#749F8B',
  SECONDARY: '#FEBD8B',
  ACCENT: '#8B5CF6' // Purple for feature cards
};

// Dashboard Card Colors - Fixed theme instead of random
export const CARD_COLORS = {
  KPI: 'teal', // For KPI cards - matches #749F8B
  FEATURE: 'purple' // For feature preview cards
};

// Dashboard Icons
export const DASHBOARD_ICONS = {
  ACCOUNTS: '/icons/dashbooard/google.png',
  API: '/icons/dashbooard/api.png',
  EMAIL: '/icons/dashbooard/email.png',
  GMAIL: '/icons/dashbooard/gmail.png',
  DRIVE: '/icons/dashbooard/google-drive.png',
  AIRDROP: '/icons/dashbooard/airdrop.png',
  ROBOT: '/icons/dashbooard/robot.png'
};

// API Endpoints
export const API_ENDPOINTS = {
  MONITORING: '/api/monitoring',
  APP_STATISTICS: '/api/apps/statistics'
};

// Dashboard Sections Configuration
export const DASHBOARD_SECTIONS = {
  HERO: {
    title: 'Dashboard',
    badge: 'Overview',
    description: 'Get a real-time snapshot of your activity, performance, and automation.'
  },
  APP_LIBRARY: {
    title: 'App Distribution Analytics',
    gradient: 'from-[#FEBD8B] to-[#749F8B]'
  }
};

// Grid Layouts
export const GRID_LAYOUTS = {
  KPI_CARDS: 'grid grid-cols-1 md:grid-cols-3 gap-5',
  FEATURE_PREVIEW: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6',
  APP_LIBRARY: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
};

// Loading Messages
export const LOADING_MESSAGES = {
  INITIALIZING: 'Initializing monitoring platform...'
};

// Utility Functions
export const getKPICardColor = () => {
  return CARD_COLORS.KPI;
};

export const getFeatureCardColor = () => {
  return CARD_COLORS.FEATURE;
};

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(num);
};

export const calculateTotalRequestFlow = (apiStats = []) => {
  return apiStats.reduce((sum, item) => sum + (item.hitCount || 0), 0);
};
