export const apiCategories = [
    {
        category: 'Authentication',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
        desc: 'Endpoints for user login, session management, and OAuth',
        endpoints: [
            { method: 'POST', path: '/api/auth/login', desc: 'Authenticate user with email and password', sampleBody: '{\n  "email": "admin@mailpulse.com",\n  "password": "your_password"\n}' },
            { method: 'POST', path: '/api/auth/logout', desc: 'Clear user session and cookies' },
            { method: 'GET', path: '/api/auth/me', desc: 'Get current authenticated user session data' },
            { method: 'GET', path: '/api/auth/google/url', desc: 'Generate Google OAuth consent URL' },
            { method: 'POST', path: '/api/auth/google/validate', desc: 'Validate Google OAuth credentials before saving' },
        ]
    },
    {
        category: 'User Management',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
        desc: 'Endpoints for managing system users and roles',
        endpoints: [
            { method: 'GET', path: '/api/users', desc: 'Retrieve all users' },
            { method: 'POST', path: '/api/users', desc: 'Create a new user', sampleBody: '{\n  "name": "Test User",\n  "email": "test@devora.col",\n  "password": "password123",\n  "role": "MEMBER"\n}', autoCleanupEndpoint: '/api/users/:id' },
            { method: 'PATCH', path: '/api/users/:id', desc: 'Update a user role or details' },
            { method: 'DELETE', path: '/api/users/:id', desc: 'Delete a user from the system' },
            { method: 'POST', path: '/api/user/upgrade', desc: 'Save Google OAuth configuration for PRO upgrade' },
            { method: 'PUT', path: '/api/user/profile', desc: 'Update user profile (Name & Email)', sampleBody: '{\n  "name": "New Name",\n  "email": "new.email@example.com"\n}' },
        ]
    },
    {
        category: 'Airdrops & Tasks',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
        desc: 'Endpoints for managing airdrop projects and associated tasks',
        endpoints: [
            { method: 'GET', path: '/api/airdrops', desc: 'Retrieve all airdrop projects' },
            { method: 'POST', path: '/api/airdrops', desc: 'Create a new airdrop project', sampleBody: '{\n  "name": "Test Project",\n  "taskType": "Social",\n  "status": "Potential"\n}', autoCleanupEndpoint: '/api/airdrops/:id' },
            { method: 'GET', path: '/api/airdrops/:id', desc: 'Get specific details of an airdrop project' },
            { method: 'PUT', path: '/api/airdrops/:id', desc: 'Update an existing airdrop project' },
            { method: 'DELETE', path: '/api/airdrops/:id', desc: 'Delete an airdrop project' },
            { method: 'PATCH', path: '/api/airdrops/:id/toggle', desc: 'Toggle the status (active/inactive) of an airdrop project' },
            { method: 'GET', path: '/api/airdrops/:id/tasks', desc: 'Get all tasks for a specific airdrop' },
            { method: 'POST', path: '/api/airdrops/:id/tasks', desc: 'Create a new task for an airdrop' },
            { method: 'PUT', path: '/api/airdrops/:id/tasks/:taskId', desc: 'Update a specific task' },
            { method: 'DELETE', path: '/api/airdrops/:id/tasks/:taskId', desc: 'Delete a specific task' },
            { method: 'POST', path: '/api/airdrops/tasks/progress', desc: 'Update task progress status' },
            { method: 'POST', path: '/api/airdrops/telegram-post', desc: 'Generate Telegram captions via Groq AI & Post to Channel', sampleBody: '{\n  "action": "preview",\n  "airdrop": {\n    "id": "123",\n    "name": "Sample Project",\n    "projectType": "Defi",\n    "status": "New",\n    "raise": "$5M"\n  },\n  "tasks": []\n}' },
        ]
    },
    {
        category: 'Airdrop Suggestions',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
        desc: 'Endpoints for community airdrop suggestions',
        endpoints: [
            { method: 'GET', path: '/api/airdrops/suggest', desc: 'Retrieve all pending airdrop suggestions' },
            { method: 'POST', path: '/api/airdrops/suggest', desc: 'Submit a new airdrop suggestion', sampleBody: '{\n  "name": "Test Suggestion",\n  "link": "https://example.com/test",\n  "description": "Just testing the API"\n}', autoCleanupEndpoint: '/api/airdrops/suggest/:id' },
            { method: 'PUT', path: '/api/airdrops/suggest/:id', desc: 'Approve or update a suggestion status' },
            { method: 'DELETE', path: '/api/airdrops/suggest/:id', desc: 'Reject or delete a suggestion' },
        ]
    },
    {
        category: 'Gmail Accounts',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
        desc: 'Endpoints for managing connected Gmail accounts and scraping',
        endpoints: [
            { method: 'GET', path: '/api/accounts', desc: 'List all connected Gmail accounts' },
            { method: 'POST', path: '/api/accounts', desc: 'Connect a new Gmail account' },
            { method: 'GET', path: '/api/accounts/:email', desc: 'Get specific account details' },
            { method: 'PUT', path: '/api/accounts/:email', desc: 'Update specific account settings' },
            { method: 'DELETE', path: '/api/accounts/:email', desc: 'Disconnect a Gmail account' },
            { method: 'GET', path: '/api/accounts/:email/messages', desc: 'Retrieve messages for a Gmail account' },
        ]
    },
    {
        category: 'Google Drive',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
        desc: 'Endpoints for managing and caching Google Drive files',
        endpoints: [
            { method: 'GET', path: '/api/drive/files', desc: 'Retrieve cached Drive files for a folder' },
            { method: 'POST', path: '/api/drive/files', desc: 'Refresh and cache Drive files from Google Drive API' }
        ]
    },
    {
        category: 'System Configuration',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
        desc: 'Endpoints for managing global system configurations and secrets',
        endpoints: [
            { method: 'GET', path: '/api/config', desc: 'Retrieve all global configurations' },
            { method: 'POST', path: '/api/config', desc: 'Create a new global configuration variable', sampleBody: '{\n  "key": "BOT_TOKEN",\n  "value": "secret_123",\n  "description": "Token for TG bot"\n}' },
            { method: 'PUT', path: '/api/config/:id', desc: 'Update an existing configuration' },
            { method: 'DELETE', path: '/api/config/:id', desc: 'Delete a configuration' }
        ]
    },
    {
        category: 'AI Chatbot',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
        desc: 'Endpoints for Groq-powered AI conversational chat',
        endpoints: [
            { method: 'GET', path: '/api/chatbot/credential', desc: 'Get active Groq credentials for user' },
            { method: 'POST', path: '/api/chatbot/credential', desc: 'Save or update Groq API key', sampleBody: '{\n  "apiKey": "gsk_..."\n}' },
            { method: 'GET', path: '/api/chatbot/session', desc: 'Retrieve user chat session history lists' },
            { method: 'POST', path: '/api/chatbot/session', desc: 'Create a new independent chat session' },
            { method: 'GET', path: '/api/chatbot/session/:id', desc: 'Load specific chat messages for a session' },
            { method: 'DELETE', path: '/api/chatbot/session/:id', desc: 'Delete a conversation session completely' },
            { method: 'POST', path: '/api/chatbot/chat', desc: 'Send a prompt to Groq API via Server', sampleBody: '{\n  "messages": [\n    { "role": "user", "content": "Hello!" }\n  ],\n  "model": "llama-3.3-70b-versatile",\n  "sessionId": "..."\n}' }
        ]
    },
    {
        category: 'Telegram Console',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
        desc: 'Endpoints for monitoring and managing Telegram bot updates',
        endpoints: [
            { method: 'GET', path: '/api/telegram/updates', desc: 'Fetch latest Telegram updates with optional database sync', sampleBody: '?sync=true' },
            { method: 'GET', path: '/api/telegram/avatar/:chatId', desc: 'Retrieve profile picture for a specific Telegram chat' },
            { method: 'GET', path: '/api/telegram/storage-config', desc: 'Retrieve current Telegram storage topic IDs (APK, Icons, Metadata)' },
            { method: 'POST', path: '/api/telegram/test-storage', desc: 'Validate storage topics by sending a test message', sampleBody: '{\n  "topicId": "123",\n  "type": "APK"\n}' },
            { method: 'GET', path: '/api/telegram/download/:fileId', desc: 'Stream and download a file (like APK) directly from Telegram servers' },
            { method: 'GET', path: '/api/telegram/image/:fileId', desc: 'Fetch and serve an image file directly from Telegram servers' },
        ]
    },
    {
        category: 'App Library',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14"><path fill="currentColor" fillRule="evenodd" d="M.352 1.305c0-.025.001-.05.003-.073l5.63 5.629l-5.63 5.63a.917.917 0 0 1-.003-.073zM1.61 13.357c.1-.019.2-.053.298-.102l6.943-3.527l-1.806-1.806zm6.496-6.496l2.152 2.152l2.586-1.314c.719-.365.719-1.31 0-1.675L10.257 4.71zm.745-2.866L1.908.468A1.122 1.122 0 0 0 1.61.366L7.045 5.8z" clipRule="evenodd" /></svg>,
        desc: 'Endpoints for managing applications, versions, and Telegram uploads',
        endpoints: [
            { method: 'GET', path: '/api/apps', desc: 'Retrieve all applications and their historical versions' },
            { method: 'GET', path: '/api/apps/:id', desc: 'Get detailed information and version history for a specific app' },
            { method: 'DELETE', path: '/api/apps/:id', desc: 'Permanently remove an app and all its associated versions (ULTRA)' },
            { method: 'POST', path: '/api/apps/:id/view', desc: 'Increment the view count for an app' },
            { method: 'DELETE', path: '/api/apps/:id/versions/:versionId', desc: 'Delete a specific version of an app (ULTRA)' },
            { method: 'POST', path: '/api/telegram/upload', desc: 'Upload a brand new app (APK + Icon) to Telegram topics (Multipart FormData)' },
            { method: 'POST', path: '/api/telegram/upload-version', desc: 'Upload a new version for an existing app to Telegram (Multipart FormData)' },
        ]
    },
    {
        category: 'Temp Mail',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
        desc: 'Endpoints for generating and managing anonymous temporary emails via Mail.tm',
        endpoints: [
            { method: 'GET', path: '/api/temp-mail/domains', desc: 'Retrieve a list of available active email domains' },
            { method: 'GET', path: '/api/temp-mail/accounts', desc: 'Retrieve all generated temporary email accounts for the user' },
            { method: 'POST', path: '/api/temp-mail/accounts', desc: 'Create a new anonymous temporary email address', sampleBody: '{\n  "domain": "cliptik.net"\n}' },
            { method: 'DELETE', path: '/api/temp-mail/accounts/:id', desc: 'Permanently delete a temporary email account' },
            { method: 'POST', path: '/api/temp-mail/token', desc: 'Generate or retrieve the Mail.tm JWT authorization token for an account', sampleBody: '{\n  "accountId": "12345"\n}' },
            { method: 'GET', path: '/api/temp-mail/messages', desc: 'Retrieve the inbox messages list for a specific account', sampleBody: '?accountId=12345' },
            { method: 'GET', path: '/api/temp-mail/messages/:id', desc: 'Retrieve the full details and HTML content of a specific email message' },
            { method: 'GET', path: '/api/temp-mail/image', desc: 'Proxy inline images to bypass CORS and tracking pixels in emails', sampleBody: '?url=https://...' }
        ]
    },
    {
        category: 'Quick Vault',
        icon: <svg className="w-[1em] h-[1em] text-blue-400 drop-shadow-md" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10V18C3 19.1046 3.89543 20 5 20H10M3 10V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V10M3 10H21M21 10V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M14 17.4286C14 16.9552 14.3838 16.5714 14.8571 16.5714H19.1429C19.6162 16.5714 20 16.9552 20 17.4286V20.1429C20 20.6162 19.6162 21 19.1429 21H14.8571C14.3838 21 14 20.6162 14 20.1429V17.4286Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M15.7143 15.2857C15.7143 14.5756 16.2899 14 17 14C17.7101 14 18.2857 14.5756 18.2857 15.2857V16.5714H15.7143V15.2857Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><circle cx="6" cy="7" r="1" fill="currentColor"></circle><circle cx="9" cy="7" r="1" fill="currentColor"></circle></svg>,
        desc: 'Endpoints for managing securely encrypted private vault credentials',
        endpoints: [
            { method: 'GET', path: '/api/quick-vault', desc: 'Retrieve all decrypted vault items for the authenticated user' },
            { method: 'POST', path: '/api/quick-vault', desc: 'Add a new vault item and store its value encrypted in the database', sampleBody: '{\n  "category": "social",\n  "label": "Twitter Password",\n  "value": "super_secret"\n}' },
            { method: 'PUT', path: '/api/quick-vault/:id', desc: 'Update an existing vault item (re-encrypts value if provided)', sampleBody: '{\n  "category": "work",\n  "label": "New Label"\n}' },
            { method: 'DELETE', path: '/api/quick-vault/:id', desc: 'Securely delete a vault item if it belongs to the authenticated user' }
        ]
    }
];
