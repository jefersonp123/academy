import Joi from 'joi';

export const createMembership = Joi.object({
  profile_id: Joi.string().uuid().required(),
  role_code: Joi.string().valid('academy_owner','academy_admin','finance_manager','collections_manager','coach','staff','guardian','athlete').required(),
});

export const updateMembership = Joi.object({
  is_primary: Joi.boolean().optional(),
});

export const updateRole = Joi.object({
  role_code: Joi.string().valid('academy_owner','academy_admin','finance_manager','collections_manager','coach','staff','guardian','athlete').required(),
});

export const updateStatus = Joi.object({
  status: Joi.string().valid('active','suspended','inactive','archived').required(),
});

export const createInvitation = Joi.object({
  email: Joi.string().email().required(),
  role_code: Joi.string().valid('academy_owner','academy_admin','finance_manager','collections_manager','coach','staff','guardian','athlete').required(),
});

export const acceptInvitation = Joi.object({
  token: Joi.string().required(),
});
