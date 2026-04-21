// Temp Mail Providers
export const PROVIDERS = {
  MAIL_TM: 'mail.tm',
  MOEMAIL: 'moemail'
};

// API Endpoints
export const API_ENDPOINTS = {
  MAIL_TM: {
    BASE: 'https://api.mail.tm',
    DOMAINS: '/domains',
    ACCOUNTS: '/accounts',
    TOKEN: '/token',
    MESSAGES: '/messages'
  },
  MOEMAIL: {
    BASE: 'https://moemail-api.danistimikwp.workers.dev',
    GENERATE: '/generate',
    INBOX: '/inbox',
    MESSAGE: '/message'
  },
  INTERNAL: {
    DOMAINS: '/api/temp-mail/domains',
    ACCOUNTS: '/api/temp-mail/accounts',
    TOKEN: '/api/temp-mail/token',
    MESSAGES: '/api/temp-mail/messages',
    IMAGE: '/api/temp-mail/image',
    HISTORY: '/api/temp-mail/accounts/history',
    MOEMAIL_GENERATE: '/api/moemail/generate',
    MOEMAIL_INBOX: '/api/moemail/inbox',
    MOEMAIL_MESSAGE: '/api/moemail/message'
  }
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'temp_mail_token',
  ACCOUNT: 'temp_mail_account',
  PROVIDER: 'temp_mail_provider',
  USER_INFO: 'user_info'
};

// Polling Configuration
export const POLLING_CONFIG = {
  INTERVAL: 5000, // 5 seconds
  ENABLED_BY_DEFAULT: false
};

// Provider Configuration
export const PROVIDER_CONFIG = {
  [PROVIDERS.MAIL_TM]: {
    name: 'Mail.tm',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    requiresPassword: true,
    requiresToken: true,
    supportsCustomAddress: true,
    domain: 'Various',
    retention: 'Permanent'
  },
  [PROVIDERS.MOEMAIL]: {
    name: 'MoeMail',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    requiresPassword: false,
    requiresToken: false,
    supportsCustomAddress: false,
    domain: '@zenra.my.id',
    retention: 'Temporary'
  }
};

// UI Messages
export const MESSAGES = {
  SUCCESS: {
    EMAIL_GENERATED: 'New email generated!',
    MOEMAIL_GENERATED: 'New MoeMail generated!',
    EMAIL_COPIED: 'Email address copied to clipboard!',
    ACCOUNT_SWITCHED: 'Switched to email: ',
    ACCOUNT_DESTROYED: 'Email address destroyed'
  },
  ERROR: {
    GENERATE_FAILED: 'Error generating temp mail',
    SWITCH_FAILED: 'Failed to switch account',
    DESTROY_FAILED: 'Failed to destroy email address',
    DESTROY_ERROR: 'An error occurred while destroying',
    LOAD_MESSAGE_FAILED: 'Failed to load full message body',
    MESSAGE_ERROR: 'Error loading message',
    NO_DOMAINS: 'No domains available',
    CREATE_ACCOUNT_FAILED: 'Failed to create account',
    CREATE_ACCOUNT_RETRY_FAILED: 'Failed to create account after retry',
    GET_TOKEN_FAILED: 'Failed to get token',
    GET_TOKEN_EXISTING_FAILED: 'Failed to get token for existing account',
    MOEMAIL_FAILED: 'Failed to generate MoeMail'
  },
  CONFIRM: {
    DESTROY_ACCOUNT: 'Are you sure you want to permanently delete this email address? This action cannot be undone.'
  },
  LOADING: {
    CONNECTING: 'Connecting to secure mail server...',
    INITIALIZING: 'Initializing monitoring platform...'
  },
  EMPTY_STATE: {
    NO_ACCOUNT: "You don't have an active temporary email address right now. Generate one to receive emails anonymously.",
    NO_MESSAGES: 'Waiting for emails...',
    NO_MESSAGES_SUBTITLE: 'Your inbox automatically refreshes every 10s',
    NO_MESSAGE_SELECTED: 'No Message Selected',
    NO_MESSAGE_SELECTED_SUBTITLE: 'Select an email from your inbox on the left to read its contents.',
    NO_HISTORY: 'No history found',
    NO_MATCHING_EMAILS: 'No matching emails found',
    MESSAGE_UNAVAILABLE: 'Message body unavailable',
    NO_PREVIEW: 'No preview available for this message. It might not be stored in the database locally.',
    NO_CONTENT: 'This message has no textual content.',
    GENERATE_TO_VIEW: 'Generate an email to view your inbox'
  }
};

// Username Prefix
export const USERNAME_PREFIX = 'devora_';

// Helper Functions
export const isProviderMoemail = (provider) => provider === PROVIDERS.MOEMAIL;
export const isProviderMailTm = (provider) => provider === PROVIDERS.MAIL_TM;

export const detectProvider = (address) => {
  if (!address) return PROVIDERS.MAIL_TM;
  return address.includes('zenra.my.id') || address.includes('moemail') 
    ? PROVIDERS.MOEMAIL 
    : PROVIDERS.MAIL_TM;
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
