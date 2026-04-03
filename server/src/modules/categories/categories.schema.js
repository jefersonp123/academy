import Joi from 'joi';

export const createCategory = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  age_min: Joi.number().integer().min(0).max(100).optional(),
  age_max: Joi.number().integer().min(0).max(100).optional(),
  sort_order: Joi.number().integer().min(0).optional(),
});

export const updateCategory = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  age_min: Joi.number().integer().min(0).max(100).allow(null).optional(),
  age_max: Joi.number().integer().min(0).max(100).allow(null).optional(),
  sort_order: Joi.number().integer().min(0).optional(),
});

export const updateStatus = Joi.object({
  status: Joi.string().valid('active', 'inactive').required(),
});

export const createFee = Joi.object({
  amount: Joi.number().min(0).required(),
  currency_code: Joi.string().length(3).uppercase().required(),
  effective_from: Joi.string().isoDate().required(),
});
