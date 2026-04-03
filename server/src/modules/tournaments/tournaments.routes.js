import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './tournaments.schema.js';
import * as controller from './tournaments.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/:academyId/tournaments', academyContextMiddleware, requirePermission('tournament.read'), controller.list);
router.post('/:academyId/tournaments', academyContextMiddleware, requirePermission('tournament.create'), validate(schema.createTournament), controller.create);
router.get('/:academyId/tournaments/:id', academyContextMiddleware, requirePermission('tournament.read'), controller.getOne);
router.patch('/:academyId/tournaments/:id', academyContextMiddleware, requirePermission('tournament.update'), validate(schema.updateTournament), controller.update);
router.post('/:academyId/tournaments/:id/cancel', academyContextMiddleware, requirePermission('tournament.update'), controller.cancel);

router.get('/:academyId/tournaments/:id/callups', academyContextMiddleware, requirePermission('tournament.read'), controller.listCallups);
router.post('/:academyId/tournaments/:id/callups', academyContextMiddleware, requirePermission('tournament.callup.manage'), validate(schema.createCallups), controller.createCallups);
router.post('/:academyId/tournaments/:id/callups/launch', academyContextMiddleware, requirePermission('tournament.callup.manage'), controller.launchCallups);
router.post('/:academyId/tournaments/:id/callups/respond', authMiddleware, validate(schema.respondCallup), controller.respondCallup);

export default router;
