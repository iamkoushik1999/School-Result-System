// Packages
import expressAsyncHandler from 'express-async-handler';
// Models
import Marks from '../models/Marks.js';
import Exam from '../models/Exam.js';
import Teacher from '../models/Teacher.js';
// Utils
import { createError } from '../utils/createError.js';

// --------------------------------------------------------------------------------------

// Verify teacher is allowed to enter marks for the given exam + subjects
const assertTeacherSubjectAccess = async ({ user, exam, subjects }) => {
  if (user.role !== 'teacher') return;
  const teacher = await Teacher.findOne({ userId: user._id }).lean();
  if (!teacher) throw createError(403, 'Teacher profile not found');

  if (!teacher.classes.includes(exam.class)) {
    throw createError(403, `You are not assigned to class ${exam.class}`);
  }

  const unauthorised = subjects.filter((s) => !teacher.subjects.includes(s));
  if (unauthorised.length > 0) {
    throw createError(403, `Not authorised for subjects: ${unauthorised.join(', ')}`);
  }
};

// GET /api/marks?examId=&studentId=
export const getMarks = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { examId, studentId } = req.query;
  const filter = { schoolId };
  if (examId) filter.examId = examId;
  if (studentId) filter.studentId = studentId;

  const marks = await Marks.find(filter)
    .populate('studentId', 'name rollNumber class section')
    .lean();

  const marksData = marks.map((m) => ({
    _id: m._id,
    student: m.studentId
      ? {
          _id: m.studentId._id,
          name: m.studentId.name,
          rollNumber: m.studentId.rollNumber,
          class: m.studentId.class,
          section: m.studentId.section,
        }
      : null,
    examId: m.examId,
    subject: m.subject,
    marksObtained: m.marksObtained,
    maxMarks: m.maxMarks,
  }));

  res.json(marksData);
});

// POST /api/marks/bulk  — upsert array of marks for one exam + subject
export const bulkEnterMarks = expressAsyncHandler(async (req, res) => {
  const { marks } = req.body;

  const examId = marks[0].examId;
  const exam = await Exam.findOne({ _id: examId, schoolId: req.user.schoolId }).lean();
  if (!exam) throw createError(404, 'Exam not found');

  const uniqueSubjects = [...new Set(marks.map((m) => m.subject))];
  await assertTeacherSubjectAccess({
    user: req.user,
    exam,
    subjects: uniqueSubjects,
  });

  // Enforce server-side maxMarks per subject — never trust client value
  for (const mark of marks) {
    const subjectDef = exam.subjects.find((s) => s.name === mark.subject);
    if (!subjectDef) throw createError(400, `Subject "${mark.subject}" not found in exam`);
    if (mark.marksObtained > subjectDef.maxMarks) {
      throw createError(
        400,
        `Marks for "${mark.subject}" exceed maximum allowed (${subjectDef.maxMarks})`,
      );
    }
    mark.maxMarks = subjectDef.maxMarks; // overwrite with server value
  }

  const ops = marks.map((m) => ({
    updateOne: {
      filter: { studentId: m.studentId, examId: m.examId, subject: m.subject },
      update: { $set: { ...m, schoolId: req.user.schoolId, enteredBy: req.user._id } },
      upsert: true,
    },
  }));

  const result = await Marks.bulkWrite(ops, { ordered: false });
  res.json({
    upsertedCount: result.upsertedCount,
    modifiedCount: result.modifiedCount,
    success: true,
    message: 'Marks entered successfully',
  });
});

// PUT /api/marks/:id
export const updateMark = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;
  const existing = await Marks.findOne({
    _id: id,
    schoolId: schoolId,
  });
  if (!existing) throw createError(404, 'Mark entry not found');

  const exam = await Exam.findById(existing.examId).lean();
  await assertTeacherSubjectAccess({
    user: req.user,
    exam,
    subjects: [existing.subject],
  });

  if (req.body.marksObtained > existing.maxMarks) {
    throw createError(400, `Marks cannot exceed maximum (${existing.maxMarks})`);
  }

  existing.marksObtained = req.body.marksObtained ?? existing.marksObtained;
  await existing.save();

  res.json({
    success: true,
    message: 'Mark updated successfully',
  });
});
