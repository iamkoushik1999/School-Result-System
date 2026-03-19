// Packages
import jwt from 'jsonwebtoken';

// --------------------------------------------------------------------------------------

/**
 * @desc Sign Token
 * @param {userId} userId
 * @returns
 */
export const signToken = ({ userId }) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
