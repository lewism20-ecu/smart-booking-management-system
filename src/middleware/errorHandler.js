module.exports = (err, req, res, next) => {
  console.error(`[ERROR] ${err.status || 500} - ${err.message}`);
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred.'
  });
};