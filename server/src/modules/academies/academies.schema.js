import Joi from 'joi';

export const updateAcademy = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  sport_type: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  currency_code: Joi.string().length(3).uppercase().optional(),
  timezone: Joi.string().max(100).optional(),
});

export const updateSettings = Joi.object({
  payment_due_day: Joi.number().integer().min(1).max(28).optional(),
  late_fee_amount: Joi.number().min(0).optional(),
  allow_partial_payments: Joi.boolean().optional(),
  notification_days_before_due: Joi.number().integer().min(0).max(30).optional(),
  default_currency: Joi.string().length(3).optional(),
  custom_fields: Joi.object().optional(),
});
