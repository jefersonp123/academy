import Joi from 'joi';

export const createIncome = Joi.object({
  category_id: Joi.string().uuid().optional().allow(null),
  tournament_id: Joi.string().uuid().optional().allow(null),
  title: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow('', null).optional(),
  income_date: Joi.string().isoDate().required(),
  amount: Joi.number().min(0.01).required(),
  currency_code: Joi.string().length(3).uppercase().required(),
  proof_file_path: Joi.string().max(500).allow('', null).optional(),
});

export const updateIncome = Joi.object({
  category_id: Joi.string().uuid().allow(null).optional(),
  tournament_id: Joi.string().uuid().allow(null).optional(),
  title: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).allow('', null).optional(),
  income_date: Joi.string().isoDate().optional(),
  amount: Joi.number().min(0.01).optional(),
  currency_code: Joi.string().length(3).uppercase().optional(),
  proof_file_path: Joi.string().max(500).allow('', null).optional(),
  status: Joi.string().valid('draft', 'confirmed', 'cancelled').optional(),
});
