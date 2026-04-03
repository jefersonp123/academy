import Joi from 'joi';

export const createAthlete = Joi.object({
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  birth_date: Joi.string().isoDate().required(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  document_number: Joi.string().max(50).allow('', null).optional(),
  phone: Joi.string().max(30).allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  notes: Joi.string().max(1000).allow('', null).optional(),
  category_id: Joi.string().uuid().optional(),
  medical_clearance_status: Joi.string().valid('pending','approved','expired').optional(),
});

export const updateAthlete = Joi.object({
  first_name: Joi.string().min(1).max(100).optional(),
  last_name: Joi.string().min(1).max(100).optional(),
  birth_date: Joi.string().isoDate().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  document_number: Joi.string().max(50).allow('', null).optional(),
  phone: Joi.string().max(30).allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  notes: Joi.string().max(1000).allow('', null).optional(),
});

export const updateStatus = Joi.object({
  membership_status: Joi.string().valid('active','inactive','suspended','archived').required(),
});

export const updateCategory = Joi.object({
  category_id: Joi.string().uuid().required(),
});

export const addGuardian = Joi.object({
  guardian_profile_id: Joi.string().uuid().required(),
  relationship_type: Joi.string().valid('parent','legal_guardian','relative','other').required(),
  is_primary: Joi.boolean().default(false),
});
