import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

export class AuditService {
  async listAuditLogs(
    stockId: string,
    params: {
      action?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      stock_id: stockId,
    };

    if (params.action) {
      where.action = params.action as any;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const auditService = new AuditService();

