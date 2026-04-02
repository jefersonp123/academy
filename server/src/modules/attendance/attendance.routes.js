import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './attendance.schema.js';
import * as controller from './attendance.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/:academyId/attendance', academyContextMiddleware, requirePermission('attendance.read'), controller.list);
router.post('/:academyId/attendance/bulk', academyContextMiddleware, requirePermission('attendance.manage'), validate(schema.bulkAttendance), controller.bulkRecord);
router.get('/:academyId/attendance/session/:sessionId', academyContextMiddleware, requirePermission('attendance.read'), controller.bySession);
router.get('/:academyId/attendance/athlete/:athleteId', academyContextMiddleware, requirePermission('attendance.read'), controller.byAthlete);

export default router;
