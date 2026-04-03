import { Router } from 'express';
import { authMiddleware } from '../../core/middlewares/authMiddleware.js';
import { academyContextMiddleware } from '../../core/middlewares/academyContextMiddleware.js';
import { requirePermission } from '../../core/middlewares/permissionMiddleware.js';
import { validate } from '../../core/middlewares/validationMiddleware.js';
import * as schema from './notifications.schema.js';
import * as controller from './notifications.controller.js';

const router = Router();

router.use(authMiddleware);

// Personal notifications
router.get('/notifications', controller.listMine);
router.patch('/notifications/:id/read', controller.markRead);
router.post('/notifications/read-all', controller.markAllRead);

// Push subscriptions
router.post('/push-subscriptions', validate(schema.createSubscription), controller.subscribePush);
router.delete('/push-subscriptions/:id', controller.unsubscribePush);

// Academy send (admin)
router.post('/:academyId/notifications/send', academyContextMiddleware, requirePermission('notification.send'), validate(schema.sendNotification), controller.sendToAcademy);
router.post('/:academyId/reminders/payments/send', academyContextMiddleware, requirePermission('notification.send'), validate(schema.sendReminder), controller.sendPaymentReminders);

export default router;
