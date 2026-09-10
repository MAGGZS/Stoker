import { prisma } from '../lib/prisma';
import { generateShareCode } from '../utils/calc';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { StockRole, AuditAction } from '@prisma/client';

export class StockService {
  async getUserStocks(userId: string) {
    const memberships = await prisma.stockMember.findMany({
      where: { user_id: userId },
      include: {
        stock: {
          include: {
            _count: {
              select: {
                items: true,
                members: true,
                movements: true,
              },
            },
          },
        },
      },
      orderBy: { joined_at: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.stock.id,
      name: m.stock.name,
      description: m.stock.description,
      shareCode: m.stock.share_code,
      allowNegativeStock: m.stock.allow_negative_stock,
      role: m.role,
      joinedAt: m.joined_at,
      counts: {
        items: m.stock._count.items,
        members: m.stock._count.members,
        movements: m.stock._count.movements,
      },
    }));
  }

  async getStockById(stockId: string, userId: string) {
    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar_url: true },
            },
          },
        },
        categories: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            items: true,
            movements: true,
          },
        },
      },
    });

    if (!stock) {
      throw new NotFoundError('Estoque não encontrado');
    }

    const currentMember = stock.members.find((m) => m.user_id === userId);
    if (!currentMember) {
      throw new ForbiddenError('Você não possui vínculo com este estoque');
    }

    return {
      ...stock,
      currentUserRole: currentMember.role,
    };
  }

  async createStock(userId: string, data: { name: string; description?: string; allowNegativeStock?: boolean }) {
    let shareCode = generateShareCode();
    // Garante que o código seja único
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.stock.findUnique({ where: { share_code: shareCode } });
      if (!exists) break;
      shareCode = generateShareCode();
      attempts++;
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos de validade

    const stock = await prisma.$transaction(async (tx) => {
      const created = await tx.stock.create({
        data: {
          name: data.name,
          description: data.description,
          share_code: shareCode,
          share_code_expires_at: expiresAt,
          created_by_id: userId,
          allow_negative_stock: data.allowNegativeStock ?? false,
        },
      });

      await tx.stockMember.create({
        data: {
          stock_id: created.id,
          user_id: userId,
          role: StockRole.OWNER,
        },
      });

      // Categoria padrão
      await tx.category.create({
        data: {
          stock_id: created.id,
          name: 'Geral',
          color: '#DC2626',
        },
      });

      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: created.id,
          action: AuditAction.STOCK_CREATE,
          entity: 'Stock',
          entity_id: created.id,
          details: { name: created.name, shareCode: created.share_code },
        },
      });

      return created;
    });

    return {
      ...stock,
      role: StockRole.OWNER,
    };
  }

  async updateStock(
    stockId: string,
    userId: string,
    data: { name?: string; description?: string; allowNegativeStock?: boolean }
  ) {
    const updated = await prisma.stock.update({
      where: { id: stockId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.allowNegativeStock !== undefined && { allow_negative_stock: data.allowNegativeStock }),
      },
    });

    await prisma.auditLog.create({
      data: {
        user_id: userId,
        stock_id: stockId,
        action: AuditAction.STOCK_UPDATE,
        entity: 'Stock',
        entity_id: stockId,
        details: data,
      },
    });

    return updated;
  }

  async getShareCode(stockId: string, userId: string) {
    const member = await prisma.stockMember.findUnique({
      where: {
        stock_id_user_id: { stock_id: stockId, user_id: userId },
      },
    });

    if (!member || member.role !== StockRole.OWNER) {
      throw new ForbiddenError('Apenas o proprietário pode visualizar o código de compartilhamento deste estoque');
    }

    const stock = await prisma.stock.findUnique({ where: { id: stockId } });
    if (!stock) {
      throw new NotFoundError('Estoque não encontrado');
    }

    const now = new Date();
    // Se o código já expirou, renova automaticamente
    if (now >= stock.share_code_expires_at) {
      return this.refreshShareCode(stockId, userId);
    }

    const remainingSeconds = Math.max(
      0,
      Math.floor((stock.share_code_expires_at.getTime() - now.getTime()) / 1000)
    );

    return {
      shareCode: stock.share_code,
      expiresAt: stock.share_code_expires_at,
      remainingSeconds,
    };
  }

  async refreshShareCode(stockId: string, userId: string) {
    const member = await prisma.stockMember.findUnique({
      where: {
        stock_id_user_id: { stock_id: stockId, user_id: userId },
      },
    });

    if (!member || member.role !== StockRole.OWNER) {
      throw new ForbiddenError('Apenas o proprietário pode gerar novo código de compartilhamento');
    }

    let shareCode = generateShareCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.stock.findUnique({ where: { share_code: shareCode } });
      if (!exists) break;
      shareCode = generateShareCode();
      attempts++;
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    const updated = await prisma.stock.update({
      where: { id: stockId },
      data: {
        share_code: shareCode,
        share_code_expires_at: expiresAt,
      },
    });

    return {
      shareCode: updated.share_code,
      expiresAt: updated.share_code_expires_at,
      remainingSeconds: 15 * 60,
    };
  }

  async joinStock(userId: string, shareCode: string) {
    const cleanCode = shareCode.trim().toUpperCase();
    const stock = await prisma.stock.findUnique({
      where: { share_code: cleanCode },
      include: {
        members: true,
      },
    });

    if (!stock) {
      throw new NotFoundError('Código de compartilhamento não encontrado ou inválido');
    }

    // Validação de expiração de 15 minutos
    if (new Date() > stock.share_code_expires_at) {
      throw new BadRequestError('Este código de acesso expirou. Solicite um novo código de 6 caracteres ao proprietário do estoque.');
    }

    const alreadyMember = stock.members.find((m) => m.user_id === userId);
    if (alreadyMember) {
      return {
        message: 'Você já possui vínculo com este estoque',
        stock: {
          id: stock.id,
          name: stock.name,
          role: alreadyMember.role,
        },
      };
    }

    // Vincula o usuário como CONVIDADO (GUEST)
    const membership = await prisma.$transaction(async (tx) => {
      const mem = await tx.stockMember.create({
        data: {
          stock_id: stock.id,
          user_id: userId,
          role: StockRole.GUEST,
        },
      });

      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stock.id,
          action: AuditAction.MEMBER_INVITE,
          entity: 'StockMember',
          entity_id: mem.id,
          details: { message: 'Usuário entrou no estoque via código de compartilhamento de 15 minutos', role: StockRole.GUEST },
        },
      });

      return mem;
    });

    return {
      message: 'Vínculo estabelecido com sucesso',
      stock: {
        id: stock.id,
        name: stock.name,
        role: membership.role,
      },
    };
  }

  async deleteStock(stockId: string, userId: string) {
    const member = await prisma.stockMember.findUnique({
      where: {
        stock_id_user_id: { stock_id: stockId, user_id: userId },
      },
    });

    if (!member || member.role !== StockRole.OWNER) {
      throw new ForbiddenError('Apenas o proprietário pode excluir este estoque');
    }

    await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          action: AuditAction.STOCK_DELETE,
          entity: 'Stock',
          entity_id: stockId,
          details: { message: 'Estoque excluído definitivamente pelo Proprietário' },
        },
      });

      await tx.stock.delete({
        where: { id: stockId },
      });
    });

    return { message: 'Estoque excluído com sucesso' };
  }

  async getStockStats(stockId: string) {
    const items = await prisma.item.findMany({
      where: { stock_id: stockId, status: 'ACTIVE' },
      select: {
        id: true,
        current_quantity: true,
        min_quantity: true,
        cost_price: true,
        sale_price: true,
      },
    });

    let totalItems = items.length;
    let totalUnits = 0;
    let totalCostValuation = 0;
    let totalSaleValuation = 0;
    let lowStockCount = 0;

    for (const item of items) {
      const qty = Number(item.current_quantity);
      const minQty = Number(item.min_quantity);
      const cost = Number(item.cost_price);
      const sale = Number(item.sale_price);

      totalUnits += qty;
      totalCostValuation += qty * cost;
      totalSaleValuation += qty * sale;

      if (qty <= minQty) {
        lowStockCount++;
      }
    }

    // Movimentações dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const movements = await prisma.movement.findMany({
      where: {
        stock_id: stockId,
        created_at: { gte: thirtyDaysAgo },
      },
      select: {
        type: true,
        quantity: true,
        total_value: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    let totalInboundUnits = 0;
    let totalOutboundUnits = 0;
    let totalInboundValue = 0;
    let totalOutboundValue = 0;

    for (const m of movements) {
      const q = Number(m.quantity);
      const val = Number(m.total_value || 0);

      if (m.type === 'ENTRADA') {
        totalInboundUnits += q;
        totalInboundValue += val;
      } else if (m.type === 'SAIDA') {
        totalOutboundUnits += q;
        totalOutboundValue += val;
      }
    }

    return {
      totalItems,
      totalUnits: Number(totalUnits.toFixed(2)),
      totalCostValuation: Number(totalCostValuation.toFixed(2)),
      totalSaleValuation: Number(totalSaleValuation.toFixed(2)),
      lowStockCount,
      last30Days: {
        inboundUnits: Number(totalInboundUnits.toFixed(2)),
        outboundUnits: Number(totalOutboundUnits.toFixed(2)),
        inboundValue: Number(totalInboundValue.toFixed(2)),
        outboundValue: Number(totalOutboundValue.toFixed(2)),
        totalMovements: movements.length,
      },
    };
  }
}

export const stockService = new StockService();

