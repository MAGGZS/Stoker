import { Request, Response } from 'express';
import { movementService } from '../services/movement.service';

export class MovementController {
  async listMovements(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const result = await movementService.listMovements(stockId, req.query);
    res.status(200).json(result);
  }

  async createInbound(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const userId = req.user!.id;
    const result = await movementService.createInbound(stockId, userId, req.body);
    res.status(201).json(result);
  }

  async createOutbound(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const userId = req.user!.id;
    const result = await movementService.createOutbound(stockId, userId, req.body);
    res.status(201).json(result);
  }

  async createAdjustment(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const userId = req.user!.id;
    const result = await movementService.createAdjustment(stockId, userId, req.body);
    res.status(200).json(result);
  }

  async batchReconciliation(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const userId = req.user!.id;
    const result = await movementService.batchReconciliation(stockId, userId, req.body);
    res.status(200).json(result);
  }
}

export const movementController = new MovementController();

