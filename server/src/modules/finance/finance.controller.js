import * as service from './finance.service.js';
import { success } from '../../shared/response.js';

export async function dashboard(req, res, next) {
  try {
    const data = await service.dashboard(req.context.activeAcademyId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function pnlMonthly(req, res, next) {
  try {
    const data = await service.pnlMonthly(req.context.activeAcademyId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function pnlSeries(req, res, next) {
  try {
    const data = await service.pnlSeries(req.context.activeAcademyId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function pnlTournament(req, res, next) {
  try {
    const data = await service.pnlTournament(req.context.activeAcademyId, req.params.tournamentId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function projection(req, res, next) {
  try {
    const data = await service.projection(req.context.activeAcademyId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}
