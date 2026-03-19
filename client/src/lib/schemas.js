import { z } from 'zod';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const phoneRegex = /^[0-9+\-\s()]{7,20}$/;

// ─── Auth ────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  schoolName: z.string().min(2, 'School name required'),
  address: z.string().min(5, 'Address required'),
  phone: z.string().regex(phoneRegex, 'Invalid phone number'),
  schoolEmail: z.string().email('Invalid school email').optional().or(z.literal('')),
});

// ─── Teacher ─────────────────────────────────────────────
export const teacherSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
  age: z.coerce.number().int().min(18, 'Min age 18').max(80, 'Max age 80'),
  phone: z.string().regex(phoneRegex, 'Invalid phone'),
  address: z.string().min(5, 'Address required'),
  bloodGroup: z.enum(BLOOD_GROUPS).optional().or(z.literal('')),
  subjects: z.array(z.string().min(1)).min(1, 'At least one subject'),
  classes: z.array(z.coerce.number().int().min(1).max(12)).min(1, 'At least one class'),
  classTeacherOf: z
    .object({
      class: z.coerce.number().int().min(1).max(12),
      section: z.string().length(1).toUpperCase(),
    })
    .optional()
    .nullable(),
});

// ─── Student ─────────────────────────────────────────────
export const studentSchema = z.object({
  name: z.string().min(2, 'Name required'),
  class: z.coerce.number().int().min(1).max(12),
  section: z.string().length(1, 'Single letter section').toUpperCase(),
  rollNumber: z.coerce.number().int().min(1, 'Roll number required'),
  age: z.coerce.number().int().min(3).max(25),
  'parentNames.father': z.string().optional(),
  'parentNames.mother': z.string().optional(),
  address: z.string().optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone').optional().or(z.literal('')),
  bloodGroup: z.enum(BLOOD_GROUPS).optional().or(z.literal('')),
  isCR: z.boolean().default(false),
});

// ─── Exam ────────────────────────────────────────────────
export const examSchema = z.object({
  examName: z.string().min(2, 'Exam name required'),
  class: z.coerce.number().int().min(1).max(12),
  section: z.string().length(1).toUpperCase(),
  date: z.string().min(1, 'Date required'),
  subjects: z
    .array(
      z.object({
        name: z.string().min(1, 'Subject name required'),
        maxMarks: z.coerce.number().int().min(1, 'Max marks must be ≥ 1'),
      }),
    )
    .min(1, 'At least one subject'),
});

// ─── School ───────────────────────────────────────────────
export const schoolSchema = z.object({
  schoolName: z.string().min(2, 'School name required'),
  address: z.string().min(5, 'Address required'),
  phone: z.string().regex(phoneRegex, 'Invalid phone'),
  email: z.string().email('Invalid email'),
  principalName: z.string().min(2, 'Principal name required'),
});
