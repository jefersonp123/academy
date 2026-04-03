import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './billing.schema.js';
import * as controller from './billing.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/:academyId/payment-periods', academyContextMiddleware, requirePermission('payment_period.read'), controller.list);
router.post('/:academyId/payment-periods/generate', academyContextMiddleware, requirePermission('payment_period.generate'), validate(schema.generatePeriods), controller.generate);
router.get('/:academyId/payment-periods/:id', academyContextMiddleware, requirePermission('payment_period.read'), controller.getOne);
router.patch('/:academyId/payment-periods/:id', academyContextMiddleware, requirePermission('payment_period.generate'), validate(schema.updatePeriod), controller.update);
router.post('/:academyId/payment-periods/:id/cancel', academyContextMiddleware, requirePermission('payment_period.generate'), controller.cancel);

router.get('/:academyId/athletes/:athleteId/account-statement', academyContextMiddleware, requirePermission('payment_period.read'), controller.accountStatement);
router.get('/:academyId/debtors', academyContextMiddleware, requirePermission('payment_period.read'), controller.debtors);
router.get('/:academyId/collections/summary', academyContextMiddleware, requirePermission('payment_period.read'), controller.collectionsSummary);

export default router;
