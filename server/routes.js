import { Router } from 'express';
const router = Router();

import authRoutes from './routes/auth.js';
import schoolRoutes from './routes/schools.js';
import teacherRoutes from './routes/teachers.js';
import studentRoutes from './routes/students.js';
import examRoutes from './routes/exams.js';
import marksRoutes from './routes/marks.js';
import resultRoutes from './routes/results.js';
import userRoutes from './routes/users.js';

// Routes
router.use('/auth', authRoutes);
router.use('/schools', schoolRoutes);
router.use('/teachers', teacherRoutes);
router.use('/students', studentRoutes);
router.use('/exams', examRoutes);
router.use('/marks', marksRoutes);
router.use('/results', resultRoutes);
router.use('/users', userRoutes);

export default router;
