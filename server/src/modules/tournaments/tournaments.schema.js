import Joi from 'joi';

export const createTournament = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow('', null).optional(),
  location: Joi.string().max(200).allow('', null).optional(),
  start_date: Joi.string().isoDate().required(),
  end_date: Joi.string().isoDate().required(),
  expected_cost: Joi.number().min(0).optional(),
  expected_income: Joi.number().min(0).optional(),
  training_group_id: Joi.string().uuid().allow(null).optional(),
  format: Joi.string().valid('elimination', 'round_robin', 'groups_then_elimination', 'other').allow(null).optional(),
  is_local_organizer: Joi.boolean().optional(),
});

export const updateTournament = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).allow('', null).optional(),
  location: Joi.string().max(200).allow('', null).optional(),
  start_date: Joi.string().isoDate().optional(),
  end_date: Joi.string().isoDate().optional(),
  expected_cost: Joi.number().min(0).allow(null).optional(),
  expected_income: Joi.number().min(0).allow(null).optional(),
  training_group_id: Joi.string().uuid().allow(null).optional(),
  format: Joi.string().valid('elimination', 'round_robin', 'groups_then_elimination', 'other').allow(null).optional(),
  is_local_organizer: Joi.boolean().optional(),
  status: Joi.string().valid('planned', 'callup_launched', 'in_progress', 'finished').optional(),
});

export const cancelTournament = Joi.object({
  cancellation_reason: Joi.string().max(500).allow('', null).optional(),
});

// ─── Callups ──────────────────────────────────────────────────────────────────

export const createCallups = Joi.object({
  athlete_enrollment_ids: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

export const respondCallup = Joi.object({
  callup_id: Joi.string().uuid().required(),
  response: Joi.string().valid('accepted', 'declined').required(),
  response_notes: Joi.string().max(500).allow('', null).optional(),
});

// ─── Costs ────────────────────────────────────────────────────────────────────

export const createCost = Joi.object({
  type: Joi.string().valid('inscription', 'arbitrage', 'transport', 'uniform', 'accommodation', 'meals', 'other').required(),
  description: Joi.string().max(500).allow('', null).optional(),
  amount: Joi.number().min(0).required(),
  is_confirmed: Joi.boolean().optional(),
});

export const updateCost = Joi.object({
  type: Joi.string().valid('inscription', 'arbitrage', 'transport', 'uniform', 'accommodation', 'meals', 'other').optional(),
  description: Joi.string().max(500).allow('', null).optional(),
  amount: Joi.number().min(0).optional(),
  is_confirmed: Joi.boolean().optional(),
});

// ─── Matches ─────────────────────────────────────────────────────────────────

export const createMatch = Joi.object({
  opponent: Joi.string().min(1).max(200).required(),
  match_date: Joi.string().isoDate().allow(null).optional(),
  match_time: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null).optional(),
  venue: Joi.string().max(200).allow('', null).optional(),
  stage: Joi.string().valid('group_stage', 'quarterfinal', 'semifinal', 'third_place', 'final', 'friendly').allow(null).optional(),
  our_score: Joi.number().integer().min(0).allow(null).optional(),
  opponent_score: Joi.number().integer().min(0).allow(null).optional(),
  notes: Joi.string().max(1000).allow('', null).optional(),
});

export const updateMatch = Joi.object({
  opponent: Joi.string().min(1).max(200).optional(),
  match_date: Joi.string().isoDate().allow(null).optional(),
  match_time: Joi.string().pattern(/^\d{2}:\d{2}$/).allow(null).optional(),
  venue: Joi.string().max(200).allow('', null).optional(),
  stage: Joi.string().valid('group_stage', 'quarterfinal', 'semifinal', 'third_place', 'final', 'friendly').allow(null).optional(),
  our_score: Joi.number().integer().min(0).allow(null).optional(),
  opponent_score: Joi.number().integer().min(0).allow(null).optional(),
  notes: Joi.string().max(1000).allow('', null).optional(),
});

export const upsertMatchAthletes = Joi.object({
  records: Joi.array().items(
    Joi.object({
      athlete_enrollment_id: Joi.string().uuid().required(),
      attended: Joi.boolean().optional(),
      goals: Joi.number().integer().min(0).optional(),
      assists: Joi.number().integer().min(0).optional(),
      yellow_cards: Joi.number().integer().min(0).optional(),
      red_cards: Joi.number().integer().min(0).optional(),
      is_injured: Joi.boolean().optional(),
      injury_notes: Joi.string().max(500).allow('', null).optional(),
      performance_note: Joi.string().max(500).allow('', null).optional(),
    })
  ).min(1).required(),
});
