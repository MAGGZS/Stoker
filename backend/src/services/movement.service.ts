import { prisma } from '../lib/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { calculateWeightedAverageCost } from '../utils/calc';
import { AuditAction, MovementType, Prisma } from '@prisma/client';

export class MovementService {
  /**
   * REGISTRO DE ENTRADA (INBOUND)
   * Regras:
   * 1. Valida se o item pertence ao estoque ativo e está ativo.
   * 2. Recalcula o Custo Médio Ponderado (CMP).
   * 3. Incrementa o saldo do item de forma atômica.
   * 4. Salva o registro de movimentação e log de auditoria.
   */
  async createInbound(
    stockId: string,
    userId: string,
    data: {
      itemId: string;
      quantity: number;
      unitCost: number;
      reason: string;
      documentRef?: string | null;
      partner?: string | null;
      batchNumber?: string | null;
      expiryDate?: string | null;
      notes?: string | null;
    }
  ) {
    if (data.quantity <= 0) {
      throw new BadRequestError('A quantidade de entrada deve ser maior que zero');
    }

    const item = await prisma.item.findFirst({
      where: { id: data.itemId, stock_id: stockId },
    });

    if (!item) {
      throw new NotFoundError('Item não encontrado no estoque');
    }

    const currentQty = Number(item.current_quantity);
    const currentCost = Number(item.cost_price);
    const inboundQty = Number(data.quantity);
    const inboundCost = Number(data.unitCost);

    const newAverageCost = calculateWeightedAverageCost(currentQty, currentCost, inboundQty, inboundCost);
    const newQuantity = Number((currentQty + inboundQty).toFixed(3));
    const totalValue = Number((inboundQty * inboundCost).toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualiza o item com novo saldo e novo custo médio
      const updatedItem = await tx.item.update({
        where: { id: item.id },
        data: {
          current_quantity: newQuantity,
          cost_price: newAverageCost,
        },
      });

      // 2. Registra o movimento de entrada
      const movement = await tx.movement.create({
        data: {
          stock_id: stockId,
          item_id: item.id,
          user_id: userId,
          type: MovementType.ENTRADA,
          reason: data.reason || 'COMPRA',
          quantity: inboundQty,
          previous_quantity: currentQty,
          new_quantity: newQuantity,
          unit_price: inboundCost,
          total_value: totalValue,
          document_ref: data.documentRef,
          partner: data.partner,
          batch_number: data.batchNumber,
          expiry_date: data.expiryDate ? new Date(data.expiryDate) : null,
          notes: data.notes,
        },
        include: {
          item: { select: { id: true, name: true, sku: true, unit: true } },
          user: { select: { id: true, name: true } },
        },
      });

      // 3. Auditoria
      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          action: AuditAction.STOCK_IN,
          entity: 'Movement',
          entity_id: movement.id,
          details: {
            itemName: item.name,
            sku: item.sku,
            quantity: inboundQty,
            previousQuantity: currentQty,
            newQuantity,
            unitCost: inboundCost,
            previousCost: currentCost,
            newAverageCost,
            partner: data.partner,
            documentRef: data.documentRef,
          },
        },
      });

      return { movement, updatedItem };
    });

    return result;
  }

  /**
   * REGISTRO DE SAÍDA (OUTBOUND)
   * Regras:
   * 1. Valida se o item pertence ao estoque ativo.
   * 2. Checa se o saldo é suficiente (se allow_negative_stock for falso, bloqueia com 400).
   * 3. Decrementa o saldo atômico do item.
   * 4. Registra movimentação, verifica se atingiu estoque mínimo e grava auditoria.
   */
  async createOutbound(
    stockId: string,
    userId: string,
    data: {
      itemId: string;
      quantity: number;
      unitPrice?: number | null;
      reason: string;
      documentRef?: string | null;
      partner?: string | null;
      notes?: string | null;
    }
  ) {
    if (data.quantity <= 0) {
      throw new BadRequestError('A quantidade de saída deve ser maior que zero');
    }

    const stock = await prisma.stock.findUnique({
      where: { id: stockId },
      select: { allow_negative_stock: true },
    });

    if (!stock) {
      throw new NotFoundError('Estoque não encontrado');
    }

    const item = await prisma.item.findFirst({
      where: { id: data.itemId, stock_id: stockId },
    });

    if (!item) {
      throw new NotFoundError('Item não encontrado no estoque');
    }

    const currentQty = Number(item.current_quantity);
    const outboundQty = Number(data.quantity);
    const unitPrice = data.unitPrice !== undefined && data.unitPrice !== null ? Number(data.unitPrice) : Number(item.sale_price);

    // Validação estrita de saldo negativo
    if (!stock.allow_negative_stock && currentQty < outboundQty) {
      throw new BadRequestError(
        `Estoque insuficiente para "${item.name}" (SKU: ${item.sku}). Saldo disponível: ${currentQty} ${item.unit}, Quantidade solicitada: ${outboundQty} ${item.unit}`
      );
    }

    const newQuantity = Number((currentQty - outboundQty).toFixed(3));
    const totalValue = Number((outboundQty * unitPrice).toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrementa o saldo do item
      const updatedItem = await tx.item.update({
        where: { id: item.id },
        data: {
          current_quantity: newQuantity,
        },
      });

      // 2. Cria o registro de movimentação de saída
      const movement = await tx.movement.create({
        data: {
          stock_id: stockId,
          item_id: item.id,
          user_id: userId,
          type: MovementType.SAIDA,
          reason: data.reason || 'VENDA',
          quantity: outboundQty,
          previous_quantity: currentQty,
          new_quantity: newQuantity,
          unit_price: unitPrice,
          total_value: totalValue,
          document_ref: data.documentRef,
          partner: data.partner,
          notes: data.notes,
        },
        include: {
          item: { select: { id: true, name: true, sku: true, unit: true, min_quantity: true } },
          user: { select: { id: true, name: true } },
        },
      });

      // 3. Auditoria
      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          action: AuditAction.STOCK_OUT,
          entity: 'Movement',
          entity_id: movement.id,
          details: {
            itemName: item.name,
            sku: item.sku,
            quantity: outboundQty,
            previousQuantity: currentQty,
            newQuantity,
            isLowStock: newQuantity <= Number(item.min_quantity),
            partner: data.partner,
            reason: data.reason,
          },
        },
      });

      return {
        movement,
        updatedItem,
        isLowStockAlert: newQuantity <= Number(item.min_quantity),
      };
    });

    return result;
  }

  /**
   * REGISTRO DE AJUSTE FÍSICO PONTUAL / CONFERÊNCIA
   * Substitui o saldo atual pela contagem física apurada, calculando a variação.
   */
  async createAdjustment(
    stockId: string,
    userId: string,
    data: {
      itemId: string;
      countedQuantity: number;
      reason: string;
      notes?: string | null;
    }
  ) {
    const item = await prisma.item.findFirst({
      where: { id: data.itemId, stock_id: stockId },
    });

    if (!item) {
      throw new NotFoundError('Item não encontrado no estoque');
    }

    const currentQty = Number(item.current_quantity);
    const countedQty = Number(data.countedQuantity);
    const delta = Number((countedQty - currentQty).toFixed(3));

    if (delta === 0) {
      return {
        message: 'A contagem informada é exatamente idêntica ao saldo atual do sistema. Nenhum ajuste necessário.',
        updatedItem: item,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.item.update({
        where: { id: item.id },
        data: { current_quantity: countedQty },
      });

      const movement = await tx.movement.create({
        data: {
          stock_id: stockId,
          item_id: item.id,
          user_id: userId,
          type: MovementType.AJUSTE,
          reason: data.reason || 'INVENTARIO_PERIODICO',
          quantity: Math.abs(delta),
          previous_quantity: currentQty,
          new_quantity: countedQty,
          unit_price: Number(item.cost_price),
          total_value: Number((Math.abs(delta) * Number(item.cost_price)).toFixed(2)),
          notes: `${data.notes || ''} [Variação apurada: ${delta > 0 ? '+' : ''}${delta} ${item.unit}]`.trim(),
        },
        include: {
          item: { select: { id: true, name: true, sku: true, unit: true } },
          user: { select: { id: true, name: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          action: AuditAction.STOCK_ADJUST,
          entity: 'Movement',
          entity_id: movement.id,
          details: {
            itemName: item.name,
            sku: item.sku,
            previousQuantity: currentQty,
            newQuantity: countedQty,
            delta,
            costPrice: Number(item.cost_price),
          },
        },
      });

      return { movement, updatedItem, delta };
    });

    return result;
  }

  /**
   * ATUALIZAÇÃO GERAL / BALANÇO GERAL EM LOTE (BATCH RECONCILIATION)
   * Recebe um array de contagens físicas de múltiplos itens e executa a reconciliação em lote atômica.
   */
  async batchReconciliation(
    stockId: string,
    userId: string,
    data: {
      reason: string;
      notes?: string | null;
      counts: Array<{ itemId: string; countedQuantity: number }>;
    }
  ) {
    const itemIds = data.counts.map((c) => c.itemId);
    const items = await prisma.item.findMany({
      where: {
        id: { in: itemIds },
        stock_id: stockId,
      },
    });

    const itemMap = new Map(items.map((i) => [i.id, i]));

    const reconciliations: Array<{
      item: (typeof items)[0];
      countedQty: number;
      currentQty: number;
      delta: number;
      financialDiff: number;
    }> = [];

    for (const count of data.counts) {
      const item = itemMap.get(count.itemId);
      if (!item) continue;

      const currentQty = Number(item.current_quantity);
      const countedQty = Number(count.countedQuantity);
      const delta = Number((countedQty - currentQty).toFixed(3));
      const financialDiff = Number((delta * Number(item.cost_price)).toFixed(2));

      if (delta !== 0) {
        reconciliations.push({
          item,
          countedQty,
          currentQty,
          delta,
          financialDiff,
        });
      }
    }

    if (reconciliations.length === 0) {
      return {
        message: 'Nenhuma divergência encontrada entre os itens informados e o saldo em sistema.',
        adjustedItemsCount: 0,
        totalFinancialImpact: 0,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const movementsCreated = [];
      let totalFinancialImpact = 0;

      for (const rec of reconciliations) {
        totalFinancialImpact += rec.financialDiff;

        await tx.item.update({
          where: { id: rec.item.id },
          data: { current_quantity: rec.countedQty },
        });

        const m = await tx.movement.create({
          data: {
            stock_id: stockId,
            item_id: rec.item.id,
            user_id: userId,
            type: MovementType.AJUSTE,
            reason: data.reason || 'BALANCO_GERAL',
            quantity: Math.abs(rec.delta),
            previous_quantity: rec.currentQty,
            new_quantity: rec.countedQty,
            unit_price: Number(rec.item.cost_price),
            total_value: Math.abs(rec.financialDiff),
            notes: `Reconciliação em lote: ${rec.delta > 0 ? '+' : ''}${rec.delta} ${rec.item.unit}. ${data.notes || ''}`.trim(),
          },
        });

        movementsCreated.push(m);
      }

      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: stockId,
          action: AuditAction.BATCH_RECONCILIATION,
          entity: 'Stock',
          entity_id: stockId,
          details: {
            reason: data.reason,
            itemsCount: reconciliations.length,
            totalFinancialImpact: Number(totalFinancialImpact.toFixed(2)),
            divergences: reconciliations.map((r) => ({
              sku: r.item.sku,
              name: r.item.name,
              delta: r.delta,
              financialDiff: r.financialDiff,
            })),
          },
        },
      });

      return {
        adjustedItemsCount: reconciliations.length,
        totalFinancialImpact: Number(totalFinancialImpact.toFixed(2)),
        reconciliations: reconciliations.map((r) => ({
          itemId: r.item.id,
          name: r.item.name,
          sku: r.item.sku,
          previousQty: r.currentQty,
          countedQty: r.countedQty,
          delta: r.delta,
          financialImpact: r.financialDiff,
        })),
      };
    });

    return result;
  }

  async listMovements(
    stockId: string,
    params: {
      itemId?: string;
      type?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.MovementWhereInput = {
      stock_id: stockId,
    };

    if (params.itemId) {
      where.item_id = params.itemId;
    }

    if (params.type && params.type !== 'ALL') {
      where.type = params.type as MovementType;
    }

    if (params.startDate || params.endDate) {
      where.created_at = {};
      if (params.startDate) where.created_at.gte = new Date(params.startDate);
      if (params.endDate) where.created_at.lte = new Date(params.endDate);
    }

    const [movements, total] = await Promise.all([
      prisma.movement.findMany({
        where,
        include: {
          item: {
            select: {
              id: true,
              name: true,
              sku: true,
              unit: true,
              category: { select: { id: true, name: true, color: true } },
            },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.movement.count({ where }),
    ]);

    const formattedMovements = movements.map((m) => ({
      id: m.id,
      type: m.type,
      reason: m.reason,
      quantity: Number(m.quantity),
      previousQuantity: Number(m.previous_quantity),
      newQuantity: Number(m.new_quantity),
      unitPrice: m.unit_price ? Number(m.unit_price) : null,
      totalValue: m.total_value ? Number(m.total_value) : null,
      documentRef: m.document_ref,
      partner: m.partner,
      batchNumber: m.batch_number,
      expiryDate: m.expiry_date,
      notes: m.notes,
      createdAt: m.created_at,
      item: m.item,
      user: m.user,
    }));

    return {
      movements: formattedMovements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const movementService = new MovementService();

