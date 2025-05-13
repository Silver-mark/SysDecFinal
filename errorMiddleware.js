// Simplified error handling middleware
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  // Always use the error message, don't worry about stack traces
  res.status(500).json({
    message: err.message || 'Something went wrong'
  });
};

module.exports = { notFound, errorHandler };