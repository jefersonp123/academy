import * as service from './tournaments.service.js';
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

export async function cancel(req, res, next) {
  try {
    const data = await service.cancel(req.context.activeAcademyId, req.params.id, req.body.cancellation_reason, req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function getStats(req, res, next) {
  try {
    const data = await service.getStats(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

// ─── Callups ──────────────────────────────────────────────────────────────────

export async function listCallups(req, res, next) {
  try {
    const data = await service.listCallups(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function createCallups(req, res, next) {
  try {
    const data = await service.createCallups(req.context.activeAcademyId, req.params.id, req.body.athlete_enrollment_ids);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function launchCallups(req, res, next) {
  try {
    const data = await service.launchCallups(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function respondCallup(req, res, next) {
  try {
    const data = await service.respondCallup(req.context.profileId, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function getEligibleAthletes(req, res, next) {
  try {
    const data = await service.getEligibleAthletes(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

// ─── Costs ────────────────────────────────────────────────────────────────────

export async function listCosts(req, res, next) {
  try {
    const data = await service.listCosts(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function createCost(req, res, next) {
  try {
    const data = await service.createCost(req.context.activeAcademyId, req.params.id, req.body);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function updateCost(req, res, next) {
  try {
    const data = await service.updateCost(req.context.activeAcademyId, req.params.id, req.params.costId, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function deleteCost(req, res, next) {
  try {
    await service.deleteCost(req.context.activeAcademyId, req.params.id, req.params.costId);
    return success(res, null);
  } catch (err) { next(err); }
}

// ─── Matches ──────────────────────────────────────────────────────────────────

export async function listMatches(req, res, next) {
  try {
    const data = await service.listMatches(req.context.activeAcademyId, req.params.id);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function createMatch(req, res, next) {
  try {
    const data = await service.createMatch(req.context.activeAcademyId, req.params.id, req.body, req.context.profileId);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function updateMatch(req, res, next) {
  try {
    const data = await service.updateMatch(req.context.activeAcademyId, req.params.id, req.params.matchId, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function deleteMatch(req, res, next) {
  try {
    await service.deleteMatch(req.context.activeAcademyId, req.params.id, req.params.matchId);
    return success(res, null);
  } catch (err) { next(err); }
}

export async function upsertMatchAthletes(req, res, next) {
  try {
    const data = await service.upsertMatchAthletes(req.context.activeAcademyId, req.params.matchId, req.body.records);
    return success(res, data);
  } catch (err) { next(err); }
}
