// Packages
import expressAsyncHandler from 'express-async-handler';
// Models
import User from '../models/User.js';
// Utils
import { createError } from '../utils/createError.js';
// Helpers
import { hashPassword } from '../helpers/password.js';

// --------------------------------------------------------------------------------------

// GET /api/users  — all users in the school (principal only)
export const getUsers = expressAsyncHandler(async (req, res) => {
  const users = await User.find({ schoolId: req.user.schoolId }).sort({ createdAt: -1 }).lean();

  const usersData = users.map((ele) => {
    return {
      _id: ele?._id,
      name: ele?.name,
      email: ele?.email,
      role: ele?.role,
      schoolId: ele?.schoolId,
      teacherId: ele?.teacherId,
      isActive: ele?.isActive,
      createdAt: ele?.createdAt,
    };
  });

  res.json(usersData);
});

// POST /api/users/admin  — create an office admin account
export const createAdmin = expressAsyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) throw createError(400, 'Email already in use');

  const hashedPassword = await hashPassword({ password });

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'admin',
    schoolId: req.user.schoolId,
  });
  res.status(201).json(user);
});

// PATCH /api/users/:id/toggle  — activate / deactivate user
export const toggleUserStatus = expressAsyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, schoolId: req.user.schoolId });
  if (!user) throw createError(404, 'User not found');
  if (user.role === 'principal') throw createError(403, 'Cannot deactivate the principal');

  user.isActive = !user.isActive;
  await user.save();
  res.json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    user,
  });
});
