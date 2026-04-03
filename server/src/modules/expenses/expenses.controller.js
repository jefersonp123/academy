import * as service from './expenses.service.js';
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

export async function archive(req, res, next) {
  try {
    const data = await service.archive(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function listCategories(req, res, next) {
  try {
    const data = await service.listCategories(req.context.activeAcademyId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function createCategory(req, res, next) {
  try {
    const data = await service.createCategory(req.context.activeAcademyId, req.body);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function updateCategory(req, res, next) {
  try {
    const data = await service.updateCategory(req.context.activeAcademyId, req.params.categoryId, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}
