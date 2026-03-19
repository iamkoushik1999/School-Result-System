// routes/marks.js
import { Router } from 'express';
// Controllers
import { getMarks, bulkEnterMarks, updateMark } from '../controllers/marksController.js';
// Middlewares
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
// Validations
import { bulkMarksSchema } from '../validations/examValidation.js';

// --------------------------------------------------------------------------------------

const router = Router();
router.use(authenticate);
router.get('/', getMarks);
router.post('/bulk', validate(bulkMarksSchema), bulkEnterMarks);
router.put('/:id', updateMark);
export default router;
