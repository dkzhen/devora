// Airdrop Status Options
export const AIRDROP_STATUS = {
  NEW: 'New',
  POTENTIAL: 'Potential',
  CONFIRMED: 'Confirmed',
  VERIFICATION_CHECK: 'Verification Check',
  ENDED: 'Ended',
};

export const AIRDROP_STATUS_OPTIONS = [
  { value: AIRDROP_STATUS.NEW, label: 'New' },
  { value: AIRDROP_STATUS.POTENTIAL, label: 'Potential' },
  { value: AIRDROP_STATUS.CONFIRMED, label: 'Confirmed' },
  { value: AIRDROP_STATUS.VERIFICATION_CHECK, label: 'Verification Check' },
  { value: AIRDROP_STATUS.ENDED, label: 'Ended' },
];

// Publish Status
export const PUBLISH_STATUS = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

// Task Status
export const TASK_STATUS = {
  OPEN: 'Open',
  CLOSED: 'Closed',
};

// Task Categories
export const TASK_CATEGORIES = {
  SOCIAL: 'social',
  TESTNET: 'testnet',
  MAINNET: 'mainnet',
  QUIZ: 'quiz',
  TRADING: 'trading',
  STAKING: 'staking',
};

// Currency Types
export const CURRENCY_TYPES = {
  USD: '$',
  IDR: 'Rp',
};

// Status Colors for UI
export const STATUS_COLORS = {
  [AIRDROP_STATUS.NEW]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [AIRDROP_STATUS.CONFIRMED]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  [AIRDROP_STATUS.POTENTIAL]: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  [AIRDROP_STATUS.VERIFICATION_CHECK]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  [AIRDROP_STATUS.ENDED]: 'bg-gray-500/10 text-slate-400 border-gray-500/20',
};

// Link Types
export const LINK_TYPES = {
  WEB: 'web',
  X: 'x',
  GITHUB: 'github',
  TELEGRAM: 'telegram',
  DISCORD: 'discord',
};

// Default Form Values
export const DEFAULT_STEP = {
  text: '',
  link: '',
  image: '',
  isPrivate: false,
};

export const DEFAULT_TASK_FORM = {
  title: '',
  category: '',
  deadline: '',
  status: TASK_STATUS.OPEN,
  steps: [DEFAULT_STEP],
};

// Visibility Filter Options
export const VISIBILITY_FILTERS = {
  ALL: '',
  PUBLIC: 'public',
  PRIVATE: 'private',
  PENDING: 'pending',
};

// Toast Types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  INFO: 'info',
  WARNING: 'warning',
};

// Time Units
export const TIME_UNITS = {
  MINUTES: 'minutes',
  HOURS: 'hours',
  DAYS: 'days',
};

// Raise Amount Multipliers
export const RAISE_MULTIPLIERS = {
  K: 0.001,
  M: 1,
  B: 1000,
};
