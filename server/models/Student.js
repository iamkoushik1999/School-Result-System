import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
    },
    name: {
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
      trim: true,
    },
    rollNumber: {
      type: Number,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    parentNames: {
      father: {
        type: String,
        trim: true,
        default: '',
      },
      mother: {
        type: String,
        trim: true,
        default: '',
      },
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      default: '',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      default: null,
    },
    isCR: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Unique roll number per class-section per school
studentSchema.index(
  {
    schoolId: 1,
    class: 1,
    section: 1,
    rollNumber: 1,
  },
  {
    unique: true,
  },
);

export default mongoose.model('Student', studentSchema);
