import { google } from 'googleapis';

/**
 * Get OAuth2 client
 */
function getOAuth2Client(clientId, clientSecret, refreshToken) {
    if (!clientId || !clientSecret) {
        throw new Error("Missing Google Client credentials");
    }

    const callbackUrl = process.env.NODE_ENV === 'production'
        ? process.env.CALLBACK_URL_PROD
        : process.env.CALLBACK_URL_DEV;

    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        callbackUrl
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    return oauth2Client;
}

/**
 * Search and list files from Google Drive
 * @param {string} refreshToken 
 * @param {string} clientId 
 * @param {string} clientSecret 
 * @param {string} query Optional search query
 * @param {string} folderId The folder ID to list files from
 * @returns {Promise<Array>} List of files
 */
export async function listDriveFiles(refreshToken, clientId, clientSecret, query = '', folderId = 'root') {
    try {
        const auth = getOAuth2Client(clientId, clientSecret, refreshToken);
        const drive = google.drive({ version: 'v3', auth });

        let q = `'${folderId}' in parents and trashed = false`;
        if (query) {
            // Basic search by name
            q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
        }

        const res = await drive.files.list({
            q,
            pageSize: 50,
            fields: 'files(id, name, mimeType, size, modifiedTime, iconLink, webViewLink)',
            orderBy: 'folder, modifiedTime desc'
        });

        return res.data.files;
    } catch (error) {
        console.error('Drive API list files failed:', error.message);
        const isAuthError = error.message.includes('insufficient authentication scopes') ||
            error.message.includes('oauth2.googleapis.com/token failed') ||
            error.message.includes('invalid_grant');
        if (isAuthError) {
            const err = new Error('Insufficient scopes or invalid token');
            err.code = 'INSUFFICIENT_SCOPES';
            throw err;
        }
        throw new Error('Failed to fetch Drive files');
    }
}

/**
 * Download a file from Google Drive
 * @param {string} refreshToken 
 * @param {string} clientId 
 * @param {string} clientSecret 
 * @param {string} fileId 
 * @returns {Promise<Object>} Stream and metadata
 */
export async function downloadDriveFile(refreshToken, clientId, clientSecret, fileId) {
    try {
        const auth = getOAuth2Client(clientId, clientSecret, refreshToken);
        const drive = google.drive({ version: 'v3', auth });

        // Get file metadata first
        const fileMeta = await drive.files.get({
            fileId: fileId,
            fields: 'id, name, mimeType'
        });

        const { name, mimeType } = fileMeta.data;
        let response;

        // Google Docs/Sheets/Slides cannot be downloaded directly via alt=media
        // We must export them
        if (mimeType.startsWith('application/vnd.google-apps.')) {
            let exportMimeType = 'application/pdf'; // Default fallback export

            if (mimeType === 'application/vnd.google-apps.document') {
                exportMimeType = 'application/pdf';
            } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
                exportMimeType = 'application/x-vnd.oasis.opendocument.spreadsheet'; // or pdf
            } else if (mimeType === 'application/vnd.google-apps.presentation') {
                exportMimeType = 'application/pdf';
            }

            response = await drive.files.export({
                fileId: fileId,
                mimeType: exportMimeType
            }, { responseType: 'stream' });

            return {
                stream: response.data,
                filename: `${name}.pdf`, // Simplified for this example
                mimeType: exportMimeType
            };
        } else {
            // Standard file download
            response = await drive.files.get({
                fileId: fileId,
                alt: 'media'
            }, { responseType: 'stream' });

            return {
                stream: response.data,
                filename: name,
                mimeType: mimeType
            };
        }
    } catch (error) {
        console.error('Drive API download failed:', error.message);
        const isAuthError = error.message.includes('insufficient authentication scopes') ||
            error.message.includes('oauth2.googleapis.com/token failed') ||
            error.message.includes('invalid_grant');
        if (isAuthError) {
            const err = new Error('Insufficient scopes or invalid token');
            err.code = 'INSUFFICIENT_SCOPES';
            throw err;
        }
        throw new Error('Failed to download Drive file');
    }
}
