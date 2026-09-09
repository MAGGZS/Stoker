import { Router } from 'express';
import { stockController } from '../controllers/stock.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireStockAccess, requireOwner } from '../middlewares/stockAccess';
import { validateBody } from '../middlewares/validate';
import { createStockSchema, updateStockSchema, joinStockSchema } from '../validators/stock.validator';

import itemRoutes from './item.routes';
import movementRoutes from './movement.routes';
import memberRoutes from './member.routes';
import auditRoutes from './audit.routes';

const router = Router();

// Todas as rotas de estoque exigem login
router.use(authenticate);

// Listar estoques do usuário logado
router.get('/', (req, res) => stockController.getUserStocks(req, res));

// Criar um novo estoque (usuário se torna DONO)
router.post('/', validateBody(createStockSchema), (req, res) => stockController.createStock(req, res));

// Entrar em um estoque via código de compartilhamento (papel CONVIDADO)
router.post('/join', validateBody(joinStockSchema), (req, res) => stockController.joinStock(req, res));

// Sub-rotas aninhadas em /:stockId
router.use('/:stockId', requireStockAccess);

router.get('/:stockId', (req, res) => stockController.getStockById(req, res));
router.patch('/:stockId', requireOwner, validateBody(updateStockSchema), (req, res) => stockController.updateStock(req, res));
router.delete('/:stockId', requireOwner, (req, res) => stockController.deleteStock(req, res));
router.get('/:stockId/stats', (req, res) => stockController.getStockStats(req, res));

// Montagem das sub-rotas
router.use('/:stockId/items', itemRoutes);
router.use('/:stockId/movements', movementRoutes);
router.use('/:stockId/members', memberRoutes);
router.use('/:stockId/audit', auditRoutes);

export default router;

