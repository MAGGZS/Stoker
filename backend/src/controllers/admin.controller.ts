import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { FeedbackStatus, FeedbackType } from '@prisma/client';

export class AdminController {
  async getDashboard(req: Request, res: Response) {
    const data = await adminService.getDashboardStats();
    res.json({ data });
  }

  async getUsers(req: Request, res: Response) {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const data = await adminService.listUsers(search, page, limit);
    res.json({ data });
  }

  async toggleUserAdmin(req: Request, res: Response) {
    const { id } = req.params;
    const requesterId = req.user!.id;

    const user = await adminService.toggleUserAdmin(id, requesterId);
    res.json({ message: 'Privilégio de administrador atualizado.', data: user });
  }

  async resetUserPassword(req: Request, res: Response) {
    const { id } = req.params;
    const { newPassword } = req.body;

    const result = await adminService.resetUserPassword(id, newPassword);
    res.json(result);
  }

  async deleteUser(req: Request, res: Response) {
    const { id } = req.params;
    const requesterId = req.user!.id;

    const result = await adminService.deleteUser(id, requesterId);
    res.json(result);
  }

  async getFeedbacks(req: Request, res: Response) {
    const status = req.query.status as FeedbackStatus | undefined;
    const type = req.query.type as FeedbackType | undefined;

    const data = await adminService.listFeedbacks(status, type);
    res.json({ data });
  }

  async updateFeedbackStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    const data = await adminService.updateFeedbackStatus(id, status as FeedbackStatus);
    res.json({ message: 'Status do feedback atualizado.', data });
  }

  async deleteFeedback(req: Request, res: Response) {
    const { id } = req.params;

    const result = await adminService.deleteFeedback(id);
    res.json(result);
  }

  async getAuditLogs(req: Request, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const data = await adminService.listAuditLogs(limit);
    res.json({ data });
  }
}

export const adminController = new AdminController();
