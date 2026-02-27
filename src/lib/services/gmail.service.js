import { google } from 'googleapis';

// Next.js loads .env automatically, so we don't need dotenv config here
// unless using custom setup, but process.env is available.

/**
 * Check Gmail account status
 * @param {string} refreshToken - OAuth refresh token
 * @param {string} clientId - User specific Client ID
 * @param {string} clientSecret - User specific Client Secret
 * @returns {Object} Result with success status and Gmail data
 */
export async function checkGmail(refreshToken, clientId, clientSecret) {
    if (!clientId || !clientSecret) {
        throw new Error("Missing Google Client credentials");
    }
    try {
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret
        );

        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });

        const gmail = google.gmail({
            version: 'v1',
            auth: oauth2Client
        });

        const res = await gmail.users.getProfile({
            userId: 'me'
        });

        return {
            success: true,
            totalMessages: res.data.messagesTotal,
            totalThreads: res.data.threadsTotal,
            historyId: res.data.historyId
        };
    } catch (error) {
        console.error('Gmail API check failed:', error.message);
        return {
            success: false,
            error: error.message,
            totalMessages: 0,
            totalThreads: 0
        };
    }
}

/**
 * Get OAuth2 client
 * @param {string} clientId - User specific Client ID
 * @param {string} clientSecret - User specific Client Secret
 * @returns {Object} OAuth2 client instance
 */
export function getOAuth2Client(clientId, clientSecret) {
    if (!clientId || !clientSecret) {
        throw new Error("Missing Google Client credentials");
    }

    const callbackUrl = process.env.NODE_ENV === 'production'
        ? process.env.CALLBACK_URL_PROD
        : process.env.CALLBACK_URL_DEV;

    return new google.auth.OAuth2(
        clientId,
        clientSecret,
        callbackUrl
    );
}

/**
 * Generate Auth URL
 */
export function generateAuthUrl(clientId, clientSecret) {
    const oauth2Client = getOAuth2Client(clientId, clientSecret);
    return oauth2Client.generateAuthUrl({
        access_type: 'offline', // Essential for refresh token
        scope: [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/gmail.readonly',
            'https://www.googleapis.com/auth/drive'
        ],
        prompt: 'consent' // Force prompts to ensure refresh token
    });
}

/**
 * Get latest 5 messages
 * @param {string} refreshToken
 * @param {string} clientId - User specific Client ID
 * @param {string} clientSecret - User specific Client Secret
 * @returns {Promise<Array>} List of messages
 */
export async function getLatestMessages(refreshToken, clientId, clientSecret) {
    if (!clientId || !clientSecret) {
        throw new Error("Missing Google Client credentials");
    }
    try {
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret
        );

        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });

        const gmail = google.gmail({
            version: "v1",
            auth: oauth2Client
        });

        // Get 5 latest messages from inbox
        const list = await gmail.users.messages.list({
            userId: "me",
            maxResults: 5,
            labelIds: ["INBOX"]
        });

        const messages = [];

        for (const msg of list.data.messages || []) {
            const detail = await gmail.users.messages.get({
                userId: "me",
                id: msg.id,
                format: "full"
            });

            const headers = detail.data.payload.headers;

            const subject = headers.find(h => h.name === "Subject")?.value || "(No Subject)";
            const from = headers.find(h => h.name === "From")?.value || "(Unknown)";
            const snippet = detail.data.snippet;

            // Try to approximate internal date
            const internalDate = parseInt(detail.data.internalDate);
            const receivedAt = !isNaN(internalDate) ? new Date(internalDate) : new Date();

            // Helper to clean base64
            const cleanBase64 = (str) => {
                return str.replace(/-/g, '+').replace(/_/g, '/');
            };

            // Extract body
            let body = '';
            const payload = detail.data.payload;

            try {
                if (payload.body && payload.body.data) {
                    body = Buffer.from(cleanBase64(payload.body.data), 'base64').toString('utf-8');
                } else if (payload.parts) {
                    const findBody = (parts) => {
                        // Prefer HTML
                        const htmlPart = parts.find(p => p.mimeType === 'text/html');
                        if (htmlPart && htmlPart.body && htmlPart.body.data) {
                            return Buffer.from(cleanBase64(htmlPart.body.data), 'base64').toString('utf-8');
                        }
                        // Fallback to text/plain
                        const textPart = parts.find(p => p.mimeType === 'text/plain');
                        if (textPart && textPart.body && textPart.body.data) {
                            return Buffer.from(cleanBase64(textPart.body.data), 'base64').toString('utf-8');
                        }
                        // Dig deeper
                        for (const part of parts) {
                            if (part.parts) {
                                const found = findBody(part.parts);
                                if (found) return found;
                            }
                        }
                        return '';
                    };
                    body = findBody(payload.parts);
                }
            } catch (err) {
                console.error('Error parsing email body:', err);
            }

            console.log(`Msg ${msg.id}: Body length ${body.length}`);

            messages.push({
                id: msg.id,
                subject,
                from,
                snippet,
                body,
                receivedAt
            });
        }

        return messages;

    } catch (error) {
        console.error('Error fetching messages:', error);
        throw new Error('Failed to fetch messages');
    }
}
