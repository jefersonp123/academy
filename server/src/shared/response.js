export function success(res, data = null, meta = null, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    meta,
    error: null,
  });
}

export function created(res, data = null) {
  return success(res, data, null, 201);
}
