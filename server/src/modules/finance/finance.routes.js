import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import * as controller from './finance.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/:academyId/finance/dashboard', academyContextMiddleware, requirePermission('finance.read'), controller.dashboard);
router.get('/:academyId/finance/pnl/monthly', academyContextMiddleware, requirePermission('finance.read'), controller.pnlMonthly);
router.get('/:academyId/finance/pnl/series', academyContextMiddleware, requirePermission('finance.read'), controller.pnlSeries);
router.get('/:academyId/finance/pnl/tournaments/:tournamentId', academyContextMiddleware, requirePermission('finance.read'), controller.pnlTournament);
router.get('/:academyId/finance/projection', academyContextMiddleware, requirePermission('finance.read'), controller.projection);

export default router;
