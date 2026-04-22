// AI Proxy Configuration Presets
export const AI_PROXY_PRESETS = {
  ROUTER: {
    id: 'ROUTER',
    label: '9Router Proxy',
    urlKey: 'ROUTER_PROXY_URL',
    tokenKey: 'ROUTER_PROXY_TOKEN',
  },
  CPA: {
    id: 'CPA',
    label: 'CPA Proxy',
    urlKey: 'CPA_PROXY_URL',
    tokenKey: 'CPA_PROXY_TOKEN',
  },
  DEFAULT: {
    id: 'DEFAULT',
    label: 'Default Proxy',
    urlKey: 'AI_PROXY_URL',
    tokenKey: 'AI_PROXY_TOKEN',
  },
};

// Get proxy config from environment (server-side only)
export function getProxyConfig(presetId) {
  const preset = AI_PROXY_PRESETS[presetId] || AI_PROXY_PRESETS.DEFAULT;
  
  // Try preset-specific env vars first, then fall back to default
  const url = process.env[preset.urlKey] || process.env.AI_PROXY_URL || 'http://localhost:8317';
  const token = process.env[preset.tokenKey] || process.env.AI_PROXY_TOKEN || 'Bandulan113';
  
  return {
    url,
    token,
    preset: preset.id,
  };
}

// Get all available presets for dropdown
export function getAvailablePresets() {
  return Object.values(AI_PROXY_PRESETS).map(preset => ({
    value: preset.id,
    label: preset.label,
  }));
}
