// Web3 Project Categories
export const PROJECT_CATEGORIES = {
  AI_AGENT: 'AI Agent',
  PROTOCOL: 'Protocol',
  DEFI: 'DeFi',
  NFT: 'NFT',
  GAMING: 'Gaming',
  INFRASTRUCTURE: 'Infrastructure',
};

// Project List Data
export const PROJECT_LIST = [
  {
    slug: 'nara-agent',
    name: 'Nara Agent',
    logo: 'https://nara.build/favicon-v3.svg',
    description: 'Advanced AI-powered agent for real-time Web3 ecosystem monitoring, risk analysis, and automated interaction protocols. One skill, everything on-chain.',
    category: PROJECT_CATEGORIES.AI_AGENT,
    isFeatured: true,
  },
];

// UI Constants
export const UI_CONSTANTS = {
  SEARCH_PLACEHOLDER: 'Search projects...',
  EXPLORE_TEXT: 'Explore Registry',
  LOGIN_REQUIRED_TEXT: 'Login Required',
  FEATURED_TEXT: 'Featured',
  DEFAULT_CATEGORY: 'Protocol',
  FALLBACK_ICON: '/icons/digital-currency.png',
};

// CSS Classes
export const CSS_CLASSES = {
  CARD_BASE: 'group relative bg-[#0a0312] border border-[#ffd89b]/20 rounded-2xl p-5 transition-all duration-300 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3)]',
  CARD_LOCKED: 'opacity-60 cursor-not-allowed',
  CARD_INTERACTIVE: 'hover:border-[#ffd89b]/50 cursor-pointer',
  HOVER_GRADIENT: 'absolute inset-0 bg-linear-to-br from-[#ffd89b]/5 via-transparent to-[#19547b]/5 opacity-0 group-hover:opacity-100 transition-opacity',
  LOGO_CONTAINER: 'w-14 h-14 rounded-xl border border-[#ffd89b]/30 bg-[#1A082E] flex items-center justify-center shrink-0 overflow-hidden shadow-[0_0_10px_rgba(255,216,155,0.2)]',
  CATEGORY_BADGE: 'inline-block px-2 py-0.5 mt-1 rounded bg-[#ffd89b]/10 text-[#ffd89b] border border-[#ffd89b]/20 text-[9px] font-black uppercase tracking-widest leading-none',
  SEARCH_INPUT: 'w-full pl-11 pr-4 py-3.5 bg-[#0a0312] border border-[#ffd89b]/20 rounded-2xl text-xs text-[#FDF2D9] placeholder:text-[#ffd89b]/30 focus:border-[#ffd89b]/40 focus:ring-2 focus:ring-[#ffd89b]/5 focus:outline-none font-mono transition-all shadow-[0_0_15px_rgba(255,216,155,0.05)]',
};

// Breadcrumb Configuration
export const BREADCRUMBS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Web3 Projects' },
];

// Page Metadata
export const PAGE_METADATA = {
  TITLE: 'Web3',
  BADGE: 'Projects',
  DESCRIPTION: 'Explore the latest decentralized applications, protocols, and blockchain eco-system projects.',
  LOADING_MESSAGE: 'Initializing Projects...',
};
