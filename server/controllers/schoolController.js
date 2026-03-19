// Packages
import expressAsyncHandler from 'express-async-handler';
// Models
import School from '../models/School.js';
// Utils
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import { createError } from '../utils/createError.js';

// --------------------------------------------------------------------------------------

// GET /api/schools
export const getSchool = expressAsyncHandler(async (req, res) => {
  const { schoolId } = req.user;
  const school = await School.findById(schoolId).lean();
  if (!school) throw createError(404, 'School not found');

  const schoolData = {
    _id: school._id,
    schoolName: school.schoolName,
    address: school.address,
    phone: school.phone,
    email: school.email,
    principalName: school.principalName,
    logo: school.logo,
    logoPublicId: school.logoPublicId,
  };

  res.json(schoolData);
});

// PUT /api/schools
export const updateSchool = expressAsyncHandler(async (req, res) => {
  const school = await School.findById(req.user.schoolId);
  if (!school) throw createError(404, 'School not found');

  if (req.file) {
    // Delete old logo from Cloudinary before uploading new one
    if (school.logoPublicId) {
      await deleteFromCloudinary(school.logoPublicId).catch(() => null); // non-fatal
    }
    const result = await uploadToCloudinary(req.file.buffer, 'school-logos');
    school.logo = result.secure_url;
    school.logoPublicId = result.public_id;
  }

  const { schoolName, address, phone, email, principalName } = req.body;
  if (schoolName) school.schoolName = schoolName;
  if (address) school.address = address;
  if (phone) school.phone = phone;
  if (email) school.email = email;
  if (principalName) school.principalName = principalName;

  await school.save();

  res.json({
    success: true,
    message: 'School updated successfully',
  });
});
