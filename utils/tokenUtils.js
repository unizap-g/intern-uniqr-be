// utils/tokenUtils.js
import jwt from 'jsonwebtoken';

/**
 * Generates a short-lived Access Token
 * @param {string} userId - The user's unique ID
 * @returns {string} - The JWT access token
 */
export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '5m', // Short lifespan (e.g., 15 minutes)
  });
};

/**
 * Generates a long-lived Refresh Token
 * @param {string} userId - The user's unique ID
 * @returns {string} - The JWT refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '2m', // Long lifespan (e.g., 1 minute)
  });
};