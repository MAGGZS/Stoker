import { Request, Response } from 'express';
import { memberService } from '../services/member.service';

export class MemberController {
  async listMembers(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const members = await memberService.listMembers(stockId);
    res.status(200).json(members);
  }

  async updateMemberRole(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const actorUserId = req.user!.id;
    const targetUserId = req.params.userId;
    const { role } = req.body;
    const updated = await memberService.updateMemberRole(stockId, actorUserId, targetUserId, role);
    res.status(200).json(updated);
  }

  async removeMember(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const actorUserId = req.user!.id;
    const targetUserId = req.params.userId;
    const result = await memberService.removeMember(stockId, actorUserId, targetUserId);
    res.status(200).json(result);
  }

  async createInvite(req: Request, res: Response): Promise<void> {
    const stockId = req.stockId!;
    const actorUserId = req.user!.id;
    const invite = await memberService.createInvite(stockId, actorUserId, req.body);
    res.status(201).json(invite);
  }
}

export const memberController = new MemberController();

