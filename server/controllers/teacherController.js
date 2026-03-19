// Packages
import expressAsyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
// Models
import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
// Utils
import { createError } from '../utils/createError.js';
// Helpers
import { hashPassword } from '../helpers/password.js';

// --------------------------------------------------------------------------------------

// GET /api/teachers
export const getTeachers = expressAsyncHandler(async (req, res) => {
  const teachers = await Teacher.find({
    schoolId: req.user.schoolId,
    isDeleted: false,
  })
    .sort({ name: 1 })
    .lean();

  const teachersData = teachers.map((ele) => {
    return {
      _id: ele._id,
      name: ele.name,
      age: ele.age,
      phone: ele.phone,
      totalSubjects: ele.subjects.length,
      totalClasses: ele.classes.length,
      classTeacherOf: ele.classTeacherOf,

      bloodGroup: ele.bloodGroup,
      subjects: ele.subjects,
      classes: ele.classes,
    };
  });

  res.json(teachersData);
});

// GET /api/teachers/:id
export const getTeacher = expressAsyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({
    _id: req.params.id,
    schoolId: req.user.schoolId,
    isDeleted: false,
  }).lean();
  if (!teacher) throw createError(404, 'Teacher not found');

  const teacherData = {
    _id: teacher?._id,
    name: teacher?.name,
    age: teacher?.age,
    phone: teacher?.phone,
    address: teacher?.address,
    bloodGroup: teacher?.bloodGroup,
    totalSubjects: teacher?.subjects.length,
    subjects: teacher?.subjects,

    totalClasses: teacher?.classes.length,
    classes: teacher?.classes,

    classTeacherOf: teacher?.classTeacherOf,

    createdAt: teacher?.createdAt,
  };

  res.json(teacherData);
});

// POST /api/teachers
// Creates Teacher + User account atomically via transaction
export const createTeacher = expressAsyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    age,
    phone,
    address,
    bloodGroup,
    subjects,
    classes,
    classTeacherOf,
  } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  const existingUser = await User.findOne({ email }).session(session);
  if (existingUser) {
    await session.abortTransaction();
    session.endSession();
    throw createError(400, 'Email already in use');
  }

  const [teacher] = await Teacher.create(
    [
      {
        schoolId: req.user.schoolId,
        name,
        age,
        phone,
        address,
        bloodGroup,
        subjects,
        classes,
        classTeacherOf,
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
        role: 'teacher',
        schoolId: req.user.schoolId,
        teacherId: teacher._id,
      },
    ],
    { session },
  );

  teacher.userId = user._id;
  await teacher.save({ session });

  await session.commitTransaction();
  session.endSession();

  res.status(201).json({
    success: true,
    message: 'Teacher Created',
    teacher,
    user,
  });
});

// PUT /api/teachers/:id
export const updateTeacher = expressAsyncHandler(async (req, res) => {
  const teacher = await Teacher.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { $set: req.body },
    { new: true, runValidators: true },
  );
  if (!teacher) throw createError(404, 'Teacher not found');

  res.json(teacher);
});

// DELETE /api/teachers/:id
// Deletes teacher profile + deactivates linked user account atomically
export const deleteTeacher = expressAsyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const teacher = await Teacher.findByIdAndUpdate(
    { _id: req.params.id, schoolId: req.user.schoolId },
    { isDeleted: true },
    { session },
  );
  if (!teacher) {
    await session.abortTransaction();
    session.endSession();
    throw createError(404, 'Teacher not found');
  }

  if (teacher.userId) {
    await User.findByIdAndUpdate(
      teacher.userId,
      {
        isActive: false,
        isDeleted: true,
      },
      { session },
    );
  }

  await session.commitTransaction();
  session.endSession();

  res.json({
    success: true,
    message: 'Teacher deleted successfully',
  });
});
