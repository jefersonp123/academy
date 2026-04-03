import * as service from './academies.service.js';
import { success } from '../../shared/response.js';

export async function listMyAcademies(req, res, next) {
  try {
    const data = await service.listForProfile(req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function getAcademy(req, res, next) {
  try {
    const data = await service.getById(req.context.activeAcademyId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function updateAcademy(req, res, next) {
  try {
    const data = await service.update(req.context.activeAcademyId, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function getSettings(req, res, next) {
  try {
    const data = await service.getSettings(req.context.activeAcademyId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function updateSettings(req, res, next) {
  try {
    const data = await service.updateSettings(req.context.activeAcademyId, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}
