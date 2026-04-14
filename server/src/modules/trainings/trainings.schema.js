import Joi from 'joi';

export const createGroup = Joi.object({
  category_id: Joi.string().uuid().required(),
  name: Joi.string().min(1).max(200).required(),
  location: Joi.string().max(200).required(),
  coach_profile_id: Joi.string().uuid().required(),
  athlete_limit: Joi.number().integer().min(1).optional().allow(null),
});

export const updateGroup = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  location: Joi.string().max(200).allow('', null).optional(),
  category_id: Joi.string().uuid().allow(null).optional(),
  coach_profile_id: Joi.string().uuid().optional().allow(null),
  athlete_limit: Joi.number().integer().min(1).optional().allow(null),
});

export const updateStatus = Joi.object({
  status: Joi.string().valid('active', 'inactive').required(),
});

export const addGroupAthletes = Joi.object({
  athlete_enrollment_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

export const createSession = Joi.object({
  training_group_id: Joi.string().uuid().required(),
  title: Joi.string().max(200).allow('', null).optional(),
  session_date: Joi.string().isoDate().required(),
  start_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
  end_time: Joi.string().pattern(/^\d{2}:\d{2}$/).required(),
});

export const updateSession = Joi.object({
  title: Joi.string().max(200).allow('', null).optional(),
  session_date: Joi.string().isoDate().optional(),
  start_time: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  end_time: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  is_enabled: Joi.boolean().optional(),
});

export const cancelSession = Joi.object({
  cancellation_reason: Joi.string().max(500).allow('', null).optional(),
});
