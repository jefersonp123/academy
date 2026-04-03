import * as service from './memberships.service.js';
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

export async function updateRole(req, res, next) {
  try {
    const data = await service.updateRole(req.context.activeAcademyId, req.params.id, req.body.role_code);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function updateStatus(req, res, next) {
  try {
    const data = await service.updateStatus(req.context.activeAcademyId, req.params.id, req.body.status);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function createInvitation(req, res, next) {
  try {
    const data = await service.createInvitation(req.context.activeAcademyId, req.body, req.context.profileId);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function resendInvitation(req, res, next) {
  try {
    await service.resendInvitation(req.context.activeAcademyId, req.params.invitationId);
    return success(res, { message: 'Invitation resent' });
  } catch (err) { next(err); }
}

export async function cancelInvitation(req, res, next) {
  try {
    await service.cancelInvitation(req.context.activeAcademyId, req.params.invitationId);
    return success(res, { message: 'Invitation cancelled' });
  } catch (err) { next(err); }
}

export async function acceptInvitation(req, res, next) {
  try {
    const data = await service.acceptInvitation(req.context.profileId, req.body.token);
    return success(res, data);
  } catch (err) { next(err); }
}
