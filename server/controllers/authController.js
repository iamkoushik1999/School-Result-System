// Packages
import expressAsyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
// Models
import User from '../models/User.js';
import School from '../models/School.js';
// Utils
import { createError } from '../utils/createError.js';
// Helpers
import { signToken } from '../helpers/token.js';
import { hashPassword } from '../helpers/password.js';

// --------------------------------------------------------------------------------------

// POST /api/auth/register
export const registerPrincipal = expressAsyncHandler(async (req, res, next) => {
  const { name, email, password, schoolName, address, phone, schoolEmail } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  const existing = await User.findOne({
    email,
    isDeleted: false,
  }).session(session);
  if (existing) {
    await session.abortTransaction();
    session.endSession();
    throw createError(400, 'Email already registered', { email });
  }

  const [school] = await School.create(
    [
      {
        schoolName,
        address,
        phone,
        email: schoolEmail || email,
        principalName: name,
      },
    ],
    { session },
  );

  const hashedPassword = await hashPassword({ password });

  const [user] = await User.create(
    [
      {
        name,
        email,
        password: hashedPassword,
        role: 'principal',
        schoolId: school._id,
      },
    ],
    { session },
  );

  school.principalId = user._id;
  await school.save({ session });

  await session.commitTransaction();
  session.endSession();

  const token = signToken({ userId: user._id });
  res.status(201).json({
    success: true,
    message: 'Account created',
    token,
    user,
    school,
  });
});

// POST /api/auth/login
export const login = expressAsyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({
    email,
    isActive: true,
    isDeleted: false,
  });
  if (!user || !(await user.comparePassword(password))) {
    throw createError(401, 'Invalid email or password', { email });
  }
  const token = signToken({ userId: user._id });

  const userData = {
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    teacherId: user.teacherId,
    isActive: user.isActive,
  };

  res.json({
    success: true,
    message: 'User logged In',
    token,
    user: userData,
  });
});

// GET /api/auth/me
export const getMe = expressAsyncHandler((req, res) => {
  const user = req.user;

  const userData = {
    name: user.name,
    email: user.email,
    role: user.role,
    schoolId: user.schoolId,
    teacherId: user.teacherId,
    isActive: user.isActive,
  };

  res.json({
    success: true,
    user: userData,
  });
});
