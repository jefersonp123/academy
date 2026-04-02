import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './expenses.schema.js';
import * as controller from './expenses.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/:academyId/expenses', academyContextMiddleware, requirePermission('expense.read'), controller.list);
router.post('/:academyId/expenses', academyContextMiddleware, requirePermission('expense.create'), validate(schema.createExpense), controller.create);
router.get('/:academyId/expenses/:id', academyContextMiddleware, requirePermission('expense.read'), controller.getOne);
router.patch('/:academyId/expenses/:id', academyContextMiddleware, requirePermission('expense.update'), validate(schema.updateExpense), controller.update);
router.patch('/:academyId/expenses/:id/archive', academyContextMiddleware, requirePermission('expense.update'), controller.archive);

router.get('/:academyId/expense-categories', academyContextMiddleware, requirePermission('expense.read'), controller.listCategories);
router.post('/:academyId/expense-categories', academyContextMiddleware, requirePermission('expense.create'), validate(schema.createCategory), controller.createCategory);
router.patch('/:academyId/expense-categories/:categoryId', academyContextMiddleware, requirePermission('expense.update'), validate(schema.updateCategory), controller.updateCategory);

export default router;
