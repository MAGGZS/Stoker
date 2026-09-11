import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res).catch(next));

// Gestão de Usuários
router.get('/users', (req, res, next) => adminController.getUsers(req, res).catch(next));
router.patch('/users/:id/role', (req, res, next) => adminController.toggleUserAdmin(req, res).catch(next));
router.patch('/users/:id/reset-password', (req, res, next) => adminController.resetUserPassword(req, res).catch(next));
router.delete('/users/:id', (req, res, next) => adminController.deleteUser(req, res).catch(next));

// Central de Feedbacks
router.get('/feedbacks', (req, res, next) => adminController.getFeedbacks(req, res).catch(next));
router.patch('/feedbacks/:id/status', (req, res, next) => adminController.updateFeedbackStatus(req, res).catch(next));
router.delete('/feedbacks/:id', (req, res, next) => adminController.deleteFeedback(req, res).catch(next));

// Auditoria
router.get('/audit', (req, res, next) => adminController.getAuditLogs(req, res).catch(next));

export default router;
