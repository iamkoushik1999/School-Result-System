import Joi from 'joi';

export const registerPrincipalSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().min(6).max(100).required(),
  schoolName: Joi.string().trim().min(2).max(200).required(),
  address: Joi.string().trim().min(5).max(500).required(),
  phone: Joi.string()
    .pattern(/^[0-9+\-\s()]{7,20}$/)
    .required()
    .messages({ 'string.pattern.base': 'Phone number is invalid' }),
  schoolEmail: Joi.string().email().lowercase().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().required(),
  password: Joi.string().required(),
});
