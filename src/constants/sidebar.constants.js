export const ROLE_COLORS = {
    ULTRA: 'from-purple-600 to-pink-600',
    PRO: 'from-indigo-500 to-purple-600',
    INSIDER: 'from-emerald-500 to-teal-600',
    MEMBER: 'from-slate-500 to-slate-600',
};

export const ROLE_BADGE = {
    ULTRA: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    PRO: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    INSIDER: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    MEMBER: 'text-slate-400 bg-gray-500/10 border-gray-500/20',
};

export const menuCategories = [
    {
        label: 'Main',
        items: [
            { name: 'Dashboard', href: '/', icon: 'Dashboard' },
            { name: 'App Library', href: '/app-library', icon: 'AppLibrary' },
        ]
    },
    {
        label: 'Web3',
        items: [
            { name: 'Airdrops', href: '/airdrops', icon: 'Airdrops' },
            { name: 'Web3 Projects', href: '/web3-projects', icon: 'Web3Projects' },
        ]
    },
    {
        label: 'AI Intelligence',
        items: [
            { name: 'AI Chatbot', href: '/chatbot', icon: 'Chatbot' },
            { name: 'LLM Console', href: '/llm-console', icon: 'LLMConsole' },
            { name: 'AI Providers', href: '/ai-providers', icon: 'AIProviders' },
            { name: 'Groq Intelligence', href: '/groq-intelligence', icon: 'GroqIntelligence' },
        ]
    },
    {
        label: 'Google Services',
        items: [
            { name: 'Gmail Center', href: '/gmail-center', icon: 'GmailCenter' },
            { name: 'Mail Control', href: '/mail-control', icon: 'MailControl' },
            { name: 'Drive Center', href: '/drive-center', icon: 'DriveCenter' },
        ]
    },
    {
        label: 'Tech Hub',
        items: [
            { name: 'HeroSMS Client', href: '/herosms-client', icon: 'HeroSMSClient' },
            { name: 'Telkomsel Client', href: '/telkomsel-client', icon: 'TelkomselClient' },
            { name: 'Telegram Console', href: '/telegram-console', icon: 'TelegramConsole' },
        ]
    },
    {
        label: 'Tech Utilities',
        items: [
            { name: 'Temp Mail', href: '/temp-mail', icon: 'TempMail' },
            { name: 'Quick Vault', href: '/quick-vault', icon: 'QuickVault' },
            { name: 'HTTP Client', href: '/http-client', icon: 'HTTPClient' },
        ]
    },
    {
        label: 'Management',
        items: [
            { name: 'Users', href: '/users', icon: 'Users' },
            { name: 'Config', href: '/config', icon: 'Config' },
            { name: 'API Key', href: '/api-key', icon: 'APIKey' },
            { name: 'Endpoints', href: '/endpoints', icon: 'Endpoints' },
            { name: 'Maintenance', href: '/maintenance-control', icon: 'Maintenance' },
        ]
    },
];
