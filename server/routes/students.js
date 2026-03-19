// routes/students.js
import { Router } from 'express';
// Controllers
import {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController.js';
// Middlewares
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
// Validations
import { createStudentSchema, updateStudentSchema } from '../validations/studentValidation.js';

// --------------------------------------------------------------------------------------

const router = Router();
router.use(authenticate);
router.get('/', getStudents);
router.get('/:id', getStudent);
router.post('/', validate(createStudentSchema), createStudent);
router.put('/:id', validate(updateStudentSchema), updateStudent);
router.delete('/:id', authorize('principal', 'admin'), deleteStudent);
export default router;
