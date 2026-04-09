import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './tournaments.schema.js';
import * as controller from './tournaments.controller.js';

const router = Router();

router.use(authMiddleware);

// ─── Tournaments ──────────────────────────────────────────────────────────────
router.get('/:academyId/tournaments', academyContextMiddleware, requirePermission('tournament.read'), controller.list);
router.post('/:academyId/tournaments', academyContextMiddleware, requirePermission('tournament.create'), validate(schema.createTournament), controller.create);
router.get('/:academyId/tournaments/:id', academyContextMiddleware, requirePermission('tournament.read'), controller.getOne);
router.patch('/:academyId/tournaments/:id', academyContextMiddleware, requirePermission('tournament.update'), validate(schema.updateTournament), controller.update);
router.post('/:academyId/tournaments/:id/cancel', academyContextMiddleware, requirePermission('tournament.update'), validate(schema.cancelTournament), controller.cancel);
router.get('/:academyId/tournaments/:id/stats', academyContextMiddleware, requirePermission('tournament.read'), controller.getStats);

// ─── Callups ──────────────────────────────────────────────────────────────────
router.get('/:academyId/tournaments/:id/callups', academyContextMiddleware, requirePermission('tournament.read'), controller.listCallups);
router.post('/:academyId/tournaments/:id/callups', academyContextMiddleware, requirePermission('tournament.callup.manage'), validate(schema.createCallups), controller.createCallups);
router.post('/:academyId/tournaments/:id/callups/launch', academyContextMiddleware, requirePermission('tournament.callup.manage'), controller.launchCallups);
// respondCallup only needs authMiddleware (athlete/guardian responds on their own behalf)
router.post('/:academyId/tournaments/:id/callups/respond', academyContextMiddleware, validate(schema.respondCallup), controller.respondCallup);
router.get('/:academyId/tournaments/:id/eligible-athletes', academyContextMiddleware, requirePermission('tournament.callup.manage'), controller.getEligibleAthletes);

// ─── Costs ────────────────────────────────────────────────────────────────────
router.get('/:academyId/tournaments/:id/costs', academyContextMiddleware, requirePermission('tournament.read'), controller.listCosts);
router.post('/:academyId/tournaments/:id/costs', academyContextMiddleware, requirePermission('tournament.update'), validate(schema.createCost), controller.createCost);
router.patch('/:academyId/tournaments/:id/costs/:costId', academyContextMiddleware, requirePermission('tournament.update'), validate(schema.updateCost), controller.updateCost);
router.delete('/:academyId/tournaments/:id/costs/:costId', academyContextMiddleware, requirePermission('tournament.update'), controller.deleteCost);

// ─── Matches ──────────────────────────────────────────────────────────────────
router.get('/:academyId/tournaments/:id/matches', academyContextMiddleware, requirePermission('tournament.read'), controller.listMatches);
router.post('/:academyId/tournaments/:id/matches', academyContextMiddleware, requirePermission('tournament.update'), validate(schema.createMatch), controller.createMatch);
router.patch('/:academyId/tournaments/:id/matches/:matchId', academyContextMiddleware, requirePermission('tournament.update'), validate(schema.updateMatch), controller.updateMatch);
router.delete('/:academyId/tournaments/:id/matches/:matchId', academyContextMiddleware, requirePermission('tournament.update'), controller.deleteMatch);

// Match athletes (attendance + stats per match)
router.post('/:academyId/tournaments/:id/matches/:matchId/athletes', academyContextMiddleware, requirePermission('tournament.update'), validate(schema.upsertMatchAthletes), controller.upsertMatchAthletes);

export default router;
