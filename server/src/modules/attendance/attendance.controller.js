import * as service from './attendance.service.js';
import { success } from '../../shared/response.js';
import { getPagination, paginationMeta } from '../../shared/pagination.js';

export async function list(req, res, next) {
  try {
    const pagination = getPagination(req.query);
    const { data, total } = await service.list(req.context.activeAcademyId, req.query, pagination);
    return success(res, data, paginationMeta(pagination.page, pagination.limit, total));
  } catch (err) { next(err); }
}

export async function bulkRecord(req, res, next) {
  try {
    const data = await service.bulkRecord(req.context.activeAcademyId, req.body, req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function bySession(req, res, next) {
  try {
    const data = await service.bySession(req.context.activeAcademyId, req.params.sessionId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function byAthlete(req, res, next) {
  try {
    const pagination = getPagination(req.query);
    const { data, total } = await service.byAthlete(req.context.activeAcademyId, req.params.athleteId, req.query, pagination);
    return success(res, data, paginationMeta(pagination.page, pagination.limit, total));
  } catch (err) { next(err); }
}
