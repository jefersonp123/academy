import * as service from './platform.service.js';
import { success, created } from '../../shared/response.js';
import { getPagination, paginationMeta } from '../../shared/pagination.js';

export async function listAcademies(req, res, next) {
  try {
    const pagination = getPagination(req.query);
    const { data, total } = await service.listAcademies(req.query, pagination);
    return success(res, data, paginationMeta(pagination.page, pagination.limit, total));
  } catch (err) { next(err); }
}

export async function createAcademy(req, res, next) {
  try {
    const data = await service.createAcademy(req.body, req.context.profileId);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function getAcademy(req, res, next) {
  try {
    const data = await service.getAcademy(req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function updateAcademy(req, res, next) {
  try {
    const data = await service.updateAcademy(req.params.id, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function updateAcademyStatus(req, res, next) {
  try {
    const data = await service.updateAcademyStatus(req.params.id, req.body.status);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function getOverview(req, res, next) {
  try {
    const data = await service.getOverview();
    return success(res, data);
  } catch (err) { next(err); }
}

export async function getConsolidatedFinance(req, res, next) {
  try {
    const data = await service.getConsolidatedFinance(req.query);
    return success(res, data);
  } catch (err) { next(err); }
}
