import * as service from './profiles.service.js';
import { success } from '../../shared/response.js';

export async function getMyProfile(req, res, next) {
  try {
    const data = await service.getById(req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function updateMyProfile(req, res, next) {
  try {
    const data = await service.update(req.context.profileId, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function getProfile(req, res, next) {
  try {
    const data = await service.getById(req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function getProfileAcademies(req, res, next) {
  try {
    const data = await service.getAcademies(req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}
