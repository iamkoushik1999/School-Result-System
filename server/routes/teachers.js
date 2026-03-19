// routes/teachers.js
import { Router } from 'express';
// Controllers
import {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
} from '../controllers/teacherController.js';
// Middlewares
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
// Validations
import { createTeacherSchema, updateTeacherSchema } from '../validations/teacherValidation.js';

// --------------------------------------------------------------------------------------

const router = Router();
router.use(authenticate);
router.get('/', getTeachers);
router.get('/:id', getTeacher);
router.post('/', authorize('principal'), validate(createTeacherSchema), createTeacher);
router.put('/:id', authorize('principal'), validate(updateTeacherSchema), updateTeacher);
router.delete('/:id', authorize('principal'), deleteTeacher);
export default router;
