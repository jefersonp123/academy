import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './athletes.schema.js';
import * as controller from './athletes.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/:academyId/athletes', academyContextMiddleware, requirePermission('athlete.read'), controller.list);
router.post('/:academyId/athletes', academyContextMiddleware, requirePermission('athlete.create'), validate(schema.createAthlete), controller.create);
router.get('/:academyId/athletes/:id', academyContextMiddleware, requirePermission('athlete.read'), controller.getOne);
router.patch('/:academyId/athletes/:id', academyContextMiddleware, requirePermission('athlete.update'), validate(schema.updateAthlete), controller.update);
router.patch('/:academyId/athletes/:id/status', academyContextMiddleware, requirePermission('athlete.update'), validate(schema.updateStatus), controller.updateStatus);
router.patch('/:academyId/athletes/:id/category', academyContextMiddleware, requirePermission('athlete.update'), validate(schema.updateCategory), controller.updateCategory);

router.get('/:academyId/athletes/:id/guardians', academyContextMiddleware, requirePermission('athlete.read'), controller.listGuardians);
router.post('/:academyId/athletes/:id/guardians', academyContextMiddleware, requirePermission('athlete.update'), validate(schema.addGuardian), controller.addGuardian);
router.delete('/:academyId/athletes/:id/guardians/:guardianId', academyContextMiddleware, requirePermission('athlete.update'), controller.removeGuardian);

export default router;
