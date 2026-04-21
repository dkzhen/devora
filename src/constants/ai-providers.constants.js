// ══════════════════════════════════════════════════════════════════════════════
// AI Providers Constants
// ══════════════════════════════════════════════════════════════════════════════

// ── API Endpoints ─────────────────────────────────────────────────────────────
export const API_ENDPOINTS = {
  AUTH_ME: '/api/auth/me',
  MODELS: '/api/ai-providers/models',
  MODELS_STATUS: '/api/ai-providers/models/status',
  API_KEY: '/api-key',
};

// ── Model Status Types ────────────────────────────────────────────────────────
export const MODEL_STATUS = {
  ACTIVE: 'active',
  SUSPEND: 'suspend',
  HIDDEN: 'hidden',
};

// ── Status Filter Options ─────────────────────────────────────────────────────
export const STATUS_FILTERS = [
  { id: 'all', label: 'ALL' },
  { id: 'active', label: 'ACTIVE', dot: 'bg-emerald-400' },
  { id: 'suspend', label: 'SUSPEND', dot: 'bg-amber-500' },
];

// ── Status Order for Sorting ──────────────────────────────────────────────────
export const STATUS_ORDER = {
  active: 0,
  suspend: 1,
  hidden: 2,
};

// ── User Roles ────────────────────────────────────────────────────────────────
export const USER_ROLES = {
  ULTRA: 'ULTRA',
  ADMIN: 'ADMIN',
  USER: 'USER',
};

// ── Toast Styles ──────────────────────────────────────────────────────────────
export const TOAST_STYLES = {
  SUCCESS: {
    background: '#0c0e1a',
    color: '#cbd5e1',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  SUCCESS_MINIMAL: {
    background: '#0B0F1A',
    color: '#D9C5C5',
    border: '1px solid #D9C5C511',
    fontSize: '9px',
    fontWeight: 'black',
  },
  ERROR: {
    background: '#0c0e1a',
    color: '#ef4444',
    border: '1px solid rgba(239,68,68,0.2)',
    fontSize: '9px',
  },
};

export const TOAST_ICON_THEME = {
  primary: '#8b5cf6',
  secondary: '#0c0e1a',
};

// ── Validation Messages ───────────────────────────────────────────────────────
export const VALIDATION_MESSAGES = {
  ALL_FIELDS_REQUIRED: 'All fields are required',
  MODEL_ID_REQUIRED: 'Model ID required',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  MODEL_EXISTS: 'Model ID already exists',
  UNAUTHORIZED: 'Unauthorized. ULTRA access required.',
  INVALID_MODEL_ID: 'Invalid model ID',
};

// ── Success Messages ──────────────────────────────────────────────────────────
export const SUCCESS_MESSAGES = {
  COPIED: 'Copied to clipboard',
  RESTRICTION_ENABLED: 'Access restriction ENABLED',
  RESTRICTION_DISABLED: 'Access restriction DISABLED',
  WHITELIST_UPDATED: 'Whitelist updated',
  STATUS_UPDATED: (status) => `Model status updated to ${status.toUpperCase()}`,
  MODEL_ADDED: 'Model added successfully',
  MODEL_UPDATED: 'Model updated successfully',
  MODEL_DELETED: 'Model deleted successfully',
};

// ── Confirmation Messages ─────────────────────────────────────────────────────
export const CONFIRM_MESSAGES = {
  DELETE_MODEL: 'Are you sure you want to delete this model?',
};

// ── UI Text Constants ─────────────────────────────────────────────────────────
export const UI_TEXT = {
  PAGE_TITLE: 'AI',
  PAGE_BADGE: 'Providers',
  PAGE_DESCRIPTION: 'Manage your local API core and supported upstream models. Flat developer-focused architecture optimized for ultra-low latency.',
  LOADING_MESSAGE: 'Synchronizing Upstream Models...',
  API_ERROR: 'API CONNECTION ERROR',
  CORE_ENDPOINT: 'Core Endpoint',
  CORE_ACTIVE: 'CORE ACTIVE',
  DEVELOPER_NOTICE: 'Developer Notice',
  SEARCH_PLACEHOLDER: 'Search identifiers or providers...',
  SYNCHRONIZED_MODELS: 'Synchronized Models',
  ADD_MODEL: 'Add Model',
  ADD_NEW_MODEL: 'Add New Model',
  EDIT_MODEL: 'Edit Model',
  CANCEL: 'Cancel',
  UPDATE: 'Update',
  ADD: 'Add',
  WHITELIST_EMAILS: 'Whitelist Emails',
  NONE_SET: 'None set',
  ADD_EMAIL_PLACEHOLDER: 'Add user email...',
  SYS_MODEL: 'SYS_MODEL',
  OPTIONAL: '(Optional)',
};

// ── Status Labels ─────────────────────────────────────────────────────────────
export const STATUS_LABELS = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  RESTRICTED: 'RESTRICTED',
  ADMIN_VISIBLE: 'ADMIN_VISIBLE',
};

