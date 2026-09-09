import { Router } from 'express';
import { auditController } from '../controllers/audit.controller';

const router = Router({ mergeParams: true });

router.get('/', (req, res) => auditController.listAuditLogs(req, res));

export default router;

