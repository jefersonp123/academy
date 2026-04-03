import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './payments.schema.js';
import * as controller from './payments.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/:academyId/payment-reports', academyContextMiddleware, requirePermission('payment_report.create'), controller.list);
router.post('/:academyId/payment-reports', academyContextMiddleware, requirePermission('payment_report.create'), validate(schema.createReport), controller.create);
router.get('/:academyId/payment-reports/:id', academyContextMiddleware, requirePermission('payment_report.create'), controller.getOne);
router.post('/:academyId/payment-reports/:id/confirm', academyContextMiddleware, requirePermission('payment_report.confirm'), validate(schema.reviewReport), controller.confirm);
router.post('/:academyId/payment-reports/:id/reject', academyContextMiddleware, requirePermission('payment_report.reject'), validate(schema.reviewReport), controller.reject);
router.post('/:academyId/payment-reports/:id/observe', academyContextMiddleware, requirePermission('payment_report.review'), validate(schema.reviewReport), controller.observe);
router.post('/:academyId/payment-reports/:id/cancel', academyContextMiddleware, requirePermission('payment_report.create'), controller.cancel);

export default router;
