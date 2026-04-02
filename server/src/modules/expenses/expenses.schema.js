import Joi from 'joi';

export const createExpense = Joi.object({
  category_id: Joi.string().uuid().optional().allow(null),
  tournament_id: Joi.string().uuid().optional().allow(null),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow('', null).optional(),
  expense_date: Joi.string().isoDate().required(),
  amount: Joi.number().min(0.01).required(),
  currency_code: Joi.string().length(3).uppercase().required(),
  payment_method: Joi.string().max(100).allow('', null).optional(),
  proof_file_path: Joi.string().max(500).allow('', null).optional(),
});

export const updateExpense = Joi.object({
  category_id: Joi.string().uuid().allow(null).optional(),
  tournament_id: Joi.string().uuid().allow(null).optional(),
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).allow('', null).optional(),
  expense_date: Joi.string().isoDate().optional(),
  amount: Joi.number().min(0.01).optional(),
  currency_code: Joi.string().length(3).uppercase().optional(),
  payment_method: Joi.string().max(100).allow('', null).optional(),
  proof_file_path: Joi.string().max(500).allow('', null).optional(),
  status: Joi.string().valid('draft', 'confirmed', 'cancelled').optional(),
});

export const createCategory = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  type: Joi.string().max(50).optional(),
});

export const updateCategory = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  type: Joi.string().max(50).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
});
