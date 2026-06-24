function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    res.status(400).json({ error: 'Invalid JSON request body' });
    return;
  }

  console.error('Unhandled request error:', error.message);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = errorHandler;
