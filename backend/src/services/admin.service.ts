import { prisma } from '../lib/prisma';
import { FeedbackStatus, FeedbackType } from '@prisma/client';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import bcrypt from 'bcrypt';

export class AdminService {
  async getDashboardStats() {
    const [
      totalUsers,
      totalStocks,
      totalItems,
      totalMovements,
      totalFeedbacks,
      pendingFeedbacks,
      recentUsers,
      recentFeedbacks,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.stock.count(),
      prisma.item.count(),
      prisma.movement.count(),
      prisma.feedback.count(),
      prisma.feedback.count({ where: { status: FeedbackStatus.PENDING } }),
      prisma.user.findMany({
        take: 6,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          is_admin: true,
          created_at: true,
          _count: {
            select: {
              created_stocks: true,
              stock_memberships: true,
            },
          },
        },
      }),
      prisma.feedback.findMany({
        take: 5,
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ]);

    const systemInfo = {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      databaseStatus: 'Conectado (Supabase PostgreSQL)',
      environment: process.env.NODE_ENV || 'development',
      serverTime: new Date().toISOString(),
    };

    return {
      metrics: {
        totalUsers,
        totalStocks,
        totalItems,
        totalMovements,
        totalFeedbacks,
        pendingFeedbacks,
      },
      recentUsers,
      recentFeedbacks,
      systemInfo,
    };
  }

  async listUsers(search?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          is_admin: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              created_stocks: true,
              stock_memberships: true,
              movements: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        isAdmin: u.is_admin,
        createdAt: u.created_at,
        stocksCreatedCount: u._count.created_stocks,
        stocksParticipatingCount: u._count.stock_memberships,
        movementsCount: u._count.movements,
      })),
      total,
      page,
      limit,
    };
  }

  async toggleUserAdmin(targetUserId: string, requesterUserId: string) {
    if (targetUserId === requesterUserId) {
      throw new ForbiddenError('Você não pode alterar seu próprio privilégio de administrador.');
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        is_admin: !user.is_admin,
      },
      select: {
        id: true,
        name: true,
        email: true,
        is_admin: true,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      isAdmin: updated.is_admin,
    };
  }

  async resetUserPassword(targetUserId: string, newPassword?: string) {
    const passwordToSet = newPassword || 'Stoker123!';
    if (passwordToSet.length < 6) {
      throw new ValidationError('A senha deve ter pelo menos 6 caracteres.');
    }

    const passwordHash = await bcrypt.hash(passwordToSet, 10);

    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        password_hash: passwordHash,
        token_version: { increment: 1 },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return {
      message: 'Senha redefinida com sucesso.',
      temporaryPassword: passwordToSet,
      user,
    };
  }

  async deleteUser(targetUserId: string, requesterUserId: string) {
    if (targetUserId === requesterUserId) {
      throw new ForbiddenError('Você não pode excluir a sua própria conta de administrador.');
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        _count: {
          select: { created_stocks: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário não encontrado.');
    }

    if (user._count.created_stocks > 0) {
      throw new ValidationError(
        'Este usuário possui estoques criados. É necessário transferir ou excluir os estoques antes de remover a conta.'
      );
    }

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    return { message: 'Usuário removido com sucesso.' };
  }

  async listFeedbacks(status?: FeedbackStatus, type?: FeedbackType) {
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const feedbacks = await prisma.feedback.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return feedbacks;
  }

  async updateFeedbackStatus(feedbackId: string, status: FeedbackStatus) {
    const feedback = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return feedback;
  }

  async deleteFeedback(feedbackId: string) {
    await prisma.feedback.delete({
      where: { id: feedbackId },
    });

    return { message: 'Feedback removido com sucesso.' };
  }

  async listAuditLogs(limit = 50) {
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        stock: {
          select: { id: true, name: true },
        },
      },
    });

    return logs;
  }
}

export const adminService = new AdminService();
