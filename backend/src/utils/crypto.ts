import crypto from 'crypto';
import { config } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM

function getMasterKey(): Buffer {
  const secret =
    process.env.MESSAGE_ENCRYPTION_KEY ||
    config.jwtSecret ||
    'chatapp_default_secure_secret_key_2026';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt message content with AES-256-GCM authenticated encryption.
 * Stored format: "enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>"
 */
export function encryptMessageContent(plaintext: string): string {
  if (!plaintext) return plaintext;
  try {
    const key = getMasterKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `enc:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('[Crypto] Message encryption error:', err);
    return plaintext;
  }
}

/**
 * Decrypt message content. If not encrypted (legacy message), returns original text.
 */
export function decryptMessageContent(storedText: string): string {
  if (!storedText || !storedText.startsWith('enc:v1:')) {
    return storedText;
  }

  try {
    const parts = storedText.split(':');
    if (parts.length !== 5) return storedText;

    const ivHex = parts[2];
    const tagHex = parts[3];
    const encryptedHex = parts[4];

    const key = getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Crypto] Message decryption error:', err);
    return storedText;
  }
}
