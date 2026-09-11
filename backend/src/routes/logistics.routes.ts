import { Router } from 'express';
import { logisticsController } from '../controllers/logistics.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';

const router = Router();

// Todas as rotas de logística exigem autenticação E papel de Administrador
router.use(authenticate, requireAdmin);

router.get('/overview', (req, res) => logisticsController.getOverview(req, res));
router.post('/transfers', (req, res) => logisticsController.executeTransfer(req, res));
router.get('/transfers', (req, res) => logisticsController.getTransferHistory(req, res));

export default router;
