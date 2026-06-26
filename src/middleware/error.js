function errorHandler(err, req, res, next) {
  console.error('ERROR OBJECT:', err);
  if (err.stack) console.error(err.stack);
  
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message
  });
}

module.exports = { errorHandler };
