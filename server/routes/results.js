// routes/results.js
import { Router } from 'express';
// Controllers
import {
  getExamResults,
  getStudentResult,
  downloadStudentResultPDF,
  exportClassResultCSV,
} from '../controllers/resultController.js';
// Middlewares
import { authenticate } from '../middlewares/auth.js';

// --------------------------------------------------------------------------------------

const router = Router();
router.use(authenticate);
router.get('/:examId', getExamResults);
router.get('/:examId/student/:studentId', getStudentResult);
router.get('/:examId/student/:studentId/pdf', downloadStudentResultPDF);
router.get('/:examId/export/csv', exportClassResultCSV);
export default router;
