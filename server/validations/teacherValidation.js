import Joi from 'joi';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const createTeacherSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).max(100).required(),
  age: Joi.number().integer().min(18).max(80).required(),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .required(),
  address: Joi.string().trim().min(5).max(500).required(),
  bloodGroup: Joi.string()
    .valid(...BLOOD_GROUPS)
    .optional(),
  subjects: Joi.array().items(Joi.string().trim()).min(1).required(),
  classes: Joi.array().items(Joi.number().integer().min(1).max(12)).min(1).required(),
  classTeacherOf: Joi.object({
    class: Joi.number().integer().min(1).max(12).required(),
    section: Joi.string().uppercase().length(1).required(),
  }).optional(),
});

export const updateTeacherSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  age: Joi.number().integer().min(18).max(80),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/),
  address: Joi.string().trim().min(5).max(500),
  bloodGroup: Joi.string().valid(...BLOOD_GROUPS),
  subjects: Joi.array().items(Joi.string().trim()).min(1),
  classes: Joi.array().items(Joi.number().integer().min(1).max(12)).min(1),
  classTeacherOf: Joi.object({
    class: Joi.number().integer().min(1).max(12).required(),
    section: Joi.string().uppercase().length(1).required(),
  }).allow(null),
}).min(1); // at least one field required for update
