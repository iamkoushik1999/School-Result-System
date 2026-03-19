// routes/exams.js
import { Router } from 'express';
// Controllers
import {
  getExams,
  getExam,
  createExam,
  updateExam,
  deleteExam,
} from '../controllers/examController.js';
// Middlewares
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
// Validations
import { createExamSchema, updateExamSchema } from '../validations/examValidation.js';

// --------------------------------------------------------------------------------------

const router = Router();
router.use(authenticate);
router.get('/', getExams);
router.get('/:id', getExam);
router.post('/', authorize('admin', 'principal'), validate(createExamSchema), createExam);
router.put('/:id', authorize('admin', 'principal'), validate(updateExamSchema), updateExam);
router.delete('/:id', authorize('admin', 'principal'), deleteExam);
export default router;
