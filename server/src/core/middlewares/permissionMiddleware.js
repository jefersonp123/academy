import { AppError } from '../errors/AppError.js';

export function requirePermission(...required) {
  return (req, _res, next) => {
    if (req.context.permissions.includes('*')) return next();
    const has = required.every((p) => req.context.permissions.includes(p));
    if (!has) {
      return next(new AppError('Insufficient permissions', 403, 'FORBIDDEN'));
    }
    next();
  };
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (req.context.platformRole === 'super_admin') return next();
    if (!roles.includes(req.context.academyRole)) {
      return next(new AppError('Role not authorized for this action', 403, 'FORBIDDEN'));
    }
    next();
  };
}

export function requirePlatformAdmin(req, _res, next) {
  if (req.context.platformRole !== 'super_admin') {
    return next(new AppError('Platform admin access required', 403, 'FORBIDDEN'));
  }
  next();
}
