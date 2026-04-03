import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './selfservice.schema.js';
import * as controller from './selfservice.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard', controller.dashboard);
router.get('/academies', controller.academies);
router.get('/payments', controller.payments);
router.get('/account-status', controller.accountStatus);
router.get('/trainings', controller.trainings);
router.get('/tournaments', controller.tournaments);
router.get('/notifications', controller.notifications);
router.post('/payment-reports', validate(schema.createPaymentReport), controller.createPaymentReport);

export default router;
