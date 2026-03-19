import mongoose from 'mongoose';

const schoolSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    }, // Cloudinary secure_url
    logoPublicId: {
      type: String,
      default: null,
    }, // for deletion/replacement
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    principalName: {
      type: String,
      required: true,
    },
    principalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
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

export default mongoose.model('School', schoolSchema);
