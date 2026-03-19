// routes/users.js
import { Router } from 'express';
// Controllers
import { getUsers, createAdmin, toggleUserStatus } from '../controllers/userController.js';
// Middlewares
import { authenticate, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
// Validations
import { adminSchema } from '../validations/userValidation.js';

// --------------------------------------------------------------------------------------

const router = Router();
router.use(authenticate, authorize('principal'));
router.get('/', getUsers);
router.post('/admin', validate(adminSchema), createAdmin);
router.patch('/:id/toggle', toggleUserStatus);
export default router;
