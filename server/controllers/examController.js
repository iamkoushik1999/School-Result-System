// Packages
import expressAsyncHandler from 'express-async-handler';
// Models
import Exam from '../models/Exam.js';
// Utils
import { createError } from '../utils/createError.js';

// --------------------------------------------------------------------------------------

// GET /api/exams
export const getExams = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;

  const { class: classQuery, section: sectionQuery } = req.query;

  const filter = { schoolId };
  if (classQuery) filter.class = parseInt(classQuery);
  if (sectionQuery) filter.section = sectionQuery.toUpperCase();
  const exams = await Exam.find(filter).sort({ date: -1 }).lean();

  const examsData = exams.map((exam) => ({
    _id: exam._id,
    examName: exam.examName,
    class: exam.class,
    section: exam.section,
    date: exam.date.toISOString().split('T')[0],
    isPublished: exam.isPublished,
    createdAt: exam.createdAt,
    subjects: exam.subjects,
  }));

  res.json(examsData);
});

// GET /api/exams/:id
export const getExam = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const exam = await Exam.findOne({
    _id: id,
    schoolId,
  }).lean();
  if (!exam) throw createError(404, 'Exam not found');

  const examData = {
    _id: exam._id,
    examName: exam.examName,
    class: exam.class,
    section: exam.section,
    date: exam.date.toISOString().split('T')[0],
    subjects: exam.subjects,
    date: exam.date.toISOString().split('T')[0],
    isPublished: exam.isPublished,
    createdAt: exam.createdAt,
  };

  res.json(examData);
});

// POST /api/exams
export const createExam = expressAsyncHandler(async (req, res) => {
  const { schoolId, _id: userId } = req.user;

  const exam = await Exam.create({
    ...req.body,
    schoolId,
    createdBy: userId,
  });

  res.status(201).json({
    success: true,
    message: 'Exam created successfully',
  });
});

// PUT /api/exams/:id
export const updateExam = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const exam = await Exam.findOneAndUpdate(
    {
      _id: id,
      schoolId,
    },
    {
      $set: req.body,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  if (!exam) throw createError(404, 'Exam not found');

  res.json({
    success: true,
    message: 'Exam updated successfully',
  });
});

// DELETE /api/exams/:id
export const deleteExam = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const { id } = req.params;

  const exam = await Exam.findOneAndDelete({
    _id: id,
    schoolId,
  });
  if (!exam) throw createError(404, 'Exam not found');

  res.json({
    success: true,
    message: 'Exam deleted successfully',
  });
});
