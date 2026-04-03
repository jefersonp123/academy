import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './profiles.schema.js';
import * as controller from './profiles.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/me', controller.getMyProfile);
router.patch('/me', validate(schema.updateProfile), controller.updateMyProfile);
router.get('/:id', controller.getProfile);
router.get('/:id/academies', controller.getProfileAcademies);

export default router;
