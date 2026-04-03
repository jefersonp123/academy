export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Unexpected server error';

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[error] ${req.method} ${req.path}`, err);
  }

  res.status(status).json({
    success: false,
    data: null,
    error: { code, message },
  });
}
