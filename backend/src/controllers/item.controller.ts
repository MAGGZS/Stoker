import { Request, Response } from 'express';
import { itemService } from '../services/item.service';

export class ItemController {
  async listItems(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const result = await itemService.listItems(stockId, req.query);
    res.status(200).json(result);
  }

  async getItemById(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const itemId = req.params.itemId;
    const item = await itemService.getItemById(stockId, itemId);
    res.status(200).json(item);
  }

  async createItem(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const userId = req.user!.id;
    const item = await itemService.createItem(stockId, userId, req.body);
    res.status(201).json(item);
  }

  async updateItem(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const itemId = req.params.itemId;
    const userId = req.user!.id;
    const item = await itemService.updateItem(stockId, itemId, userId, req.body);
    res.status(200).json(item);
  }

  async deleteItem(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const itemId = req.params.itemId;
    const userId = req.user!.id;
    const result = await itemService.deleteItem(stockId, itemId, userId);
    res.status(200).json(result);
  }
}

export const itemController = new ItemController();

