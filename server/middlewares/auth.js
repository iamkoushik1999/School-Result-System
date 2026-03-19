// Packages
import expressAsyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
// Models
import User from '../models/User.js';
// Utils
import { createError } from '../utils/createError.js';

// --------------------------------------------------------------------------------------

export const authenticate = expressAsyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw createError(401, 'No token provided');

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw createError(401, 'Invalid or expired token');
  }

  const user = await User.findById(decoded.id).select('-password').lean();
  if (!user || !user.isActive) throw createError(401, 'User not found or deactivated');

  req.user = user;
  next();
});

/** Usage: authorize('principal', 'admin') */
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) throw createError(403, 'Insufficient permissions');
    next();
  };
