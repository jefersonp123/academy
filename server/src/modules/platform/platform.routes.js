import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { requirePlatformAdmin } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './platform.schema.js';
import * as controller from './platform.controller.js';

const router = Router();

router.use(authMiddleware, requirePlatformAdmin);

router.get('/academies', controller.listAcademies);
router.post('/academies', validate(schema.createAcademy), controller.createAcademy);
router.get('/academies/:id', controller.getAcademy);
router.patch('/academies/:id', validate(schema.updateAcademy), controller.updateAcademy);
router.patch('/academies/:id/status', validate(schema.updateStatus), controller.updateAcademyStatus);
router.get('/overview', controller.getOverview);
router.get('/finance/consolidated', controller.getConsolidatedFinance);

export default router;
