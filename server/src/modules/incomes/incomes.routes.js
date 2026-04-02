import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './incomes.schema.js';
import * as controller from './incomes.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/:academyId/incomes', academyContextMiddleware, requirePermission('income.read'), controller.list);
router.post('/:academyId/incomes', academyContextMiddleware, requirePermission('income.create'), validate(schema.createIncome), controller.create);
router.get('/:academyId/incomes/:id', academyContextMiddleware, requirePermission('income.read'), controller.getOne);
router.patch('/:academyId/incomes/:id', academyContextMiddleware, requirePermission('income.update'), validate(schema.updateIncome), controller.update);
router.patch('/:academyId/incomes/:id/archive', academyContextMiddleware, requirePermission('income.update'), controller.archive);

export default router;
