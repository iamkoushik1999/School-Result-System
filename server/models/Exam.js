import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    examName: {
      type: String,
      required: true,
      trim: true,
    },
    class: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    section: {
      type: String,
      required: true,
      uppercase: true,
    },
    subjects: [
      {
        name: { 
          type: String,
          required: true,
          trim: true,
        },
        maxMarks: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    date: {
      type: Date,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Exam', examSchema);
