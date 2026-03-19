import Joi from 'joi';

export const createExamSchema = Joi.object({
  examName: Joi.string().trim().min(2).max(100).required(),
  class: Joi.number().integer().min(1).max(12).required(),
  section: Joi.string().uppercase().trim().length(1).required(),
  subjects: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().min(1).required(),
        maxMarks: Joi.number().integer().min(1).max(1000).required(),
      }),
    )
    .min(1)
    .required(),
  date: Joi.date().iso().required(),
  isPublished: Joi.boolean().default(false),
});

export const updateExamSchema = createExamSchema
  .fork(['examName', 'class', 'section', 'subjects', 'date', 'isPublished'], (schema) =>
    schema.optional(),
  )
  .min(1);

// Single mark entry
export const markEntrySchema = Joi.object({
  studentId: Joi.string().hex().length(24).required(),
  examId: Joi.string().hex().length(24).required(),
  subject: Joi.string().trim().min(1).required(),
  marksObtained: Joi.number().min(0).required(),
  maxMarks: Joi.number().min(1).required(),
}).custom((value, helpers) => {
  if (value.marksObtained > value.maxMarks) {
    return helpers.error('any.invalid');
  }
  return value;
}, 'marks range check');

// Bulk mark entry
export const bulkMarksSchema = Joi.object({
  marks: Joi.array()
    .items(
      Joi.object({
        studentId: Joi.string().hex().length(24).required(),
        examId: Joi.string().hex().length(24).required(),
        subject: Joi.string().trim().min(1).required(),
        marksObtained: Joi.number().min(0).required(),
        maxMarks: Joi.number().min(1).required(),
      }),
    )
    .min(1)
    .required(),
});

export const schoolUpdateSchema = Joi.object({
  schoolName: Joi.string().trim().min(2).max(200),
  address: Joi.string().trim().min(5).max(500),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/),
  email: Joi.string().email().lowercase(),
  principalName: Joi.string().trim().min(2).max(100),
}).min(1);
