// Packages
import bcrypt from 'bcryptjs';

// --------------------------------------------------------------------------------------

/**
 * @desc Hash Password
 * @param {password} password
 * @param {saltRounds} saltRounds - Default 12
 * @returns
 */
export const hashPassword = async ({ password, saltRounds = 12 }) => {
  return await bcrypt.hash(password, saltRounds);
};

/**
 * @desc Compare Password
 * @param {password} password - Input password
 * @param {hashedPassword} hashedPassword - Database password
 * @returns
 */
export const comparePassword = async ({ password, hashedPassword }) => {
  return await bcrypt.compare(password, hashedPassword);
};
