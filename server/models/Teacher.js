import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      default: null,
    },
    subjects: [
      {
        type: String,
        trim: true,
      },
    ],
    classes: [
      {
        type: Number,
        min: 1,
        max: 12,
      },
    ],
    classTeacherOf: {
      class: {
        type: Number,
        min: 1,
        max: 12,
        default: null,
      },
      section: {
        type: String,
        uppercase: true,
        default: null,
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model('Teacher', teacherSchema);
