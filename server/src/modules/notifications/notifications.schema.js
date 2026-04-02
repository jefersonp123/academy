import Joi from 'joi';

export const createSubscription = Joi.object({
  endpoint: Joi.string().uri().required(),
  p256dh: Joi.string().required(),
  auth: Joi.string().required(),
  user_agent: Joi.string().max(500).allow('', null).optional(),
  academy_id: Joi.string().uuid().allow(null).optional(),
});

export const sendNotification = Joi.object({
  profile_ids: Joi.array().items(Joi.string().uuid()).optional(),
  role_codes: Joi.array().items(Joi.string()).optional(),
  type: Joi.string().max(100).required(),
  title: Joi.string().max(200).required(),
  body: Joi.string().max(1000).required(),
  payload_json: Joi.object().optional(),
});

export const sendReminder = Joi.object({
  period_year: Joi.number().integer().min(2020).max(2100).required(),
  period_month: Joi.number().integer().min(1).max(12).required(),
  status_filter: Joi.array().items(Joi.string().valid('pending', 'overdue')).optional(),
});
