// ══════════════════════════════════════════════════════════════════════════════
// LLM Console Constants
// ══════════════════════════════════════════════════════════════════════════════

// ── Local Storage Configuration ───────────────────────────────────────────────
export const LOCAL_STORAGE = {
  KEY: 'llm_console_config',
  SALT: 'devora_llm_v1',
};

// ── API Endpoints ─────────────────────────────────────────────────────────────
export const API_ENDPOINTS = {
  CONFIG: '/api/llm-console/config',
  CONFIG_RAW: '/api/llm-console/config?raw=true',
  TEST: '/api/llm-console/test',
  AUTH_ME: '/api/auth/me',
};

// ── UI States ─────────────────────────────────────────────────────────────────
export const SAVE_STATUS = {
  IDLE: 'idle',
  SAVING: 'saving',
  SAVED: 'saved',
};

export const COPY_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  DONE: 'done',
  ERROR: 'error',
};

// ── Timeouts & Delays ─────────────────────────────────────────────────────────
export const TIMEOUTS = {
  COPY_FEEDBACK: 2000,
  SAVE_CLOSE_DELAY: 800,
  API_REQUEST: 15000,
};

// ── Color Palette ─────────────────────────────────────────────────────────────
export const COLORS = {
  PRIMARY: '#76D2DB',
  SECONDARY: '#F7F6E5',
  DANGER: '#DA4848',
  BACKGROUND: '#36064D',
};

// ── Provider Configurations ───────────────────────────────────────────────────
export const PROVIDERS = [
  {
    id: 'devora',
    name: 'Devora',
    baseUrl: 'https://devora.my.id/api/v1/ai',
    model: 'gpt-4o',
    icon: '/icons/devora-icon.png',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    iconType: 'svg',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.0-flash-exp',
    iconType: 'svg',
  },
  {
    id: 'fireworks',
    name: 'Fireworks',
    baseUrl: 'https://api.fireworks.ai/inference/v1',
    model: 'accounts/fireworks/models/llama-v3p3-70b-instruct',
    iconType: 'svg',
  },
  {
    id: 'xai',
    name: 'xAI',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-beta',
    icon: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/grok-icon.png',
  },
  {
    id: 'groq',
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    icon: 'https://cdn.brandfetch.io/idxygbEPCQ/w/201/h/201/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1668515712972',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    icon: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/claude-ai-icon.png',
  },
  {
    id: 'blink',
    name: 'Blink',
    baseUrl: 'https://core.blink.new/api/v1/ai',
    model: 'anthropic/claude-sonnet-4.6',
    icon: 'https://blink.new/blink/blink-logo-icon--dark.svg',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'google/gemini-2.0-flash-001',
    iconType: 'svg',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    iconType: 'svg',
  },
];

// ── Validation Messages ───────────────────────────────────────────────────────
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELDS: 'Base URL and Model are required',
  REQUIRED_API_KEY: 'API Key is required for first-time setup',
  SAVE_FAILED: 'Save failed',
  NETWORK_ERROR: 'Network error',
  NO_CONFIG: 'No config found. Please save your credentials first.',
  REQUIRED_CREDENTIALS: 'baseUrl, model, and apiKey are required',
};

// ── Success Messages ──────────────────────────────────────────────────────────
export const SUCCESS_MESSAGES = {
  CONFIG_SAVED: 'Configuration synchronized',
  CONFIG_REMOVED: 'Configuration removed',
  PROVIDER_LOADED: (name) => `Loaded ${name} defaults`,
  ENDPOINT_WORKING: 'Endpoint is working!',
};

// ── UI Text Constants ─────────────────────────────────────────────────────────
export const UI_TEXT = {
  PAGE_TITLE: 'LLM',
  PAGE_BADGE: 'Console',
  PAGE_DESCRIPTION: 'Test any OpenAI-compatible API endpoint. Supports custom base URL, model selection, and optional API key storage.',
  BANNER_TITLE: 'OpenAI-Compatible Endpoint Tester',
  BANNER_SUBTITLE: 'Sends a minimal 5-token probe · Low cost · Fast feedback',
  LOADING_MESSAGE: 'Initializing console...',
  AWAITING_SETUP: 'Awaiting Setup',
  TEST_DESCRIPTION: 'Fire a test request to verify your endpoint and API credentials.',
  GUEST_MODE_WARNING: 'Guest mode – Local storage only.',
  SIGN_IN_LINK: 'Sign in',
  SIGN_IN_SUFFIX: 'to sync.',
  ENCRYPTED_NOTE: 'Encrypted & masked in database',
  UNCHANGED_PLACEHOLDER: '(unchanged)',
  LEAVE_BLANK_NOTE: 'Leave blank to keep current key',
  CONFIRM_RESET: 'Remove your saved LLM configuration?',
};

