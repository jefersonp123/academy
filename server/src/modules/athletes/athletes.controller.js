import * as service from './athletes.service.js';
import { success, created } from '../../shared/response.js';
import { getPagination, paginationMeta } from '../../shared/pagination.js';

export async function list(req, res, next) {
  try {
    const pagination = getPagination(req.query);
    const { data, total } = await service.list(req.context.activeAcademyId, req.query, pagination);
    return success(res, data, paginationMeta(pagination.page, pagination.limit, total));
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
    const data = await service.updateEnrollmentStatus(req.context.activeAcademyId, req.params.id, req.body.membership_status);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function updateCategory(req, res, next) {
  try {
    const data = await service.updateCategory(req.context.activeAcademyId, req.params.id, req.body.category_id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function listGuardians(req, res, next) {
  try {
    const data = await service.listGuardians(req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function addGuardian(req, res, next) {
  try {
    const data = await service.addGuardian(req.params.id, req.body);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function removeGuardian(req, res, next) {
  try {
    await service.removeGuardian(req.params.id, req.params.guardianId);
    return success(res, { message: 'Guardian removed' });
  } catch (err) { next(err); }
}
