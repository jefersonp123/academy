import * as service from './notifications.service.js';
import { success, created } from '../../shared/response.js';

export async function listMine(req, res, next) {
  try {
    const data = await service.listForProfile(req.context.profileId, req.query);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function markRead(req, res, next) {
  try {
    await service.markRead(req.context.profileId, req.params.id);
    return success(res, { message: 'Marked as read' });
  } catch (err) { next(err); }
}

export async function markAllRead(req, res, next) {
  try {
    await service.markAllRead(req.context.profileId);
    return success(res, { message: 'All marked as read' });
  } catch (err) { next(err); }
}

export async function subscribePush(req, res, next) {
  try {
    const data = await service.subscribePush(req.context.profileId, req.body);
    return created(res, data);
  } catch (err) { next(err); }
}

export async function unsubscribePush(req, res, next) {
  try {
    await service.unsubscribePush(req.context.profileId, req.params.id);
    return success(res, { message: 'Unsubscribed' });
  } catch (err) { next(err); }
}

export async function sendToAcademy(req, res, next) {
  try {
    const data = await service.sendToAcademy(req.context.activeAcademyId, req.body, req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function sendPaymentReminders(req, res, next) {
  try {
    const data = await service.sendPaymentReminders(req.context.activeAcademyId, req.body);
    return success(res, data);
  } catch (err) { next(err); }
}