// ── Button Labels ─────────────────────────────────────────────────────────────
export const BUTTON_LABELS = {
  EDIT: 'Edit',
  RESET: 'Reset',
  SAVE: 'Save Configuration',
  CANCEL: 'Cancel',
  COPY: 'Copy',
  COPIED: 'Copied!',
  FIRE_TEST: 'Fire Test Request',
  LOADING: '...',
  FAILED: 'Failed',
  SAVED: '✓ SAVED!',
};

// ── Section Headers ───────────────────────────────────────────────────────────
export const SECTION_HEADERS = {
  CONFIGURATION: 'Configuration',
  SETUP_REQUIRED: 'Setup Required',
  ENDPOINT_SETTINGS: 'Endpoint Settings',
  API_CREDENTIALS: 'API Credentials',
  QUICK_SYNC: 'Quick Sync Provider',
  ENDPOINT_DATA: 'Endpoint Data',
  API_ACCESS: 'API Access',
  DIAGNOSTIC_SUCCESS: '✓ Diagnostic Success',
  DIAGNOSTIC_ERROR: '✗ Diagnostic Error',
  STREAM_CONTENT: 'Stream Content',
  ERROR_TRACE: 'Error Trace',
};

// ── Form Labels ───────────────────────────────────────────────────────────────
export const FORM_LABELS = {
  BASE_URL: 'Base URL',
  MODEL: 'Model',
  MODEL_ID: 'Model ID',
  API_KEY: 'API Key',
  PROMPT: 'Prompt',
  COMPLETION: 'Completion',
  TOTAL: 'Total',
};

// ── Placeholders ──────────────────────────────────────────────────────────────
export const PLACEHOLDERS = {
  BASE_URL: 'https://api.openai.com',
  MODEL: 'gpt-4o, etc.',
  API_KEY: 'sk-••••••••',
  EMPTY_BODY: 'EMPTY_BODY',
  UNHANDLED_EXCEPTION: 'UNHANDLED_EXCEPTION',
};

// ── HTTP Status Ranges ────────────────────────────────────────────────────────
export const HTTP_STATUS = {
  SUCCESS_MIN: 200,
  SUCCESS_MAX: 300,
  CLIENT_ERROR_MIN: 400,
  CLIENT_ERROR_MAX: 500,
  TIMEOUT: 408,
  BAD_GATEWAY: 502,
};

// ── Test Request Configuration ────────────────────────────────────────────────
export const TEST_REQUEST = {
  MESSAGE: { role: 'user', content: 'Hello' },
  TEMPERATURE: 0,
  MAX_TOKENS: 5,
};

// ── Breadcrumbs ───────────────────────────────────────────────────────────────
export const BREADCRUMBS = [
  { label: 'DASHBOARD', href: '/' },
  { label: 'LLM CONSOLE' },
];

// ── CSS Classes (Reusable) ────────────────────────────────────────────────────
export const CSS_CLASSES = {
  STATUS_SUCCESS: 'bg-[#76D2DB]/15 text-[#76D2DB] border-[#76D2DB]/40',
  STATUS_WARNING: 'bg-[#DA4848]/15 text-[#DA4848] border-[#DA4848]/40',
  STATUS_NEUTRAL: 'bg-gray-500/15 text-slate-400 border-gray-500/30',
  BUTTON_PRIMARY: 'flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest border border-[#76D2DB]/30 text-[#76D2DB]/70 hover:text-[#76D2DB] hover:border-[#76D2DB]/60 hover:bg-[#76D2DB]/5 transition-all',
  BUTTON_DANGER: 'flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border border-[#DA4848]/30 text-[#DA4848]/60 hover:text-[#DA4848] hover:border-[#DA4848]/60 rounded transition-all',
};

// ── Gradient Styles ───────────────────────────────────────────────────────────
export const GRADIENT_STYLES = {
  BANNER: 'linear-gradient(135deg, #36064D 0%, #76D2DB33 30%, #DA484833 70%, #36064D 100%)',
  GRID_PATTERN: 'linear-gradient(rgba(118,210,219,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(118,210,219,0.08) 1px, transparent 1px)',
  GRID_SIZE: '20px 20px',
};
