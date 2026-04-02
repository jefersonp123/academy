import * as service from './billing.service.js';
import { success } from '../../shared/response.js';
import { getPagination, paginationMeta } from '../../shared/pagination.js';

export async function list(req, res, next) {
  try {
    const pagination = getPagination(req.query);
    const { data, total } = await service.list(req.context.activeAcademyId, req.query, pagination);
    return success(res, data, paginationMeta(pagination.page, pagination.limit, total));
  } catch (err) { next(err); }
}

export async function generate(req, res, next) {
  try {
    const data = await service.generate(req.context.activeAcademyId, req.body, req.context.profileId);
    return success(res, data, null, 201);
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

export async function cancel(req, res, next) {
  try {
    const data = await service.cancel(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function accountStatement(req, res, next) {
  try {
    const data = await service.accountStatement(req.context.activeAcademyId, req.params.athleteId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function debtors(req, res, next) {
  try {
    const data = await service.debtors(req.context.activeAcademyId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function collectionsSummary(req, res, next) {
  try {
    const data = await service.collectionsSummary(req.context.activeAcademyId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}
