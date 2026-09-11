import { Request, Response } from 'express';
import { categoryService } from '../services/category.service';

export class CategoryController {
  async listCategories(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const categories = await categoryService.listCategories(stockId);
    res.status(200).json(categories);
  }

  async createCategory(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const userId = req.user!.id;
    const category = await categoryService.createCategory(stockId, userId, req.body);
    res.status(201).json(category);
  }

  async updateCategory(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const categoryId = req.params.categoryId;
    const userId = req.user!.id;
    const category = await categoryService.updateCategory(stockId, categoryId, userId, req.body);
    res.status(200).json(category);
  }

  async deleteCategory(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const categoryId = req.params.categoryId;
    const userId = req.user!.id;
    const result = await categoryService.deleteCategory(stockId, categoryId, userId);
    res.status(200).json(result);
  }
}

export const categoryController = new CategoryController();
