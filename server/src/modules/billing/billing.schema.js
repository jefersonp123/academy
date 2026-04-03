import Joi from 'joi';

export const generatePeriods = Joi.object({
  period_year: Joi.number().integer().min(2020).max(2100).required(),
  period_month: Joi.number().integer().min(1).max(12).required(),
  due_day: Joi.number().integer().min(1).max(28).optional(),
  category_ids: Joi.array().items(Joi.string().uuid()).optional(),
});

export const updatePeriod = Joi.object({
  discount_amount: Joi.number().min(0).optional(),
  surcharge_amount: Joi.number().min(0).optional(),
  due_date: Joi.string().isoDate().optional(),
  notes: Joi.string().max(500).allow('', null).optional(),
});
