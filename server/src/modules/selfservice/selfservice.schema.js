import Joi from 'joi';

export const createPaymentReport = Joi.object({
  payment_period_id: Joi.string().uuid().required(),
  amount_reported: Joi.number().min(0.01).required(),
  payment_method: Joi.string().max(100).required(),
  reference_number: Joi.string().max(200).allow('', null).optional(),
  payment_date: Joi.string().isoDate().required(),
  proof_file_path: Joi.string().max(500).allow('', null).optional(),
});
