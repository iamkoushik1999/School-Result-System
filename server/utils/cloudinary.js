import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import streamifier from 'streamifier';

// cloudinary.config() is called once at startup in config/cloudinary.js
// This file only exports upload helpers and the multer middleware.

// Memory storage — buffer is streamed directly to Cloudinary (no temp files)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

/**
 * Stream a buffer to Cloudinary and return the upload result.
 * @param {Buffer} buffer
 * @param {string} folder   - Cloudinary folder, e.g. 'school-logos'
 * @param {string} [publicId] - supply to overwrite an existing asset
 */
export const uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      resource_type: 'image',
      ...(publicId && { public_id: publicId, overwrite: true }),
    };

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

/**
 * Delete an asset from Cloudinary by its public_id.
 * Non-fatal — caller should handle errors gracefully.
 */
export const deleteFromCloudinary = (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};