// ── Status Descriptions ───────────────────────────────────────────────────────
export const STATUS_DESCRIPTIONS = {
  ACTIVE: 'Highly available system endpoints.',
  SUSPENDED: 'Model is temporarily offline.',
  RESTRICTED: 'Whitelist authorization required.',
  API_ACCESS_NOTE: 'API access requires a valid',
  BEARER_TOKEN: 'Bearer Token',
};

// ── Form Labels ───────────────────────────────────────────────────────────────
export const FORM_LABELS = {
  MODEL_ID: 'Model ID',
  MODEL_NAME: 'Model Name',
  OWNED_BY: 'Owned By',
  BASE_URL: 'Base URL',
};

// ── Form Placeholders ─────────────────────────────────────────────────────────
export const FORM_PLACEHOLDERS = {
  MODEL_ID: 'e.g., gpt-4, claude-3-opus',
  MODEL_NAME: 'e.g., GPT-4, Claude 3 Opus',
  OWNED_BY: 'e.g., OpenAI, Anthropic',
  BASE_URL: 'e.g., https://api.openai.com/v1',
};

// ── Button Tooltips ───────────────────────────────────────────────────────────
export const BUTTON_TOOLTIPS = {
  COPY_BASE_URL: 'Copy Base URL',
  COPY_MODEL_ID: 'Copy Model ID',
  SET_ACTIVE: 'Set Active',
  TOGGLE_RESTRICTION: 'Toggle Access Restriction',
  SET_SUSPENDED: 'Set Suspended',
  HIDE_MODEL: 'Hide Model',
  EDIT_MODEL: 'Edit Model',
  DELETE_MODEL: 'Delete Model',
};

// ── CSS Status Styles ─────────────────────────────────────────────────────────
export const STATUS_STYLES = {
  active: 'text-emerald-300 border-emerald-400/30 bg-emerald-400/10',
  suspend: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  hidden: 'text-slate-400 border-slate-600/30 bg-slate-700/20 opacity-70',
};

// ── Breadcrumbs ───────────────────────────────────────────────────────────────
export const BREADCRUMBS = {
  DASHBOARD: {
    label: 'Dashboard',
    href: '/',
  },
  AI_PROVIDERS: {
    label: 'AI Providers',
  },
};

// ── Color Palette ─────────────────────────────────────────────────────────────
export const COLORS = {
  PRIMARY: '#8b5cf6', // purple-500
  SUCCESS: '#10B981', // emerald-400
  WARNING: '#F59E0B', // amber-500
  DANGER: '#ef4444', // red-500
  INFO: '#3b82f6', // blue-500
};

// ── Icon Sizes ────────────────────────────────────────────────────────────────
export const ICON_SIZES = {
  SMALL: 'w-3 h-3',
  MEDIUM: 'w-3.5 h-3.5',
  LARGE: 'w-4 h-4',
  XLARGE: 'w-5 h-5',
  XXLARGE: 'w-6 h-6',
};

// ── Default Values ────────────────────────────────────────────────────────────
export const DEFAULTS = {
  STATUS: 'active',
  IS_RESTRICTED: false,
  OWNER: 'Other',
  YEAR: 2026,
  MONTH: 1,
};

// ── CSS Classes (Reusable) ────────────────────────────────────────────────────
export const CSS_CLASSES = {
  CARD_BASE: 'p-4 border border-slate-600/40 bg-slate-800/40 hover:bg-slate-700/40 transition-all rounded-xl group flex flex-col justify-between min-h-[120px]',
  CARD_HIDDEN: 'ring-1 ring-slate-600/40 opacity-50',
  CARD_NORMAL: 'shadow-lg shadow-black/20',
  BADGE_BASE: 'text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-xs border',
  BADGE_RESTRICTED: 'border-blue-400/30 text-blue-300 bg-blue-500/10',
  BADGE_ADMIN: 'border-purple-400/30 text-purple-300 bg-purple-500/10',
  BUTTON_ICON_BASE: 'p-1 rounded-sm border transition-colors',
  BUTTON_ICON_ACTIVE: 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400',
  BUTTON_ICON_INACTIVE: 'bg-slate-500/10 border-white/10 text-slate-600',
  INPUT_BASE: 'w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-400/50 transition-all',
  MODAL_OVERLAY: 'fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4',
  MODAL_CONTENT: 'bg-slate-800 border border-slate-600/50 rounded-xl p-6 max-w-md w-full',
};

// ── Animation Classes ─────────────────────────────────────────────────────────
export const ANIMATION_CLASSES = {
  PULSE: 'animate-pulse',
  SPIN: 'animate-spin',
  FADE_IN: 'opacity-0 group-hover:opacity-100 transition-opacity',
};

// ── Shadow Effects ────────────────────────────────────────────────────────────
export const SHADOW_EFFECTS = {
  SUCCESS_GLOW: 'shadow-[0_0_10px_#10B981]',
  WARNING_GLOW: 'shadow-[0_0_10px_#F59E0B]',
  PRIMARY_GLOW: 'shadow-[0_0_10px_rgba(168,85,247,0.6)]',
  SUCCESS_SOFT: 'shadow-[0_0_8px_rgba(52,211,153,0.5)]',
};
