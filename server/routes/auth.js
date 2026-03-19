// routes/auth.js
import { Router } from 'express';
// Controllers
import { registerPrincipal, login, getMe } from '../controllers/authController.js';
// Middlewares
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
// Validations
import { registerPrincipalSchema, loginSchema } from '../validations/authValidation.js';

// --------------------------------------------------------------------------------------

const router = Router();
router.post('/register', validate(registerPrincipalSchema), registerPrincipal);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);
export default router;
