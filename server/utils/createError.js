/**
 * Create a structured HTTP error to pass to Express error handler.
 */
export const createError = (status, message, details = null) => {
  const err = new Error(message);
  err.status = status;
  if (details) err.details = details;
  return err;
};
