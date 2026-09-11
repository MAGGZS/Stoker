import { prisma } from '../lib/prisma';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { MovementType, AuditAction } from '@prisma/client';

export class LogisticsService {
  async getOverview() {
    // 1. Busca todos os estoques com seus itens ativos e movimentações recentes
    const stocks = await prisma.stock.findMany({
      include: {
        creator: { select: { id: true, name: true, email: true } },
        items: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            sku: true,
            name: true,
            unit: true,
            current_quantity: true,
            min_quantity: true,
            max_quantity: true,
            cost_price: true,
            sale_price: true,
            stock_id: true,
            created_at: true,
            category: { select: { id: true, name: true, color: true } },
          },
        },
        _count: {
          select: { items: true, members: true, movements: true },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // 2. Busca movimentações dos últimos 30 dias para cálculo de giro e ROP
    const movements30d = await prisma.movement.findMany({
      where: {
        created_at: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        stock_id: true,
        item_id: true,
        type: true,
        reason: true,
        quantity: true,
        total_value: true,
        created_at: true,
      },
    });

    // 3. Busca movimentações de perdas/avarias dos últimos 90 dias
    const lossMovements = await prisma.movement.findMany({
      where: {
        created_at: { gte: ninetyDaysAgo },
        OR: [
          { reason: { in: ['PERDA_AVARIA', 'AVARIA_IDENTIFICADA', 'AJUSTE_NEGATIVO'] } },
          { type: 'AJUSTE', quantity: { lt: 0 } },
        ],
      },
      select: {
        id: true,
        reason: true,
        quantity: true,
        total_value: true,
        created_at: true,
        item: { select: { name: true, sku: true, unit: true, cost_price: true } },
        stock: { select: { name: true } },
      },
    });

    // Mapeamento de saídas por item nos últimos 30 dias
    const outboundsByItem = new Map<string, number>();
    const movementsByStock = new Map<string, number>();

    for (const m of movements30d) {
      movementsByStock.set(m.stock_id, (movementsByStock.get(m.stock_id) || 0) + 1);
      if (m.type === 'SAIDA') {
        outboundsByItem.set(m.item_id, (outboundsByItem.get(m.item_id) || 0) + Number(m.quantity));
      }
    }

    // Coleta todos os itens do sistema
    type FlatItem = {
      id: string;
      sku: string;
      name: string;
      unit: string;
      currentQuantity: number;
      minQuantity: number;
      maxQuantity: number | null;
      costPrice: number;
      salePrice: number;
      stockId: string;
      stockName: string;
      categoryName: string;
      totalValue: number;
    };

    const allItems: FlatItem[] = [];
    let totalNetworkValue = 0;
    let totalUnits = 0;
    let stockoutCount = 0;
    let lowStockCount = 0;

    for (const stock of stocks) {
      for (const item of stock.items) {
        const qty = Number(item.current_quantity);
        const cost = Number(item.cost_price);
        const minQ = Number(item.min_quantity);
        const maxQ = item.max_quantity ? Number(item.max_quantity) : null;
        const val = Number((qty * cost).toFixed(2));

        totalNetworkValue += val;
        totalUnits += qty;

        if (qty <= 0) {
          stockoutCount++;
        } else if (qty <= minQ) {
          lowStockCount++;
        }

        allItems.push({
          id: item.id,
          sku: item.sku,
          name: item.name,
          unit: item.unit,
          currentQuantity: qty,
          minQuantity: minQ,
          maxQuantity: maxQ,
          costPrice: cost,
          salePrice: Number(item.sale_price),
          stockId: stock.id,
          stockName: stock.name,
          categoryName: item.category?.name || 'Sem categoria',
          totalValue: val,
        });
      }
    }

    const totalSkus = allItems.length;
    const stockoutRate = totalSkus > 0 ? Number(((stockoutCount / totalSkus) * 100).toFixed(1)) : 0;

    // Resumo comparativo por estoque
    const stockBreakdown = stocks.map((s) => {
      let stVal = 0;
      let stStockout = 0;
      let stLow = 0;

      for (const it of s.items) {
        const q = Number(it.current_quantity);
        const c = Number(it.cost_price);
        stVal += q * c;
        if (q <= 0) stStockout++;
        else if (q <= Number(it.min_quantity)) stLow++;
      }

      return {
        id: s.id,
        name: s.name,
        description: s.description,
        creatorName: s.creator.name,
        itemCount: s.items.length,
        totalValue: Number(stVal.toFixed(2)),
        stockoutCount: stStockout,
        lowStockCount: stLow,
        movementsCount30d: movementsByStock.get(s.id) || 0,
        allowNegativeStock: s.allow_negative_stock,
      };
    });

    // 4. Curva ABC (Análise de Pareto 80/20)
    // Ordena itens de forma decrescente por valor monetário total
    const sortedByValue = [...allItems].sort((a, b) => b.totalValue - a.totalValue);
    let runningCumulativeValue = 0;

    const abcItems = sortedByValue.map((item) => {
      runningCumulativeValue += item.totalValue;
      const sharePercent = totalNetworkValue > 0 ? Number(((item.totalValue / totalNetworkValue) * 100).toFixed(2)) : 0;
      const cumulativePercent = totalNetworkValue > 0 ? Number(((runningCumulativeValue / totalNetworkValue) * 100).toFixed(2)) : 0;

      let classification: 'A' | 'B' | 'C' = 'C';
      if (cumulativePercent <= 80) {
        classification = 'A';
      } else if (cumulativePercent <= 95) {
        classification = 'B';
      } else {
        classification = 'C';
      }

      return {
        ...item,
        sharePercent,
        cumulativePercent,
        classification,
      };
    });

    const abcSummary = {
      classA: {
        count: abcItems.filter((i) => i.classification === 'A').length,
        totalValue: Number(abcItems.filter((i) => i.classification === 'A').reduce((acc, i) => acc + i.totalValue, 0).toFixed(2)),
        percentOfTotal: totalNetworkValue > 0 ? Number(((abcItems.filter((i) => i.classification === 'A').reduce((acc, i) => acc + i.totalValue, 0) / totalNetworkValue) * 100).toFixed(1)) : 0,
      },
      classB: {
        count: abcItems.filter((i) => i.classification === 'B').length,
        totalValue: Number(abcItems.filter((i) => i.classification === 'B').reduce((acc, i) => acc + i.totalValue, 0).toFixed(2)),
        percentOfTotal: totalNetworkValue > 0 ? Number(((abcItems.filter((i) => i.classification === 'B').reduce((acc, i) => acc + i.totalValue, 0) / totalNetworkValue) * 100).toFixed(1)) : 0,
      },
      classC: {
        count: abcItems.filter((i) => i.classification === 'C').length,
        totalValue: Number(abcItems.filter((i) => i.classification === 'C').reduce((acc, i) => acc + i.totalValue, 0).toFixed(2)),
        percentOfTotal: totalNetworkValue > 0 ? Number(((abcItems.filter((i) => i.classification === 'C').reduce((acc, i) => acc + i.totalValue, 0) / totalNetworkValue) * 100).toFixed(1)) : 0,
      },
    };

    // 5. Previsão de Demanda e Motor ROP (Ponto de Pedido & Sugestão de Reposição)
    const replenishmentSuggestions = allItems.map((item) => {
      const outbound30d = outboundsByItem.get(item.id) || 0;
      const dailyBurnRate = Number((outbound30d / 30).toFixed(2));
      const daysOfSupply = dailyBurnRate > 0 ? Math.floor(item.currentQuantity / dailyBurnRate) : (item.currentQuantity > 0 ? 999 : 0);

      // Lead time padrão de 7 dias para reposição
      const estimatedLeadTimeDays = 7;
      const reorderPoint = Number(((dailyBurnRate * estimatedLeadTimeDays) + item.minQuantity).toFixed(1));

      // Meta de estoque (usa maxQuantity ou fórmula de segurança)
      const targetStock = item.maxQuantity ? item.maxQuantity : Math.max(Math.ceil(reorderPoint * 2), item.minQuantity * 2, 10);
      const suggestedOrderQty = item.currentQuantity <= reorderPoint ? Math.max(0, Math.ceil(targetStock - item.currentQuantity)) : 0;
      const estimatedCost = Number((suggestedOrderQty * item.costPrice).toFixed(2));

      let status: 'CRITICO' | 'REPOSICAO' | 'EQUILIBRADO' | 'EXCESSO' = 'EQUILIBRADO';
      if (item.currentQuantity <= 0 || daysOfSupply < 7) {
        status = 'CRITICO';
      } else if (item.currentQuantity <= reorderPoint || daysOfSupply < 15) {
        status = 'REPOSICAO';
      } else if (daysOfSupply > 60 && outbound30d > 0) {
        status = 'EXCESSO';
      } else {
        status = 'EQUILIBRADO';
      }

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        unit: item.unit,
        stockId: item.stockId,
        stockName: item.stockName,
        currentQuantity: item.currentQuantity,
        minQuantity: item.minQuantity,
        outbound30d,
        dailyBurnRate,
        daysOfSupply,
        reorderPoint,
        suggestedOrderQty,
        estimatedCost,
        status,
      };
    });

    // Ordena sugestões de reposição: primeiro críticos, depois em reposição
    replenishmentSuggestions.sort((a, b) => {
      const order = { CRITICO: 1, REPOSICAO: 2, EXCESSO: 3, EQUILIBRADO: 4 };
      return order[a.status] - order[b.status];
    });

    // 6. Estoque Encalhado (Dead Stock / Aging)
    // Itens com saldo positivo sem nenhuma saída registrada nos últimos 30 dias
    const deadStockItems = allItems
      .filter((item) => item.currentQuantity > 0 && (outboundsByItem.get(item.id) || 0) === 0)
      .map((item) => ({
        ...item,
        tiedUpCapital: item.totalValue,
        daysIdle: 30, // Pelo menos 30 dias
      }))
      .sort((a, b) => b.tiedUpCapital - a.tiedUpCapital);

    const totalDeadStockValue = deadStockItems.reduce((acc, i) => acc + i.tiedUpCapital, 0);

    // 7. Perdas Operacionais (Shrinkage)
    let totalLossValue = 0;
    const lossesByReason: Record<string, { count: number; totalValue: number }> = {};

    for (const loss of lossMovements) {
      const cost = Number(loss.item?.cost_price || 0);
      const val = loss.total_value ? Number(loss.total_value) : Math.abs(Number(loss.quantity)) * cost;
      totalLossValue += val;

      const reason = loss.reason || 'OUTRO';
      if (!lossesByReason[reason]) {
        lossesByReason[reason] = { count: 0, totalValue: 0 };
      }
      lossesByReason[reason].count++;
      lossesByReason[reason].totalValue += val;
    }

    return {
      networkMetrics: {
        totalStocks: stocks.length,
        totalSkus,
        totalUnits: Number(totalUnits.toFixed(1)),
        totalInventoryValue: Number(totalNetworkValue.toFixed(2)),
        stockoutCount,
        lowStockCount,
        stockoutRate,
        totalDeadStockValue: Number(totalDeadStockValue.toFixed(2)),
        totalLossValue90d: Number(totalLossValue.toFixed(2)),
      },
      stockBreakdown,
      abcAnalysis: {
        summary: abcSummary,
        items: abcItems,
      },
      replenishment: {
        criticalCount: replenishmentSuggestions.filter((i) => i.status === 'CRITICO').length,
        reorderCount: replenishmentSuggestions.filter((i) => i.status === 'REPOSICAO').length,
        excessCount: replenishmentSuggestions.filter((i) => i.status === 'EXCESSO').length,
        items: replenishmentSuggestions,
      },
      deadStock: {
        count: deadStockItems.length,
        totalValue: Number(totalDeadStockValue.toFixed(2)),
        items: deadStockItems,
      },
      losses: {
        totalValue90d: Number(totalLossValue.toFixed(2)),
        byReason: lossesByReason,
        recentLosses: lossMovements.slice(0, 15),
      },
    };
  }

  // Executa uma transferência atômica entre dois estoques
  async executeTransfer(
    userId: string,
    data: {
      sourceStockId: string;
      targetStockId: string;
      itemId: string;
      quantity: number;
      notes?: string;
    }
  ) {
    if (data.sourceStockId === data.targetStockId) {
      throw new BadRequestError('O estoque de origem e o de destino não podem ser iguais');
    }

    if (data.quantity <= 0) {
      throw new BadRequestError('A quantidade a transferir deve ser maior que zero');
    }

    // 1. Busca estoques e item de origem
    const [sourceStock, targetStock, sourceItem] = await Promise.all([
      prisma.stock.findUnique({ where: { id: data.sourceStockId } }),
      prisma.stock.findUnique({ where: { id: data.targetStockId } }),
      prisma.item.findUnique({ where: { id: data.itemId } }),
    ]);

    if (!sourceStock) throw new NotFoundError('Estoque de origem não encontrado');
    if (!targetStock) throw new NotFoundError('Estoque de destino não encontrado');
    if (!sourceItem) throw new NotFoundError('Produto não encontrado');

    if (sourceItem.stock_id !== data.sourceStockId) {
      throw new BadRequestError('O produto selecionado não pertence ao estoque de origem');
    }

    const currentQty = Number(sourceItem.current_quantity);
    if (currentQty < data.quantity && !sourceStock.allow_negative_stock) {
      throw new BadRequestError(`Saldo insuficiente na origem (${sourceStock.name}). Disponível: ${currentQty} ${sourceItem.unit}`);
    }

    const transferQty = data.quantity;
    const itemCost = Number(sourceItem.cost_price);
    const totalTransferValue = Number((transferQty * itemCost).toFixed(2));

    // 2. Transação atômica
    const result = await prisma.$transaction(async (tx) => {
      // A. Baixa no estoque de origem
      const updatedSourceItem = await tx.item.update({
        where: { id: sourceItem.id },
        data: {
          current_quantity: { decrement: transferQty },
        },
      });

      const sourceMovement = await tx.movement.create({
        data: {
          stock_id: sourceStock.id,
          item_id: sourceItem.id,
          user_id: userId,
          type: MovementType.SAIDA,
          reason: 'TRANSFERENCIA_ENTRE_ESTOQUES',
          quantity: transferQty,
          previous_quantity: currentQty,
          new_quantity: Number(updatedSourceItem.current_quantity),
          unit_price: itemCost,
          total_value: totalTransferValue,
          document_ref: `Para: ${targetStock.name}`,
          partner: `Destino: ${targetStock.name}`,
          notes: data.notes || `Transferência inter-estoques autorizada pela Administração`,
        },
      });

      // B. Entrada no estoque de destino (cria o produto se não existir)
      let destItem = await tx.item.findUnique({
        where: {
          stock_id_sku: {
            stock_id: targetStock.id,
            sku: sourceItem.sku,
          },
        },
      });

      let previousDestQty = 0;
      let newDestQty = transferQty;
      let newDestCost = itemCost;

      if (destItem) {
        previousDestQty = Number(destItem.current_quantity);
        newDestQty = previousDestQty + transferQty;
        const prevCost = Number(destItem.cost_price);

        // Recálculo do Custo Médio Ponderado (CMP) no destino
        if (newDestQty > 0) {
          newDestCost = Number((((previousDestQty * prevCost) + totalTransferValue) / newDestQty).toFixed(2));
        }

        destItem = await tx.item.update({
          where: { id: destItem.id },
          data: {
            current_quantity: { increment: transferQty },
            cost_price: newDestCost,
          },
        });
      } else {
        // Cria o item no estoque de destino com os mesmos dados da origem
        destItem = await tx.item.create({
          data: {
            stock_id: targetStock.id,
            name: sourceItem.name,
            sku: sourceItem.sku,
            unit: sourceItem.unit,
            description: sourceItem.description,
            current_quantity: transferQty,
            min_quantity: sourceItem.min_quantity,
            cost_price: itemCost,
            sale_price: sourceItem.sale_price,
            location: 'Recebido de Transferência',
          },
        });
      }

      const targetMovement = await tx.movement.create({
        data: {
          stock_id: targetStock.id,
          item_id: destItem.id,
          user_id: userId,
          type: MovementType.ENTRADA,
          reason: 'TRANSFERENCIA_ENTRE_ESTOQUES',
          quantity: transferQty,
          previous_quantity: previousDestQty,
          new_quantity: newDestQty,
          unit_price: itemCost,
          total_value: totalTransferValue,
          document_ref: `De: ${sourceStock.name}`,
          partner: `Origem: ${sourceStock.name}`,
          notes: data.notes || `Transferência inter-estoques recebida`,
        },
      });

      // C. Registro de Auditoria Administrativa
      await tx.auditLog.create({
        data: {
          user_id: userId,
          stock_id: sourceStock.id,
          action: AuditAction.INTER_STOCK_TRANSFER,
          entity: 'Transfer',
          details: {
            sourceStockId: sourceStock.id,
            sourceStockName: sourceStock.name,
            targetStockId: targetStock.id,
            targetStockName: targetStock.name,
            sku: sourceItem.sku,
            itemName: sourceItem.name,
            quantity: transferQty,
            unit: sourceItem.unit,
            unitCost: itemCost,
            totalValue: totalTransferValue,
            notes: data.notes,
          },
        },
      });

      return {
        sourceStockName: sourceStock.name,
        targetStockName: targetStock.name,
        itemName: sourceItem.name,
        sku: sourceItem.sku,
        quantity: transferQty,
        unit: sourceItem.unit,
        totalValue: totalTransferValue,
        sourceNewBalance: Number(updatedSourceItem.current_quantity),
        targetNewBalance: newDestQty,
        sourceMovementId: sourceMovement.id,
        targetMovementId: targetMovement.id,
      };
    });

    return result;
  }

  // Histórico de transferências entre estoques
  async getTransferHistory() {
    const movements = await prisma.movement.findMany({
      where: {
        reason: 'TRANSFERENCIA_ENTRE_ESTOQUES',
      },
      include: {
        stock: { select: { id: true, name: true } },
        item: { select: { id: true, name: true, sku: true, unit: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return movements;
  }
}

export const logisticsService = new LogisticsService();
