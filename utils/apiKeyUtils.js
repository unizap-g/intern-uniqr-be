// utils/apiKeyUtils.js
import crypto from 'crypto';

/**
 * Generate a UUID-style API key
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export const generateUuidApiKey = () => {
  return crypto.randomUUID();
};

/**
 * Generate a prefixed API key for easier identification
 * Format: bz_xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export const generatePrefixedApiKey = () => {
  return `bz_${crypto.randomUUID()}`;
};

/**
 * Validate API key format
 */
export const validateApiKey = (apiKey) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const prefixedRegex = /^bz_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  return uuidRegex.test(apiKey) || prefixedRegex.test(apiKey);
};
