/**
 * Map an HTTP status code to a consistent error name
 * @param {number} status
 * @returns {string}
 */
function errorName(status) {
  const map = {
    400: 'BadRequest',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'NotFound',
    409: 'Conflict',
    422: 'UnprocessableEntity',
    500: 'InternalServerError',
  };
  return map[status] || 'Error';
}

/**
 * Send a consistent error response from a caught model error
 * @param {Error} err
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function handleModelError(err, res, next) {
  if (err.status) {
    return res.status(err.status).json({
      error:   errorName(err.status),
      message: err.message,
    });
  }
  next(err);
}

module.exports = { errorName, handleModelError };
