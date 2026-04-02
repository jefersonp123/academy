import Joi from 'joi';

export const createAcademy = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  slug: Joi.string().min(2).max(100).lowercase().pattern(/^[a-z0-9-]+$/).required(),
  sport_type: Joi.string().max(100).required(),
  country: Joi.string().max(100).required(),
  currency_code: Joi.string().length(3).uppercase().required(),
  timezone: Joi.string().max(100).required(),
  owner_profile_id: Joi.string().uuid().required(),
});

export const updateAcademy = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  sport_type: Joi.string().max(100).optional(),
  country: Joi.string().max(100).optional(),
  currency_code: Joi.string().length(3).uppercase().optional(),
  timezone: Joi.string().max(100).optional(),
});

export const updateStatus = Joi.object({
  status: Joi.string().valid('active', 'suspended', 'inactive').required(),
});
