import * as service from './payments.service.js';
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

export async function confirm(req, res, next) {
  try {
    const data = await service.review(req.context.activeAcademyId, req.params.id, 'confirmed', req.body.review_notes, req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function reject(req, res, next) {
  try {
    const data = await service.review(req.context.activeAcademyId, req.params.id, 'rejected', req.body.review_notes, req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function observe(req, res, next) {
  try {
    const data = await service.review(req.context.activeAcademyId, req.params.id, 'observed', req.body.review_notes, req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function cancel(req, res, next) {
  try {
    const data = await service.cancel(req.context.activeAcademyId, req.params.id, req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}
