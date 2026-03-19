/**
 * Express middleware factory for Joi validation.
 * Validates req.body against the given schema.
 * Returns 422 with field-level errors on failure.
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // collect all errors, not just the first
    stripUnknown: true, // remove fields not in schema
  });

  if (error) {
    const details = error.details.map((d) => ({
      field: d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      details,
    });
  }

  req.body = value; // use sanitized/coerced value
  next();
};
