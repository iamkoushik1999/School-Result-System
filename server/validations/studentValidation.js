import Joi from 'joi';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const createStudentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  class: Joi.number().integer().min(1).max(12).required(),
  section: Joi.string().uppercase().trim().length(1).required(),
  rollNumber: Joi.number().integer().min(1).required(),
  age: Joi.number().integer().min(3).max(25).required(),
  parentNames: Joi.object({
    father: Joi.string().trim().max(100).optional(),
    mother: Joi.string().trim().max(100).optional(),
  }).optional(),
  address: Joi.string().trim().max(500).optional(),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .optional(),
  bloodGroup: Joi.string()
    .valid(...BLOOD_GROUPS)
    .optional(),
  isCR: Joi.boolean().default(false),
});

export const updateStudentSchema = createStudentSchema
  .fork(['name', 'class', 'section', 'rollNumber', 'age'], (schema) => schema.optional())
  .min(1);
