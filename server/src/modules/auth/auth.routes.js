import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './auth.schema.js';
import * as controller from './auth.controller.js';

const router = Router();

router.post('/register', validate(schema.register), controller.register);
router.post('/login', validate(schema.login), controller.login);
router.post('/logout', authMiddleware, controller.logout);
router.post('/refresh', validate(schema.refresh), controller.refresh);
router.post('/forgot-password', validate(schema.forgotPassword), controller.forgotPassword);
router.post('/reset-password', validate(schema.resetPassword), controller.resetPassword);
router.get('/me', authMiddleware, controller.me);
router.post('/select-academy', authMiddleware, validate(schema.selectAcademy), controller.selectAcademy);

export default router;
