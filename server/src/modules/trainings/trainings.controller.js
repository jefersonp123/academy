import * as service from './trainings.service.js';
import { success, created } from '../../shared/response.js';
import { getPagination, paginationMeta } from '../../shared/pagination.js';

export async function listGroups(req, res, next) {
  try {
    const data = await service.listGroups(req.context.activeAcademyId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function createGroup(req, res, next) {
  try {
    const data = await service.createGroup(req.context.activeAcademyId, req.body, req.context.profileId);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function getGroup(req, res, next) {
  try {
    const data = await service.getGroup(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function updateGroup(req, res, next) {
  try {
    const data = await service.updateGroup(req.context.activeAcademyId, req.params.id, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function updateGroupStatus(req, res, next) {
  try {
    const data = await service.updateGroup(req.context.activeAcademyId, req.params.id, { status: req.body.status });
    return success(res, data);
  } catch (err) { next(err); }
}

export async function listSessions(req, res, next) {
  try {
    const pagination = getPagination(req.query);
    const { data, total } = await service.listSessions(req.context.activeAcademyId, req.query, pagination);
    return success(res, data, paginationMeta(pagination.page, pagination.limit, total));
  } catch (err) { next(err); }
}

export async function createSession(req, res, next) {
  try {
    const data = await service.createSession(req.context.activeAcademyId, req.body, req.context.profileId);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function getSession(req, res, next) {
  try {
    const data = await service.getSession(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function updateSession(req, res, next) {
  try {
    const data = await service.updateSession(req.context.activeAcademyId, req.params.id, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function cancelSession(req, res, next) {
  try {
    const data = await service.cancelSession(req.context.activeAcademyId, req.params.id, req.body.cancellation_reason);
    return success(res, data);
  } catch (err) { next(err); }
}
