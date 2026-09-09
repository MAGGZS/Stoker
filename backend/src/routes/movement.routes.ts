import { Router } from 'express';
import { movementController } from '../controllers/movement.controller';
import { requireOwner } from '../middlewares/stockAccess';
import { validateBody, validateQuery } from '../middlewares/validate';
import {
  inboundMovementSchema,
  outboundMovementSchema,
  adjustmentMovementSchema,
  batchReconciliationSchema,
  queryMovementsSchema,
} from '../validators/movement.validator';

const router = Router({ mergeParams: true });

router.get('/', validateQuery(queryMovementsSchema), (req, res) => movementController.listMovements(req, res));
router.post('/inbound', validateBody(inboundMovementSchema), (req, res) => movementController.createInbound(req, res));
router.post('/outbound', validateBody(outboundMovementSchema), (req, res) => movementController.createOutbound(req, res));
router.post('/adjust', validateBody(adjustmentMovementSchema), (req, res) => movementController.createAdjustment(req, res));
router.post('/reconcile-batch', requireOwner, validateBody(batchReconciliationSchema), (req, res) => movementController.batchReconciliation(req, res));

export default router;

