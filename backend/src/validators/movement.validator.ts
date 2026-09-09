import { z } from 'zod';

// Validação para Registro de Entrada (Inbound)
export const inboundMovementSchema = z.object({
  itemId: z.string().uuid('Identificador do item inválido'),
  quantity: z.number().positive('Quantidade de entrada deve ser maior que zero'),
  unitCost: z.number().min(0, 'Custo unitário não pode ser negativo').default(0),
  reason: z.string().min(2, 'Motivo da entrada é obrigatório').default('COMPRA'),
  documentRef: z.string().max(100).optional().nullable(),
  partner: z.string().max(150).optional().nullable(), // Fornecedor
  batchNumber: z.string().max(50).optional().nullable(),
  expiryDate: z.string().datetime().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// Validação para Registro de Saída (Outbound)
export const outboundMovementSchema = z.object({
  itemId: z.string().uuid('Identificador do item inválido'),
  quantity: z.number().positive('Quantidade de saída deve ser maior que zero'),
  unitPrice: z.number().min(0).optional().nullable(), // Preço de venda praticado
  reason: z.string().min(2, 'Motivo da saída é obrigatório').default('VENDA'),
  documentRef: z.string().max(100).optional().nullable(),
  partner: z.string().max(150).optional().nullable(), // Cliente ou Departamento
  notes: z.string().max(1000).optional().nullable(),
});

// Validação para Ajuste Pontual de Inventário (Conferência Física)
export const adjustmentMovementSchema = z.object({
  itemId: z.string().uuid('Identificador do item inválido'),
  countedQuantity: z.number().min(0, 'A quantidade física contada não pode ser negativa'),
  reason: z.string().min(2, 'Motivo do ajuste é obrigatório').default('INVENTARIO_PERIODICO'),
  notes: z.string().max(1000).optional().nullable(),
});

// Validação para Balanço Geral em Lote (Reconciliação Física de Vários Itens)
export const batchReconciliationSchema = z.object({
  reason: z.string().default('BALANCO_GERAL'),
  notes: z.string().optional().nullable(),
  counts: z
    .array(
      z.object({
        itemId: z.string().uuid(),
        countedQuantity: z.number().min(0),
      })
    )
    .min(1, 'Pelo menos um item deve ser informado para a reconciliação'),
});

export const queryMovementsSchema = z.object({
  itemId: z.string().optional(),
  type: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE', 'ALL']).default('ALL').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

