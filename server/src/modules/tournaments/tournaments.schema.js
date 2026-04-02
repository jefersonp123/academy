import Joi from 'joi';

export const createTournament = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow('', null).optional(),
  location: Joi.string().max(200).allow('', null).optional(),
  start_date: Joi.string().isoDate().required(),
  end_date: Joi.string().isoDate().required(),
  expected_cost: Joi.number().min(0).optional(),
  expected_income: Joi.number().min(0).optional(),
});

export const updateTournament = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).allow('', null).optional(),
  location: Joi.string().max(200).allow('', null).optional(),
  start_date: Joi.string().isoDate().optional(),
  end_date: Joi.string().isoDate().optional(),
  expected_cost: Joi.number().min(0).allow(null).optional(),
  expected_income: Joi.number().min(0).allow(null).optional(),
  status: Joi.string().valid('planned', 'callup_launched', 'in_progress', 'finished').optional(),
});

export const createCallups = Joi.object({
  athlete_enrollment_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

export const respondCallup = Joi.object({
  callup_id: Joi.string().uuid().required(),
  response: Joi.string().valid('accepted', 'declined').required(),
  response_notes: Joi.string().max(500).allow('', null).optional(),
});
