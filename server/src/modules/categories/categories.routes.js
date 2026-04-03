import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './categories.schema.js';
import * as controller from './categories.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/:academyId/categories', academyContextMiddleware, requirePermission('category.read'), controller.list);
router.post('/:academyId/categories', academyContextMiddleware, requirePermission('category.manage'), validate(schema.createCategory), controller.create);
router.get('/:academyId/categories/:id', academyContextMiddleware, requirePermission('category.read'), controller.getOne);
router.patch('/:academyId/categories/:id', academyContextMiddleware, requirePermission('category.manage'), validate(schema.updateCategory), controller.update);
router.patch('/:academyId/categories/:id/status', academyContextMiddleware, requirePermission('category.manage'), validate(schema.updateStatus), controller.updateStatus);

router.get('/:academyId/categories/:id/fees', academyContextMiddleware, requirePermission('category.read'), controller.listFees);
router.post('/:academyId/categories/:id/fees', academyContextMiddleware, requirePermission('category.manage'), validate(schema.createFee), controller.createFee);
router.get('/:academyId/categories/:id/fees/history', academyContextMiddleware, requirePermission('category.read'), controller.feeHistory);

export default router;
