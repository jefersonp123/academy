import { Router } from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import platformRoutes from '../modules/platform/platform.routes.js';
import academiesRoutes from '../modules/academies/academies.routes.js';
import membershipsRoutes from '../modules/memberships/memberships.routes.js';
import profilesRoutes from '../modules/profiles/profiles.routes.js';
import athletesRoutes from '../modules/athletes/athletes.routes.js';
import categoriesRoutes from '../modules/categories/categories.routes.js';
import trainingsRoutes from '../modules/trainings/trainings.routes.js';
import attendanceRoutes from '../modules/attendance/attendance.routes.js';
import billingRoutes from '../modules/billing/billing.routes.js';
import paymentsRoutes from '../modules/payments/payments.routes.js';
import expensesRoutes from '../modules/expenses/expenses.routes.js';
import incomesRoutes from '../modules/incomes/incomes.routes.js';
import financeRoutes from '../modules/finance/finance.routes.js';
import tournamentsRoutes from '../modules/tournaments/tournaments.routes.js';
import notificationsRoutes from '../modules/notifications/notifications.routes.js';
import selfServiceRoutes from '../modules/selfservice/selfservice.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/platform', platformRoutes);
router.use('/academies', academiesRoutes);
router.use('/academies', membershipsRoutes);
router.use('/profiles', profilesRoutes);
router.use('/academies', athletesRoutes);
router.use('/academies', categoriesRoutes);
router.use('/academies', trainingsRoutes);
router.use('/academies', attendanceRoutes);
router.use('/academies', billingRoutes);
router.use('/academies', paymentsRoutes);
router.use('/academies', expensesRoutes);
router.use('/academies', incomesRoutes);
router.use('/academies', financeRoutes);
router.use('/academies', tournamentsRoutes);
router.use('/', notificationsRoutes);
router.use('/me', selfServiceRoutes);

export default router;
