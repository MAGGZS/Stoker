import { Request, Response } from 'express';
import { stockService } from '../services/stock.service';

export class StockController {
  async getUserStocks(req: Request, res: Response): Promise<void> {
    const stocks = await stockService.getUserStocks(req.user!.id);
    res.status(200).json(stocks);
  }

  async getStockById(req: Request, res: Response): Promise<void> {
    const stockId = req.params.stockId;
    const stock = await stockService.getStockById(stockId, req.user!.id);
    res.status(200).json(stock);
  }

  async createStock(req: Request, res: Response): Promise<void> {
    const stock = await stockService.createStock(req.user!.id, req.body);
    res.status(201).json(stock);
  }

  async updateStock(req: Request, res: Response): Promise<void> {
    const stockId = req.params.stockId;
    const updated = await stockService.updateStock(stockId, req.user!.id, req.body);
    res.status(200).json(updated);
  }

  async joinStock(req: Request, res: Response): Promise<void> {
    const { shareCode } = req.body;
    const result = await stockService.joinStock(req.user!.id, shareCode);
    res.status(200).json(result);
  }

  async deleteStock(req: Request, res: Response): Promise<void> {
    const stockId = req.params.stockId;
    const result = await stockService.deleteStock(stockId, req.user!.id);
    res.status(200).json(result);
  }

  async getStockStats(req: Request, res: Response): Promise<void> {
    const stockId = req.params.stockId;
    const stats = await stockService.getStockStats(stockId);
    res.status(200).json(stats);
  }

  async getShareCode(req: Request, res: Response): Promise<void> {
    const stockId = req.params.stockId;
    const result = await stockService.getShareCode(stockId, req.user!.id);
    res.status(200).json(result);
  }

  async refreshShareCode(req: Request, res: Response): Promise<void> {
    const stockId = req.params.stockId;
    const result = await stockService.refreshShareCode(stockId, req.user!.id);
    res.status(200).json(result);
  }
}

export const stockController = new StockController();

