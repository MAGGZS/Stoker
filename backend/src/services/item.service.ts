import { prisma } from '../lib/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { AuditAction, ItemStatus, MovementType, Prisma } from '@prisma/client';

export class ItemService {
  async listItems(
    stockId: string,
    params: {
      search?: string;
      categoryId?: string;
      status?: string;
      lowStockOnly?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.ItemWhereInput = {
      stock_id: stockId,
    };

    if (params.status && params.status !== 'ALL') {
      where.status = params.status as ItemStatus;
    }

    if (params.categoryId) {
      where.category_id = params.categoryId;
    }

    if (params.search) {
      const search = params.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, color: true },
          },
        },
        orderBy: [{ status: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.item.count({ where }),
    ]);

    // Filtro adicional de estoque baixo caso solicitado
    let processedItems = items.map((item) => {
      const qty = Number(item.current_quantity);
      const minQty = Number(item.min_quantity);
      const isLowStock = qty <= minQty;

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        description: item.description,
        unit: item.unit,
        currentQuantity: qty,
        minQuantity: minQty,
        maxQuantity: item.max_quantity ? Number(item.max_quantity) : null,
        costPrice: Number(item.cost_price),
        salePrice: Number(item.sale_price),
        totalCostValue: Number((qty * Number(item.cost_price)).toFixed(2)),
        totalSaleValue: Number((qty * Number(item.sale_price)).toFixed(2)),
        location: item.location,
        status: item.status,
        isLowStock,
        category: item.category,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    });

    if (params.lowStockOnly === 'true') {
      processedItems = processedItems.filter((i) => i.isLowStock);
    }

    return {
      items: processedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getItemById(stockId: string, itemId: string) {
    const item = await prisma.item.findFirst({
      where: { id: itemId, stock_id: stockId },
      include: {
        category: true,
        movements: {
          take: 10,
          orderBy: { created_at: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundError('Item não encontrado');
    }

    const qty = Number(item.current_quantity);
    const minQty = Number(item.min_quantity);

    return {
      ...item,
      currentQuantity: qty,
      minQuantity: minQty,
      maxQuantity: item.max_quantity ? Number(item.max_quantity) : null,
      costPrice: Number(item.cost_price),
      salePrice: Number(item.sale_price),
      isLowStock: qty <= minQty,
    };
  }

  async createItem(
    stockId: string,
    userId: string,
    data: {
      name: string;
      sku: string;
      description?: string;
      categoryId?: string | null;
      unit?: string;
      initialQuantity?: number;
      minQuantity?: number;
      maxQuantity?: number | null;
      costPrice?: number;
      salePrice?: number;
      location?: string | null;
    }
  ) {
    const existingSku = await prisma.item.findUnique({
      where: {
        stock_id_sku: {
          stock_id: stockId,
          sku: data.sku.trim().toUpperCase(),
        },
      },
    });

    if (existingSku) {
      throw new BadRequestError(`Já existe um item cadastrado com o SKU/Código "${data.sku}" neste estoque`);
    }

    const initialQty = data.initialQuantity || 0;
    const costPrice = data.costPrice || 0;

    const result = await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          stock_id: stockId,
          name: data.name,
          sku: data.sku.trim().toUpperCase(),
          description: data.description,
          category_id: data.categoryId,
          unit: data.unit || 'UN',
          current_quantity: initialQty,
          min_quantity: data.minQuantity || 0,
          max_quantity: data.maxQuantity,
          cost_price: costPrice,
          sale_price: data.salePrice || 0,
          location: data.location,
        },
        include: {
          category: true,
        },
      });

      // Se houver saldo inicial > 0, cria o movimento de entrada correspondente
      if (initialQty > 0) {
        await tx.movement.create({
          data: {
            stock_id: stockId,
            item_id: item.id,
            user_id: userId,
            type: MovementType.ENTRADA,
            reason: 'SALDO_INICIAL',
            quantity: initialQty,
            previous_quantity: 0,
            new_quantity: initialQty,
            unit_price: costPrice,
            total_value: Number((initialQty * costPrice).toFixed(2)),
            notes: 'Cadastro inicial do item com saldo',
          },
        });
      }

      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          action: AuditAction.ITEM_CREATE,
          entity: 'Item',
          entity_id: item.id,
          details: { name: item.name, sku: item.sku, initialQty, costPrice },
        },
      });

      return item;
    });

    return result;
  }

  async updateItem(
    stockId: string,
    itemId: string,
    userId: string,
    data: {
      name?: string;
      sku?: string;
      description?: string | null;
      categoryId?: string | null;
      unit?: string;
      minQuantity?: number;
      maxQuantity?: number | null;
      costPrice?: number;
      salePrice?: number;
      location?: string | null;
      status?: ItemStatus;
    }
  ) {
    const existing = await prisma.item.findFirst({
      where: { id: itemId, stock_id: stockId },
    });

    if (!existing) {
      throw new NotFoundError('Item não encontrado no estoque');
    }

    if (data.sku && data.sku.trim().toUpperCase() !== existing.sku) {
      const conflict = await prisma.item.findUnique({
        where: {
          stock_id_sku: {
            stock_id: stockId,
            sku: data.sku.trim().toUpperCase(),
          },
        },
      });
      if (conflict) {
        throw new BadRequestError(`O SKU "${data.sku}" já está em uso por outro produto`);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.item.update({
        where: { id: itemId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.sku && { sku: data.sku.trim().toUpperCase() }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.categoryId !== undefined && { category_id: data.categoryId }),
          ...(data.unit && { unit: data.unit.toUpperCase() }),
          ...(data.minQuantity !== undefined && { min_quantity: data.minQuantity }),
          ...(data.maxQuantity !== undefined && { max_quantity: data.maxQuantity }),
          ...(data.costPrice !== undefined && { cost_price: data.costPrice }),
          ...(data.salePrice !== undefined && { sale_price: data.salePrice }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.status && { status: data.status }),
        },
        include: {
          category: true,
        },
      });

      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          action: AuditAction.ITEM_UPDATE,
          entity: 'Item',
          entity_id: item.id,
          details: { changes: data },
        },
      });

      return item;
    });

    return updated;
  }

  async deleteItem(stockId: string, itemId: string, userId: string) {
    const existing = await prisma.item.findFirst({
      where: { id: itemId, stock_id: stockId },
      include: {
        _count: {
          select: { movements: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundError('Item não encontrado no estoque');
    }

    // Se já possui histórico de movimentação, inativa em vez de apagar fisicamente para manter a integridade contábil
    if (existing._count.movements > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.item.update({
          where: { id: itemId },
          data: { status: ItemStatus.INACTIVE },
        });

        await tx.auditLog.create({
          data: {
            user_id: userId,
            stock_id: stockId,
            action: AuditAction.ITEM_UPDATE,
            entity: 'Item',
            entity_id: itemId,
            details: { message: 'Item inativado (possui movimentações prévias)', previousStatus: existing.status },
          },
        });
      });

      return { message: 'Item marcado como inativo para preservar o histórico de movimentações' };
    }

    // Se nunca foi movimentado, exclui definitivamente
    await prisma.$transaction(async (tx) => {
      await tx.item.delete({ where: { id: itemId } });
      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          action: AuditAction.ITEM_DELETE,
          entity: 'Item',
          entity_id: itemId,
          details: { name: existing.name, sku: existing.sku },
        },
      });
    });

    return { message: 'Item excluído com sucesso' };
  }
}

export const itemService = new ItemService();

