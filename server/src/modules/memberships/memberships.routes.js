import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './memberships.schema.js';
import * as controller from './memberships.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/:academyId/memberships', academyContextMiddleware, requirePermission('membership.read'), controller.list);
router.post('/:academyId/memberships', academyContextMiddleware, requirePermission('membership.create'), validate(schema.createMembership), controller.create);
router.get('/:academyId/memberships/:id', academyContextMiddleware, requirePermission('membership.read'), controller.getOne);
router.patch('/:academyId/memberships/:id', academyContextMiddleware, requirePermission('membership.update'), validate(schema.updateMembership), controller.update);
router.patch('/:academyId/memberships/:id/role', academyContextMiddleware, requirePermission('membership.update'), validate(schema.updateRole), controller.updateRole);
router.patch('/:academyId/memberships/:id/status', academyContextMiddleware, requirePermission('membership.update'), validate(schema.updateStatus), controller.updateStatus);

router.post('/:academyId/invitations', academyContextMiddleware, requirePermission('membership.create'), validate(schema.createInvitation), controller.createInvitation);
router.post('/:academyId/invitations/:invitationId/resend', academyContextMiddleware, requirePermission('membership.create'), controller.resendInvitation);
router.post('/:academyId/invitations/:invitationId/cancel', academyContextMiddleware, requirePermission('membership.update'), controller.cancelInvitation);
router.post('/invitations/accept', authMiddleware, validate(schema.acceptInvitation), controller.acceptInvitation);

export default router;
