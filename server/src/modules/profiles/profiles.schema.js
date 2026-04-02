import Joi from 'joi';

export const updateProfile = Joi.object({
  first_name: Joi.string().min(1).max(100).optional(),
  last_name: Joi.string().min(1).max(100).optional(),
  phone: Joi.string().max(30).allow('', null).optional(),
  avatar_url: Joi.string().uri().allow('', null).optional(),
});
