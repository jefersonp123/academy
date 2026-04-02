import * as service from './auth.service.js';
import { success } from '../../shared/response.js';

export async function register(req, res, next) {
  try {
    const data = await service.register(req.body);
    return success(res, data, null, 201);
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const data = await service.login(req.body);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function logout(req, res, next) {
  try {
    await service.logout(req.context.userId);
    return success(res, { message: 'Logged out successfully' });
  } catch (err) { next(err); }
}

export async function refresh(req, res, next) {
  try {
    const data = await service.refresh(req.body.refresh_token);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function forgotPassword(req, res, next) {
  try {
    await service.forgotPassword(req.body.email);
    return success(res, { message: 'Password reset email sent if account exists' });
  } catch (err) { next(err); }
}

export async function resetPassword(req, res, next) {
  try {
    await service.resetPassword(req.body);
    return success(res, { message: 'Password updated successfully' });
  } catch (err) { next(err); }
}

export async function me(req, res, next) {
  try {
    const data = await service.me(req.context.profileId);
    return success(res, data);
  } catch (err) { next(err); }
}

export async function selectAcademy(req, res, next) {
  try {
    const data = await service.selectAcademy(req.context.profileId, req.body.academy_id);
    return success(res, data);
  } catch (err) { next(err); }
}
