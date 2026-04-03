import Joi from 'joi';

export const bulkAttendance = Joi.object({
  session_id: Joi.string().uuid().required(),
  records: Joi.array().items(
    Joi.object({
      athlete_enrollment_id: Joi.string().uuid().required(),
      attendance_status: Joi.string().valid('present', 'absent', 'late', 'justified').required(),
    })
  ).min(1).required(),
});
