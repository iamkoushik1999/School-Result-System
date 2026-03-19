import mongoose from 'mongoose';
import { createError } from '../utils/createError.js';

const marksSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate entry for same student + exam + subject
marksSchema.index(
  {
    studentId: 1,
    examId: 1,
    subject: 1,
  },
  {
    unique: true,
  },
);

marksSchema.pre('save', function (next) {
  if (this.marksObtained > this.maxMarks) {
    throw createError(
      400,
      `Marks obtained (${this.marksObtained}) exceeds max marks (${this.maxMarks})`,
    );
  }
});

export default mongoose.model('Marks', marksSchema);
