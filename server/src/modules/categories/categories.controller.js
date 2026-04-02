import * as service from './categories.service.js';
import { success, created } from '../../shared/response.js';

export async function list(req, res, next) {
  try {
    const data = await service.list(req.context.activeAcademyId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const data = await service.create(req.context.activeAcademyId, req.body, req.context.profileId);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function getOne(req, res, next) {
  try {
    const data = await service.getOne(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function update(req, res, next) {
  try {
    const data = await service.update(req.context.activeAcademyId, req.params.id, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function updateStatus(req, res, next) {
  try {
    const data = await service.updateStatus(req.context.activeAcademyId, req.params.id, req.body.status);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function listFees(req, res, next) {
  try {
    const data = await service.listFees(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function createFee(req, res, next) {
  try {
    const data = await service.createFee(req.context.activeAcademyId, req.params.id, req.body, req.context.profileId);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function feeHistory(req, res, next) {
  try {
    const data = await service.feeHistory(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}
