import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// Ensure the secret string is exactly 32 bytes long by hashing it with SHA-256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(process.env.JWT_SECRET || 'fallback-secret-key-123').digest();
const IV_LENGTH = 16;

export function encrypt(text) {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Encryption failing fallback to string:', error);
        return text;
    }
}

export function decrypt(text) {
    if (!text) return text;
    try {
        const textParts = text.split(':');
        if (textParts.length !== 2) return text; // Probably not encrypted

        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        // If decryption fails (e.g., plain text), return the original
        return text;
    }
}
