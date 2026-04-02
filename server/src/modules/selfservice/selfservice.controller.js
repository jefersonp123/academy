import * as service from './selfservice.service.js';
import { success, created } from '../../shared/response.js';

export async function dashboard(req, res, next) {
  try {
    const data = await service.dashboard(req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function academies(req, res, next) {
  try {
    const data = await service.academies(req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function payments(req, res, next) {
  try {
    const data = await service.payments(req.context.profileId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function accountStatus(req, res, next) {
  try {
    const data = await service.accountStatus(req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function trainings(req, res, next) {
  try {
    const data = await service.trainings(req.context.profileId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function tournaments(req, res, next) {
  try {
    const data = await service.tournaments(req.context.profileId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function notifications(req, res, next) {
  try {
    const data = await service.notifications(req.context.profileId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function createPaymentReport(req, res, next) {
  try {
    const data = await service.createPaymentReport(req.context.profileId, req.body);
    return created(res, data);
  } catch (err) { next(err); }
}
