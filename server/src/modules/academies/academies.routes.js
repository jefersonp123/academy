import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './academies.schema.js';
import * as controller from './academies.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', controller.listMyAcademies);
router.get('/:academyId', academyContextMiddleware, controller.getAcademy);
router.patch('/:academyId', academyContextMiddleware, requirePermission('academy.update'), validate(schema.updateAcademy), controller.updateAcademy);
router.get('/:academyId/settings', academyContextMiddleware, requirePermission('academy.read'), controller.getSettings);
router.patch('/:academyId/settings', academyContextMiddleware, requirePermission('academy.update'), validate(schema.updateSettings), controller.updateSettings);

export default router;
