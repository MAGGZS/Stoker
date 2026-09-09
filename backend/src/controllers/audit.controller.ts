import { Request, Response } from 'express';
import { auditService } from '../services/audit.service';

export class AuditController {
  async listAuditLogs(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const result = await auditService.listAuditLogs(stockId, req.query);
    res.status(200).json(result);
  }
}

export const auditController = new AuditController();

