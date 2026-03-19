// routes/schools.js
import { Router } from 'express';
// Controllers
import { getSchool, updateSchool } from '../controllers/schoolController.js';
// Middlewares
import { authenticate, authorize } from '../middlewares/auth.js';
// Utils
import { upload } from '../utils/cloudinary.js';

// --------------------------------------------------------------------------------------

const router = Router();
router.use(authenticate);
router.get('/', getSchool);
router.put('/', authorize('principal'), upload.single('logo'), updateSchool);
export default router;
