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

// Task Type Options (for airdrop projects)
export const TASK_TYPE = {
  SOCIAL: 'Social',
  TESTNET: 'Testnet',
  MAINNET: 'Mainnet',
  QUIZ: 'Quiz',
  TRADING: 'Trading',
  STAKING: 'Staking',
  WAITLIST: 'Waitlist',
  MIXED: 'Mixed',
};

export const TASK_TYPE_OPTIONS = [
  { value: TASK_TYPE.SOCIAL, label: 'Social' },
  { value: TASK_TYPE.TESTNET, label: 'Testnet' },
  { value: TASK_TYPE.MAINNET, label: 'Mainnet' },
  { value: TASK_TYPE.QUIZ, label: 'Quiz' },
  { value: TASK_TYPE.TRADING, label: 'Trading' },
  { value: TASK_TYPE.STAKING, label: 'Staking' },
  { value: TASK_TYPE.WAITLIST, label: 'Waitlist' },
  { value: TASK_TYPE.MIXED, label: 'Mixed' },
];

// Reward Type Options
export const REWARD_TYPE = {
  AIRDROP: 'Airdrop',
  POINTS: 'Points',
  WAITLIST: 'Waitlist',
  NFT: 'NFT',
  TOKEN: 'Token',
  WHITELIST: 'Whitelist',
  UNKNOWN: 'Unknown',
};

export const REWARD_TYPE_OPTIONS = [
  { value: REWARD_TYPE.AIRDROP, label: 'Airdrop' },
  { value: REWARD_TYPE.POINTS, label: 'Points' },
  { value: REWARD_TYPE.WAITLIST, label: 'Waitlist' },
  { value: REWARD_TYPE.NFT, label: 'NFT' },
  { value: REWARD_TYPE.TOKEN, label: 'Token' },
  { value: REWARD_TYPE.WHITELIST, label: 'Whitelist' },
  { value: REWARD_TYPE.UNKNOWN, label: 'Unknown' },
];

// Project Type Options
export const PROJECT_TYPE = {
  DEFI: 'DeFi',
  INFRA: 'Infra',
  AI: 'AI',
  GAMING: 'Gaming',
  NFT: 'NFT',
  SOCIAL: 'Social',
  ZK: 'ZK',
  LAYER1: 'Layer 1',
  LAYER2: 'Layer 2',
  BRIDGE: 'Bridge',
  DEX: 'DEX',
  LENDING: 'Lending',
  WALLET: 'Wallet',
  OTHER: 'Other',
};

export const PROJECT_TYPE_OPTIONS = [
  { value: PROJECT_TYPE.DEFI, label: 'DeFi' },
  { value: PROJECT_TYPE.INFRA, label: 'Infra' },
  { value: PROJECT_TYPE.AI, label: 'AI' },
  { value: PROJECT_TYPE.GAMING, label: 'Gaming' },
  { value: PROJECT_TYPE.NFT, label: 'NFT' },
  { value: PROJECT_TYPE.SOCIAL, label: 'Social' },
  { value: PROJECT_TYPE.ZK, label: 'ZK' },
  { value: PROJECT_TYPE.LAYER1, label: 'Layer 1' },
  { value: PROJECT_TYPE.LAYER2, label: 'Layer 2' },
  { value: PROJECT_TYPE.BRIDGE, label: 'Bridge' },
  { value: PROJECT_TYPE.DEX, label: 'DEX' },
  { value: PROJECT_TYPE.LENDING, label: 'Lending' },
  { value: PROJECT_TYPE.WALLET, label: 'Wallet' },
  { value: PROJECT_TYPE.OTHER, label: 'Other' },
];

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
