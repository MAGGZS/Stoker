import { Request, Response } from 'express';
import { logisticsService } from '../services/logistics.service';

export class LogisticsController {
  async getOverview(_req: Request, res: Response): Promise<void> {
    const overview = await logisticsService.getOverview();
    res.status(200).json(overview);
  }

  async executeTransfer(req: Request, res: Response): Promise<void> {
    const result = await logisticsService.executeTransfer(req.user!.id, req.body);
    res.status(200).json(result);
  }

  async getTransferHistory(_req: Request, res: Response): Promise<void> {
    const history = await logisticsService.getTransferHistory();
    res.status(200).json(history);
  }
}

export const logisticsController = new LogisticsController();
