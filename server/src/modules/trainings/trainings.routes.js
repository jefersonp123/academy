import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './trainings.schema.js';
import * as controller from './trainings.controller.js';

const router = Router();

router.use(authMiddleware);

// ─── Training groups ──────────────────────────────────────────────────────────
router.get('/:academyId/trainings', academyContextMiddleware, requirePermission('training.read'), controller.listGroups);
router.post('/:academyId/trainings', academyContextMiddleware, requirePermission('training.manage'), validate(schema.createGroup), controller.createGroup);
router.get('/:academyId/trainings/:id', academyContextMiddleware, requirePermission('training.read'), controller.getGroup);
router.patch('/:academyId/trainings/:id', academyContextMiddleware, requirePermission('training.manage'), validate(schema.updateGroup), controller.updateGroup);
router.patch('/:academyId/trainings/:id/status', academyContextMiddleware, requirePermission('training.manage'), validate(schema.updateStatus), controller.updateGroupStatus);

// ─── Group athletes ───────────────────────────────────────────────────────────
router.get('/:academyId/trainings/:id/athletes', academyContextMiddleware, requirePermission('training.read'), controller.listGroupAthletes);
router.post('/:academyId/trainings/:id/athletes', academyContextMiddleware, requirePermission('training.manage'), validate(schema.addGroupAthletes), controller.addGroupAthletes);
router.delete('/:academyId/trainings/:id/athletes/:enrollmentId', academyContextMiddleware, requirePermission('training.manage'), controller.removeGroupAthlete);

// ─── Sessions ─────────────────────────────────────────────────────────────────
router.get('/:academyId/training-sessions', academyContextMiddleware, requirePermission('training.read'), controller.listSessions);
router.post('/:academyId/training-sessions', academyContextMiddleware, requirePermission('training.manage'), validate(schema.createSession), controller.createSession);
router.get('/:academyId/training-sessions/:id', academyContextMiddleware, requirePermission('training.read'), controller.getSession);
router.patch('/:academyId/training-sessions/:id', academyContextMiddleware, requirePermission('training.manage'), validate(schema.updateSession), controller.updateSession);
router.patch('/:academyId/training-sessions/:id/cancel', academyContextMiddleware, requirePermission('training.manage'), validate(schema.cancelSession), controller.cancelSession);

export default router;
