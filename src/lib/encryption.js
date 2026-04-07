const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes (64 hex characters)

/**
 * Encrypts sensitive text using AES-256-GCM.
 * Returns a string format: iv:authTag:encryptedContent
 */
function encrypt(text) {
    if (!KEY) {
        throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY, 'hex'), iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts text encrypted by the above function.
 */
function decrypt(encryptedText) {
    if (!KEY) {
        throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }

    const [ivHex, authTagHex, encryptedContent] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY, 'hex'), iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

module.exports = {
    encrypt,
    decrypt
};
