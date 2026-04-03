import { AppError } from '../errors/AppError.js';

export function validate(schema, target = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      return next(new AppError(message, 422, 'VALIDATION_ERROR'));
    }

    req[target] = value;
    next();
  };
}
