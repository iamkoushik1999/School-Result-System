// Packages
import expressAsyncHandler from 'express-async-handler';
// Models
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
// Utils
import { createError } from '../utils/createError.js';

// --------------------------------------------------------------------------------------

// Enforce teacher class access restriction
const assertTeacherClassAccess = async ({ user, classNum }) => {
  if (user.role !== 'teacher') return;

  const teacher = await Teacher.findOne({ userId: user._id }).lean();
  if (!teacher) throw createError(403, 'Teacher profile not found');

  if (classNum && !teacher.classes.includes(classNum)) {
    throw createError(403, 'You are not assigned to this class');
  }
};

// GET /api/students?class=5&section=A
export const getStudents = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const filter = {
    schoolId,
    isActive: true,
  };

  const allowedFilters = ['class', 'section'];
  for (const key of Object.keys(req.query)) {
    if (!allowedFilters.includes(key)) {
      throw createError(400, `Invalid filter: ${key}`);
    }
  }

  const { class: classQuery, section: sectionQuery } = req.query;

  const query = {
    class: classQuery ? parseInt(classQuery) : null,
    section: sectionQuery ? sectionQuery.toUpperCase() : null,
  };

  const classNum = classQuery ? parseInt(classQuery) : null;
  if (classNum) filter.class = classNum;
  if (sectionQuery) filter.section = sectionQuery.toUpperCase();

  await assertTeacherClassAccess({
    user: req.user,
    classNum,
  });

  const students = await Student.find(filter)
    .sort({
      class: 1,
      section: 1,
      rollNumber: 1,
    })
    .lean();

  const studentsData = students.map((student) => ({
    _id: student._id,
    name: student.name,
    class: student.class,
    section: student.section,
    rollNumber: student.rollNumber,
    age: student.age,
    bloodGroup: student.bloodGroup,
    isCR: student.isCR,
  }));

  res.json(studentsData);
});

// GET /api/students/:id
export const getStudent = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const student = await Student.findOne({
    _id: id,
    schoolId,
  }).lean();
  if (!student) throw createError(404, 'Student not found');

  const studentData = {
    _id: student._id,
    name: student.name,
    class: student.class,
    section: student.section,
    rollNumber: student.rollNumber,
    age: student.age,
    parentNames: student.parentNames,
    address: student.address,
    phone: student.phone,
    bloodGroup: student.bloodGroup,
    isCR: student.isCR,
    createdAt: student.createdAt,
  };

  await assertTeacherClassAccess({
    user: req.user,
    classNum: student.class,
  });

  res.json(studentData);
});

// POST /api/students
export const createStudent = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;

  const existingStudent = await Student.findOne({
    schoolId,
    class: req.body.class,
    section: req.body.section.toUpperCase(),
    rollNumber: req.body.rollNumber,
  }).lean();
  if (existingStudent) {
    throw createError(
      400,
      `Roll number ${req.body.rollNumber} already exists in class ${req.body.class}${req.body.section.toUpperCase()}`,
    );
  }

  const student = await Student.create({
    ...req.body,
    schoolId,
  });

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
  });
});

// PUT /api/students/:id
export const updateStudent = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const student = await Student.findOneAndUpdate(
    {
      _id: id,
      schoolId: schoolId,
    },
    {
      $set: req.body,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!student) throw createError(404, 'Student not found');

  res.json({
    success: true,
    message: 'Student updated successfully',
  });
});

// DELETE /api/students/:id  — soft delete
export const deleteStudent = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const student = await Student.findOneAndUpdate(
    {
      _id: id,
      schoolId: schoolId,
    },
    {
      isActive: false,
    },
    {
      new: true,
    },
  );
  if (!student) throw createError(404, 'Student not found');

  res.json({
    success: true,
    message: 'Student deleted successfully',
  });
});
